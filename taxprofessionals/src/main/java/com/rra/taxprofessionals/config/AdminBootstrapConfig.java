package com.rra.taxprofessionals.config;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.rra.taxprofessionals.enums.OfficerType;
import com.rra.taxprofessionals.model.Officer;
import com.rra.taxprofessionals.repository.OfficerRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Bootstrap Configuration for creating the first admin user.
 *
 * This solves the "chicken-and-egg" problem where you need an admin to create
 * admins, but no admin exists initially.
 *
 * HOW IT WORKS: 1. Runs automatically when application starts 2. Checks if any
 * ADMIN users exist in database 3. If none exist, creates a default admin
 * account 4. Can be disabled via application.properties after first admin is
 * created
 *
 * SECURITY NOTES: - Only creates admin if ZERO admins exist - Should be
 * disabled in production after initial setup - Default password should be
 * changed immediately after first login - Uses environment variables for
 * credentials (more secure than hardcoding)
 *
 * CONFIGURATION: Enable/disable via application.properties:
 * app.bootstrap.enabled=true (enabled - creates admin if none exist)
 * app.bootstrap.enabled=false (disabled - no automatic admin creation)
 *
 * Default admin credentials via environment variables or properties:
 * app.bootstrap.admin.employee-id=${BOOTSTRAP_ADMIN_ID:ADMIN001}
 * app.bootstrap.admin.email=${BOOTSTRAP_ADMIN_EMAIL:admin@rra.gov.rw}
 * app.bootstrap.admin.password=${BOOTSTRAP_ADMIN_PASSWORD:Admin@12345}
 * app.bootstrap.admin.names=${BOOTSTRAP_ADMIN_NAMES:System Administrator}
 *
 * @author RRA Development Team
 */
@Slf4j
@Configuration
public class AdminBootstrapConfig {

    @Autowired
    private OfficerRepository officerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin.employee-id:ADMIN001}")
    private String bootstrapEmployeeId;

    @Value("${app.bootstrap.admin.email:admin@rra.gov.rw}")
    private String bootstrapEmail;

    @Value("${app.bootstrap.admin.password:Admin@12345}")
    private String bootstrapPassword;

    @Value("${app.bootstrap.admin.names:System Administrator}")
    private String bootstrapNames;

    @Value("${app.bootstrap.admin.department:IT Administration}")
    private String bootstrapDepartment;

    /**
     * CommandLineRunner bean that executes after application context is loaded.
     * Only active when app.bootstrap.enabled=true in application.properties.
     *
     * @return CommandLineRunner that creates first admin if needed
     */
    @Bean
    @ConditionalOnProperty(
            name = "app.bootstrap.enabled",
            havingValue = "true",
            matchIfMissing = false
    )
    public CommandLineRunner createFirstAdmin() {
        return args -> {
            log.info("╔════════════════════════════════════════════════════════════════╗");
            log.info("║          🔐 ADMIN BOOTSTRAP - CHECKING ADMIN USERS            ║");
            log.info("╚════════════════════════════════════════════════════════════════╝");

            // Check if any admin users exist
            long adminCount = officerRepository.countByOfficerType(OfficerType.ADMIN);

            if (adminCount > 0) {
                log.info("✅ Admin users already exist (count: {})", adminCount);
                log.info("   No bootstrap needed. Skipping admin creation.");
                log.info("════════════════════════════════════════════════════════════════");
                return;
            }

            log.warn("⚠️  NO ADMIN USERS FOUND IN DATABASE!");
            log.info("📝 Creating bootstrap admin account...");
            log.info("────────────────────────────────────────────────────────────────");

            try {
                // Check if employee ID already exists (shouldn't happen, but safety check)
                if (officerRepository.existsByEmployeeId(bootstrapEmployeeId)) {
                    log.error("❌ Bootstrap failed: Employee ID '{}' already exists", bootstrapEmployeeId);
                    log.error("   Please check your database manually.");
                    return;
                }

                // Check if email already exists
                if (officerRepository.existsByEmail(bootstrapEmail)) {
                    log.error("❌ Bootstrap failed: Email '{}' already exists", bootstrapEmail);
                    log.error("   Please check your database manually.");
                    return;
                }

                // Create the bootstrap admin
                Officer admin = new Officer();
                admin.setEmployeeId(bootstrapEmployeeId);
                admin.setEmail(bootstrapEmail);
                admin.setNames(bootstrapNames);
                admin.setDepartment(bootstrapDepartment);
                admin.setOfficerType(OfficerType.ADMIN);
                admin.setPassword(passwordEncoder.encode(bootstrapPassword));
                admin.setIsActivated(true);
                admin.setCreatedAt(LocalDateTime.now());
                admin.setActivatedAt(LocalDateTime.now());

                // Save to database
                Officer savedAdmin = officerRepository.save(admin);

                log.info("✅ Bootstrap admin created successfully!");
                log.info("────────────────────────────────────────────────────────────────");
                log.info("📋 ADMIN CREDENTIALS (SAVE THESE!):");
                log.info("   Employee ID: {}", savedAdmin.getEmployeeId());
                log.info("   Email:       {}", savedAdmin.getEmail());
                log.info("   Password:    {}", bootstrapPassword);
                log.info("   Name:        {}", savedAdmin.getNames());
                log.info("   Department:  {}", savedAdmin.getDepartment());
                log.info("────────────────────────────────────────────────────────────────");
                log.warn("⚠️  IMPORTANT SECURITY STEPS:");
                log.warn("   1. ✅ Login immediately and change the password");
                log.warn("   2. ✅ Set app.bootstrap.enabled=false in application.properties");
                log.warn("   3. ✅ Remove BOOTSTRAP_ADMIN_PASSWORD from environment variables");
                log.warn("   4. ✅ Restart the application after making these changes");
                log.info("────────────────────────────────────────────────────────────────");
                log.info("🔑 Login endpoint: POST /api/auth/login");
                log.info("   Request body:");
                log.info("   {{");
                log.info("     \"employeeId\": \"{}\",", savedAdmin.getEmployeeId());
                log.info("     \"password\": \"{}\"", bootstrapPassword);
                log.info("   }}");
                log.info("════════════════════════════════════════════════════════════════");

            } catch (Exception e) {
                log.error("❌ FAILED TO CREATE BOOTSTRAP ADMIN!");
                log.error("   Error: {}", e.getMessage());
                log.error("   Stack trace:", e);
                log.error("════════════════════════════════════════════════════════════════");
                throw new RuntimeException("Bootstrap admin creation failed", e);
            }
        };
    }
}
