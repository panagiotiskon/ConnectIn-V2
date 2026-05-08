package backend.connectin.service;

import backend.connectin.domain.*;
import backend.connectin.domain.repository.*;
import backend.connectin.recommendation.algorithm.MatrixFactorization;
import backend.connectin.util.FeedAssembler;
import backend.connectin.web.dto.FeedPageDTO;
import backend.connectin.web.dto.JobPostDTO;
import backend.connectin.web.mappers.PostMapper;
import backend.connectin.web.resources.PostResourceDetailed;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

@Service
public class RecommendationService {
    private final JobPostRepository jobPostRepository;
    private final UserService userService;
    private final JobViewRepository jobViewRepository;
    private final PersonalInfoRepository personalInfoRepository;
    private final JobRecommendationRepository jobRecommendationRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final PostService postService;
    private final ConnectionService connectionService;
    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;
    private final PostRecommendationRepository postRecommendationRepository;
    private final PostMapper postMapper;
    private final PostViewRepository postViewRepository;
    private final FeedAssembler feedAssembler;
    private final TransactionTemplate transactionTemplate;
    private final TransactionTemplate readOnlyTransactionTemplate;
    private final AtomicBoolean jobsTrainingInFlight = new AtomicBoolean(false);
    private final AtomicBoolean postsTrainingInFlight = new AtomicBoolean(false);

    public RecommendationService(JobPostRepository jobPostRepository, UserService userService, JobViewRepository jobViewRepository, PersonalInfoRepository personalInfoRepository, JobRecommendationRepository jobRecommendationRepository, JobApplicationRepository jobApplicationRepository, PostService postService, ConnectionService connectionService, ReactionRepository reactionRepository, PostRepository postRepository, PostRecommendationRepository postRecommendationRepository, PostMapper postMapper, PostViewRepository postViewRepository, FeedAssembler feedAssembler, PlatformTransactionManager transactionManager) {
        this.jobPostRepository = jobPostRepository;
        this.userService = userService;
        this.jobViewRepository = jobViewRepository;
        this.personalInfoRepository = personalInfoRepository;
        this.jobRecommendationRepository = jobRecommendationRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.postService = postService;
        this.connectionService = connectionService;
        this.reactionRepository = reactionRepository;
        this.postRepository = postRepository;
        this.postRecommendationRepository = postRecommendationRepository;
        this.postMapper = postMapper;
        this.postViewRepository = postViewRepository;
        this.feedAssembler = feedAssembler;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        // REQUIRES_NEW so per-user atomicity holds even if a future caller wraps us in their own transaction.
        this.transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        // Keeps the Hibernate Session open while training, so lazy proxies (e.g. Reaction.getPost()) load.
        this.readOnlyTransactionTemplate = new TransactionTemplate(transactionManager);
        this.readOnlyTransactionTemplate.setReadOnly(true);
        this.readOnlyTransactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    private static final int COLD_START_LIMIT = 20;

    public List<JobPostDTO> findRecommendedJobsForUser(long userId) {
        // sorted job IDs by recommendation score, highest first
        List<Long> jobIds = jobRecommendationRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(JobRecommendation::getJobScore).reversed())
                .map(JobRecommendation::getJobId)
                .toList();

        if (jobIds.isEmpty()) {
            // Cold start: no recommendations yet (new user or zero-signal user) — fall back to globally popular jobs.
            jobIds = jobViewRepository.findPopularJobIds(COLD_START_LIMIT);
            if (jobIds.isEmpty()) {
                return List.of();
            }
        }

        // fetch all job posts in one query, then restore the sorted order via map lookup
        Map<Long, JobPost> jobPostMap = jobPostRepository.findAllById(jobIds).stream()
                .collect(Collectors.toMap(JobPost::getId, jp -> jp));
        List<JobPost> recommendedJobs = jobIds.stream()
                .map(jobPostMap::get)
                .filter(Objects::nonNull)
                .toList();

        // fetch only this user's applications once — not the entire table per job
        Set<Long> appliedJobIds = jobApplicationRepository.findJobApplicationByUserId(userId).stream()
                .map(JobApplication::getJobPostId)
                .collect(Collectors.toSet());

        // batch-fetch all distinct authors once instead of one findById per job (N+1 fix)
        List<Long> authorIds = recommendedJobs.stream()
                .map(JobPost::getUserId)
                .distinct()
                .toList();
        Map<Long, User> usersById = userService.findUsersByIds(authorIds).stream()
                .collect(Collectors.toMap(User::getId, java.util.function.Function.identity()));

        List<JobPostDTO> jobPostDTOS = new ArrayList<>();
        for (var jobPost : recommendedJobs) {
            User user = usersById.get(jobPost.getUserId());
            if (user == null) {
                continue;
            }
            String fullName = user.getFirstName() + " " + user.getLastName();
            boolean hasApplied = appliedJobIds.contains(jobPost.getId());
            jobPostDTOS.add(new JobPostDTO(jobPost.getId(), user.getId(), jobPost.getJobTitle(),
                    jobPost.getCompanyName(), jobPost.getJobDescription(), jobPost.getCreatedAt(),
                    fullName, hasApplied));
        }
        return jobPostDTOS;
    }

