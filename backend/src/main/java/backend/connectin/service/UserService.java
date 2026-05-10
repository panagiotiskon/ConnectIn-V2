package backend.connectin.service;

import backend.connectin.domain.repository.JobApplicationRepository;
import backend.connectin.web.mappers.PostMapper;
import backend.connectin.web.resources.*;

import backend.connectin.domain.*;
import backend.connectin.domain.repository.FileRepository;
import backend.connectin.domain.repository.PersonalInfoRepository;
import backend.connectin.domain.repository.UserRepository;
import backend.connectin.web.dto.*;
import backend.connectin.web.mappers.PersonalInfoMapper;
import backend.connectin.web.mappers.UserMapper;
import backend.connectin.web.requests.UserChangeEmailRequest;
import backend.connectin.web.requests.UserChangePasswordRequest;
import backend.connectin.web.requests.UserRegisterRequest;
import jakarta.transaction.Transactional;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final FileService fileService;
    private final PersonalInfoRepository personalInfoRepository;
    private final PersonalInfoMapper personalInfoMapper;
    private final ReactionService reactionService;
    private final JobService jobService;
    private final CommentService commentService;
    private final PostService postService;
    private final PostMapper postMapper;
    private final ConnectionService connectionService;
    private final WelcomeConnectionService welcomeConnectionService;

    public UserService(UserRepository userRepository,
                       FileRepository fileRepository,
                       UserMapper userMapper,
                       PasswordEncoder passwordEncoder,
                       FileService fileService,
                       PersonalInfoRepository personalInfoRepository,
                       PersonalInfoMapper personalInfoMapper,
                       @Lazy ReactionService reactionService,
                       @Lazy JobService jobService,
                       @Lazy CommentService commentService,
                       @Lazy PostService postService,
                       PostMapper postMapper,
                       @Lazy ConnectionService connectionService,
                       @Lazy WelcomeConnectionService welcomeConnectionService) {

        this.userRepository = userRepository;
        this.fileRepository = fileRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.fileService = fileService;
        this.personalInfoRepository = personalInfoRepository;
        this.personalInfoMapper = personalInfoMapper;
        this.reactionService = reactionService;
        this.jobService = jobService;
        this.commentService = commentService;
        this.postService = postService;
        this.postMapper = postMapper;
        this.connectionService = connectionService;
        this.welcomeConnectionService = welcomeConnectionService;
    }

    // Check if user with the given email already exists
    public void validateEmail(String email) {
        if (userRepository.findUserByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
    }

    public User findUserOrThrow(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    public List<User> findUsersByIds(Collection<Long> ids) {
        return userRepository.findAllById(ids);
    }

    @Transactional
    public void registerUser(UserRegisterRequest userRegisterRequest) {
        String email = userRegisterRequest.getEmail();
        User user;
        try {
            validateEmail(email);
            user = userMapper.mapToUser(userRegisterRequest);
            userRepository.save(user);
        } catch (ResponseStatusException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
        MultipartFile profilePicture = userRegisterRequest.getProfilePicture();
        if (profilePicture != null && !profilePicture.isEmpty()) {
            try {
                fileService.store(profilePicture, true, user.getId());
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Profile picture cannot be saved");
            }
        }

        // Best-effort: send pending connection requests from the launch-seed users.
        // Gated by WELCOME_CONNECTIONS env var. Each request runs in its own
        // REQUIRES_NEW transaction inside the service, so a failure there cannot
        // mark this registration transaction rollback-only.
        welcomeConnectionService.sendWelcomeRequests(user.getId());
    }

    public List<User> fetchAll() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .filter(user -> user.getRoles().stream().noneMatch(role -> role.getName().equalsIgnoreCase("ROLE_ADMIN")))
                .toList();
    }

    // Efficient version for admin listing: filters at DB level + batch-loads profile pictures
    public List<UserDTO> fetchAllDTOs() {
        List<User> users = userRepository.findUsersExcludingRole("ROLE_ADMIN");
        List<Long> userIds = users.stream().map(User::getId).toList();
        Map<Long, byte[]> pictureMap = fileRepository.findProfilePicturesByUserIds(userIds)
                .stream()
                .collect(Collectors.toMap(FileDB::getUserId, FileDB::getData));
        return users.stream()
                .map(u -> userMapper.mapToUserDTO(u, pictureMap.get(u.getId())))
                .toList();
    }

    private static final int ADMIN_USERS_DEFAULT_PAGE_SIZE = 20;
    private static final int ADMIN_USERS_MAX_PAGE_SIZE = 100;

    public AdminUserPageDTO searchAdminUsers(String search, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? ADMIN_USERS_DEFAULT_PAGE_SIZE : Math.min(size, ADMIN_USERS_MAX_PAGE_SIZE);
        String term = search == null ? "" : search.trim();

        // Fetch one extra to determine hasMore without a separate count query.
        int fetchLimit = safeSize + 1;
        int offset = safePage * safeSize;
        List<User> users = userRepository.searchUsersExcludingRole("ROLE_ADMIN", term, fetchLimit, offset);
        if (users.isEmpty()) {
            return new AdminUserPageDTO(List.of(), safePage, safeSize, false);
        }

        boolean hasMore = users.size() > safeSize;
        if (hasMore) {
            users = users.subList(0, safeSize);
        }

        List<Long> userIds = users.stream().map(User::getId).toList();
        Map<Long, byte[]> pictureMap = fileRepository.findProfilePicturesByUserIds(userIds)
                .stream()
                .collect(Collectors.toMap(FileDB::getUserId, FileDB::getData));

        List<UserDTO> content = users.stream()
                .map(u -> userMapper.mapToUserDTO(u, pictureMap.get(u.getId())))
                .toList();
        return new AdminUserPageDTO(content, safePage, safeSize, hasMore);
    }


    public Optional<User> findUserByEmail(String email) {
        return userRepository.findUserByEmail(email);
    }

    @Transactional
    public void updatePassword(User user, UserChangePasswordRequest userChangePasswordRequest) {
        if (!passwordEncoder.matches(userChangePasswordRequest.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Old password does not match");
        }
        user.setPassword(passwordEncoder.encode(userChangePasswordRequest.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void updateUserEmail(UserChangeEmailRequest userChangeEmailRequest) {

        String oldEmail = userChangeEmailRequest.getOldEmail();
        String newEmail = userChangeEmailRequest.getNewEmail();

        User user = userRepository.findUserByEmail(oldEmail)
                .orElseThrow(() -> new RuntimeException("User with old email not found."));

        if (userRepository.findUserByEmail(newEmail).isPresent()) {
            throw new RuntimeException("New email already exists.");
        }

        user.setEmail(newEmail);
        userRepository.save(user);
    }

    public List<Experience> getExperience(long userId) {
        if (userRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User not found");
        }
        PersonalInfo personalInfo = personalInfoRepository.findByUserId(userId);
        if (personalInfo == null) {
            return List.of();
        }
        return personalInfo.getExperiences();
    }

    public List<Skill> getSkills(long userId) {
        if (userRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        PersonalInfo personalInfo = personalInfoRepository.findByUserId(userId);
        if (personalInfo == null) {
            return List.of();
        }
        return personalInfo.getSkills();
    }

    public List<Education> getEducation(long userId) {
        if (userRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User not found");
        }
        PersonalInfo personalInfo = personalInfoRepository.findByUserId(userId);
        if (personalInfo == null) {
            return List.of();
        }
        return personalInfo.getEducations();
    }

    @Transactional
    public List<Education> addEducation(long userId, Education education) {
        if (userRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User not found");
        }
        PersonalInfo personalInfo;
        if (personalInfoRepository.findByUserId(userId) == null) {
            User user = userRepository.findById(userId).get();
            personalInfo = new PersonalInfo();
            personalInfo.setUser(user);
            personalInfo.setEducations(List.of(education));
            education.setPersonalInfo(personalInfo);
            personalInfoRepository.save(personalInfo);
        } else {
            personalInfo = personalInfoRepository.findByUserId(userId);

            education.setPersonalInfo(personalInfo);

            personalInfo.addToEducations(education);

            personalInfoRepository.save(personalInfo);
        }
        return personalInfo.getEducations();
    }

    @Transactional
    public List<Experience> addExperience(long userId, Experience experience) {
        if (userRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User not found");
        }
        PersonalInfo personalInfo;
        if (personalInfoRepository.findByUserId(userId) == null) {
            User user = userRepository.findById(userId).get();
            personalInfo = new PersonalInfo();
            personalInfo.setUser(user);
            personalInfo.setExperiences(List.of(experience));
            experience.setPersonalInfo(personalInfo);
            personalInfoRepository.save(personalInfo);
        } else {
            personalInfo = personalInfoRepository.findByUserId(userId);

            experience.setPersonalInfo(personalInfo);

            personalInfo.addToExperiences(experience);

            personalInfoRepository.save(personalInfo);
        }
        return personalInfo.getExperiences();
    }

    @Transactional
    public List<Skill> addSkill(long userId, Skill skill) {
        if (userRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        PersonalInfo personalInfo;
        if (personalInfoRepository.findByUserId(userId) == null) {
            User user = userRepository.findById(userId).get();
            personalInfo = new PersonalInfo();
            personalInfo.setUser(user);
            personalInfo.setSkills(List.of(skill));
            skill.setPersonalInfo(personalInfo);
            personalInfoRepository.save(personalInfo);
        } else {
            personalInfo = personalInfoRepository.findByUserId(userId);

            skill.setPersonalInfo(personalInfo);

            personalInfo.addToSkills(skill);

            personalInfoRepository.save(personalInfo);
        }
        return personalInfo.getSkills();
    }

    public UserDetailDTO getUserDetails(long userId) {
        if (userRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        PersonalInfo personalInfo = personalInfoRepository.findByUserId(userId);
        UserDetailDTO userDetailDTO = new UserDetailDTO();

        if (personalInfo != null) {

            List<SkillDTO> skillDTOS = personalInfo.getSkills().stream()
                    .map(personalInfoMapper::mapToSkillDTO)
                    .toList();

            List<ExperienceDTO> experienceDTOS = personalInfo.getExperiences().stream()
                    .map(personalInfoMapper::mapToExperienceDTO)
                    .toList();

            List<EducationDTO> educationDTOS = personalInfo.getEducations().stream()
                    .map(personalInfoMapper::mapToEducationDTO)
                    .toList();

            userDetailDTO.setSkills(skillDTOS);
            userDetailDTO.setExperiences(experienceDTOS);
            userDetailDTO.setEducation(educationDTOS);
        }
        List<ConnectionResource> connectionResources = connectionService.getConnectedUsers(userId);
        List<JobApplicationDTO> jobApplicationDTOS = jobService.getJobApplications(userId);
        List<JobPostDTO> jobPostDTOS = jobService.getUserJobPosts(userId);

        List<PostResource> postResources = postService.fetchUserPosts(userId)
                .stream()
                .map(postMapper::mapToPostResource)
                .toList();

        List<CommentResource> commentResources = commentService.fetchUserCommentResources(userId);
        List<ReactionResource> reactionResources = reactionService.fetchUserReactions(userId);
        userDetailDTO.setConnectedUsers(connectionResources);
        userDetailDTO.setJobApplications(jobApplicationDTOS);
        userDetailDTO.setJobPosts(jobPostDTOS);
        userDetailDTO.setPosts(postResources);
        userDetailDTO.setComments(commentResources);
        userDetailDTO.setReactions(reactionResources);
        return userDetailDTO;
    }

    public Map<Long, UserDetailDTO> getUsersDetails(List<Long> userIds) {
        // Validate all user IDs in one query instead of one findById per user
        Set<Long> existingIds = userRepository.findAllById(userIds).stream()
                .map(User::getId)
                .collect(Collectors.toSet());
        List<Long> notFound = userIds.stream().filter(id -> !existingIds.contains(id)).toList();
        if (!notFound.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Users not found: " + notFound);
        }
        return userIds.stream()
                .collect(Collectors.toMap(
                        userId -> userId,
                        this::getUserDetailsSkipExistenceCheck
                ));
    }

    private UserDetailDTO getUserDetailsSkipExistenceCheck(long userId) {
        PersonalInfo personalInfo = personalInfoRepository.findByUserId(userId);
        UserDetailDTO userDetailDTO = new UserDetailDTO();

        if (personalInfo != null) {
            List<SkillDTO> skillDTOS = personalInfo.getSkills().stream()
                    .map(personalInfoMapper::mapToSkillDTO)
                    .toList();
            List<ExperienceDTO> experienceDTOS = personalInfo.getExperiences().stream()
                    .map(personalInfoMapper::mapToExperienceDTO)
                    .toList();
            List<EducationDTO> educationDTOS = personalInfo.getEducations().stream()
                    .map(personalInfoMapper::mapToEducationDTO)
                    .toList();
            userDetailDTO.setSkills(skillDTOS);
            userDetailDTO.setExperiences(experienceDTOS);
            userDetailDTO.setEducation(educationDTOS);
        }
        userDetailDTO.setConnectedUsers(connectionService.getConnectedUsers(userId));
        userDetailDTO.setJobApplications(jobService.getJobApplications(userId));
        userDetailDTO.setJobPosts(jobService.getUserJobPosts(userId));
        userDetailDTO.setPosts(postService.fetchUserPosts(userId).stream()
                .map(postMapper::mapToPostResource).toList());
        userDetailDTO.setComments(commentService.fetchUserCommentResources(userId));
        userDetailDTO.setReactions(reactionService.fetchUserReactions(userId));
        return userDetailDTO;
    }

    private static final int SEARCH_MAX_PAGE_SIZE = 50;
    private static final int SEARCH_DEFAULT_PAGE_SIZE = 20;

    public UserSearchPageDTO searchUsers(String searchTerm, long currentUserId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? SEARCH_DEFAULT_PAGE_SIZE : Math.min(size, SEARCH_MAX_PAGE_SIZE);

        if (searchTerm == null || searchTerm.isBlank()) {
            return new UserSearchPageDTO(List.of(), safePage, safeSize, false);
        }
        String term = searchTerm.trim();

        // Fetch one extra row to determine hasMore without a separate count query.
        int fetchLimit = safeSize + 1;
        int offset = safePage * safeSize;
        List<Object[]> rows = userRepository.searchUsersWithConnectionStatus(currentUserId, term, fetchLimit, offset);
        if (rows.isEmpty()) {
            return new UserSearchPageDTO(List.of(), safePage, safeSize, false);
        }

        boolean hasMore = rows.size() > safeSize;
        if (hasMore) {
            rows = rows.subList(0, safeSize);
        }

        List<Long> userIds = rows.stream().map(r -> ((Number) r[0]).longValue()).toList();

        Map<Long, Object[]> experienceMap = personalInfoRepository.findLatestExperienceByUserIds(userIds)
                .stream()
                .collect(Collectors.toMap(
                        r -> ((Number) r[0]).longValue(),
                        r -> r,
                        (a, b) -> a
                ));

        Map<Long, FileDB> pictureMap = fileRepository.findProfilePicturesByUserIds(userIds)
                .stream()
                .collect(Collectors.toMap(FileDB::getUserId, f -> f));

        List<RegisteredUserDTO> results = new ArrayList<>();
        for (Object[] row : rows) {
            long userId = ((Number) row[0]).longValue();
            String firstName = (String) row[1];
            String lastName = (String) row[2];
            String connectionStatus = row[3] != null ? row[3].toString() : null;

            Object[] exp = experienceMap.get(userId);
            String jobTitle = exp != null ? (String) exp[1] : null;
            String companyName = exp != null ? (String) exp[2] : null;

            FileDB pic = pictureMap.get(userId);
            String profilePic = null;
            String profileType = null;
            if (pic != null && pic.getType().startsWith("image/")) {
                profilePic = Base64.getEncoder().encodeToString(pic.getData());
                profileType = pic.getType();
            }

            results.add(new RegisteredUserDTO(userId, firstName, lastName, jobTitle, companyName, profilePic, profileType, connectionStatus));
        }
        return new UserSearchPageDTO(results, safePage, safeSize, hasMore);
    }

    public List<Long> getFilteredUsers(String searchTerm, long userId) {
        List<User> users = fetchAll();

        users = users.stream()
                .filter(user -> user.getId() != 1 && user.getId() != userId)
                .collect(Collectors.toList());


        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String lowerCaseSearchTerm = searchTerm.toLowerCase();
            String[] searchTerms = lowerCaseSearchTerm.split(" ");

            users = users.stream()
                    .filter(user -> {
                        boolean matches = false;

                        if (searchTerms.length == 1) {
                            matches = user.getFirstName().toLowerCase().startsWith(searchTerms[0]);
                        } else if (searchTerms.length >= 2) {
                            matches = user.getFirstName().toLowerCase().startsWith(searchTerms[0])
                                    && user.getLastName().toLowerCase().startsWith(searchTerms[1]);
                        }

                        return matches;
                    }).toList();
            if (users.isEmpty()) {
                return new ArrayList<>();
            }

            return users.stream().map(User::getId).toList();

        } else {
            return new ArrayList<>();
        }
    }

    public void deleteSkill(long userId, long skillId) {
        PersonalInfo personalInfo = personalInfoRepository.findByUserId(userId);
        if (personalInfo != null) {
            List<Skill> skills = personalInfo.getSkills();
            skills.removeIf(skill -> skill.getId() == skillId);
            personalInfo.setSkills(skills);
            personalInfoRepository.save(personalInfo);
        }
    }

    public void deleteEducation(long userId, long educationId) {
        PersonalInfo personalInfo = personalInfoRepository.findByUserId(userId);
        if (personalInfo != null) {
            List<Education> educations = personalInfo.getEducations();
            educations.removeIf(education -> education.getId() == educationId);
            personalInfo.setEducations(educations);
            personalInfoRepository.save(personalInfo);
        }
    }

    public void deleteExperience(long userId, long experienceId) {
        PersonalInfo personalInfo = personalInfoRepository.findByUserId(userId);
        if (personalInfo != null) {
            List<Experience> experiences = personalInfo.getExperiences();
            experiences.removeIf(experience -> experience.getId() == experienceId);
            personalInfo.setExperiences(experiences);
            personalInfoRepository.save(personalInfo);
        }
    }

}

