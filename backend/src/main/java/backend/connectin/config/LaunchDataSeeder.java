package backend.connectin.config;

import backend.connectin.domain.Connection;
import backend.connectin.domain.JobApplication;
import backend.connectin.domain.JobPost;
import backend.connectin.domain.Post;
import backend.connectin.domain.Role;
import backend.connectin.domain.User;
import backend.connectin.domain.enums.ConnectionStatus;
import backend.connectin.domain.repository.ConnectionRepository;
import backend.connectin.domain.repository.JobApplicationRepository;
import backend.connectin.domain.repository.JobPostRepository;
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
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * One-shot launch fixture seeder.
 *
 * Activated only when app.seed.launch.enabled=true (env: LAUNCH_SEED).
 * Idempotent: skips if any non-admin user already exists, so leaving the flag
 * on by mistake won't duplicate data.
 *
 * Workflow:
 *   1. Run prod-wipe.sql against Railway MySQL.
 *   2. Set LAUNCH_SEED=true on Railway, redeploy. Seeder populates fixtures.
 *   3. Set LAUNCH_SEED=false (or unset), redeploy. Seeder no longer runs.
 */
@Configuration
public class LaunchDataSeeder {

    private static final Logger log = LoggerFactory.getLogger(LaunchDataSeeder.class);
    public static final String SEED_PASSWORD = "Demo123!"; // shared demo password
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
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String adminEmail;

    public LaunchDataSeeder(UserRepository userRepository,
                            RoleRepository roleRepository,
                            PostRepository postRepository,
                            JobPostRepository jobPostRepository,
                            JobApplicationRepository jobApplicationRepository,
                            ConnectionRepository connectionRepository,
                            PasswordEncoder passwordEncoder,
                            @Value("${app.seed.launch.enabled:false}") boolean enabled,
                            @Value("${app.admin.email:" + ADMIN_EMAIL_PROPERTY + "}") String adminEmail) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.postRepository = postRepository;
        this.jobPostRepository = jobPostRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.connectionRepository = connectionRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.adminEmail = adminEmail;
    }

    @Bean
    @Transactional
    public CommandLineRunner seedLaunchData() {
        return args -> {
            if (!enabled) {
                return;
            }

            long nonAdminUsers = userRepository.findAll().stream()
                    .filter(u -> !u.getEmail().equalsIgnoreCase(adminEmail))
                    .count();
            if (nonAdminUsers > 0) {
                log.info("[LaunchDataSeeder] Skipping seed: {} non-admin users already exist", nonAdminUsers);
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
                    buildUser(SEED_USER_EMAILS.get(0), "Alex", "Morgan", "+30 6912345001", userRole),
                    buildUser(SEED_USER_EMAILS.get(1), "Maria", "Papadopoulou", "+30 6912345002", userRole),
                    buildUser(SEED_USER_EMAILS.get(2), "Nikos", "Dimitriou", "+30 6912345003", userRole),
                    buildUser(SEED_USER_EMAILS.get(3), "Elena", "Georgiou", "+30 6912345004", userRole),
                    buildUser(SEED_USER_EMAILS.get(4), "Yannis", "Koutras", "+30 6912345005", userRole)
            );
            users = userRepository.saveAll(users);
            log.info("[LaunchDataSeeder] Seeded {} users", users.size());

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
            // Pending requests targeting alex (mirrored).
            addConnectionPair(connections, alexId, mariaId, ConnectionStatus.PENDING, now.minus(2, ChronoUnit.DAYS));
            addConnectionPair(connections, alexId, nikosId, ConnectionStatus.PENDING, now.minus(2, ChronoUnit.DAYS));
            addConnectionPair(connections, alexId, elenaId, ConnectionStatus.PENDING, now.minus(1, ChronoUnit.DAYS));
            addConnectionPair(connections, alexId, yannisId, ConnectionStatus.PENDING, now.minus(1, ChronoUnit.DAYS));
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

            log.warn("[LaunchDataSeeder] Seed complete. Set LAUNCH_SEED=false and redeploy to deactivate.");
        };
    }

    private User buildUser(String email, String firstName, String lastName, String phone, Role role) {
        User u = new User();
        u.setEmail(email);
        u.setFirstName(firstName);
        u.setLastName(lastName);
        u.setPhoneNumber(phone);
        u.setPassword(passwordEncoder.encode(SEED_PASSWORD));
        u.setRoles(List.of(role));
        return u;
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
}