    public FeedPageDTO findRecommendedPostsForUser(long userId, int page, Integer sizeParam) {
        int size = postService.clampSize(sizeParam);
        int safePage = Math.max(page, 0);

        List<Post> postsThatMustBeFetched = postService.fetchFeed(userId);
        if (postsThatMustBeFetched.isEmpty()) {
            return new FeedPageDTO(List.of(), safePage, size, 0L);
        }

        Set<Long> fetchedPostIds = postsThatMustBeFetched.stream()
                .map(Post::getId)
                .collect(Collectors.toSet());

        // O(n) rank index keyed by postId — replaces the previous O(n²) sort that
        // re-streamed and rebuilt a List on every comparator invocation.
        List<PostRecommendation> sortedRecommendations = postRecommendationRepository.findByUserId(userId).stream()
                .filter(rec -> fetchedPostIds.contains(rec.getPostId()))
                .sorted(Comparator.comparing(PostRecommendation::getPostScore).reversed())
                .toList();

        Map<Long, Integer> rankByPostId = new HashMap<>();
        if (sortedRecommendations.isEmpty()) {
            // Cold start: rank the user's available feed by reaction count so they see popular posts instead of nothing.
            List<Long> popularIds = reactionRepository.findPostIdsRankedByReactionCount(new ArrayList<>(fetchedPostIds));
            for (int i = 0; i < popularIds.size(); i++) {
                rankByPostId.put(popularIds.get(i), i);
            }
            int nextRank = popularIds.size();
            for (Long postId : fetchedPostIds) {
                rankByPostId.putIfAbsent(postId, nextRank++);
            }
        } else {
            for (int i = 0; i < sortedRecommendations.size(); i++) {
                rankByPostId.put(sortedRecommendations.get(i).getPostId(), i);
            }
        }

        List<Post> orderedPosts = postsThatMustBeFetched.stream()
                .filter(post -> rankByPostId.containsKey(post.getId()))
                .sorted(Comparator.comparingInt(post -> rankByPostId.get(post.getId())))
                .toList();

        long total = orderedPosts.size();
        int from = (int) Math.min((long) safePage * size, total);
        int to = (int) Math.min((long) from + size, total);
        List<Post> pageSlice = orderedPosts.subList(from, to);

        return new FeedPageDTO(feedAssembler.assemble(pageSlice), safePage, size, total);
    }

    public void recommendJobs() {
        if (!jobsTrainingInFlight.compareAndSet(false, true)) {
            return;
        }
        try {
            readOnlyTransactionTemplate.executeWithoutResult(status -> trainAndSaveJobRecommendations());
        } finally {
            jobsTrainingInFlight.set(false);
        }
    }

    private void trainAndSaveJobRecommendations() {
        List<User> users = userService.fetchAll();
        List<JobPost> jobPosts = jobPostRepository.findAll();

        if (users.isEmpty() || jobPosts.isEmpty()) {
            return;
        }

        double[][] matrix = new double[users.size()][jobPosts.size()];
        Set<Integer> usersWithSignal = new HashSet<>();

        for (int userIndex = 0; userIndex < users.size(); userIndex++) {
            User user = users.get(userIndex);
            if (user.getId() == 1) { // Skip admin user
                continue;
            }

            List<JobView> jobViews = jobViewRepository.findByUserId(user.getId());
            PersonalInfo personalInfo = personalInfoRepository.findByUserId(user.getId());
            if(personalInfo==null){
                continue;
            }
            List<Skill> skills = personalInfo.getSkills();

            List<Long> viewedJobIds = jobViews.stream().map(JobView::getJobId).toList();
            Map<Long, JobPost> viewedJobMap = jobPostRepository.findAllById(viewedJobIds).stream()
                    .collect(Collectors.toMap(JobPost::getId, jp -> jp));

            for (int jobPostIndex = 0; jobPostIndex < jobPosts.size(); jobPostIndex++) {
                JobPost job = jobPosts.get(jobPostIndex);
                int skillMatchScore = calculateSkillMatchForJobs(skills, job, jobViews, viewedJobMap);
                int score = Math.max(skillMatchScore, 0);
                matrix[userIndex][jobPostIndex] = score;
                if (score > 0) {
                    usersWithSignal.add(userIndex);
                }
            }
        }
        MatrixFactorization matrixFactorization = new MatrixFactorization(matrix, 16, 0.0001, 0.05, 6500);
        double[][] results = matrixFactorization.trainAndPredict();
        saveJobRecommendations(users, jobPosts, results, usersWithSignal);
    }

