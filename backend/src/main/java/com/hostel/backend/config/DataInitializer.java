package com.hostel.backend.config;

import com.hostel.backend.entity.Block;
import com.hostel.backend.entity.Department;
import com.hostel.backend.entity.Hostel;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import com.hostel.backend.repository.BlockRepository;
import com.hostel.backend.repository.DepartmentRepository;
import com.hostel.backend.repository.HostelRepository;
import com.hostel.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository       userRepository;
    private final PasswordEncoder      passwordEncoder;
    private final HostelRepository     hostelRepository;
    private final BlockRepository      blockRepository;
    private final DepartmentRepository departmentRepository;

    public DataInitializer(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           HostelRepository hostelRepository,
                           BlockRepository blockRepository,
                           DepartmentRepository departmentRepository) {
        this.userRepository       = userRepository;
        this.passwordEncoder      = passwordEncoder;
        this.hostelRepository     = hostelRepository;
        this.blockRepository      = blockRepository;
        this.departmentRepository = departmentRepository;
    }

    @Override
    public void run(String... args) {
        seedAdmin();
        seedHostelsAndBlocks();
        seedDepartments();
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    private void seedAdmin() {
        if (userRepository.findByEmail("admin_10@hostel.com").isEmpty()) {
            userRepository.save(User.builder()
                    .name("Super Admin")
                    .email("admin_10@hostel.com")
                    .password(passwordEncoder.encode("Admin_10@123"))
                    .role(Role.ADMIN)
                    .phoneNumber("9000000001")
                    .active(true)
                    .build());
            System.out.println("✅ Admin seeded");
        }
    }

    // ── Hostels + Blocks ─────────────────────────────────────────────────────

    private void seedHostelsAndBlocks() {
        if (hostelRepository.count() > 0) {
            System.out.println("⏭️  Hostels already seeded, skipping");
            return;
        }

        // H1–H7, H9, H11, H12 → single hostel-level warden/caretaker
        createHostelWithBlocks("Hostel 1",     "H1",    List.of("A", "B"));
        createHostelWithBlocks("Hostel 2",     "H2",    List.of("A", "B"));
        createHostelWithBlocks("Hostel 3",     "H3",    List.of("A", "B"));
        createHostelWithBlocks("Hostel 4",     "H4",    List.of("A", "B"));
        createHostelWithBlocks("Hostel 5",     "H5",    List.of("A", "B"));
        createHostelWithBlocks("Hostel 6",     "H6",    List.of("A", "B"));
        createHostelWithBlocks("Hostel 7",     "H7",    List.of("A", "B"));
        createHostelWithBlocks("Hostel 9",     "H9",    List.of("A", "B"));
        createHostelWithBlocks("Hostel 11",    "H11",   List.of("A", "B"));
        createHostelWithBlocks("Hostel 12",    "H12",   List.of("A", "B"));

        // H8 → 2 blocks, each with separate warden, caretaker same for both
        createHostelWithBlocks("Hostel 8",     "H8",    List.of("A", "B"));

        // H10 A&B → treated as separate hostel entity
        createHostelWithBlocks("Hostel 10 AB", "H10AB", List.of("A", "B"));

        // H10 C&D → treated as separate hostel entity
        createHostelWithBlocks("Hostel 10 CD", "H10CD", List.of("C", "D"));

        System.out.println("✅ Hostels and blocks seeded");
    }

    private void createHostelWithBlocks(String name, String code, List<String> blockNames) {
        Hostel hostel = hostelRepository.save(
                Hostel.builder()
                        .name(name)
                        .code(code)
                        .build()
        );
        for (String blockName : blockNames) {
            blockRepository.save(
                    Block.builder()
                            .name(blockName)
                            .hostel(hostel)
                            .build()
            );
        }
    }

    // ── Departments ──────────────────────────────────────────────────────────

    private void seedDepartments() {
        if (departmentRepository.count() > 0) {
            System.out.println("⏭️  Departments already seeded, skipping");
            return;
        }

        List<String[]> departments = List.of(
            new String[]{"Electrical",          "Handles all electrical issues in hostels"},
            new String[]{"WiFi & Internet",     "Handles internet and WiFi maintenance"},
            new String[]{"Computer & Hardware", "Handles computer and hardware support"},
            new String[]{"AC & HVAC",           "Handles air conditioning and cooling issues"},
            new String[]{"Building & Civil",    "Handles building, seepage and civil issues"},
            new String[]{"Telephone",           "Handles telephone line issues"}
        );

        for (String[] dept : departments) {
            departmentRepository.save(
                    Department.builder()
                            .name(dept[0])
                            .description(dept[1])
                            .active(true)
                            .build()
            );
        }

        System.out.println("Departments seeded");
    }
}
