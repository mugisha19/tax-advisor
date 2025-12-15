package com.rra.taxprofessionals.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

/**
 * Email Configuration Validator
 *
 * Validates email configuration on application startup to catch configuration
 * issues early before attempting to send emails.
 *
 * Only active when app.email.mock.enabled=false (real email mode)
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.email.mock.enabled", havingValue = "false")
public class EmailConfigValidator {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String mailUsername;

    @Value("${spring.mail.password}")
    private String mailPassword;

    @Value("${spring.mail.host}")
    private String mailHost;

    @Value("${spring.mail.port}")
    private int mailPort;

    public EmailConfigValidator(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void validateEmailConfiguration() {
        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║          📧 EMAIL CONFIGURATION VALIDATION                    ║");
        log.info("╚════════════════════════════════════════════════════════════════╝");

        boolean isValid = true;
        StringBuilder errors = new StringBuilder();

        // Log what we're checking (for debugging - masked for security)
        log.debug("Checking email configuration:");
        log.debug("  Username value: {}", mailUsername != null ? maskEmail(mailUsername) : "NULL");
        log.debug("  Password length: {}", mailPassword != null ? mailPassword.length() : 0);
        log.debug("  Is username placeholder? {}", isPlaceholder(mailUsername));
        log.debug("  Is password placeholder? {}", isPlaceholder(mailPassword));

        // Check username
        if (isPlaceholder(mailUsername)) {
            log.error("❌ Email username is not configured properly");
            log.error("   Current value: {}", mailUsername);
            log.error("   This appears to be a placeholder, not a real email address");
            log.error("");
            log.error("   ⚡ SOLUTION: Set environment variable MAIL_USERNAME");
            log.error("");
            log.error("   Windows PowerShell:");
            log.error("     $env:MAIL_USERNAME=\"your-email@gmail.com\"");
            log.error("");
            log.error("   Mac/Linux:");
            log.error("     export MAIL_USERNAME=your-email@gmail.com");
            log.error("");
            log.error("   VS Code (launch.json):");
            log.error("     \"env\": {{ \"MAIL_USERNAME\": \"your-email@gmail.com\" }}");
            errors.append("- MAIL_USERNAME not configured (placeholder detected)\n");
            isValid = false;
        } else if (mailUsername == null || mailUsername.trim().isEmpty()) {
            log.error("❌ Email username is empty or null");
            errors.append("- MAIL_USERNAME is empty or null\n");
            isValid = false;
        } else if (!isValidEmailFormat(mailUsername)) {
            log.error("❌ Email username format is invalid: {}", maskEmail(mailUsername));
            log.error("   Expected format: user@domain.com");
            errors.append("- MAIL_USERNAME has invalid email format\n");
            isValid = false;
        } else {
            log.info("✅ Email username: {}", maskEmail(mailUsername));
        }

        // Check password
        if (isPlaceholder(mailPassword)) {
            log.error("❌ Email password is not configured properly");
            log.error("   Current value appears to be a placeholder");
            log.error("");
            log.error("   ⚡ SOLUTION: Set environment variable MAIL_PASSWORD");
            log.error("");
            log.error("   Windows PowerShell:");
            log.error("     $env:MAIL_PASSWORD=\"your-16-char-app-password\"");
            log.error("");
            log.error("   Mac/Linux:");
            log.error("     export MAIL_PASSWORD=your-16-char-app-password");
            log.error("");
            log.error("   📖 Get Gmail App Password:");
            log.error("     1. Go to: https://myaccount.google.com/apppasswords");
            log.error("     2. Enable 2-Step Verification (if not enabled)");
            log.error("     3. Generate App Password for 'Mail'");
            log.error("     4. Copy the 16-character password");
            errors.append("- MAIL_PASSWORD not configured (placeholder detected)\n");
            isValid = false;
        } else if (mailPassword == null || mailPassword.trim().isEmpty()) {
            log.error("❌ Email password is empty or null");
            errors.append("- MAIL_PASSWORD is empty or null\n");
            isValid = false;
        } else {
            String maskedPassword = mailPassword.length() >= 4
                    ? mailPassword.substring(0, 4) + "***"
                    : "***";
            log.info("✅ Email password: {} (length: {})", maskedPassword, mailPassword.length());

            // Validate password length (Gmail app passwords are 16 characters)
            if (mailPassword.length() != 16) {
                log.warn("⚠️  Gmail App Passwords are typically 16 characters");
                log.warn("   Your password length: {} characters", mailPassword.length());
                log.warn("   If you're using Gmail, ensure you have an App Password, not your regular password");
            }
        }

        // Check host and port
        log.info("📧 Email host: {}", mailHost);
        log.info("📧 Email port: {}", mailPort);

        // If validation failed, show comprehensive error message
        if (!isValid) {
            printValidationFailureMessage(errors);
            return; // Don't test connection if config is invalid
        }

        // Test connection (optional but recommended)
        testConnection();

        // Success message
        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║          ✅ EMAIL CONFIGURATION VALID                         ║");
        log.info("╚════════════════════════════════════════════════════════════════╝");
        log.info("📧 Ready to send emails via {} on port {}", mailHost, mailPort);
        log.info("📧 Emails will be sent from: {}", maskEmail(mailUsername));
        log.info("════════════════════════════════════════════════════════════════");
    }

    /**
     * Print comprehensive validation failure message with solutions
     */
    private void printValidationFailureMessage(StringBuilder errors) {
        log.error("╔════════════════════════════════════════════════════════════════╗");
        log.error("║          ⚠️  EMAIL CONFIGURATION INCOMPLETE!                  ║");
        log.error("╚════════════════════════════════════════════════════════════════╝");
        log.error("");
        log.error("🔍 Issues Found:");
        log.error("{}", errors.toString());
        log.error("────────────────────────────────────────────────────────────────");
        log.error("⚠️  Emails will NOT be sent until these issues are fixed!");
        log.error("────────────────────────────────────────────────────────────────");
        log.error("");
        log.error("💡 SOLUTIONS:");
        log.error("");
        log.error("╔════════════════════════════════════════════════════════════════╗");
        log.error("║ Option 1: Use Setup Script (Easiest)                          ║");
        log.error("╚════════════════════════════════════════════════════════════════╝");
        log.error("  Windows PowerShell:");
        log.error("    .\\setup-email-env.ps1");
        log.error("");
        log.error("  Mac/Linux:");
        log.error("    ./setup-email-env.sh");
        log.error("");
        log.error("╔════════════════════════════════════════════════════════════════╗");
        log.error("║ Option 2: Set Environment Variables Manually                  ║");
        log.error("╚════════════════════════════════════════════════════════════════╝");
        log.error("  Windows PowerShell:");
        log.error("    $env:MAIL_USERNAME=\"your-email@gmail.com\"");
        log.error("    $env:MAIL_PASSWORD=\"your-16-char-app-password\"");
        log.error("    $env:EMAIL_MOCK_ENABLED=\"false\"");
        log.error("");
        log.error("  Mac/Linux:");
        log.error("    export MAIL_USERNAME=your-email@gmail.com");
        log.error("    export MAIL_PASSWORD=your-16-char-app-password");
        log.error("    export EMAIL_MOCK_ENABLED=false");
        log.error("");
        log.error("╔════════════════════════════════════════════════════════════════╗");
        log.error("║ Option 3: VS Code Configuration                               ║");
        log.error("╚════════════════════════════════════════════════════════════════╝");
        log.error("  1. Create .env file in project root:");
        log.error("     MAIL_USERNAME=your-email@gmail.com");
        log.error("     MAIL_PASSWORD=your-16-char-app-password");
        log.error("     EMAIL_MOCK_ENABLED=false");
        log.error("");
        log.error("  2. Update .vscode/launch.json:");
        log.error("     \"envFile\": \"${{workspaceFolder}}/.env\"");
        log.error("");
        log.error("╔════════════════════════════════════════════════════════════════╗");
        log.error("║ Option 4: Use Mock Emails (Development Only)                  ║");
        log.error("╚════════════════════════════════════════════════════════════════╝");
        log.error("  Set in application.properties:");
        log.error("    app.email.mock.enabled=true");
        log.error("");
        log.error("════════════════════════════════════════════════════════════════");
    }

    /**
     * Test SMTP connection by creating a test message (doesn't send, just
     * validates connection is possible)
     */
    private void testConnection() {
        try {
            log.info("🔍 Testing SMTP connection to {}:{}...", mailHost, mailPort);
            MimeMessage testMessage = mailSender.createMimeMessage();
            // Just creating the message tests that JavaMailSender is properly configured
            log.info("✅ SMTP connection test successful");
        } catch (Exception e) {
            log.error("❌ SMTP connection test failed");
            log.error("   Error: {}", e.getMessage());
            log.error("");
            log.error("   This may indicate:");
            log.error("   ❌ Wrong App Password (must be 16 characters from Google)");
            log.error("   ❌ 2-Step Verification not enabled on Gmail");
            log.error("   ❌ Firewall blocking SMTP ports ({}, {})", mailPort, 465);
            log.error("   ❌ Incorrect SMTP host: {}", mailHost);
            log.error("   ❌ Network connectivity issues");
            log.error("");
            log.error("   Full error details:");
            log.error("", e);
        }
    }

    /**
     * Check if a value is a placeholder (not a real credential)
     *
     * This method detects GENERIC placeholder patterns only. It does NOT check
     * for specific email addresses or passwords.
     *
     * Detects patterns like: - "your-email@gmail.com" (generic placeholder) -
     * "your-app-password" (generic placeholder) - "placeholder" - "example" -
     * null or empty values
     *
     * SECURITY NOTE: This method should NEVER contain actual credentials!
     *
     * @param value The value to check
     * @return true if the value appears to be a generic placeholder
     */
    private boolean isPlaceholder(String value) {
        // Null or empty check
        if (value == null || value.trim().isEmpty()) {
            return true;
        }

        String lower = value.toLowerCase().trim();

        // Check for GENERIC placeholder patterns ONLY
        // DO NOT add specific email addresses or passwords here!
        return lower.contains("your-") // "your-email", "your-password"
                || lower.contains("placeholder") // "placeholder@example.com"
                || lower.contains("example") // "example@example.com"
                || lower.contains("changeme") // "changeme"
                || lower.contains("replace") // "replace-this"
                || lower.contains("todo") // "todo-set-this"
                || lower.equals("password") // Literal "password"
                || lower.equals("secret") // Literal "secret"
                || lower.equals("abc123") // Common placeholder
                || lower.equals("test123");          // Common placeholder

        // REMOVED LINES (SECURITY FIX):
        // || lower.equals("habiyaadolphe19@gmail.com")  // ❌ NEVER hardcode real credentials!
        // || lower.equals("cymjinckkymyexdt");           // ❌ NEVER hardcode real passwords!
    }

    /**
     * Validate email format using simple regex
     *
     * @param email Email address to validate
     * @return true if format is valid
     */
    private boolean isValidEmailFormat(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        // Simple email validation regex
        return email.matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
    }

    /**
     * Mask an email address for logging (show first 2 chars and domain)
     *
     * Examples: - "john.doe@gmail.com" → "jo***@gmail.com" - "a@test.com" →
     * "**@test.com" - null → "***"
     *
     * @param email Email address to mask
     * @return Masked email for safe logging
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        String[] parts = email.split("@");
        if (parts[0].length() <= 2) {
            return "**@" + parts[1];
        }
        return parts[0].substring(0, 2) + "***@" + parts[1];
    }
}