    public void recommendPosts() {
        if (!postsTrainingInFlight.compareAndSet(false, true)) {
            return;
        }
        try {
            readOnlyTransactionTemplate.executeWithoutResult(status -> trainAndSavePostRecommendations());
        } finally {
            postsTrainingInFlight.set(false);
        }
    }

    private void trainAndSavePostRecommendations() {
        List<User> users = userService.fetchAll();
        List<Post> posts = postService.fetchAll();
        if (users.isEmpty() || posts.isEmpty()) {
            return;
        }
        double[][] matrix = new double[users.size()][posts.size()];
        Set<Integer> usersWithSignal = new HashSet<>();

        for (int userIndex = 0; userIndex < users.size(); userIndex++) {
            User user = users.get(userIndex);
            if (user.getId() == 1) { // Skip admin user
                continue;
            }

            List<Long> connectionIds = new ArrayList<>(connectionService.getConnectedUserIds(user.getId()));
            List<Long> postIdsFromReactions = reactionRepository.findPostIdsByUserIds(connectionIds);
            List<Post> postsFromReactions = postRepository.findPostsByIdIn(postIdsFromReactions);
            connectionIds.add(user.getId());
            connectionIds = new ArrayList<>(new HashSet<>(connectionIds));
            List<Reaction> userReactions = reactionRepository.findAllByUserIdFetchPost(user.getId());
            List<PostView> postViews = postViewRepository.findByUserId(user.getId());

            // Fix 4: bulk-fetch all connection reactions once instead of one query per connection
            List<Long> connectionIdsWithoutSelf = connectionIds.stream()
                    .filter(id -> !Objects.equals(id, user.getId())).toList();
            List<Reaction> allConnectionReactions = connectionIdsWithoutSelf.isEmpty()
                    ? List.of()
                    : reactionRepository.findAllByUserIdInFetchPost(connectionIdsWithoutSelf);

            // Fix 4 (post-view path): bulk-fetch viewed posts once instead of per-id inside stream
            List<Long> viewedPostIds = postViews.stream().map(PostView::getPostId).toList();
            Map<Long, Long> viewedPostUserMap = viewedPostIds.isEmpty()
                    ? Map.of()
                    : postRepository.findAllById(viewedPostIds).stream()
                            .collect(Collectors.toMap(Post::getId, Post::getUserId));
            Map<Long, Integer> postCountByUser = new HashMap<>();
            viewedPostUserMap.values().forEach(uid ->
                    postCountByUser.merge(uid, 1, Integer::sum));

            int connectionWeight = 10;
            int threshold = 10;
            int likeWeight = 4;
            for (int postIndex = 0; postIndex < posts.size(); postIndex++) {
                int postScore = 0;
                Post post = posts.get(postIndex);
                if(connectionIds.contains(post.getUserId())){
                    postScore += connectionWeight;
                    if(!Objects.equals(post.getUserId(), user.getId())){
                        Long whoPosted = post.getUserId();
                        long howManyReactions = userReactions.stream()
                                .filter(reaction -> reaction.getPost().getUserId().equals(whoPosted)).count();
                        postScore += (int) howManyReactions;
                    }
                }
                else if(postsFromReactions.contains(post)){
                    long reactionCount = allConnectionReactions.stream()
                            .filter(reaction -> reaction.getPost().getId().equals(post.getId())).count();
                    if(reactionCount > threshold){
                        reactionCount = threshold;
                    }
                    postScore += (int) reactionCount;
                }
                if(!userReactions.isEmpty()) {
                    if (userReactions.stream().anyMatch(reaction -> reaction.getPost().getId().equals(post.getId()))) {
                        postScore += likeWeight;
                    }
                } else {
                    postScore += postCountByUser.getOrDefault(post.getUserId(), 0);
                }
                int score = Math.max(postScore, 0);
                matrix[userIndex][postIndex] = score;
                if (score > 0) {
                    usersWithSignal.add(userIndex);
                }
            }

        }
        MatrixFactorization matrixFactorization = new MatrixFactorization(matrix, 16, 0.0001, 0.05, 6500);
        double[][] results = matrixFactorization.trainAndPredict();
        savePostRecommendations(users, posts, results, usersWithSignal);
    }

