package com.rra.taxprofessionals.service.imp;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Properties;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.enums.DocumentType;
import com.rra.taxprofessionals.model.Document;
import com.rra.taxprofessionals.model.DocumentRejection;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.DocumentRejectionRepository;
import com.rra.taxprofessionals.repository.DocumentRepository;
import com.rra.taxprofessionals.repository.TaxProfessionalRepository;
import com.rra.taxprofessionals.repository.OfficerRepository;
import com.rra.taxprofessionals.service.EmailService;
import com.rra.taxprofessionals.service.SmsService;
import com.rra.taxprofessionals.model.Officer;

import jakarta.activation.DataHandler;
import jakarta.activation.DataSource;
import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Multipart;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import jakarta.mail.util.ByteArrayDataSource;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service("emailServiceImpl")
@ConditionalOnProperty(name = "app.email.mock.enabled", havingValue = "false", matchIfMissing = true)
public class EmailServiceImpl implements EmailService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentRejectionRepository documentRejectionRepository;

    @Autowired
    private TaxProfessionalRepository taxProfessionalRepository;

    @Autowired
    private OfficerRepository officerRepository;

    @Autowired
    private SmsService smsService;

    @Value("${app.frontend.taxprofessional.url}")
    private String taxProfessionalFrontendUrl;

    @Value("${app.frontend.officer.url}")
    private String officerFrontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${spring.mail.password}")
    private String mailPassword;

    @Value("${spring.mail.host}")
    private String mailHost;

    @Value("${spring.mail.port}")
    private int mailPort;

    private Session getMailSession() {
        log.info("=== EMAIL CONFIGURATION ===");
        log.info("📧 SMTP Host: {}", mailHost);
        log.info("📧 SMTP Port: {}", mailPort);
        log.info("📧 From Email: {}", fromEmail);
        
        // Mask password but show actual length
        String maskedPassword = "****";
        if (mailPassword != null && mailPassword.length() > 4) {
            String firstTwo = mailPassword.substring(0, 2);
            String lastTwo = mailPassword.substring(mailPassword.length() - 2);
            int middleLength = mailPassword.length() - 4;
            String middle = "*".repeat(middleLength);
            maskedPassword = firstTwo + middle + lastTwo;
        } else if (mailPassword != null) {
            maskedPassword = "*".repeat(mailPassword.length());
        }
        log.info("📧 Password: {}", maskedPassword);
        
        log.info("📧 SMTP Auth: true");
        log.info("📧 STARTTLS: false");
        log.info("📧 SSL Trust: {}", mailHost);
        log.info("📧 Debug Mode: true");
        log.info("===========================");

        Properties properties = new Properties();
        properties.put("mail.smtp.auth", "true");
        properties.put("mail.smtp.starttls.enable", "false");
        properties.put("mail.smtp.host", mailHost);
        properties.put("mail.smtp.port", mailPort);
        properties.put("mail.smtp.ssl.trust", mailHost);
        properties.put("mail.debug", "true");

        return Session.getInstance(properties, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(fromEmail, mailPassword);
            }
        });
    }

    private void sendEmail(String toEmail, String subject, String htmlBody, byte[] attachment, String attachmentName) throws MessagingException {
        Session session = getMailSession();
        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject(subject);

        MimeBodyPart textPart = new MimeBodyPart();
        textPart.setContent(htmlBody, "text/html; charset=utf-8");

        Multipart multipart = new MimeMultipart("related");
        multipart.addBodyPart(textPart);

        if (attachment != null && attachmentName != null) {
            MimeBodyPart attachmentPart = new MimeBodyPart();
            DataSource source = new ByteArrayDataSource(attachment, "application/pdf");
            attachmentPart.setDataHandler(new DataHandler(source));
            attachmentPart.setFileName(attachmentName);
            multipart.addBodyPart(attachmentPart);
        }

        message.setContent(multipart);
        Transport.send(message);
    }

    @Override
    public void sendInvitationEmail(String toEmail, String employeeId, String names, String invitationToken) {
        log.info("📧 Preparing to send invitation email to: {}", toEmail);

        try {
            String encodedToken = URLEncoder.encode(invitationToken, StandardCharsets.UTF_8);
            String invitationLink = officerFrontendUrl + "/reset-password?token=" + encodedToken + "&type=officer";
            String htmlContent = buildInvitationEmailTemplate(names, employeeId, invitationLink);

            log.info("📤 Sending email via SMTP...");
            sendEmail(toEmail, "Invitation to RRA Tax Professionals Platform", htmlContent, null, null);

            log.info("✅ Invitation email sent successfully to: {}", toEmail);
            log.info("📋 Invitation details - Employee ID: {}, Link: {}", employeeId, invitationLink);

        } catch (MessagingException e) {
            log.error("❌ MessagingException while sending email to {}: {}", toEmail, e.getMessage());
            log.error("Stack trace:", e);
            
            // Try SMS fallback for officer
            trySmsForOfficer(employeeId, "You have been invited to RRA Tax Professionals Platform. Your invitation link: " + officerFrontendUrl + "/reset-password?token=" + invitationToken + "&type=officer");
            
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error while sending email to {}: {}", toEmail, e.getMessage());
            log.error("Stack trace:", e);
            
            // Try SMS fallback for officer
            trySmsForOfficer(employeeId, "You have been invited to RRA Tax Professionals Platform. Your invitation link: " + officerFrontendUrl + "/reset-password?token=" + invitationToken + "&type=officer");
            
            throw new RuntimeException("Unexpected error sending email: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String employeeId, String names, String resetToken) {
        log.info("📧 Preparing to send password reset email to: {}", toEmail);

        String resetLink = null;
        try {
            String encodedToken = URLEncoder.encode(resetToken, StandardCharsets.UTF_8);
            resetLink = officerFrontendUrl + "/reset-password?token=" + encodedToken + "&type=officer";
            String htmlContent = buildPasswordResetEmailTemplate(names, employeeId, resetLink);

            log.info("📤 Sending password reset email via SMTP...");
            sendEmail(toEmail, "Password Reset Request - RRA Tax Professionals Platform", htmlContent, null, null);

            log.info("✅ Password reset email sent successfully to: {}", toEmail);
            log.info("📋 Reset details - Employee ID: {}, Link: {}", employeeId, resetLink);

        } catch (MessagingException e) {
            log.error("❌ MessagingException while sending password reset email to {}: {}", toEmail, e.getMessage());
            log.error("Stack trace:", e);
            
            // Try SMS fallback for officer
            String smsMessage = resetLink != null 
                ? "Password reset request for RRA Tax Professionals Platform. Reset link: " + resetLink
                : "Password reset request for RRA Tax Professionals Platform. Please contact admin for reset link.";
            trySmsForOfficer(employeeId, smsMessage);
            
            throw new RuntimeException("Failed to send password reset email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error while sending password reset email to {}: {}", toEmail, e.getMessage());
            log.error("Stack trace:", e);
            
            // Try SMS fallback for officer
            String smsMessage = resetLink != null 
                ? "Password reset request for RRA Tax Professionals Platform. Reset link: " + resetLink
                : "Password reset request for RRA Tax Professionals Platform. Please contact admin for reset link.";
            trySmsForOfficer(employeeId, smsMessage);
            
            throw new RuntimeException("Unexpected error sending password reset email: " + e.getMessage(), e);
        }
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
            List<Long> problematicDocumentIds) {

        log.info("📧 Preparing to send application decision email to: {} (Status: {})", toEmail, status);

        try {
            String subject = status == ApplicationStatus.APPROVED
                    ? "Application Approved - RRA Tax Professionals Platform"
                    : "Application Decision - RRA Tax Professionals Platform";

            String htmlContent = status == ApplicationStatus.APPROVED
                    ? buildApprovalEmailTemplate(applicantName, tpin)
                    : buildRejectionEmailTemplate(applicantName, tpin, rejectionReason, problematicDocumentIds);

            log.info("📤 Sending decision email via SMTP...");
            sendEmail(toEmail, subject, htmlContent, pdfAttachment, fileName);

            log.info("✅ Decision email sent successfully to: {} (Status: {})", toEmail, status);
            log.info("📋 Attachment: {}, Size: {} bytes", fileName, pdfAttachment.length);

        } catch (MessagingException e) {
            log.error("❌ MessagingException while sending decision email to {}: {}", toEmail, e.getMessage());
            log.error("Stack trace:", e);
            
            // Try SMS fallback for tax professional
            String smsMessage = status == ApplicationStatus.APPROVED 
                ? "Congratulations " + applicantName + "! Your application for Tax Professional License has been APPROVED. Check your portal for details."
                : "Dear " + applicantName + ", Your application requires attention. Please check your portal for details. TPIN: " + tpin;
            trySmsForTaxProfessional(tpin, smsMessage);
            
            throw new RuntimeException("Failed to send decision email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error while sending decision email to {}: {}", toEmail, e.getMessage());
            log.error("Stack trace:", e);
            
            // Try SMS fallback for tax professional
            String smsMessage = status == ApplicationStatus.APPROVED 
                ? "Congratulations " + applicantName + "! Your application for Tax Professional License has been APPROVED. Check your portal for details."
                : "Dear " + applicantName + ", Your application requires attention. Please check your portal for details. TPIN: " + tpin;
            trySmsForTaxProfessional(tpin, smsMessage);
            
            throw new RuntimeException("Unexpected error sending decision email: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendApprovalEmailWithCertificate(String toEmail, String applicantName, byte[] pdfBytes) {
        log.info("📧 Sending approval email with frontend-generated certificate to: {}", toEmail);

        try {
            String htmlContent = "<!DOCTYPE html>"
                    + "<html>"
                    + "<head>"
                    + "    <meta charset='UTF-8'>"
                    + "    <style>"
                    + "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }"
                    + "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }"
                    + "        .header { background-color: #0056b3; color: white; padding: 20px; text-align: center; }"
                    + "        .content { background-color: #f9f9f9; padding: 30px; }"
                    + "        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }"
                    + "    </style>"
                    + "</head>"
                    + "<body>"
                    + "    <div class='container'>"
                    + "        <div class='header'>"
                    + "            <h1>Congratulations!</h1>"
                    + "        </div>"
                    + "        <div class='content'>"
                    + "            <p>Dear " + applicantName + ",</p>"
                    + "            <p>We are pleased to inform you that your application for the Tax Advisory License has been <strong>APPROVED</strong>.</p>"
                    + "            <p>Your certificate is attached to this email. Please download and keep it for your records.</p>"
                    + "            <p>You can also access your certificate anytime by logging into your portal account.</p>"
                    + "            <p>Thank you for your application.</p>"
                    + "            <p>Best regards,<br>Rwanda Revenue Authority</p>"
                    + "        </div>"
                    + "        <div class='footer'>"
                    + "            <p>&copy; Rwanda Revenue Authority. All rights reserved.</p>"
                    + "        </div>"
                    + "    </div>"
                    + "</body>"
                    + "</html>";

            log.info("📤 Sending email via SMTP...");
            sendEmail(toEmail, "Tax Advisory License - Approved", htmlContent, pdfBytes, "Tax_Professional_Certificate.pdf");

            log.info("✅ Approval email with certificate sent successfully to: {}", toEmail);
            log.info("📋 Certificate attachment size: {} bytes", pdfBytes.length);

        } catch (MessagingException e) {
            log.error("❌ MessagingException while sending approval email: {}", e.getMessage(), e);
            
            // Try SMS fallback - find tax professional by email
            TaxProfessional taxPro = taxProfessionalRepository.findByEmail(toEmail).orElse(null);
            if (taxPro != null) {
                String smsMessage = "Congratulations " + applicantName + "! Your Tax Advisory License has been APPROVED. Your certificate is ready. Login to your portal to download it.";
                trySmsForTaxProfessional(taxPro.getTpin(), smsMessage);
            }
            
            throw new RuntimeException("Failed to send approval email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error while sending approval email: {}", e.getMessage(), e);
            
            // Try SMS fallback - find tax professional by email
            TaxProfessional taxPro = taxProfessionalRepository.findByEmail(toEmail).orElse(null);
            if (taxPro != null) {
                String smsMessage = "Congratulations " + applicantName + "! Your Tax Advisory License has been APPROVED. Your certificate is ready. Login to your portal to download it.";
                trySmsForTaxProfessional(taxPro.getTpin(), smsMessage);
            }
            
            throw new RuntimeException("Unexpected error sending approval email: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendRejectionEmailWithLetter(String toEmail, String applicantName, String tpin, byte[] pdfBytes) {
        log.info("📧 Sending rejection email with frontend-generated letter to: {}", toEmail);

        try {
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin).orElse(null);
            String rejectionReason = taxProfessional != null ? taxProfessional.getRejectionReason() : null;

            List<DocumentRejection> documentRejections = documentRejectionRepository.findByTaxProfessionalTpin(tpin);
            List<Document> problematicDocs = documentRejections.stream()
                    .map(DocumentRejection::getDocument)
                    .collect(java.util.stream.Collectors.toList());

            String htmlContent = buildRejectionLetterEmailTemplate(applicantName, rejectionReason, problematicDocs);

            log.info("📤 Sending rejection email via SMTP...");
            sendEmail(toEmail, "Tax Advisory License Application - Decision", htmlContent, pdfBytes, "Rejection_Letter.pdf");

            log.info("✅ Rejection email with letter sent successfully to: {}", toEmail);
            log.info("📋 Rejection letter attachment size: {} bytes", pdfBytes.length);
            if (!problematicDocs.isEmpty()) {
                log.info("📋 Included {} problematic documents in email", problematicDocs.size());
            }

        } catch (MessagingException e) {
            log.error("❌ MessagingException while sending rejection email: {}", e.getMessage(), e);
            
            // Try SMS fallback
            String smsMessage = "Dear " + applicantName + ", Your application requires attention. Please check your portal for details. TPIN: " + tpin;
            trySmsForTaxProfessional(tpin, smsMessage);
            
            throw new RuntimeException("Failed to send rejection email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error while sending rejection email: {}", e.getMessage(), e);
            
            // Try SMS fallback
            String smsMessage = "Dear " + applicantName + ", Your application requires attention. Please check your portal for details. TPIN: " + tpin;
            trySmsForTaxProfessional(tpin, smsMessage);
            
            throw new RuntimeException("Unexpected error sending rejection email: " + e.getMessage(), e);
        }
    }

    @Override
    public void sendWelcomePasswordEmail(String toEmail, String password, String fullName, String accountType, String resetToken) {
        log.info("📧 Preparing to send welcome password email to: {}", toEmail);

        try {
            String resetLink = null;
            if (resetToken != null && !resetToken.trim().isEmpty()) {
                String encodedToken = URLEncoder.encode(resetToken, StandardCharsets.UTF_8);
                String userType = "COMPANY".equalsIgnoreCase(accountType) ? "company" : "taxprofessional";
                resetLink = taxProfessionalFrontendUrl + "/reset-password?token=" + encodedToken + "&type=" + userType;
                log.info("🔗 Generated reset link with type: {}", userType);
            }

            String htmlContent = buildWelcomePasswordEmailTemplate(toEmail, password, fullName, accountType, resetLink);

            log.info("📤 Sending welcome email via SMTP...");
            sendEmail(toEmail, "Welcome to RRA Tax Professional Portal - Your Account Details", htmlContent, null, null);

            log.info("✅ Welcome password email sent successfully to: {}", toEmail);
            if (resetLink != null) {
                log.info("📋 Reset link included: {}", resetLink);
            }

        } catch (MessagingException e) {
            log.error("❌ MessagingException while sending welcome email to {}: {}", toEmail, e.getMessage());
            log.error("Stack trace:", e);
            
            // Try SMS fallback - find tax professional by email
            TaxProfessional taxPro = taxProfessionalRepository.findByEmail(toEmail).orElse(null);
            if (taxPro != null) {
                String smsMessage = "Welcome " + fullName + "! Your RRA Tax Professional Portal account is ready. Login with email: " + toEmail + ". Please check your portal for password details.";
                trySmsForTaxProfessional(taxPro.getTpin(), smsMessage);
            }
            
            throw new RuntimeException("Failed to send welcome email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error while sending welcome email to {}: {}", toEmail, e.getMessage());
            log.error("Stack trace:", e);
            
            // Try SMS fallback - find tax professional by email
            TaxProfessional taxPro = taxProfessionalRepository.findByEmail(toEmail).orElse(null);
            if (taxPro != null) {
                String smsMessage = "Welcome " + fullName + "! Your RRA Tax Professional Portal account is ready. Login with email: " + toEmail + ". Please check your portal for password details.";
                trySmsForTaxProfessional(taxPro.getTpin(), smsMessage);
            }
            
            throw new RuntimeException("Unexpected error sending welcome email: " + e.getMessage(), e);
        }
    }

    private String buildInvitationEmailTemplate(String names, String employeeId, String invitationLink) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "    <meta charset='UTF-8'>"
                + "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                + "    <style>"
                + "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }"
                + "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }"
                + "        .header { background-color: #0056b3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }"
                + "        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }"
                + "        .button { display: inline-block; padding: 12px 30px; background-color: #0056b3; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }"
                + "        .button:hover { background-color: #003d82; }"
                + "        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }"
                + "        .info-box { background-color: #e7f3ff; border-left: 4px solid #0056b3; padding: 15px; margin: 20px 0; }"
                + "        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }"
                + "    </style>"
                + "</head>"
                + "<body>"
                + "    <div class='container'>"
                + "        <div class='header'>"
                + "            <h1 style='margin: 0;'>RRA Tax Professionals Platform</h1>"
                + "        </div>"
                + "        <div class='content'>"
                + "            <h2>Welcome, " + names + "!</h2>"
                + "            <p>You have been invited to join the RRA Tax Professionals Platform as an officer.</p>"
                + "            "
                + "            <div class='info-box'>"
                + "                <strong>Your Employee ID:</strong> " + employeeId + ""
                + "            </div>"
                + "            "
                + "            <p>To complete your registration and set your password, please click the button below:</p>"
                + "            "
                + "            <div style='text-align: center;'>"
                + "                <a href='" + invitationLink + "' class='button'>Set Your Password</a>"
                + "            </div>"
                + "            "
                + "            <p style='margin-top: 20px;'>Or copy and paste this link into your browser:</p>"
                + "            <p style='word-break: break-all; color: #0056b3; background-color: #f0f0f0; padding: 10px; border-radius: 3px;'>" + invitationLink + "</p>"
                + "            "
                + "            <div class='warning'>"
                + "                <p style='margin: 0;'><strong>Important Information:</strong></p>"
                + "                <ul style='margin: 10px 0 0 0;'>"
                + "                    <li>This invitation link will expire in <strong>7 days</strong></li>"
                + "                    <li>The link can only be used <strong>once</strong></li>"
                + "                    <li>Your password must be at least <strong>6 characters long</strong></li>"
                + "                </ul>"
                + "            </div>"
                + "            "
                + "            <p style='margin-top: 20px;'>If you did not expect this invitation, please contact your system administrator immediately.</p>"
                + "        </div>"
                + "        <div class='footer'>"
                + "            <p>&copy; 2024 Rwanda Revenue Authority. All rights reserved.</p>"
                + "            <p>This is an automated message, please do not reply to this email.</p>"
                + "        </div>"
                + "    </div>"
                + "</body>"
                + "</html>";
    }

    private String buildPasswordResetEmailTemplate(String names, String employeeId, String resetLink) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "    <meta charset='UTF-8'>"
                + "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                + "    <style>"
                + "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }"
                + "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }"
                + "        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }"
                + "        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }"
                + "        .button { display: inline-block; padding: 12px 30px; background-color: #dc3545; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }"
                + "        .button:hover { background-color: #c82333; }"
                + "        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }"
                + "        .info-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }"
                + "        .warning { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }"
                + "    </style>"
                + "</head>"
                + "<body>"
                + "    <div class='container'>"
                + "        <div class='header'>"
                + "            <h1 style='margin: 0;'>RRA Tax Professionals Platform</h1>"
                + "        </div>"
                + "        <div class='content'>"
                + "            <h2>Password Reset Request</h2>"
                + "            <p>Hello " + names + ",</p>"
                + "            <p>We received a request to reset your password for the RRA Tax Professionals Platform.</p>"
                + "            "
                + "            <div class='info-box'>"
                + "                <strong>Your Employee ID:</strong> " + employeeId + ""
                + "            </div>"
                + "            "
                + "            <p>To reset your password, please click the button below:</p>"
                + "            "
                + "            <div style='text-align: center;'>"
                + "                <a href='" + resetLink + "' class='button'>Reset Your Password</a>"
                + "            </div>"
                + "            "
                + "            <p style='margin-top: 20px;'>Or copy and paste this link into your browser:</p>"
                + "            <p style='word-break: break-all; color: #dc3545; background-color: #f0f0f0; padding: 10px; border-radius: 3px;'>" + resetLink + "</p>"
                + "            "
                + "            <div class='warning'>"
                + "                <p style='margin: 0;'><strong>Important Security Information:</strong></p>"
                + "                <ul style='margin: 10px 0 0 0;'>"
                + "                    <li>This password reset link will expire in <strong>24 hours</strong></li>"
                + "                    <li>The link can only be used <strong>once</strong></li>"
                + "                    <li>Your new password must be at least <strong>6 characters long</strong></li>"
                + "                    <li>If you did not request this reset, please ignore this email and contact your administrator</li>"
                + "                </ul>"
                + "            </div>"
                + "            "
                + "            <p style='margin-top: 20px;'>For security reasons, if you did not request a password reset, please contact your system administrator immediately.</p>"
                + "        </div>"
                + "        <div class='footer'>"
                + "            <p>&copy; 2024 Rwanda Revenue Authority. All rights reserved.</p>"
                + "            <p>This is an automated message, please do not reply to this email.</p>"
                + "        </div>"
                + "    </div>"
                + "</body>"
                + "</html>";
    }

    private String buildApprovalEmailTemplate(String applicantName, String tpin) {
        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "    <meta charset='UTF-8'>"
                + "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                + "    <style>"
                + "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }"
                + "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }"
                + "        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }"
                + "        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }"
                + "        .success-box { background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }"
                + "        .info-box { background-color: #e7f3ff; border-left: 4px solid #0056b3; padding: 15px; margin: 20px 0; }"
                + "        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }"
                + "        .button { display: inline-block; padding: 12px 30px; background-color: #28a745; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }"
                + "    </style>"
                + "</head>"
                + "<body>"
                + "    <div class='container'>"
                + "        <div class='header'>"
                + "            <h1 style='margin: 0;'>🎉 Application Approved!</h1>"
                + "        </div>"
                + "        <div class='content'>"
                + "            <h2>Congratulations, " + applicantName + "!</h2>"
                + "            "
                + "            <div class='success-box'>"
                + "                <p style='margin: 0; font-size: 16px;'><strong>Your application has been approved!</strong></p>"
                + "            </div>"
                + "            "
                + "            <p>We are pleased to inform you that your application for registration as a Tax Professional "
                + "               with the Rwanda Revenue Authority has been <strong>approved</strong>.</p>"
                + "            "
                + "            <div class='info-box'>"
                + "                <strong>Your Tax Identification Number (TIN):</strong> " + tpin + ""
                + "            </div>"
                + "            "
                + "            <p>Please find your <strong>official approval certificate</strong> attached to this email. "
                + "               This certificate confirms your registration as a qualified Tax Professional with RRA.</p>"
                + "            "
                + "            <h3>Next Steps:</h3>"
                + "            <ul>"
                + "                <li>Download and save your approval certificate</li>"
                + "                <li>You may now provide tax professional services in accordance with RRA regulations</li>"
                + "                <li>Keep your certificate for your records and professional use</li>"
                + "                <li>Login to your account to access additional resources</li>"
                + "            </ul>"
                + "            "
                + "            <p style='margin-top: 20px;'>If you have any questions or need assistance, please don't hesitate to contact us.</p>"
                + "            "
                + "            <p style='margin-top: 30px;'><strong>Thank you for joining the RRA Tax Professionals community!</strong></p>"
                + "        </div>"
                + "        <div class='footer'>"
                + "            <p>&copy; 2024 Rwanda Revenue Authority. All rights reserved.</p>"
                + "            <p>This is an automated message, please do not reply to this email.</p>"
                + "            <p>For inquiries: ocdtd@rra.gov.rw | +250 788 185 541 | 0788 185 540</p>"
                + "        </div>"
                + "    </div>"
                + "</body>"
                + "</html>";
    }

    private String buildRejectionEmailTemplate(String applicantName, String tpin, String rejectionReason, List<Long> problematicDocumentIds) {
        String reasonText = rejectionReason != null && !rejectionReason.trim().isEmpty()
                ? rejectionReason
                : "Please refer to the attached letter for details.";

        // Build problematic documents list HTML
        String problematicDocumentsHtml = "";
        if (problematicDocumentIds != null && !problematicDocumentIds.isEmpty()) {
            List<Document> problematicDocs = documentRepository.findAllById(problematicDocumentIds);
            if (!problematicDocs.isEmpty()) {
                StringBuilder docsHtml = new StringBuilder();
                docsHtml.append("<div class='info-box' style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;'>");
                docsHtml.append("<p style='margin: 0 0 10px 0;'><strong>Problematic Documents:</strong></p>");
                docsHtml.append("<p style='margin: 0 0 5px 0;'>Please review and update the following documents:</p>");
                docsHtml.append("<ul style='margin: 5px 0;'>");
                for (Document doc : problematicDocs) {
                    String documentTypeName = formatDocumentType(doc.getDocumentType());
                    docsHtml.append("<li>").append(documentTypeName);
                    if (doc.getUploadedAt() != null) {
                        docsHtml.append(" (Uploaded: ").append(doc.getUploadedAt().toLocalDate()).append(")");
                    }
                    docsHtml.append("</li>");
                }
                docsHtml.append("</ul>");
                docsHtml.append("</div>");
                problematicDocumentsHtml = docsHtml.toString();
            }
        }

        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "    <meta charset='UTF-8'>"
                + "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                + "    <style>"
                + "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }"
                + "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }"
                + "        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }"
                + "        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }"
                + "        .warning-box { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }"
                + "        .info-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }"
                + "        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }"
                + "    </style>"
                + "</head>"
                + "<body>"
                + "    <div class='container'>"
                + "        <div class='header'>"
                + "            <h1 style='margin: 0;'>Application Decision</h1>"
                + "        </div>"
                + "        <div class='content'>"
                + "            <h2>Dear " + applicantName + ",</h2>"
                + "            "
                + "            <p>Thank you for your interest in becoming a registered Tax Professional with the Rwanda Revenue Authority.</p>"
                + "            "
                + "            <div class='warning-box'>"
                + "                <p style='margin: 0;'><strong>Application Status:</strong> Unfortunately, your application has not been approved at this time.</p>"
                + "            </div>"
                + "            "
                + "            <p><strong>Application Reference:</strong> " + tpin + "</p>"
                + "            "
                + "            <div class='info-box'>"
                + "                <p style='margin: 0 0 10px 0;'><strong>Reason:</strong></p>"
                + "                <p style='margin: 0;'>" + reasonText + "</p>"
                + "            </div>"
                + "            "
                + problematicDocumentsHtml
                + "            "
                + "            <p>Please find the detailed rejection letter attached to this email, which provides complete information "
                + "               regarding the decision.</p>"
                + "            "
                + "            <h3>What You Can Do:</h3>"
                + "            <ul>"
                + "                <li>Review the detailed rejection letter attached</li>"
                + "                <li>Address the issues mentioned in the rejection</li>"
                + "                <li>Resubmit your application after addressing the concerns</li>"
                + "                <li>Contact us if you need clarification or assistance</li>"
                + "            </ul>"
                + "            "
                + "            <p style='margin-top: 20px;'><strong>Need Help?</strong></p>"
                + "            <p>If you have questions about this decision or need assistance with resubmission, "
                + "               please contact our Commissioner Domestic Taxes Department:</p>"
                + "            <ul>"
                + "                <li>Email: taxprofessionals@rra.gov.rw</li>"
                + "                <li>Phone: +250 788 123 456</li>"
                + "            </ul>"
                + "            "
                + "            <p style='margin-top: 30px;'>We encourage you to address the concerns and resubmit your application. "
                + "               We appreciate your interest in becoming a registered Tax Professional with RRA.</p>"
                + "        </div>"
                + "        <div class='footer'>"
                + "            <p>&copy; 2024 Rwanda Revenue Authority. All rights reserved.</p>"
                + "            <p>This is an automated message, please do not reply to this email.</p>"
                + "            <p>For inquiries: taxprofessionals@rra.gov.rw | +250 788 123 456</p>"
                + "        </div>"
                + "    </div>"
                + "</body>"
                + "</html>";
    }

    @Override
    public void sendApplicantPasswordResetEmail(String toEmail, String tpin, String fullName, String resetToken, String accountType) {
        log.info("📧 Preparing to send applicant password reset email to: {} (Account type: {})", toEmail, accountType);

        try {
            String encodedToken = URLEncoder.encode(resetToken, StandardCharsets.UTF_8);
            String userType = "COMPANY".equalsIgnoreCase(accountType) ? "company" : "taxprofessional";
            String resetLink = taxProfessionalFrontendUrl + "/reset-password?token=" + encodedToken + "&type=" + userType;
            log.info("🔗 Generated applicant reset link with type: {}", userType);

            String htmlContent = buildApplicantPasswordResetEmailTemplate(fullName, tpin, resetLink);

            log.info("📤 Sending applicant password reset email via SMTP...");
            sendEmail(toEmail, "Password Reset Request - RRA Tax Professional Portal", htmlContent, null, null);

            log.info("✅ Applicant password reset email sent successfully to: {}", toEmail);
            log.info("📋 Reset details - TPIN: {}, Link: {}", tpin, resetLink);

        } catch (MessagingException e) {
            log.error("❌ MessagingException while sending applicant password reset email to {}: {}", toEmail, e.getMessage());
            log.error("Stack trace:", e);
            
            // Try SMS fallback
            String smsMessage = "Password reset request for RRA Tax Professional Portal. TPIN: " + tpin + ". Please login to your portal to reset password or contact support.";
            trySmsForTaxProfessional(tpin, smsMessage);
            
            throw new RuntimeException("Failed to send applicant password reset email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error while sending applicant password reset email to {}: {}", toEmail, e.getMessage());
            log.error("Stack trace:", e);
            
            // Try SMS fallback
            String smsMessage = "Password reset request for RRA Tax Professional Portal. TPIN: " + tpin + ". Please login to your portal to reset password or contact support.";
            trySmsForTaxProfessional(tpin, smsMessage);
            
            throw new RuntimeException("Unexpected error sending applicant password reset email: " + e.getMessage(), e);
        }
    }

    private String buildApplicantPasswordResetEmailTemplate(String fullName, String tpin, String resetLink) {
        String displayName = fullName != null && !fullName.trim().isEmpty() ? fullName : "User";

        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "    <meta charset='UTF-8'>"
                + "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                + "    <style>"
                + "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }"
                + "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }"
                + "        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }"
                + "        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }"
                + "        .button { display: inline-block; padding: 12px 30px; background-color: #dc3545; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }"
                + "        .button:hover { background-color: #c82333; }"
                + "        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }"
                + "        .info-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }"
                + "        .warning { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }"
                + "    </style>"
                + "</head>"
                + "<body>"
                + "    <div class='container'>"
                + "        <div class='header'>"
                + "            <h1 style='margin: 0;'>RRA Tax Professional Portal</h1>"
                + "        </div>"
                + "        <div class='content'>"
                + "            <h2>Password Reset Request</h2>"
                + "            <p>Hello " + displayName + ",</p>"
                + "            <p>We received a request to reset your password for the RRA Tax Professional Portal.</p>"
                + "            "
                + "            <div class='info-box'>"
                + "                <strong>Your TPIN:</strong> " + tpin + ""
                + "            </div>"
                + "            "
                + "            <p>To reset your password, please click the button below:</p>"
                + "            "
                + "            <div style='text-align: center;'>"
                + "                <a href='" + resetLink + "' class='button'>Reset Your Password</a>"
                + "            </div>"
                + "            "
                + "            <p style='margin-top: 20px;'>Or copy and paste this link into your browser:</p>"
                + "            <p style='word-break: break-all; color: #dc3545; background-color: #f0f0f0; padding: 10px; border-radius: 3px;'>" + resetLink + "</p>"
                + "            "
                + "            <div class='warning'>"
                + "                <p style='margin: 0;'><strong>Important Security Information:</strong></p>"
                + "                <ul style='margin: 10px 0 0 0;'>"
                + "                    <li>This password reset link will expire in <strong>24 hours</strong></li>"
                + "                    <li>The link can only be used <strong>once</strong></li>"
                + "                    <li>Your new password must be at least <strong>6 characters long</strong></li>"
                + "                    <li>If you did not request this reset, please ignore this email and contact support</li>"
                + "                </ul>"
                + "            </div>"
                + "            "
                + "            <p style='margin-top: 20px;'>For security reasons, if you did not request a password reset, please contact support immediately.</p>"
                + "        </div>"
                + "        <div class='footer'>"
                + "            <p>&copy; 2024 Rwanda Revenue Authority. All rights reserved.</p>"
                + "            <p>This is an automated message, please do not reply to this email.</p>"
                + "        </div>"
                + "    </div>"
                + "</body>"
                + "</html>";
    }

    private String buildWelcomePasswordEmailTemplate(String email, String password, String fullName, String accountType, String resetLink) {
        String displayName = fullName != null && !fullName.trim().isEmpty() ? fullName : "User";
        String displayAccountType = accountType != null && !accountType.trim().isEmpty() ? accountType : "INDIVIDUAL";

        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "    <meta charset='UTF-8'>"
                + "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                + "    <style>"
                + "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }"
                + "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }"
                + "        .header { background-color: #0056b3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }"
                + "        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }"
                + "        .button { display: inline-block; padding: 12px 30px; background-color: #28a745; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }"
                + "        .button:hover { background-color: #218838; }"
                + "        .credentials-box { background-color: #e7f3ff; border-left: 4px solid #0056b3; padding: 15px; margin: 20px 0; }"
                + "        .security-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }"
                + "        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }"
                + "        .divider { border-top: 2px solid #0056b3; margin: 30px 0; }"
                + "    </style>"
                + "</head>"
                + "<body>"
                + "    <div class='container'>"
                + "        <div class='header'>"
                + "            <h1 style='margin: 0;'>Welcome to RRA Tax Professional Portal!</h1>"
                + "        </div>"
                + "        <div class='content'>"
                + "            <h2>Dear " + displayName + ",</h2>"
                + "            <p>Welcome to the RRA Tax Professional Portal!</p>"
                + "            <p>Your account has been successfully created. Here are your login credentials:</p>"
                + "            "
                + "            <div class='credentials-box'>"
                + "                <p style='margin: 5px 0;'><strong>Email/Username:</strong> " + email + "</p>"
                + "                <p style='margin: 5px 0;'><strong>Password:</strong> " + password + "</p>"
                + "                <p style='margin: 5px 0;'><strong>Account Type:</strong> " + displayAccountType + "</p>"
                + "            </div>"
                + "            "
                + "            <p>You can login at: <a href='" + taxProfessionalFrontendUrl + "' style='color: #0056b3;'>" + taxProfessionalFrontendUrl + "</a></p>"
                + (resetLink != null
                        ? "            <div class='divider'></div>"
                        + "            <div class='security-box'>"
                        + "                <h3 style='margin-top: 0; color: #856404;'>🔒 SET A NEW PASSWORD (Recommended)</h3>"
                        + "                <p>For security reasons, we strongly recommend setting a new password of your choice.</p>"
                        + "                <div style='text-align: center;'>"
                        + "                    <a href='" + resetLink + "' class='button'>Set New Password</a>"
                        + "                </div>"
                        + "                <p style='margin-top: 15px; font-size: 12px; color: #666;'>Or copy and paste this link into your browser:</p>"
                        + "                <p style='word-break: break-all; font-size: 11px; color: #0056b3; background-color: #f0f0f0; padding: 10px; border-radius: 3px;'>" + resetLink + "</p>"
                        + "                <p style='margin-top: 10px; font-size: 12px;'><strong>Note:</strong> This link will expire in 24 hours.</p>"
                        + "            </div>"
                        + "            <div class='divider'></div>"
                        : "")
                + "            "
                + "            <p style='margin-top: 20px;'><strong>Important Security Reminder:</strong></p>"
                + "            <ul>"
                + "                <li>Keep your password confidential</li>"
                + "                <li>Do not share your login credentials with anyone</li>"
                + (resetLink != null ? "                <li>We recommend changing your password immediately using the link above</li>" : "")
                + "                <li>Contact us if you notice any suspicious activity</li>"
                + "            </ul>"
                + "            "
                + "            <p style='margin-top: 20px;'>If you did not create this account, please contact us immediately.</p>"
                + "            "
                + "            <p style='margin-top: 30px;'>Best regards,<br><strong>RRA Tax Professional Portal Team</strong></p>"
                + "        </div>"
                + "        <div class='footer'>"
                + "            <p>&copy; 2024 Rwanda Revenue Authority. All rights reserved.</p>"
                + "            <p>This is an automated message, please do not reply to this email.</p>"
                + "        </div>"
                + "    </div>"
                + "</body>"
                + "</html>";
    }

    /**
     * Build rejection letter email template (for frontend-generated PDF)
     */
    private String buildRejectionLetterEmailTemplate(String applicantName, String rejectionReason, List<Document> problematicDocs) {
        String reasonText = rejectionReason != null && !rejectionReason.trim().isEmpty()
                ? rejectionReason
                : "Please refer to the attached rejection letter for details.";

        // Build problematic documents list HTML
        String problematicDocumentsHtml = "";
        String actionItems = "";

        if (problematicDocs != null && !problematicDocs.isEmpty()) {
            StringBuilder docsHtml = new StringBuilder();
            docsHtml.append("<div style='background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;'>");
            docsHtml.append("<p style='margin: 0 0 10px 0;'><strong>📋 Problematic Documents:</strong></p>");
            docsHtml.append("<p style='margin: 0 0 5px 0;'>The following documents require your attention:</p>");
            docsHtml.append("<ul style='margin: 5px 0; padding-left: 20px;'>");
            for (Document doc : problematicDocs) {
                String documentTypeName = formatDocumentType(doc.getDocumentType());
                docsHtml.append("<li style='margin: 5px 0;'>");
                docsHtml.append("<strong>").append(documentTypeName).append("</strong>");
                if (doc.getUploadedAt() != null) {
                    docsHtml.append(" <span style='color: #666; font-size: 12px;'>(Uploaded: ")
                            .append(doc.getUploadedAt().toLocalDate()).append(")</span>");
                }
                docsHtml.append("</li>");
            }
            docsHtml.append("</ul>");
            docsHtml.append("</div>");
            problematicDocumentsHtml = docsHtml.toString();

            actionItems = "                <li>Update or replace the problematic documents listed above</li>"
                    + "                <li>Ensure all documents meet the required standards</li>"
                    + "                <li>Resubmit your application after addressing the concerns</li>";
        } else {
            actionItems = "                <li>Address the issues mentioned in the rejection letter</li>"
                    + "                <li>Resubmit your application after addressing the concerns</li>"
                    + "                <li>Contact us if you need clarification or assistance</li>";
        }

        return "<!DOCTYPE html>"
                + "<html>"
                + "<head>"
                + "    <meta charset='UTF-8'>"
                + "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                + "    <style>"
                + "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }"
                + "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }"
                + "        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }"
                + "        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }"
                + "        .warning-box { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }"
                + "        .info-box { background-color: #e7f3ff; border-left: 4px solid #0056b3; padding: 15px; margin: 20px 0; }"
                + "        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }"
                + "    </style>"
                + "</head>"
                + "<body>"
                + "    <div class='container'>"
                + "        <div class='header'>"
                + "            <h1 style='margin: 0;'>Application Decision</h1>"
                + "        </div>"
                + "        <div class='content'>"
                + "            <h2>Dear " + applicantName + ",</h2>"
                + "            <p>Thank you for your interest in becoming a registered Tax Professional with the Rwanda Revenue Authority.</p>"
                + "            <div class='warning-box'>"
                + "                <p style='margin: 0;'><strong>⚠️ Application Status:</strong> Unfortunately, your application has not been approved at this time.</p>"
                + "            </div>"
                + "            <div class='info-box'>"
                + "                <p style='margin: 0 0 10px 0;'><strong>Reason for Rejection:</strong></p>"
                + "                <p style='margin: 0;'>" + reasonText + "</p>"
                + "            </div>"
                + problematicDocumentsHtml
                + "            <p><strong>📎 Attached:</strong> Please find the detailed rejection letter attached to this email.</p>"
                + "            <h3>What You Can Do Next:</h3>"
                + "            <ul>"
                + "                <li>Review the attached rejection letter carefully</li>"
                + actionItems
                + "            </ul>"
                + "            <p style='margin-top: 20px;'><strong>Need Help?</strong></p>"
                + "            <p>If you have questions about this decision or need assistance with resubmission, please contact our Tax Professional Registration Department:</p>"
                + "            <ul>"
                + "                <li>Email: taxprofessionals@rra.gov.rw</li>"
                + "                <li>Phone: +250 788 123 456</li>"
                + "            </ul>"
                + "            <p style='margin-top: 30px;'>We encourage you to address the concerns and resubmit your application. We appreciate your interest in becoming a registered Tax Professional with RRA.</p>"
                + "        </div>"
                + "        <div class='footer'>"
                + "            <p>&copy; 2024 Rwanda Revenue Authority. All rights reserved.</p>"
                + "            <p>This is an automated message, please do not reply to this email.</p>"
                + "            <p>For inquiries: taxprofessionals@rra.gov.rw | +250 788 123 456</p>"
                + "        </div>"
                + "    </div>"
                + "</body>"
                + "</html>";
    }

    @Override
    public void sendSimpleEmail(String toEmail, String subject, String body) {
        log.info("📧 Sending simple email to: {}", toEmail);
        try {
            String htmlContent = "<!DOCTYPE html><html><body><p>" + body + "</p></body></html>";
            sendEmail(toEmail, subject, htmlContent, null, null);
            log.info("✅ Simple email sent successfully to: {}", toEmail);
        } catch (MessagingException e) {
            log.error("❌ Failed to send simple email: {}", e.getMessage(), e);
            
            // Try SMS fallback - try to find recipient and send SMS
            log.info("🔄 Attempting SMS fallback for simple email to: {}", toEmail);
            
            // Try to find officer by email
            Officer officer = officerRepository.findByEmail(toEmail).orElse(null);
            if (officer != null && officer.getPhoneNumber() != null) {
                try {
                    smsService.sendSms(officer.getPhoneNumber(), body);
                    log.info("✅ SMS sent as fallback to officer: {}", officer.getEmployeeId());
                } catch (Exception smsEx) {
                    log.error("❌ SMS fallback also failed: {}", smsEx.getMessage());
                }
            } else {
                // Try to find tax professional by email
                TaxProfessional taxPro = taxProfessionalRepository.findByEmail(toEmail).orElse(null);
                if (taxPro != null && taxPro.getPhoneNumber() != null) {
                    try {
                        smsService.sendSms(taxPro.getPhoneNumber(), body);
                        log.info("✅ SMS sent as fallback to tax professional: {}", taxPro.getTpin());
                    } catch (Exception smsEx) {
                        log.error("❌ SMS fallback also failed: {}", smsEx.getMessage());
                    }
                } else {
                    log.warn("⚠️ No phone number found for: {}", toEmail);
                }
            }
            
            throw new RuntimeException("Failed to send simple email: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error sending simple email: {}", e.getMessage(), e);
            
            // Try SMS fallback for non-MessagingException errors too
            log.info("🔄 Attempting SMS fallback for simple email to: {}", toEmail);
            
            Officer officer = officerRepository.findByEmail(toEmail).orElse(null);
            if (officer != null && officer.getPhoneNumber() != null) {
                try {
                    smsService.sendSms(officer.getPhoneNumber(), body);
                    log.info("✅ SMS sent as fallback to officer: {}", officer.getEmployeeId());
                } catch (Exception smsEx) {
                    log.error("❌ SMS fallback also failed: {}", smsEx.getMessage());
                }
            } else {
                TaxProfessional taxPro = taxProfessionalRepository.findByEmail(toEmail).orElse(null);
                if (taxPro != null && taxPro.getPhoneNumber() != null) {
                    try {
                        smsService.sendSms(taxPro.getPhoneNumber(), body);
                        log.info("✅ SMS sent as fallback to tax professional: {}", taxPro.getTpin());
                    } catch (Exception smsEx) {
                        log.error("❌ SMS fallback also failed: {}", smsEx.getMessage());
                    }
                } else {
                    log.warn("⚠️ No phone number found for: {}", toEmail);
                }
            }
            
            throw new RuntimeException("Unexpected error sending simple email: " + e.getMessage(), e);
        }
    }

    /**
     * Format document type enum to human-readable string
     */
    private String formatDocumentType(DocumentType documentType) {
        if (documentType == null) {
            return "Unknown Document";
        }

        switch (documentType) {
            case CV:
                return "Curriculum Vitae (CV)";
            case EDUCERTIFICATE:
                return "Education Certificate";
            case EBMCERTIFICATE:
                return "EBM Certificate";
            case SIGNEDLETTER:
                return "Signed Letter";
            case CRIMINALRECORD:
                return "Criminal Record";
            case RECOMMENDATIONLETTER:
                return "Recommendation Letter";
            case NONREFUNDFEES:
                return "Non-Refund Fees Document";
            case TAXCLEARANCECERTIFICATE:
                return "Tax Clearance Certificate";
            case BUSINESSREGISTRATIONCERT:
                return "Business Registration Certificate";
            default:
                return documentType.toString();
        }
    }

    /**
     * Try to send SMS to officer when email fails
     */
    private void trySmsForOfficer(String employeeId, String message) {
        try {
            Officer officer = officerRepository.findByEmployeeId(employeeId).orElse(null);
            if (officer != null && officer.getPhoneNumber() != null && !officer.getPhoneNumber().trim().isEmpty()) {
                log.info("📱 Email failed, attempting SMS fallback for officer: {}", employeeId);
                boolean smsSent = smsService.sendSms(officer.getPhoneNumber(), message);
                if (smsSent) {
                    log.info("✅ SMS fallback successful for officer: {}", employeeId);
                } else {
                    log.warn("⚠️ SMS fallback failed for officer: {}", employeeId);
                }
            } else {
                log.warn("⚠️ Cannot send SMS fallback: Officer {} has no phone number", employeeId);
            }
        } catch (Exception e) {
            log.error("❌ Error during SMS fallback for officer {}: {}", employeeId, e.getMessage());
        }
    }

    /**
     * Try to send SMS to tax professional when email fails
     */
    private void trySmsForTaxProfessional(String tpin, String message) {
        try {
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin).orElse(null);
            if (taxProfessional != null && taxProfessional.getPhoneNumber() != null && !taxProfessional.getPhoneNumber().trim().isEmpty()) {
                log.info("📱 Email failed, attempting SMS fallback for tax professional: {}", tpin);
                boolean smsSent = smsService.sendSms(taxProfessional.getPhoneNumber(), message);
                if (smsSent) {
                    log.info("✅ SMS fallback successful for tax professional: {}", tpin);
                } else {
                    log.warn("⚠️ SMS fallback failed for tax professional: {}", tpin);
                }
            } else {
                log.warn("⚠️ Cannot send SMS fallback: Tax professional {} has no phone number", tpin);
            }
        } catch (Exception e) {
            log.error("❌ Error during SMS fallback for tax professional {}: {}", tpin, e.getMessage());
        }
    }
}
