package com.rra.taxprofessionals.controller;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.SendPasswordEmailRequest;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.TaxProfessionalRepository;
import com.rra.taxprofessionals.service.EmailService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/email")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private TaxProfessionalRepository taxProfessionalRepository;

    @Value("${app.password.reset.token.expiry.hours:24}")
    private int resetTokenExpiryHours;

    @PostMapping("/send-password")
    public ResponseEntity<ApiResponse<String>> sendPasswordEmail(@Valid @RequestBody SendPasswordEmailRequest request) {
        log.info("📧 Received request to send password email to: {}", request.getEmail());

        try {
            String resetToken = null;

            // Generate reset token if requested
            if (request.getIncludeResetLink() != null && request.getIncludeResetLink()) {
                log.info("🔐 Generating reset token for: {}", request.getEmail());

                // Find TaxProfessional by email
                TaxProfessional taxProfessional = taxProfessionalRepository.findByEmail(request.getEmail())
                        .orElse(null);

                if (taxProfessional != null) {
                    // Generate and store reset token
                    resetToken = UUID.randomUUID().toString();
                    LocalDateTime resetTokenExpiry = LocalDateTime.now().plusHours(resetTokenExpiryHours);

                    taxProfessional.setResetToken(resetToken);
                    taxProfessional.setResetTokenExpiry(resetTokenExpiry);
                    taxProfessionalRepository.save(taxProfessional);

                    log.info("✅ Reset token generated and stored for: {}", request.getEmail());
                } else {
                    log.warn("⚠️ TaxProfessional not found for email: {}. Reset link will not be included.", request.getEmail());
                }
            }

            // Send welcome email with password
            emailService.sendWelcomePasswordEmail(
                    request.getEmail(),
                    request.getPassword(),
                    request.getFullName(),
                    request.getAccountType(),
                    resetToken);

            log.info("✅ Password email sent successfully to: {}", request.getEmail());

            return ResponseEntity.ok(ApiResponse.success(
                    "Password email sent successfully",
                    "Email sent to " + request.getEmail()));

        } catch (Exception e) {
            log.error("❌ Failed to send password email to {}: {}", request.getEmail(), e.getMessage());
            log.error("Stack trace:", e);

            return ResponseEntity.status(500).body(ApiResponse.error(
                    "Failed to send email. An error occurred while sending the email. Please try again later."));
        }
    }
}

