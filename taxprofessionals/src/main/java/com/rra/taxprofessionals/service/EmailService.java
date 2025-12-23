package com.rra.taxprofessionals.service;

import com.rra.taxprofessionals.enums.ApplicationStatus;

public interface EmailService {

    void sendInvitationEmail(String toEmail, String employeeId, String names, String invitationToken);

    void sendPasswordResetEmail(String toEmail, String employeeId, String names, String resetToken);

    /**
     * Send application decision email with PDF attachment
     *
     * @param toEmail Email address of the applicant
     * @param applicantName Full name of the applicant
     * @param tpin Tax Identification Number
     * @param status Application status (APPROVED or REJECTED)
     * @param pdfAttachment PDF certificate/letter as byte array
     * @param fileName Name for the PDF attachment
     * @param rejectionReason Reason for rejection (null if approved)
     * @param problematicDocumentIds List of problematic document IDs (null if approved or none)
     */
    void sendApplicationDecisionEmail(
            String toEmail,
            String applicantName,
            String tpin,
            ApplicationStatus status,
            byte[] pdfAttachment,
            String fileName,
            String rejectionReason,
            java.util.List<Long> problematicDocumentIds);

    /**
     * Send approval email with frontend-generated certificate
     *
     * @param toEmail Email address of the applicant
     * @param applicantName Full name of the applicant
     * @param pdfBytes Frontend-generated PDF certificate as byte array
     */
    void sendApprovalEmailWithCertificate(String toEmail, String applicantName, byte[] pdfBytes);

    /**
     * Send rejection email with frontend-generated rejection letter
     * Includes problematic documents if any were flagged
     *
     * @param toEmail Email address of the applicant
     * @param applicantName Full name of the applicant
     * @param tpin Tax Identification Number
     * @param pdfBytes Frontend-generated PDF rejection letter as byte array
     */
    void sendRejectionEmailWithLetter(String toEmail, String applicantName, String tpin, byte[] pdfBytes);

    /**
     * Send welcome email with password to newly registered tax professional
     * Optionally includes a "Set New Password" link with reset token
     *
     * @param toEmail Email address of the user
     * @param password User's password (plaintext as provided during registration)
     * @param fullName User's full name
     * @param accountType Account type ("INDIVIDUAL" or "COMPANY")
     * @param resetToken Reset token for "Set New Password" link (null if not included)
     */
    void sendWelcomePasswordEmail(String toEmail, String password, String fullName, String accountType, String resetToken);

    /**
     * Send password reset email to tax professional (applicant)
     * Uses applicant-specific reset password page
     *
     * @param toEmail Email address of the applicant
     * @param tpin Tax professional identification number
     * @param fullName Applicant's full name
     * @param resetToken Reset token for password reset
     */
    void sendApplicantPasswordResetEmail(String toEmail, String tpin, String fullName, String resetToken, String accountType);

    void sendSimpleEmail(String toEmail, String subject, String body);
}
