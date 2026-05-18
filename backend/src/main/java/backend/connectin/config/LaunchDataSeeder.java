package backend.connectin.config;

import backend.connectin.domain.Connection;
import backend.connectin.domain.Education;
import backend.connectin.domain.Experience;
import backend.connectin.domain.JobApplication;
import backend.connectin.domain.JobPost;
import backend.connectin.domain.Notification;
import backend.connectin.domain.PersonalInfo;
import backend.connectin.domain.Post;
import backend.connectin.domain.Role;
import backend.connectin.domain.Skill;
import backend.connectin.domain.User;
import backend.connectin.domain.enums.ConnectionStatus;
import backend.connectin.domain.enums.NotificationType;
import backend.connectin.domain.repository.ConnectionRepository;
import backend.connectin.domain.repository.JobApplicationRepository;
import backend.connectin.domain.repository.JobPostRepository;
import backend.connectin.domain.repository.NotificationRepository;
import backend.connectin.domain.repository.PersonalInfoRepository;
import backend.connectin.domain.repository.PostRepository;
import backend.connectin.domain.repository.RoleRepository;
import backend.connectin.domain.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * One-shot launch fixture seeder.
 *
 * Activated only when app.seed.launch.enabled=true (env: LAUNCH_SEED).
 * Idempotent: detects a prior successful seed by checking whether the first
 * seed user already has a PersonalInfo row, and short-circuits if so. This
 * makes it safe to leave LAUNCH_SEED=true across deploys without duplicating
 * posts/jobs/connections/notifications.
 */
