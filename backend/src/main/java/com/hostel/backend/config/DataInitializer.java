package com.hostel.backend.config;

import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import com.hostel.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // Seed ADMIN
        if (userRepository.findByEmail("admin_10@hostel.com").isEmpty()) {
            User admin = User.builder()
                    .name("Super Admin")
                    .email("admin_10@hostel.com")
                    .password(passwordEncoder.encode("Admin_10@123"))
                    .role(Role.ADMIN)
                    .phoneNumber("9000000001")
                    .active(true)
                    .build();
            userRepository.save(admin);
            System.out.println("✅ Admin seeded successfully");
        }

        // Seed WARDEN
        if (userRepository.findByEmail("warden_10@hostel.com").isEmpty()) {
            User warden = User.builder()
                    .name("Head Warden")
                    .email("warden_10@hostel.com")
                    .password(passwordEncoder.encode("Warden_10@123"))
                    .role(Role.WARDEN)
                    .phoneNumber("9000000002")
                    .active(true)
                    .build();
            userRepository.save(warden);
            System.out.println("✅ Warden seeded successfully");
        }
    }
}