    private int calculateSkillMatchForJobs(List<Skill> skills, JobPost jobPost, List<JobView> jobViews, Map<Long, JobPost> viewedJobMap) {
        int totalDistance = 0;
        int skillCount = 0;

        for (Skill skill : skills) {
            int maxLength = Math.max(skill.getSkillTitle().length(), jobPost.getJobTitle().length());
            int distance = calculateLevenshteinDistance(skill.getSkillTitle().toLowerCase(), jobPost.getJobTitle().toLowerCase());
            distance = maxLength - distance;
            if (distance >= 0) {
                totalDistance += distance;
                skillCount++;
            }
        }
        int skillScore = skillCount > 0 ? totalDistance / skillCount : 0;
        int viewBonus = calculateViewedJobBonus(jobPost, jobViews, viewedJobMap);
        return viewBonus + skillScore;
    }

    // Fix 2: accepts pre-fetched viewedJobMap instead of querying DB per view
    private int calculateViewedJobBonus(JobPost currentJob, List<JobView> jobViews, Map<Long, JobPost> viewedJobMap) {
        double weightedBonus = 0.0;
        double totalWeight = 0.0;
        for (JobView jobView : jobViews) {
            JobPost viewedJob = viewedJobMap.get(jobView.getJobId());
            if (viewedJob != null) {
                int maxLength = Math.max(viewedJob.getJobTitle().length(), currentJob.getJobTitle().length());
                int titleDistance = calculateLevenshteinDistance(viewedJob.getJobTitle().toLowerCase(), currentJob.getJobTitle().toLowerCase());
                int viewBonus = maxLength - titleDistance;
                double weight = 1.0 + Math.log1p(Math.max(0, jobView.getViewCount() - 1));
                weightedBonus += viewBonus * weight;
                totalWeight += weight;
            }
        }
        if (totalWeight > 0) {
            return (int) (weightedBonus / totalWeight);
        }
        return 0;
    }

    private int calculateLevenshteinDistance(String word1, String word2) {
        int[][] dp = new int[word1.length() + 1][word2.length() + 1];

        for (int i = 0; i <= word1.length(); i++) {
            for (int j = 0; j <= word2.length(); j++) {
                if (i == 0) {
                    dp[i][j] = j;
                }
                else if (j == 0) {
                    dp[i][j] = i;
                }
                else {
                    dp[i][j] = min(dp[i - 1][j - 1]
                                    + costOfSubstitution(word1.charAt(i - 1), word2.charAt(j - 1)),
                            dp[i - 1][j] + 1,
                            dp[i][j - 1] + 1);
                }
            }
        }

        return dp[word1.length()][word2.length()];
    }

    public static int costOfSubstitution(char a, char b) {
        return a == b ? 0 : 1;
    }

    public static int min(int... numbers) {
        return Arrays.stream(numbers)
                .min().orElse(Integer.MAX_VALUE);
    }

    private void saveJobRecommendations(List<User> users, List<JobPost> jobPosts, double[][] results, Set<Integer> usersWithSignal) {
        for (int userIndex = 0; userIndex < users.size(); userIndex++) {
            User user = users.get(userIndex);
            if (user.getId() == 1) continue;
            // Skip zero-signal users — they fall through to the cold-start fallback in findRecommendedJobsForUser.
            if (!usersWithSignal.contains(userIndex)) continue;

            final int uIdx = userIndex;
            List<JobRecommendation> toSave = new ArrayList<>();
            for (int jobPostIndex = 0; jobPostIndex < jobPosts.size(); jobPostIndex++) {
                JobRecommendation jobRecommendation = new JobRecommendation();
                jobRecommendation.setJobId(jobPosts.get(jobPostIndex).getId());
                jobRecommendation.setUserId(user.getId());
                jobRecommendation.setJobScore(results[uIdx][jobPostIndex]);
                toSave.add(jobRecommendation);
            }

            transactionTemplate.executeWithoutResult(status -> {
                jobRecommendationRepository.deleteByUserId(user.getId());
                jobRecommendationRepository.saveAll(toSave);
            });
        }
    }

    private void savePostRecommendations(List<User> users, List<Post> posts, double[][] results, Set<Integer> usersWithSignal) {
        for (int userIndex = 0; userIndex < users.size(); userIndex++) {
            User user = users.get(userIndex);
            if (user.getId() == 1) continue;
            if (!usersWithSignal.contains(userIndex)) continue;

            final int uIdx = userIndex;
            List<PostRecommendation> toSave = new ArrayList<>();
            for (int postIndex = 0; postIndex < posts.size(); postIndex++) {
                PostRecommendation postRecommendation = new PostRecommendation();
                postRecommendation.setPostId(posts.get(postIndex).getId());
                postRecommendation.setUserId(user.getId());
                postRecommendation.setPostScore(results[uIdx][postIndex]);
                toSave.add(postRecommendation);
            }

            transactionTemplate.executeWithoutResult(status -> {
                postRecommendationRepository.deleteByUserId(user.getId());
                postRecommendationRepository.saveAll(toSave);
            });
        }
    }
}
