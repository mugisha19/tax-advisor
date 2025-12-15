package com.rra.taxprofessionals.service.imp;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.service.EmailService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@ConditionalOnProperty(name = "app.email.mock.enabled", havingValue = "true", matchIfMissing = false)
public class MockEmailServiceImpl implements EmailService {

    @Value("${app.frontend.taxprofessional.url}")
    private String taxProfessionalFrontendUrl;

    @Value("${app.frontend.officer.url}")
    private String officerFrontendUrl;

    @Override
    public void sendInvitationEmail(String toEmail, String employeeId, String names, String invitationToken) {
        // Build invitation link with correct path and parameters
        // Format: /reset-password?token=xxx&type=officer
        String encodedToken = URLEncoder.encode(invitationToken, StandardCharsets.UTF_8);
        String invitationLink = officerFrontendUrl + "/reset-password?token=" + encodedToken + "&type=officer";

        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║               📧 MOCK EMAIL - NOT SENT                        ║");
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ To:          {}", toEmail);
        log.info("║ Subject:     Invitation to RRA Tax Professionals Platform");
        log.info("║ Employee ID: {}", employeeId);
        log.info("║ Names:       {}", names);
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ INVITATION DETAILS FOR TESTING:                                ║");
        log.info("║ Token:       {}", invitationToken);
        log.info("║ Link:        {}", invitationLink);
        log.info("╚════════════════════════════════════════════════════════════════╝");

        // Print to console for easy copying
        System.out.println("\n🎯 COPY THIS TOKEN FOR TESTING:");
        System.out.println("Token: " + invitationToken);
        System.out.println("Validate URL: POST /api/auth/validate-invitation");
        System.out.println("Set Password URL: POST /api/auth/set-password\n");
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String employeeId, String names, String resetToken) {
        // Build reset link with correct path and parameters
        // Format: /reset-password?token=xxx&type=officer
        String encodedToken = URLEncoder.encode(resetToken, StandardCharsets.UTF_8);
        String resetLink = officerFrontendUrl + "/reset-password?token=" + encodedToken + "&type=officer";

        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║            📧 MOCK PASSWORD RESET EMAIL - NOT SENT            ║");
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ To:          {}", toEmail);
        log.info("║ Subject:     Password Reset Request - RRA Tax Professionals Platform");
        log.info("║ Employee ID: {}", employeeId);
        log.info("║ Names:       {}", names);
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ PASSWORD RESET DETAILS FOR TESTING:                             ║");
        log.info("║ Token:       {}", resetToken);
        log.info("║ Link:        {}", resetLink);
        log.info("╚════════════════════════════════════════════════════════════════╝");

        // Print to console for easy copying
        System.out.println("\n🎯 COPY THIS RESET TOKEN FOR TESTING:");
        System.out.println("Token: " + resetToken);
        System.out.println("Reset Link: " + resetLink);
        System.out.println("Set Password URL: POST /api/auth/set-password\n");
    }

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

        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║          📧 MOCK DECISION EMAIL - NOT SENT                    ║");
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ To:              {}", toEmail);
        log.info("║ Applicant:       {}", applicantName);
        log.info("║ TPIN:            {}", tpin);
        log.info("║ Status:          {}", status);
        log.info("║ Subject:         Application {} - RRA Tax Professionals",
                status == ApplicationStatus.APPROVED ? "Approved" : "Decision");
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ ATTACHMENT DETAILS:                                             ║");
        log.info("║ File Name:       {}", fileName);
        log.info("║ File Size:       {} bytes ({} KB)", pdfAttachment.length, pdfAttachment.length / 1024);
        log.info("║ File Type:       PDF Document");

        if (status == ApplicationStatus.REJECTED && rejectionReason != null) {
            log.info("╠════════════════════════════════════════════════════════════════╣");
            log.info("║ REJECTION REASON:                                               ║");
            String displayReason = rejectionReason.length() > 60
                    ? rejectionReason.substring(0, 57) + "..."
                    : rejectionReason;
            log.info("║ {}", displayReason);
        }

        if (status == ApplicationStatus.REJECTED && problematicDocumentIds != null && !problematicDocumentIds.isEmpty()) {
            log.info("╠════════════════════════════════════════════════════════════════╣");
            log.info("║ PROBLEMATIC DOCUMENTS:                                          ║");
            log.info("║ Document IDs: {}", problematicDocumentIds);
        }

        log.info("╚════════════════════════════════════════════════════════════════╝");

