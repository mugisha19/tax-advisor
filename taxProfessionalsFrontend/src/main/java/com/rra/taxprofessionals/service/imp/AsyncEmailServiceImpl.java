package com.rra.taxprofessionals.service.imp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.service.EmailService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service("asyncEmailService")
@ConditionalOnProperty(name = "app.email.async.enabled", havingValue = "true", matchIfMissing = false)
public class AsyncEmailServiceImpl implements EmailService {

    @Autowired
    @Qualifier("emailServiceImpl") // Explicitly inject the real email service (not async wrapper)
    private EmailService emailService; // Will inject EmailServiceImpl or MockEmailServiceImpl

    @Async
    @Retryable(
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    @Override
    public void sendInvitationEmail(String toEmail, String employeeId, String names, String invitationToken) {
        log.info("🔄 Async email sending started for: {}", toEmail);
        try {
            emailService.sendInvitationEmail(toEmail, employeeId, names, invitationToken);
            log.info("✅ Async email completed for: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Async email failed for {}: {}", toEmail, e.getMessage());
            throw e; // Rethrow to trigger retry
        }
    }

    @Async
    @Retryable(
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    @Override
    public void sendPasswordResetEmail(String toEmail, String employeeId, String names, String resetToken) {
        log.info("🔄 Async password reset email sending started for: {}", toEmail);
        try {
            emailService.sendPasswordResetEmail(toEmail, employeeId, names, resetToken);
            log.info("✅ Async password reset email completed for: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Async password reset email failed for {}: {}", toEmail, e.getMessage());
            throw e; // Rethrow to trigger retry
        }
    }

    @Async
    @Retryable(
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    @Override
    public void sendApplicationDecisionEmail(
            String toEmail,
            String applicantName,
            String tpin,
            ApplicationStatus status,
            byte[] pdfAttachment,
            String fileName,
            String rejectionReason,
            java.util.List<Long> problematicDocumentIds) {

        log.info("🔄 Async decision email sending started for: {} (Status: {}, Attempt: retry-aware)",
                toEmail, status);
        try {
            emailService.sendApplicationDecisionEmail(
                    toEmail,
                    applicantName,
                    tpin,
                    status,
                    pdfAttachment,
                    fileName,
                    rejectionReason,
                    problematicDocumentIds
            );
            log.info("✅ Async decision email completed for: {} (Status: {})", toEmail, status);
        } catch (Exception e) {
            log.error("❌ Async decision email failed for {} (Status: {}): {}",
                    toEmail, status, e.getMessage());
            log.error("⚠️ CRITICAL: Application decision email failed. Will retry...");
            log.error("   TPIN: {}, Applicant: {}, Status: {}", tpin, applicantName, status);
            throw e; // Rethrow to trigger retry
        }
    }

    @Async
    @Retryable(
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    @Override
    public void sendApprovalEmailWithCertificate(String toEmail, String applicantName, byte[] pdfBytes) {
        log.info("🔄 Async approval email with certificate sending started for: {}", toEmail);
        try {
            emailService.sendApprovalEmailWithCertificate(toEmail, applicantName, pdfBytes);
            log.info("✅ Async approval email with certificate completed for: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Async approval email with certificate failed for {}: {}", toEmail, e.getMessage());
            throw e; // Rethrow to trigger retry
        }
    }

    @Async
    @Retryable(
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    @Override
    public void sendRejectionEmailWithLetter(String toEmail, String applicantName, String tpin, byte[] pdfBytes) {
        log.info("🔄 Async rejection email with letter sending started for: {} (TPIN: {})", toEmail, tpin);
        try {
            emailService.sendRejectionEmailWithLetter(toEmail, applicantName, tpin, pdfBytes);
            log.info("✅ Async rejection email with letter completed for: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Async rejection email with letter failed for {}: {}", toEmail, e.getMessage());
            throw e; // Rethrow to trigger retry
        }
    }

    @Async
    @Retryable(
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    @Override
    public void sendWelcomePasswordEmail(String toEmail, String password, String fullName, String accountType, String resetToken) {
        log.info("🔄 Async welcome password email sending started for: {}", toEmail);
        try {
            emailService.sendWelcomePasswordEmail(toEmail, password, fullName, accountType, resetToken);
            log.info("✅ Async welcome password email completed for: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Async welcome password email failed for {}: {}", toEmail, e.getMessage());
            throw e; // Rethrow to trigger retry
        }
    }

    @Async
    @Retryable(
            maxAttempts = 3,
            backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    @Override
    public void sendApplicantPasswordResetEmail(String toEmail, String tpin, String fullName, String resetToken, String accountType) {
        log.info("🔄 Async applicant password reset email sending started for: {} (Account type: {})", toEmail, accountType);
        try {
            emailService.sendApplicantPasswordResetEmail(toEmail, tpin, fullName, resetToken, accountType);
            log.info("✅ Async applicant password reset email completed for: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Async applicant password reset email failed for {}: {}", toEmail, e.getMessage());
            throw e; // Rethrow to trigger retry
        }
    }
}
