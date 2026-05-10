package backend.connectin.service;

import backend.connectin.config.LaunchDataSeeder;
import backend.connectin.domain.User;
import backend.connectin.domain.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

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
    private final boolean enabled;

    public WelcomeConnectionService(UserRepository userRepository,
                                    @Lazy ConnectionService connectionService,
                                    @Value("${app.seed.welcome.enabled:false}") boolean enabled) {
        this.userRepository = userRepository;
        this.connectionService = connectionService;
        this.enabled = enabled;
    }

    /**
     * Best-effort: for each seed user that exists, send a pending connection request
     * targeting the newly registered user.
     *
     * When invoked inside an active transaction (e.g. from UserService.registerUser),
     * the work is deferred to afterCommit so that any failure inside requestToConnect
     * — which throws RuntimeException on conflict / not-found and would otherwise
     * mark the outer transaction rollback-only — cannot affect the registration.
     */
    public void sendWelcomeRequests(long newUserId) {
        if (!enabled) {
            return;
        }

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    doSendWelcomeRequests(newUserId);
                }
            });
        } else {
            doSendWelcomeRequests(newUserId);
        }
    }

    private void doSendWelcomeRequests(long newUserId) {
        int sent = 0;
        for (String seedEmail : LaunchDataSeeder.SEED_USER_EMAILS) {
            try {
                User seedUser = userRepository.findUserByEmail(seedEmail).orElse(null);
                if (seedUser == null || seedUser.getId() == newUserId) {
                    continue;
                }
                connectionService.requestToConnect(seedUser.getId(), newUserId);
                sent++;
            } catch (Exception e) {
                log.warn("[WelcomeConnectionService] Skipped welcome request from {} to user {}: {}",
                        seedEmail, newUserId, e.getMessage());
            }
        }
        log.info("[WelcomeConnectionService] Sent {} welcome connection requests to user {}", sent, newUserId);
    }
}