        // Print to console for easy verification
        System.out.println("\n🎯 EMAIL DECISION SENT (MOCK):");
        System.out.println("Status: " + status);
        System.out.println("Recipient: " + toEmail);
        System.out.println("Attachment: " + fileName + " (" + (pdfAttachment.length / 1024) + " KB)");
        if (status == ApplicationStatus.REJECTED) {
            System.out.println("Rejection Reason: " + (rejectionReason != null ? rejectionReason : "N/A"));
            if (problematicDocumentIds != null && !problematicDocumentIds.isEmpty()) {
                System.out.println("Problematic Document IDs: " + problematicDocumentIds);
            }
        }
        System.out.println();
    }

    @Override
    public void sendApprovalEmailWithCertificate(String toEmail, String applicantName, byte[] pdfBytes) {
        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║     📧 MOCK APPROVAL EMAIL WITH CERTIFICATE - NOT SENT        ║");
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ To:              {}", toEmail);
        log.info("║ Applicant:       {}", applicantName);
        log.info("║ Subject:         Application Approved - RRA Tax Professionals");
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ CERTIFICATE DETAILS:                                            ║");
        log.info("║ File Name:       TaxProfessional_Certificate.pdf");
        log.info("║ File Size:       {} bytes ({} KB)", pdfBytes.length, pdfBytes.length / 1024);
        log.info("║ File Type:       PDF Certificate");
        log.info("╚════════════════════════════════════════════════════════════════╝");

        System.out.println("\n🎯 APPROVAL EMAIL WITH CERTIFICATE SENT (MOCK):");
        System.out.println("Recipient: " + toEmail);
        System.out.println("Applicant: " + applicantName);
        System.out.println("Certificate: " + (pdfBytes.length / 1024) + " KB");
        System.out.println();
    }

    @Override
    public void sendRejectionEmailWithLetter(String toEmail, String applicantName, String tpin, byte[] pdfBytes) {
        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║     📧 MOCK REJECTION EMAIL WITH LETTER - NOT SENT            ║");
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ To:              {}", toEmail);
        log.info("║ Applicant:       {}", applicantName);
        log.info("║ TPIN:            {}", tpin);
        log.info("║ Subject:         Tax Advisory License Application - Decision");
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ REJECTION LETTER DETAILS:                                       ║");
        log.info("║ File Name:       Rejection_Letter.pdf");
        log.info("║ File Size:       {} bytes ({} KB)", pdfBytes.length, pdfBytes.length / 1024);
        log.info("║ File Type:       PDF Rejection Letter");
        log.info("╚════════════════════════════════════════════════════════════════╝");

        System.out.println("\n🎯 REJECTION EMAIL WITH LETTER SENT (MOCK):");
        System.out.println("Recipient: " + toEmail);
        System.out.println("Applicant: " + applicantName);
        System.out.println("TPIN: " + tpin);
        System.out.println("Rejection Letter: " + (pdfBytes.length / 1024) + " KB");
        System.out.println();
    }

    @Override
    public void sendWelcomePasswordEmail(String toEmail, String password, String fullName, String accountType, String resetToken) {
        String encodedToken = resetToken != null ? URLEncoder.encode(resetToken, StandardCharsets.UTF_8) : null;
        // Determine user type based on accountType
        String userType = "COMPANY".equalsIgnoreCase(accountType) ? "company" : "taxprofessional";
        String resetLink = encodedToken != null 
                ? taxProfessionalFrontendUrl + "/reset-password?token=" + encodedToken + "&type=" + userType
                : null;

        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║         📧 MOCK WELCOME PASSWORD EMAIL - NOT SENT             ║");
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ To:              {}", toEmail);
        log.info("║ Full Name:       {}", fullName != null ? fullName : "N/A");
        log.info("║ Account Type:    {}", accountType != null ? accountType : "N/A");
        log.info("║ Subject:         Welcome to RRA Tax Professional Portal - Your Account Details");
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ CREDENTIALS FOR TESTING:                                        ║");
        log.info("║ Email:           {}", toEmail);
        log.info("║ Password:        {}", password);
        
        if (resetToken != null) {
            log.info("╠════════════════════════════════════════════════════════════════╣");
            log.info("║ PASSWORD RESET DETAILS:                                         ║");
            log.info("║ Reset Token:     {}", resetToken);
            log.info("║ Reset Link:      {}", resetLink);
        }
        
        log.info("╚════════════════════════════════════════════════════════════════╝");

        System.out.println("\n🎯 COPY THESE CREDENTIALS FOR TESTING:");
        System.out.println("Email: " + toEmail);
        System.out.println("Password: " + password);
        System.out.println("Account Type: " + (accountType != null ? accountType : "N/A"));
        
        if (resetToken != null) {
            System.out.println("\n🔐 PASSWORD RESET TOKEN:");
            System.out.println("Token: " + resetToken);
            System.out.println("Reset Link: " + resetLink);
        }
        
        System.out.println();
    }

    @Override
    public void sendApplicantPasswordResetEmail(String toEmail, String tpin, String fullName, String resetToken, String accountType) {
        String encodedToken = URLEncoder.encode(resetToken, StandardCharsets.UTF_8);
        String userType = "COMPANY".equalsIgnoreCase(accountType) ? "company" : "taxprofessional";
        String resetLink = taxProfessionalFrontendUrl + "/reset-password?token=" + encodedToken + "&type=" + userType;

        log.info("╔════════════════════════════════════════════════════════════════╗");
        log.info("║      📧 MOCK APPLICANT PASSWORD RESET EMAIL - NOT SENT        ║");
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ To:          {}", toEmail);
        log.info("║ Subject:     Password Reset Request - RRA Tax Professional Portal");
        log.info("║ TPIN:        {}", tpin);
        log.info("║ Full Name:   {}", fullName);
        log.info("╠════════════════════════════════════════════════════════════════╣");
        log.info("║ APPLICANT PASSWORD RESET DETAILS FOR TESTING:                  ║");
        log.info("║ Token:       {}", resetToken);
        log.info("║ Reset Link:  {}", resetLink);
        log.info("╚════════════════════════════════════════════════════════════════╝");

        System.out.println("\n🎯 COPY THIS APPLICANT RESET TOKEN FOR TESTING:");
        System.out.println("Token: " + resetToken);
        System.out.println("Reset Link: " + resetLink);
        System.out.println("Set Password URL: POST /api/auth/set-password\n");
    }
}
