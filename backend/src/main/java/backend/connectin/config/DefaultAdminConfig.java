package backend.connectin.config;


import backend.connectin.domain.Role;
import backend.connectin.domain.User;
import backend.connectin.domain.repository.RoleRepository;
import backend.connectin.domain.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DefaultAdminConfig {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminFirstName;
    private final String adminLastName;

    public DefaultAdminConfig(UserRepository userRepository,
                              RoleRepository roleRepository,
                              PasswordEncoder passwordEncoder,
                              @Value("${app.admin.email}") String adminEmail,
                              @Value("${app.admin.password}") String adminPassword,
                              @Value("${app.admin.first-name}") String adminFirstName,
                              @Value("${app.admin.last-name}") String adminLastName) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.adminFirstName = adminFirstName;
        this.adminLastName = adminLastName;
    }

    @Bean
    @Transactional
    public CommandLineRunner createDefaultAdmin() {
        return args -> {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN");

            if (userRepository.findUserByEmail(adminEmail).isEmpty()) {
                User admin = new User();
                admin.setEmail(adminEmail);
                admin.setFirstName(adminFirstName);
                admin.setLastName(adminLastName);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setRoles(List.of(adminRole));
                userRepository.save(admin);
            }
        };
    }
}
