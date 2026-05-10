package backend.connectin.service;

import backend.connectin.config.LaunchDataSeeder;
import backend.connectin.domain.User;
import backend.connectin.domain.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Sends pending connection requests from each launch-seed user to a newly registered user,
 * so the new user lands in an inbox that already has activity.
 *
 * Activated only when app.seed.welcome.enabled=true (env: WELCOME_CONNECTIONS).
 * Failures are swallowed and logged — a problem here must never block registration.
 */
@Service
public class WelcomeConnectionService {

    private static final Logger log = LoggerFactory.getLogger(WelcomeConnectionService.class);

    private final UserRepository userRepository;
    private final ConnectionService connectionService;
    private final TransactionTemplate requiresNewTx;
    private final boolean enabled;

    public WelcomeConnectionService(UserRepository userRepository,
                                    @Lazy ConnectionService connectionService,
                                    PlatformTransactionManager txManager,
                                    @Value("${app.seed.welcome.enabled:false}") boolean enabled) {
        this.userRepository = userRepository;
        this.connectionService = connectionService;
        this.requiresNewTx = new TransactionTemplate(txManager);
        this.requiresNewTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.enabled = enabled;
    }

    /**
     * For each seed user that exists, send a pending connection request targeting the
     * newly registered user.
     *
     * Each request runs in its own REQUIRES_NEW transaction. The caller's transaction
     * (e.g. UserService.registerUser) is suspended for the duration of each request
     * and resumed afterwards, so a failure here can never mark the registration
     * transaction rollback-only.
     */
    public void sendWelcomeRequests(long newUserId) {
        if (!enabled) {
            return;
        }

        int sent = 0;
        for (String seedEmail : LaunchDataSeeder.SEED_USER_EMAILS) {
            try {
                Boolean wrote = requiresNewTx.execute(status -> {
                    User seedUser = userRepository.findUserByEmail(seedEmail).orElse(null);
                    if (seedUser == null || seedUser.getId() == newUserId) {
                        return Boolean.FALSE;
                    }
                    connectionService.requestToConnect(seedUser.getId(), newUserId);
                    return Boolean.TRUE;
                });
                if (Boolean.TRUE.equals(wrote)) {
                    sent++;
                }
            } catch (Exception e) {
                log.warn("[WelcomeConnectionService] Skipped welcome request from {} to user {}: {}",
                        seedEmail, newUserId, e.getMessage());
            }
        }
        log.info("[WelcomeConnectionService] Sent {} welcome connection requests to user {}", sent, newUserId);
    }
}