@Configuration
public class LaunchDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(LaunchDataSeeder.class);
    private static final String ADMIN_EMAIL_PROPERTY = "admin@example.com";

    /** Emails of all seed users, in seeding order. Re-used by WelcomeConnectionService. */
    public static final List<String> SEED_USER_EMAILS = List.of(
            "alex.morgan@connectin.demo",
            "maria.papadopoulou@connectin.demo",
            "nikos.dimitriou@connectin.demo",
            "elena.georgiou@connectin.demo",
            "yannis.koutras@connectin.demo"
    );

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PostRepository postRepository;
    private final JobPostRepository jobPostRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final ConnectionRepository connectionRepository;
    private final NotificationRepository notificationRepository;
    private final PersonalInfoRepository personalInfoRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String adminEmail;
    private final String seedPassword;

    public LaunchDataSeeder(UserRepository userRepository,
                            RoleRepository roleRepository,
                            PostRepository postRepository,
                            JobPostRepository jobPostRepository,
                            JobApplicationRepository jobApplicationRepository,
                            ConnectionRepository connectionRepository,
                            NotificationRepository notificationRepository,
                            PersonalInfoRepository personalInfoRepository,
                            PasswordEncoder passwordEncoder,
                            @Value("${app.seed.launch.enabled:false}") boolean enabled,
                            @Value("${app.admin.email:" + ADMIN_EMAIL_PROPERTY + "}") String adminEmail,
                            @Value("${app.seed.password:}") String seedPassword) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.postRepository = postRepository;
        this.jobPostRepository = jobPostRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.connectionRepository = connectionRepository;
        this.notificationRepository = notificationRepository;
        this.personalInfoRepository = personalInfoRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.adminEmail = adminEmail;
        this.seedPassword = seedPassword;
    }

    @Bean
    @Transactional
    public CommandLineRunner seedLaunchData() {
        return args -> {
            if (!enabled) {
                return;
            }

            if (seedPassword == null || seedPassword.isBlank()) {
                log.error("[LaunchDataSeeder] LAUNCH_SEED=true but SEED_PASSWORD is not set. Aborting seed.");
                return;
            }

            // Global idempotency guard: if the first seed user already has personal
            // info, the seed has run successfully before — skip everything to avoid
            // duplicating posts, jobs, applications, connections, and notifications
            // on subsequent deploys.
            Optional<User> existingPrimary = userRepository.findUserByEmail(SEED_USER_EMAILS.get(0));
            if (existingPrimary.isPresent()
                    && personalInfoRepository.findByUserId(existingPrimary.get().getId()) != null) {
                log.info("[LaunchDataSeeder] Seed data already present (alex has personal info). Skipping.");
                return;
            }

            log.warn("[LaunchDataSeeder] LAUNCH_SEED=true — seeding launch fixtures.");

            Role userRole = roleRepository.findByName("ROLE_USER");
            if (userRole == null) {
                log.error("[LaunchDataSeeder] ROLE_USER not found. Aborting seed.");
                return;
            }

            // ---- Users (5) ----
            // Emails are sourced from SEED_USER_EMAILS so WelcomeConnectionService stays in sync.
            List<User> users = List.of(
                    getOrCreateSeedUser(SEED_USER_EMAILS.get(0), "Alex", "Morgan", "+30 6912345001", userRole),
                    getOrCreateSeedUser(SEED_USER_EMAILS.get(1), "Maria", "Papadopoulou", "+30 6912345002", userRole),
                    getOrCreateSeedUser(SEED_USER_EMAILS.get(2), "Nikos", "Dimitriou", "+30 6912345003", userRole),
                    getOrCreateSeedUser(SEED_USER_EMAILS.get(3), "Elena", "Georgiou", "+30 6912345004", userRole),
                    getOrCreateSeedUser(SEED_USER_EMAILS.get(4), "Yannis", "Koutras", "+30 6912345005", userRole)
            );
            users = userRepository.saveAll(users);
            log.info("[LaunchDataSeeder] Seeded {} users", users.size());

            // ---- Personal info: skills, education, experience ----
            // Profiles are tailored to each user's posts, applications, and the jobs they
            // own (e.g. Yannis owns the Connect-In requisitions, so he reads as the
            // hiring manager; Elena owns the Aegean Labs design role, etc.).
            seedPersonalInfo(users.get(0),
                    List.of("Java", "Spring Boot", "MySQL", "OAuth & JWT", "REST APIs"),
                    List.of(
                            edu("National Technical University of Athens", "BSc Computer Science",
                                    LocalDate.of(2015, 9, 1), LocalDate.of(2019, 7, 1)),
                            edu("University of Edinburgh", "MSc Software Engineering",
                                    LocalDate.of(2019, 9, 1), LocalDate.of(2020, 9, 1))
                    ),
                    List.of(
                            exp("Software Engineer", "FinHub",
                                    LocalDate.of(2020, 10, 1), LocalDate.of(2022, 8, 1)),
                            exp("Senior Backend Engineer", "Acme Corp",
                                    LocalDate.of(2022, 9, 1), null)
                    ));

            seedPersonalInfo(users.get(1),
                    List.of("React", "TypeScript", "CSS", "Distributed Systems", "Accessibility"),
                    List.of(
                            edu("University of Athens", "BSc Software Engineering",
                                    LocalDate.of(2015, 9, 1), LocalDate.of(2019, 7, 1))
                    ),
                    List.of(
                            exp("Junior Frontend Developer", "WebStack",
                                    LocalDate.of(2019, 9, 1), LocalDate.of(2021, 5, 1)),
                            exp("Frontend Engineer", "Aegean Labs",
                                    LocalDate.of(2021, 6, 1), null)
                    ));

            seedPersonalInfo(users.get(2),
                    List.of("Kubernetes", "AWS", "Terraform", "Java", "Observability"),
                    List.of(
                            edu("National Technical University of Athens",
                                    "MEng Electrical & Computer Engineering",
                                    LocalDate.of(2012, 9, 1), LocalDate.of(2017, 7, 1))
                    ),
                    List.of(
                            exp("Backend Developer", "Acme Corp",
                                    LocalDate.of(2017, 9, 1), LocalDate.of(2020, 6, 1)),
                            exp("DevOps Engineer", "Olympus Tech",
                                    LocalDate.of(2020, 7, 1), null)
                    ));

            seedPersonalInfo(users.get(3),
                    List.of("Figma", "User Research", "Prototyping", "Design Systems", "Workshop Facilitation"),
                    List.of(
                            edu("Athens School of Fine Arts", "BA Graphic Design",
                                    LocalDate.of(2014, 9, 1), LocalDate.of(2018, 7, 1))
                    ),
                    List.of(
                            exp("UX Designer", "DesignWorks",
                                    LocalDate.of(2018, 9, 1), LocalDate.of(2021, 4, 1)),
                            exp("Product Designer", "Aegean Labs",
                                    LocalDate.of(2021, 5, 1), null)
                    ));

            seedPersonalInfo(users.get(4),
                    List.of("Engineering Leadership", "System Design", "Hiring", "Mentoring", "Java"),
                    List.of(
                            edu("Athens University of Economics and Business", "BSc Informatics",
                                    LocalDate.of(2010, 9, 1), LocalDate.of(2014, 7, 1)),
                            edu("University of Patras", "MSc Computer Science",
                                    LocalDate.of(2014, 9, 1), LocalDate.of(2016, 7, 1))
                    ),
                    List.of(
                            exp("Senior Software Engineer", "FinHub",
                                    LocalDate.of(2016, 9, 1), LocalDate.of(2022, 2, 1)),
                            exp("Engineering Manager", "Connect-In",
                                    LocalDate.of(2022, 3, 1), null)
                    ));
            log.info("[LaunchDataSeeder] Seeded personal info for {} users", users.size());

            // ---- Posts (6) ----
            Instant now = Instant.now();
            List<Post> posts = List.of(
                    buildPost(users.get(0).getId(),
                            "Excited to share that I just shipped a new authentication flow at work! Big thanks to my team.",
                            now.minus(6, ChronoUnit.DAYS)),
                    buildPost(users.get(1).getId(),
                            "Looking for recommendations on books about distributed systems. Drop your favorites below!",
                            now.minus(5, ChronoUnit.DAYS)),
                    buildPost(users.get(2).getId(),
                            "Just attended an amazing meetup on Kubernetes. The community in Athens is thriving.",
                            now.minus(4, ChronoUnit.DAYS)),
                    buildPost(users.get(3).getId(),
                            "Hot take: well-named functions beat clever abstractions every time.",
                            now.minus(3, ChronoUnit.DAYS)),
                    buildPost(users.get(4).getId(),
                            "We are hiring! Check out the open roles on our jobs page.",
                            now.minus(2, ChronoUnit.DAYS)),
                    buildPost(users.get(0).getId(),
                            "Career milestone: 3 years in. Grateful for the mentors who helped along the way.",
                            now.minus(1, ChronoUnit.DAYS))
            );
            posts = postRepository.saveAll(posts);
            log.info("[LaunchDataSeeder] Seeded {} posts", posts.size());

            // ---- Job posts (4) ----
            List<JobPost> jobs = List.of(
                    buildJobPost(users.get(4).getId(), "Senior Backend Engineer", "Connect-In",
                            "We are looking for a senior backend engineer with strong Java/Spring experience to join our platform team. You will own services that power user feeds, recommendations, and messaging.",
                            now.minus(7, ChronoUnit.DAYS)),
                    buildJobPost(users.get(4).getId(), "Frontend Engineer (React)", "Connect-In",
                            "Build delightful UIs with React and modern tooling. Strong design sense and ability to ship end-to-end features required.",
                            now.minus(5, ChronoUnit.DAYS)),
                    buildJobPost(users.get(2).getId(), "DevOps Engineer", "Olympus Tech",
                            "Own our CI/CD, observability, and infrastructure-as-code. Kubernetes and AWS experience preferred.",
                            now.minus(4, ChronoUnit.DAYS)),
                    buildJobPost(users.get(3).getId(), "Product Designer", "Aegean Labs",
                            "Lead the design of new product surfaces. You will work closely with engineering and PM from concept to launch.",
                            now.minus(2, ChronoUnit.DAYS))
            );
            jobs = jobPostRepository.saveAll(jobs);
            log.info("[LaunchDataSeeder] Seeded {} job posts", jobs.size());

            // ---- Job applications (5) ----
            List<JobApplication> applications = List.of(
                    buildApplication(users.get(0).getId(), jobs.get(0).getId(), now.minus(3, ChronoUnit.DAYS)),
                    buildApplication(users.get(1).getId(), jobs.get(1).getId(), now.minus(2, ChronoUnit.DAYS)),
                    buildApplication(users.get(2).getId(), jobs.get(0).getId(), now.minus(2, ChronoUnit.DAYS)),
                    buildApplication(users.get(3).getId(), jobs.get(2).getId(), now.minus(1, ChronoUnit.DAYS)),
                    buildApplication(users.get(0).getId(), jobs.get(3).getId(), now.minus(1, ChronoUnit.DAYS))
            );
            applications = jobApplicationRepository.saveAll(applications);
            log.info("[LaunchDataSeeder] Seeded {} job applications", applications.size());

            // ---- Connections ----
            // The app stores each connection as TWO mirrored rows (see ConnectionService.requestToConnect):
            //   (A, B, status) AND (B, A, status). We follow the same convention here.
            // Pattern:
            //   * Alex (users[0]) is the primary demo account: 4 PENDING pairs (everyone -> alex).
            //   * 3 ACCEPTED pairs among the rest, so the connections page is never empty.
            Long alexId = users.get(0).getId();
            Long mariaId = users.get(1).getId();
            Long nikosId = users.get(2).getId();
            Long elenaId = users.get(3).getId();
            Long yannisId = users.get(4).getId();

            List<Connection> connections = new java.util.ArrayList<>();
            // Each addConnectionPair(sender, recipient) creates two mirrored rows:
            //   (sender, recipient, status) and (recipient, sender, status).
            // findPendingUserConnections(userId) queries WHERE userId2 = userId, so the row
            // (sender, recipient) is matched when the logged-in user is the recipient,
            // and the peer shown is userId1 = sender. ✓
            addConnectionPair(connections, mariaId, alexId, ConnectionStatus.PENDING, now.minus(2, ChronoUnit.DAYS));
            addConnectionPair(connections, nikosId, alexId, ConnectionStatus.PENDING, now.minus(2, ChronoUnit.DAYS));
            addConnectionPair(connections, elenaId, alexId, ConnectionStatus.PENDING, now.minus(1, ChronoUnit.DAYS));
            addConnectionPair(connections, yannisId, alexId, ConnectionStatus.PENDING, now.minus(1, ChronoUnit.DAYS));
            // Existing accepted network among the rest (mirrored).
            addConnectionPair(connections, mariaId, nikosId, ConnectionStatus.ACCEPTED, now.minus(20, ChronoUnit.DAYS));
            addConnectionPair(connections, mariaId, elenaId, ConnectionStatus.ACCEPTED, now.minus(15, ChronoUnit.DAYS));
            addConnectionPair(connections, nikosId, yannisId, ConnectionStatus.ACCEPTED, now.minus(10, ChronoUnit.DAYS));

            connections = connectionRepository.saveAll(connections);
            log.info("[LaunchDataSeeder] Seeded {} connection rows ({} pending, {} accepted) across {} pairs",
                    connections.size(),
                    connections.stream().filter(c -> c.getStatus() == ConnectionStatus.PENDING).count(),
                    connections.stream().filter(c -> c.getStatus() == ConnectionStatus.ACCEPTED).count(),
                    connections.size() / 2);

            // ---- Notifications for pending connections ----
            // One notification per pending request so Alex sees them in his inbox on first login.
            // userId = recipient (Alex), connectionUserId = sender.
            List<Notification> pendingNotifications = List.of(
                    buildConnectionNotification(alexId, mariaId,  now.minus(2, ChronoUnit.DAYS)),
                    buildConnectionNotification(alexId, nikosId,  now.minus(2, ChronoUnit.DAYS)),
                    buildConnectionNotification(alexId, elenaId,  now.minus(1, ChronoUnit.DAYS)),
                    buildConnectionNotification(alexId, yannisId, now.minus(1, ChronoUnit.DAYS))
            );
            notificationRepository.saveAll(pendingNotifications);
            log.info("[LaunchDataSeeder] Seeded {} connection notifications for alex", pendingNotifications.size());

            log.warn("[LaunchDataSeeder] Seed complete. Set LAUNCH_SEED=false and redeploy to deactivate.");
        };
    }

    private User buildUser(String email, String firstName, String lastName, String phone, Role role) {
        User u = new User();
        u.setEmail(email);
        u.setFirstName(firstName);
        u.setLastName(lastName);
        u.setPhoneNumber(phone);
        u.setPassword(passwordEncoder.encode(seedPassword));
        u.setRoles(List.of(role));
        return u;
    }

    private User getOrCreateSeedUser(String email, String firstName, String lastName, String phone, Role role) {
        Optional<User> existing = userRepository.findUserByEmail(email);
        if (existing.isPresent()) {
            log.info("[LaunchDataSeeder] Found existing user with email {}. Skipping creation.", email);
            return existing.get();
        }
        User newUser = buildUser(email, firstName, lastName, phone, role);
        return userRepository.save(newUser);
    }

    private Post buildPost(Long userId, String content, Instant createdAt) {
        Post p = new Post();
        p.setUserId(userId);
        p.setContent(content);
        p.setCreatedAt(createdAt);
        return p;
    }

    private JobPost buildJobPost(long userId, String title, String company, String description, Instant createdAt) {
        JobPost j = new JobPost();
        j.setUserId(userId);
        j.setJobTitle(title);
        j.setCompanyName(company);
        j.setJobDescription(description);
        j.setCreatedAt(createdAt);
        return j;
    }

    private JobApplication buildApplication(long userId, long jobPostId, Instant appliedAt) {
        JobApplication a = new JobApplication();
        a.setUserId(userId);
        a.setJobPostId(jobPostId);
        a.setAppliedAt(appliedAt);
        return a;
    }

    private Connection buildConnection(Long userId1, Long userId2, ConnectionStatus status, Instant when) {
        Connection c = new Connection(userId1, userId2, status);
        c.setCreatedAt(when);
        c.setUpdatedAt(when);
        return c;
    }

    private void addConnectionPair(List<Connection> sink, Long a, Long b, ConnectionStatus status, Instant when) {
        sink.add(buildConnection(a, b, status, when));
        sink.add(buildConnection(b, a, status, when));
    }

    private void seedPersonalInfo(User user, List<String> skillTitles,
                                  List<Education> educations, List<Experience> experiences) {
        PersonalInfo personalInfo = new PersonalInfo();
        personalInfo.setUser(user);

        List<Skill> skills = new ArrayList<>();
        for (String title : skillTitles) {
            Skill skill = new Skill();
            skill.setSkillTitle(title);
            skill.setSkillDescription("");
            skill.setIsPublic(true);
            skill.setPersonalInfo(personalInfo);
            skills.add(skill);
        }
        for (Education education : educations) {
            education.setIsPublic(true);
            education.setPersonalInfo(personalInfo);
        }
        for (Experience experience : experiences) {
            experience.setIsPublic(true);
            experience.setPersonalInfo(personalInfo);
        }
        personalInfo.setSkills(skills);
        personalInfo.setEducations(new ArrayList<>(educations));
        personalInfo.setExperiences(new ArrayList<>(experiences));

        personalInfoRepository.save(personalInfo);
        log.info("[LaunchDataSeeder] Seeded personal info for {}", user.getEmail());
    }

    private Education edu(String universityName, String fieldOfStudy, LocalDate startDate, LocalDate endDate) {
        Education e = new Education();
        e.setUniversityName(universityName);
        e.setFieldOfStudy(fieldOfStudy);
        e.setStartDate(startDate);
        e.setEndDate(endDate);
        return e;
    }

    private Experience exp(String jobTitle, String companyName, LocalDate startDate, LocalDate endDate) {
        Experience x = new Experience();
        x.setJobTitle(jobTitle);
        x.setCompanyName(companyName);
        x.setStartDate(startDate);
        x.setEndDate(endDate);
        return x;
    }

    private Notification buildConnectionNotification(Long recipientId, Long senderId, Instant when) {
        Notification n = new Notification();
        n.setUserId(recipientId);
        n.setConnectionUserId(senderId);
        n.setType(NotificationType.CONNECTION);
        n.setCreatedAt(when);
        return n;
    }
}
