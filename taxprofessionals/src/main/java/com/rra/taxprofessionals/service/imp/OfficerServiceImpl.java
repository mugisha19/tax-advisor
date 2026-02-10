package com.rra.taxprofessionals.service.imp;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.ApplicationReviewRequest;
import com.rra.taxprofessionals.dto.LocationResponse;
import com.rra.taxprofessionals.dto.OfficerCreationRequest;
import com.rra.taxprofessionals.dto.OfficerResponse;
import com.rra.taxprofessionals.dto.OfficerUpdateRequest;
import com.rra.taxprofessionals.dto.SetPasswordRequest;
import com.rra.taxprofessionals.dto.TaxProfessionalResponse;
import com.rra.taxprofessionals.dto.ValidateInvitationResponse;
import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.exception.DuplicateResourceException;
import com.rra.taxprofessionals.exception.FileStorageException;
import com.rra.taxprofessionals.exception.InvalidRequestException;
import com.rra.taxprofessionals.exception.InvalidTokenException;
import com.rra.taxprofessionals.exception.ResourceNotFoundException;
import com.rra.taxprofessionals.model.Company;
import com.rra.taxprofessionals.model.Document;
import com.rra.taxprofessionals.model.DocumentRejection;
import com.rra.taxprofessionals.model.Officer;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.CompanyRepository;
import com.rra.taxprofessionals.repository.DocumentRejectionRepository;
import com.rra.taxprofessionals.repository.DocumentRepository;
import com.rra.taxprofessionals.repository.OfficerRepository;
import com.rra.taxprofessionals.repository.TaxProfessionalRepository;
import com.rra.taxprofessionals.service.CertificatePdfService;
import com.rra.taxprofessionals.service.EmailService;
import com.rra.taxprofessionals.service.OfficerService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
public class OfficerServiceImpl implements OfficerService {

    @Autowired
    private OfficerRepository officerRepository;

    @Autowired
    private TaxProfessionalRepository taxProfessionalRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private CertificatePdfService certificatePdfService;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentRejectionRepository documentRejectionRepository;

    @Autowired
    private com.rra.taxprofessionals.service.SmsService smsService;

    @Value("${app.invitation.token.expiry.days:7}")
    private int tokenExpiryDays;

    @Value("${app.password.reset.token.expiry.hours:24}")
    private int resetTokenExpiryHours;

    @Value("${app.frontend.taxprofessional.url}")
    private String taxProfessionalFrontendUrl;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public ApiResponse<OfficerResponse> createOfficer(OfficerCreationRequest request) {
        try {
            // Validate employee ID uniqueness
            if (officerRepository.existsByEmployeeId(request.getEmployeeId())) {
                throw new DuplicateResourceException(
                        "Officer already exists with employee ID: " + request.getEmployeeId());
            }

            // Validate email uniqueness if provided
            if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
                if (officerRepository.existsByEmail(request.getEmail())) {
                    throw new DuplicateResourceException(
                            "Officer already exists with email: " + request.getEmail());
                }
            }

            // Determine creation flow
            boolean hasPassword = request.getPassword() != null && !request.getPassword().trim().isEmpty();
            boolean hasEmail = request.getEmail() != null && !request.getEmail().trim().isEmpty();
            boolean hasPhoneNumber = request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty();

            // Validation: Either password must be provided, OR at least email/phone for invitation
            if (!hasPassword && !hasEmail && !hasPhoneNumber) {
                throw new InvalidRequestException(
                        "Either password must be provided, or at least email/phone number for invitation");
            }

            // For invitation flow (no password), require at least email or phone
            if (!hasPassword && !hasEmail && !hasPhoneNumber) {
                throw new InvalidRequestException(
                        "For invitation flow, at least email or phone number must be provided");
            }

            Officer officer = new Officer();
            officer.setEmployeeId(request.getEmployeeId());
            officer.setNames(request.getNames());
            officer.setOfficerType(request.getOfficerType());
            officer.setEmail(request.getEmail());
            officer.setPhoneNumber(request.getPhoneNumber()); // Add phone number
            officer.setCreatedAt(LocalDateTime.now());
            officer.setDepartment(""); // Set default empty string to satisfy NOT NULL constraint

            String successMessage;

            if (hasPassword) {
                // FLOW 1: Create with password (immediate activation)
                officer.setPassword(passwordEncoder.encode(request.getPassword()));
                officer.setIsActivated(true);
                officer.setActivatedAt(LocalDateTime.now());
                successMessage = "Officer created and activated successfully";
            } else {
                // FLOW 2: Create with invitation (pending activation)
                String invitationToken = UUID.randomUUID().toString();
                officer.setInvitationToken(invitationToken);
                officer.setTokenExpiry(LocalDateTime.now().plusDays(tokenExpiryDays));
                officer.setIsActivated(false);

                // Save officer FIRST (before sending notifications)
                Officer savedOfficer = officerRepository.save(officer);

                // Try to send invitation email (if email provided)
                if (hasEmail) {
                    try {
                        emailService.sendInvitationEmail(
                                request.getEmail(),
                                request.getEmployeeId(),
                                request.getNames(),
                                invitationToken);
                        successMessage = "Officer created successfully. Invitation email sent to " + request.getEmail();

                    } catch (Exception emailException) {
                        log.error("Failed to send invitation email to {}: {}",
                                request.getEmail(), emailException.getMessage());

                        // Email failed - SMS fallback already handled in EmailService
                        if (hasPhoneNumber) {
                            successMessage = "Officer created successfully. Email failed, SMS notification sent to phone.";
                        } else {
                            successMessage = "Officer created successfully, but notification sending failed. "
                                    + "Invitation token: " + invitationToken + " (expires in " + tokenExpiryDays + " days). "
                                    + "Please share this token with the officer manually.";
                        }
                    }
                } else if (hasPhoneNumber) {
                    // No email provided, send SMS directly
                    log.info("No email provided for officer {}, sending SMS invitation", request.getEmployeeId());
                    successMessage = "Officer created successfully. Invitation details sent via SMS to " + request.getPhoneNumber();
                } else {
                    // Neither email nor phone (shouldn't reach here due to validation)
                    successMessage = "Officer created successfully. Invitation token: " + invitationToken 
                            + " (expires in " + tokenExpiryDays + " days). Please share this token manually.";
                }

                return ApiResponse.success(successMessage, mapToOfficerResponse(savedOfficer));
            }

            Officer saved = officerRepository.save(officer);
            return ApiResponse.success(successMessage, mapToOfficerResponse(saved));

        } catch (DuplicateResourceException | InvalidRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to create officer: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create officer: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<ValidateInvitationResponse> validateInvitationToken(String token) {
        try {
            // Try to find Officer by invitation token first
            Officer officer = officerRepository.findByInvitationToken(token).orElse(null);
            boolean isInvitationToken = officer != null;

            // If not found, try Officer reset token
            if (!isInvitationToken) {
                officer = officerRepository.findByResetToken(token).orElse(null);
            }

            // If Officer not found, try TaxProfessional reset token
            TaxProfessional taxProfessional = null;
            if (officer == null) {
                taxProfessional = taxProfessionalRepository.findByResetToken(token).orElse(null);
            }

            // If neither Officer nor TaxProfessional found, throw exception
            if (officer == null && taxProfessional == null) {
                throw new InvalidTokenException("Invalid token");
            }

            // Handle Officer tokens
            if (officer != null) {
                if (isInvitationToken) {
                    // OFFICER INVITATION TOKEN VALIDATION
                    if (officer.getIsActivated()) {
                        return ApiResponse.success(
                                "Token has already been used",
                                new ValidateInvitationResponse(
                                        false, null, null, null,
                                        "This invitation has already been used"));
                    }

                    if (officer.getTokenExpiry() == null || officer.getTokenExpiry().isBefore(LocalDateTime.now())) {
                        return ApiResponse.success(
                                "Token has expired",
                                new ValidateInvitationResponse(
                                        false, null, null, null,
                                        "This invitation has expired. Please contact your administrator."));
                    }

                    return ApiResponse.success(
                            "Token is valid",
                            new ValidateInvitationResponse(
                                    true,
                                    officer.getEmail(),
                                    officer.getEmployeeId(),
                                    officer.getNames(),
                                    "Token is valid. Please set your password."));
                } else {
                    // OFFICER RESET TOKEN VALIDATION
                    if (officer.getResetTokenExpiry() == null
                            || officer.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                        return ApiResponse.success(
                                "Token has expired",
                                new ValidateInvitationResponse(
                                        false, null, null, null,
                                        "This password reset link has expired. Please request a new one."));
                    }

                    if (!officer.getIsActivated()) {
                        return ApiResponse.success(
                                "Token is invalid",
                                new ValidateInvitationResponse(
                                        false, null, null, null,
                                        "This account is not activated. Please contact your administrator."));
                    }

                    return ApiResponse.success(
                            "Token is valid",
                            new ValidateInvitationResponse(
                                    true,
                                    officer.getEmail(),
                                    officer.getEmployeeId(),
                                    officer.getNames(),
                                    "Password reset token is valid. Please set your new password."));
                }
            }

            // Handle TaxProfessional reset token
            if (taxProfessional != null) {
                log.info("📋 Validating TaxProfessional reset token");

                // TAXPROFESSIONAL RESET TOKEN VALIDATION
                if (taxProfessional.getResetTokenExpiry() == null
                        || taxProfessional.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                    return ApiResponse.success(
                            "Token has expired",
                            new ValidateInvitationResponse(
                                    false, null, null, null,
                                    "This password reset link has expired. Please request a new one."));
                }

                return ApiResponse.success(
                        "Token is valid",
                        new ValidateInvitationResponse(
                                true,
                                taxProfessional.getEmail(),
                                taxProfessional.getTpin(),
                                taxProfessional.getFullName(),
                                "Password reset token is valid. Please set your new password."));
            }

            // Should never reach here due to exception thrown earlier
            throw new InvalidTokenException("Invalid token");

        } catch (InvalidTokenException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to validate token: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<String> setPassword(SetPasswordRequest request) {
        try {
            // Try to find Officer by invitation token first
            Officer officer = officerRepository.findByInvitationToken(request.getToken()).orElse(null);
            boolean isInvitationToken = officer != null;

            // If not Officer invitation, try Officer reset token
            if (!isInvitationToken) {
                officer = officerRepository.findByResetToken(request.getToken()).orElse(null);
            }

            // If Officer found, handle Officer password set/reset
            if (officer != null) {
                if (isInvitationToken) {
                    // OFFICER INVITATION TOKEN FLOW (for new officers)
                    if (officer.getIsActivated()) {
                        throw new InvalidTokenException("This invitation has already been used");
                    }

                    if (officer.getTokenExpiry() == null || officer.getTokenExpiry().isBefore(LocalDateTime.now())) {
                        throw new InvalidTokenException("This invitation has expired. Please contact your administrator.");
                    }

                    // Set password and activate account
                    officer.setPassword(passwordEncoder.encode(request.getPassword()));
                    officer.setIsActivated(true);
                    officer.setActivatedAt(LocalDateTime.now());

                    // Clear invitation token (single-use)
                    officer.setInvitationToken(null);
                    officer.setTokenExpiry(null);

                    officerRepository.save(officer);

                    return ApiResponse.success(
                            "Password set successfully. You can now login with your employee ID and password.",
                            "Account activated for: " + officer.getEmployeeId());
                } else {
                    // OFFICER RESET TOKEN FLOW (for password reset)
                    if (officer.getResetTokenExpiry() == null
                            || officer.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                        throw new InvalidTokenException("This password reset link has expired. Please request a new one.");
                    }

                    // Update password (officer is already activated)
                    officer.setPassword(passwordEncoder.encode(request.getPassword()));

                    // Clear reset token (single-use)
                    officer.setResetToken(null);
                    officer.setResetTokenExpiry(null);

                    officerRepository.save(officer);

                    return ApiResponse.success(
                            "Password reset successfully. You can now login with your employee ID and new password.",
                            "Password updated for: " + officer.getEmployeeId());
                }
            }

            // If no Officer found, try TaxProfessional reset token
            TaxProfessional taxProfessional = taxProfessionalRepository.findByResetToken(request.getToken())
                    .orElse(null);

            if (taxProfessional != null) {
                log.info("📋 Setting password for TaxProfessional: {}", taxProfessional.getTpin());

                // TAXPROFESSIONAL RESET TOKEN FLOW
                if (taxProfessional.getResetTokenExpiry() == null
                        || taxProfessional.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                    throw new InvalidTokenException("This password reset link has expired. Please request a new one.");
                }

                // Update password
                taxProfessional.setPassword(passwordEncoder.encode(request.getPassword()));

                // Clear reset token (single-use)
                taxProfessional.setResetToken(null);
                taxProfessional.setResetTokenExpiry(null);

                taxProfessionalRepository.save(taxProfessional);

                log.info("✅ Password set successfully for TaxProfessional: {}", taxProfessional.getTpin());

                return ApiResponse.success(
                        "Password set successfully. You can now login with your email and new password.",
                        "Password updated for: " + taxProfessional.getEmail());
            }

            // If no TaxProfessional found, try Company reset token
            Company company = companyRepository.findByResetToken(request.getToken()).orElse(null);

            if (company != null) {
                log.info("📋 Setting password for Company: {}", company.getCompanyTin());

                // COMPANY RESET TOKEN FLOW
                if (company.getResetTokenExpiry() == null
                        || company.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
                    throw new InvalidTokenException("This password reset link has expired. Please request a new one.");
                }

                // Update password
                company.setPassword(passwordEncoder.encode(request.getPassword()));

                // Clear reset token (single-use)
                company.setResetToken(null);
                company.setResetTokenExpiry(null);

                companyRepository.save(company);

                log.info("✅ Password set successfully for Company: {}", company.getCompanyTin());

                return ApiResponse.success(
                        "Password set successfully. You can now login with your company email and new password.",
                        "Password updated for: " + company.getCompanyEmail());
            }

            // No valid token found
            throw new InvalidTokenException("Invalid token");

        } catch (InvalidTokenException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to set password: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public ApiResponse<Map<String, Object>> manuallyResetApplication(String tpin, String reason, String officerEmployeeId) {
        try {
            log.info("🔄 Manual reset requested for TPIN: {} by officer: {}", tpin, officerEmployeeId);
            
            // Validate inputs
            if (tpin == null || tpin.trim().isEmpty()) {
                log.warn("⚠️ Manual reset failed - TPIN is required");
                return ApiResponse.error("TPIN is required");
            }
            
            if (reason == null || reason.trim().isEmpty()) {
                log.warn("⚠️ Manual reset failed - Reason is required");
                return ApiResponse.error("Reset reason is required for audit trail");
            }
            
            if (officerEmployeeId == null || officerEmployeeId.trim().isEmpty()) {
                log.warn("⚠️ Manual reset failed - Officer ID is required");
                return ApiResponse.error("Officer identification is required");
            }
            
            // Find the tax professional
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin)
                    .orElse(null);
            
            if (taxProfessional == null) {
                log.warn("⚠️ Manual reset failed - Tax professional not found: {}", tpin);
                return ApiResponse.error("Application not found with TPIN: " + tpin);
            }
            
            // Validate that application can be reset
            if (!taxProfessional.canBeManuallyReset()) {
                log.warn("⚠️ Manual reset failed - Application not eligible: {} (status: {}, rejectionCount: {})", 
                        tpin, taxProfessional.getStatus(), taxProfessional.getRejectionCount());
                return ApiResponse.error("Only REJECTED applications or PENDING applications with rejection count >= 1 can be manually reset. Current status: " 
                        + taxProfessional.getStatus() + ", Rejection count: " + taxProfessional.getRejectionCount());
            }
            
            // Get officer details
            Officer officer = officerRepository.findByEmployeeId(officerEmployeeId).orElse(null);
            if (officer == null) {
                log.warn("⚠️ Manual reset failed - Officer not found: {}", officerEmployeeId);
                return ApiResponse.error("Officer not found with ID: " + officerEmployeeId);
            }
            
            String officerName = officer.getNames();
            
            // Log pre-reset state for audit (capture all fields that must be preserved)
            Integer preResetRejectionCount = taxProfessional.getRejectionCount();
            String preResetRejectionReason = taxProfessional.getRejectionReason();
            String preResetPreviousRejectionReason = taxProfessional.getPreviousRejectionReason();
            String preResetReviewedBy = taxProfessional.getReviewedBy();
            LocalDateTime preResetReviewedAt = taxProfessional.getReviewedAt();
            LocalDateTime preResetFirstRejectionDate = taxProfessional.getFirstRejectionDate();
            
            log.info("📋 PRE-RESET STATE - TPIN: {}, Status: {}, RejectionCount: {}, RejectionReason: {}, ReviewedBy: {}", 
                    tpin, 
                    taxProfessional.getStatus(),
                    preResetRejectionCount,
                    preResetRejectionReason != null ? preResetRejectionReason.substring(0, Math.min(50, preResetRejectionReason.length())) + "..." : "NULL",
                    preResetReviewedBy);
            
            // Perform the manual reset (resets rejectionCount to 0, preserves other audit data in dedicated fields)
            taxProfessional.performManualReset(officerName, reason);
            
            // Save to database (JPA UPDATE - only modified fields updated)
            TaxProfessional saved = taxProfessionalRepository.save(taxProfessional);
            
            // VERIFY audit data was preserved in dedicated audit fields after save
            boolean auditDataPreserved = 
                saved.getRejectionCountAtReset().equals(preResetRejectionCount) && // Original count preserved here
                (saved.getRejectionReason() != null ? saved.getRejectionReason().equals(preResetRejectionReason) : preResetRejectionReason == null) &&
                (saved.getReviewedBy() != null ? saved.getReviewedBy().equals(preResetReviewedBy) : preResetReviewedBy == null);
            
            if (!auditDataPreserved) {
                log.error("❌ AUDIT DATA NOT PRESERVED! Pre-reset count: {}, RejectionCountAtReset: {}", 
                    preResetRejectionCount, saved.getRejectionCountAtReset());
                throw new RuntimeException("Audit data integrity check failed - data was not preserved");
            }
            
            // Log post-reset state for audit
            log.info("✅ POST-RESET STATE - TPIN: {}, NewStatus: {}, NewRejectionCount: {}, ManualResetCount: {}, ManualResetBy: {}, RejectionCountAtReset: {}, PRESERVED_RejectionReason: {}, PRESERVED_ReviewedBy: {}", 
                    tpin,
                    saved.getStatus(),
                    saved.getRejectionCount(), // Now 0 (fresh start)
                    saved.getManualResetCount(),
                    saved.getManualResetBy(),
                    saved.getRejectionCountAtReset(), // Original count preserved here
                    saved.getRejectionReason() != null ? "YES" : "NO",
                    saved.getReviewedBy());
            
            log.info("✅ AUDIT VERIFICATION: Rejection count reset to 0, original count preserved in rejectionCountAtReset field");
            
            // Prepare audit details for response
            Map<String, Object> resetDetails = new HashMap<>();
            resetDetails.put("tpin", saved.getTpin());
            resetDetails.put("applicantName", saved.getFullName());
            resetDetails.put("newStatus", saved.getStatus().toString());
            resetDetails.put("resetDate", saved.getManualResetDate().toString());
            resetDetails.put("resetBy", saved.getManualResetBy());
            resetDetails.put("resetReason", saved.getManualResetReason());
            resetDetails.put("resetCount", saved.getManualResetCount());
            resetDetails.put("previousRejectionCount", saved.getRejectionCountAtReset());
            resetDetails.put("newRejectionCount", saved.getRejectionCount()); // Should be 0 (fresh start)
            resetDetails.put("preservedRejectionReason", saved.getRejectionReason());
            resetDetails.put("preservedReviewedBy", saved.getReviewedBy());
            
            log.info("✅ Manual reset completed successfully for TPIN: {} by officer: {}", tpin, officerName);
            
            return ApiResponse.success(
                    "Application has been manually reset to REGISTERED status. Rejection count reset to 0. All rejection history has been preserved for audit.",
                    resetDetails);
            
        } catch (Exception e) {
            log.error("❌ Error during manual reset for TPIN {}: {}", tpin, e.getMessage(), e);
            return ApiResponse.error("Failed to reset application: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<String> forgotPassword(String identifier) {
        try {
            log.info("🔐 Processing forgot password request for identifier: {}", identifier);

            // Determine if identifier is email or TIN
            boolean isEmail = identifier.contains("@");
            
            Officer officer = null;
            TaxProfessional taxProfessional = null;

            if (isEmail) {
                // Try to find Officer by email first
                officer = officerRepository.findByEmail(identifier).orElse(null);
            }

            if (officer != null) {
                log.info("📋 Found Officer account for email: {}", identifier);

                // Check if officer is activated (only activated officers can reset password)
                if (!officer.getIsActivated()) {
                    log.warn("⚠️ Password reset requested for inactive officer account: {}", identifier);
                    return ApiResponse.success(
                            "If an account exists with this identifier, a password reset link has been sent.",
                            "Please check your email for reset instructions.");
                }

                // Generate reset token for Officer
                String resetToken = UUID.randomUUID().toString();
                LocalDateTime resetTokenExpiry = LocalDateTime.now().plusHours(resetTokenExpiryHours);

                officer.setResetToken(resetToken);
                officer.setResetTokenExpiry(resetTokenExpiry);
                officerRepository.save(officer);

                log.info("✅ Reset token generated for officer: {}", officer.getEmployeeId());

                // Send password reset email for Officer
                try {
                    emailService.sendPasswordResetEmail(
                            officer.getEmail(),
                            officer.getEmployeeId(),
                            officer.getNames(),
                            resetToken);
                    log.info("✅ Password reset email sent successfully to officer: {}", officer.getEmail());
                } catch (Exception emailException) {
                    log.error("❌ Failed to send password reset email to officer {}: {}",
                            officer.getEmail(), emailException.getMessage());
                }

                return ApiResponse.success(
                        "If an account exists with this identifier, a password reset link has been sent.",
                        "Please check your email for reset instructions. The link will expire in "
                        + resetTokenExpiryHours + " hours.");
            }

            // If not Officer, try TaxProfessional by TIN or Email
            if (isEmail) {
                taxProfessional = taxProfessionalRepository.findByEmail(identifier).orElse(null);
            } else {
                // Try to find by TIN
                taxProfessional = taxProfessionalRepository.findById(identifier).orElse(null);
            }

            if (taxProfessional != null) {
                log.info("📋 Found TaxProfessional account for identifier: {}", identifier);

                // TaxProfessionals can reset password if they have a password set
                if (taxProfessional.getPassword() == null || taxProfessional.getPassword().trim().isEmpty()) {
                    log.warn("⚠️ Password reset requested for TaxProfessional with no password: {}", identifier);
                    return ApiResponse.success(
                            "If an account exists with this identifier, a password reset link has been sent.",
                            "Please check your email for reset instructions.");
                }
                
                // Check if TaxProfessional has an email address
                if (taxProfessional.getEmail() == null || taxProfessional.getEmail().trim().isEmpty()) {
                    log.warn("⚠️ Password reset requested for TaxProfessional with no email: {}", identifier);
                    return ApiResponse.success(
                            "If an account exists with this identifier, a password reset link has been sent.",
                            "Please check your email for reset instructions.");
                }

                // Generate reset token for TaxProfessional
                String resetToken = UUID.randomUUID().toString();
                LocalDateTime resetTokenExpiry = LocalDateTime.now().plusHours(resetTokenExpiryHours);

                taxProfessional.setResetToken(resetToken);
                taxProfessional.setResetTokenExpiry(resetTokenExpiry);
                taxProfessionalRepository.save(taxProfessional);

                log.info("✅ Reset token generated for TaxProfessional: {}", taxProfessional.getTpin());

                // Send password reset email for TaxProfessional (applicant-specific email)
                // Determine account type based on businessStatus
                String accountType = (taxProfessional.getBusinessStatus() == com.rra.taxprofessionals.enums.BusinessStatus.COMPANY) 
                                     ? "COMPANY" : "INDIVIDUAL";
                try {
                    emailService.sendApplicantPasswordResetEmail(
                            taxProfessional.getEmail(),
                            taxProfessional.getTpin(),
                            taxProfessional.getFullName(),
                            resetToken,
                            accountType);
                    log.info("✅ Applicant password reset email sent successfully to TaxProfessional: {} (Type: {})", 
                            taxProfessional.getEmail(), accountType);
                } catch (Exception emailException) {
                    log.error("❌ Failed to send applicant password reset email to TaxProfessional {}: {}",
                            taxProfessional.getEmail(), emailException.getMessage());
                }

                return ApiResponse.success(
                        "If an account exists with this identifier, a password reset link has been sent.",
                        "Please check your email for reset instructions. The link will expire in "
                        + resetTokenExpiryHours + " hours.");
            }

            // If not TaxProfessional, try Company by TIN or Email
            Company company = null;
            if (isEmail) {
                company = companyRepository.findByCompanyEmail(identifier).orElse(null);
            } else {
                // Try to find by Company TIN
                company = companyRepository.findByCompanyTin(identifier).orElse(null);
            }

            if (company != null) {
                log.info("📋 Found Company account for identifier: {}", identifier);

                // Generate reset token for Company
                String resetToken = UUID.randomUUID().toString();
                LocalDateTime resetTokenExpiry = LocalDateTime.now().plusHours(resetTokenExpiryHours);

                company.setResetToken(resetToken);
                company.setResetTokenExpiry(resetTokenExpiry);
                companyRepository.save(company);

                log.info("✅ Reset token generated for Company: {}", company.getCompanyTin());

                boolean emailSent = false;
                // Send password reset email for Company
                try {
                    emailService.sendApplicantPasswordResetEmail(
                            company.getCompanyEmail(),
                            company.getCompanyTin(),
                            company.getCompanyName(),
                            resetToken,
                            "COMPANY");
                    log.info("✅ Company password reset email sent successfully to: {}", company.getCompanyEmail());
                    emailSent = true;
                } catch (Exception emailException) {
                    log.error("❌ Failed to send password reset email to company {}: {}",
                            company.getCompanyEmail(), emailException.getMessage());
                    
                    // SMS fallback if company has phone number
                    if (company.getCompanyPhone() != null && !company.getCompanyPhone().trim().isEmpty()) {
                        try {
                            String encodedToken = java.net.URLEncoder.encode(resetToken, java.nio.charset.StandardCharsets.UTF_8);
                            String resetLink = taxProfessionalFrontendUrl + "/reset-password?token=" + encodedToken + "&type=company";
                            String smsMessage = "[RRA Tax Professional Portal] Password reset requested for " + company.getCompanyName() + 
                                    ". Reset link: " + resetLink + " (expires in " + resetTokenExpiryHours + " hours)";
                            boolean smsSent = smsService.sendSms(company.getCompanyPhone(), smsMessage);
                            if (smsSent) {
                                log.info("✅ SMS fallback sent to company phone: {}", company.getCompanyPhone());
                            } else {
                                log.error("❌ SMS fallback failed for company: {}", company.getCompanyTin());
                            }
                        } catch (Exception smsException) {
                            log.error("❌ SMS fallback exception for company {}: {}",
                                    company.getCompanyTin(), smsException.getMessage());
                        }
                    } else {
                        log.warn("⚠️ No phone number available for SMS fallback - Company: {}", company.getCompanyTin());
                    }
                }

                return ApiResponse.success(
                        "If an account exists with this identifier, a password reset link has been sent.",
                        "Please check your email for reset instructions. The link will expire in "
                        + resetTokenExpiryHours + " hours.");
            }

            // No account found - return generic success message for security
            log.warn("⚠️ Password reset requested for non-existent identifier: {}", identifier);
            return ApiResponse.success(
                    "If an account exists with this identifier, a password reset link has been sent.",
                    "Please check your email for reset instructions.");

        } catch (Exception e) {
            log.error("❌ Unexpected error in forgot password: {}", e.getMessage(), e);
            // Return generic success message for security
            return ApiResponse.success(
                    "If an account exists with this identifier, a password reset link has been sent.",
                    "Please check your email for reset instructions.");
        }
    }

    @Override
    public ApiResponse<OfficerResponse> updateOfficer(Long officerId, OfficerUpdateRequest request) {
        try {
            Officer officer = officerRepository.findById(officerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Officer not found with ID: " + officerId));

            // Update only non-null fields
            if (request.getNames() != null && !request.getNames().trim().isEmpty()) {
                officer.setNames(request.getNames());
            }

            if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
                officer.setEmail(request.getEmail());
            }

            if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
                officer.setPhoneNumber(request.getPhoneNumber());
            }

            if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
                officer.setPassword(passwordEncoder.encode(request.getPassword()));
            }

            if (request.getOfficerType() != null) {
                officer.setOfficerType(request.getOfficerType());
            }

            Officer updated = officerRepository.save(officer);

            return ApiResponse.success("Officer updated successfully", mapToOfficerResponse(updated));

        } catch (ResourceNotFoundException | InvalidRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update officer: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<TaxProfessionalResponse> reviewApplication(String employeeId, ApplicationReviewRequest request) {
        try {
            log.info("🔍 Processing application review - TPIN: {}, Status: {}", request.getTpin(), request.getStatus());

            // Find officer
            Officer officer = officerRepository.findByEmployeeId(employeeId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Officer not found with employee ID: " + employeeId));

            // Check if officer is activated
            if (!officer.getIsActivated()) {
                throw new InvalidRequestException(
                        "Officer account is not activated. Please complete your registration.");
            }

            // Validate rejection reason if status is REJECTED
            if (request.getStatus() == ApplicationStatus.REJECTED) {
                if (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty()) {
                    throw new InvalidRequestException(
                            "Rejection reason is required when rejecting an application");
                }
                if (request.getRejectionReason().trim().length() < 10) {
                    throw new InvalidRequestException(
                            "Rejection reason must be at least 10 characters long");
                }

                // Validate problematic document IDs if provided
                if (request.getProblematicDocumentIds() != null && !request.getProblematicDocumentIds().isEmpty()) {
                    List<Document> documents = documentRepository.findByTaxProfessionalTpin(request.getTpin());
                    List<Long> validDocumentIds = documents.stream()
                            .map(Document::getDocId)
                            .collect(Collectors.toList());

                    for (Long docId : request.getProblematicDocumentIds()) {
                        if (!validDocumentIds.contains(docId)) {
                            throw new InvalidRequestException(
                                    "Document with ID " + docId + " does not exist or does not belong to TPIN "
                                    + request.getTpin());
                        }
                    }
                }
            }

            // Find application
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(request.getTpin())
                    .orElseThrow(() -> new ResourceNotFoundException(
                    "Application not found with TPIN: " + request.getTpin()));

            // Check if application is already reviewed
            if (taxProfessional.getStatus() != ApplicationStatus.PENDING) {
                log.warn("⚠️ Application {} has already been reviewed (Status: {})",
                        request.getTpin(), taxProfessional.getStatus());
                throw new InvalidRequestException(
                        "Application has already been reviewed with status: " + taxProfessional.getStatus());
            }

            log.info("✅ Validation passed. Proceeding with review...");

            // Update application status and details BEFORE generating PDF (so dates are
            // available)
            taxProfessional.setStatus(request.getStatus());
            taxProfessional.setReviewedBy(officer.getEmployeeId());
            taxProfessional.setReviewedAt(LocalDateTime.now());

            if (request.getStatus() == ApplicationStatus.APPROVED) {
                LocalDateTime approvalDate = LocalDateTime.now();
                taxProfessional.setApprovalDate(approvalDate);
                taxProfessional.setExpiryDate(approvalDate.plusYears(3));

                // Clear rejection fields if previously rejected
                taxProfessional.setRejectionReason(null);

                // Clear manual reset flag after officer reviews the resubmitted application
                taxProfessional.setIsManualReset(false);

                log.info("✅ Application APPROVED - TPIN: {}", request.getTpin());

            } else if (request.getStatus() == ApplicationStatus.REJECTED) {
                taxProfessional.setRejectionReason(request.getRejectionReason());

                // ==================== INCREMENT REJECTION COUNT ====================
                // Get rejection count BEFORE incrementing to determine if this is first rejection
                Integer currentRejectionCount = taxProfessional.getRejectionCount() == null ? 0 : taxProfessional.getRejectionCount();
                
                // Increment rejection count using the helper method from TaxProfessional entity
                taxProfessional.incrementRejectionCount();

                // ==================== AUTOMATIC REJECTION LETTER LOGIC ====================
                // Set firstRejectionDate if this is the first rejection (count was 0 before increment)
                if (currentRejectionCount == 0) {
                    taxProfessional.setFirstRejectionDate(LocalDateTime.now());
                    taxProfessional.setRejectionLetterSent(false);
                    taxProfessional.setRejectionLetterAutoSent(false);
                    log.info("📅 First rejection for TPIN: {} - automatic letter will be sent after 72 hours if not reapplied",
                            request.getTpin());
                } else {
                    // Second or subsequent rejection - letter should be sent immediately by frontend
                    log.info("📄 Second+ rejection for TPIN: {} - rejection letter should be sent immediately",
                            request.getTpin());
                }
                // ========================================================================

                // Reset reapplication flag (if they were reapplying)
                taxProfessional.setIsReapplication(false);

                // Clear manual reset flag after officer reviews the resubmitted application
                taxProfessional.setIsManualReset(false);

                // ==================== CREATE DOCUMENT REJECTION RECORDS ====================
                // Create DocumentRejection records for each problematic document ID
                if (request.getProblematicDocumentIds() != null && !request.getProblematicDocumentIds().isEmpty()) {
                    List<DocumentRejection> documentRejections = new ArrayList<>();
                    for (Long docId : request.getProblematicDocumentIds()) {
                        Document document = documentRepository.findById(docId)
                                .orElseThrow(
                                        () -> new ResourceNotFoundException("Document not found with ID: " + docId));

                        DocumentRejection documentRejection = new DocumentRejection();
                        documentRejection.setTaxProfessional(taxProfessional);
                        documentRejection.setDocument(document);
                        documentRejection.setRejectionDate(LocalDateTime.now());
                        documentRejection.setReviewedBy(officer.getEmployeeId());
                        documentRejections.add(documentRejection);
                    }
                    documentRejectionRepository.saveAll(documentRejections);
                    log.info("📋 Created {} document rejection records for TPIN: {}",
                            documentRejections.size(), request.getTpin());
                }
                // ========================================================================

                log.info("❌ Application REJECTED - TPIN: {}, Rejection count: {}",
                        request.getTpin(), taxProfessional.getRejectionCount());
                // ==================================================================
            }

            // Save the updated application status
            TaxProfessional updatedApplication = taxProfessionalRepository.save(taxProfessional);
            log.info("✅ Application status updated in database - TPIN: {}, Status: {}",
                    request.getTpin(), request.getStatus());

            // ==================== AUTO-GENERATE REJECTION PDF ====================
            // For rejections, automatically generate the rejection letter PDF with correct message
            // This ensures taxprofessionals always get the correct rejection message when they download
            if (request.getStatus() == ApplicationStatus.REJECTED) {
                log.info("🔄 Auto-generating rejection letter PDF for TPIN: {} (rejectionCount: {})", 
                        request.getTpin(), updatedApplication.getRejectionCount());
                
                try {
                    // Generate rejection letter with current rejectionCount
                    byte[] pdfBytes = certificatePdfService.generateRejectionLetter(
                            updatedApplication, 
                            officer, 
                            request.getRejectionReason()
                    );
                    
                    // Save the PDF to filesystem
                    String certificatePath = saveCertificatePdf(pdfBytes, updatedApplication, false);
                    updatedApplication.setCertificateFilePath(certificatePath);
                    updatedApplication = taxProfessionalRepository.save(updatedApplication);
                    
                    log.info("✅ Rejection letter PDF auto-generated and saved for TPIN: {}", request.getTpin());
                    
                } catch (Exception e) {
                    log.error("❌ Failed to auto-generate rejection letter PDF for TPIN {}: {}", 
                            request.getTpin(), e.getMessage(), e);
                    // Don't fail the whole operation if PDF generation fails
                    // Officer can manually regenerate using frontend
                }
            }
            // ====================================================================

            // Success - status updated, awaiting certificate upload from frontend
            log.info("🎉 Application review completed successfully - TPIN: {}, Status: {}",
                    request.getTpin(), request.getStatus());

            String message = request.getStatus() == ApplicationStatus.APPROVED
                    ? "Application approved successfully. Please upload the certificate to send it to the applicant."
                    : "Application rejected successfully. Rejection details have been saved.";

            return ApiResponse.success(message, mapToTaxProfessionalResponse(updatedApplication));

        } catch (ResourceNotFoundException | InvalidRequestException | FileStorageException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Unexpected error during application review: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to review application: " + e.getMessage(), e);
        }
    }

    /**
     * Save certificate PDF to filesystem
     *
     * @param pdfBytes PDF content as byte array
     * @param taxProfessional The tax professional entity
     * @param isApproval true for approval certificate, false for rejection
     * letter
     * @return relative file path for database storage
     */
    private String saveCertificatePdf(byte[] pdfBytes, TaxProfessional taxProfessional, boolean isApproval) {
        // Use company TIN for company members, otherwise use the member's TPIN
        String folderIdentifier;
        if (taxProfessional.getCompanyId() != null && taxProfessional.getTinCompany() != null) {
            // Company member - use company TIN
            folderIdentifier = taxProfessional.getTinCompany();
            log.info("📁 Using company TIN {} for certificate storage (member TPIN: {})",
                    folderIdentifier, taxProfessional.getTpin());
        } else {
            // Individual - use their TPIN
            folderIdentifier = taxProfessional.getTpin();
        }

        try {
            // Create certificates directory structure: uploads/certificates/{tin}/
            String certificateDir = "certificates/" + folderIdentifier;
            Path certificatePath = Paths.get(uploadDir, certificateDir).toAbsolutePath().normalize();
            Files.createDirectories(certificatePath);

            // Generate filename based on approval/rejection
            // For company members, include their TPIN in the filename to distinguish between members
            String filename;
            if (taxProfessional.getCompanyId() != null && taxProfessional.getTinCompany() != null) {
                // Company member - include TPIN in filename
                String memberTpin = taxProfessional.getTpin();
                filename = isApproval 
                    ? memberTpin + "_approval_certificate.pdf" 
                    : memberTpin + "_rejection_letter.pdf";
                log.info("📁 Using member-specific filename: {} for company member TPIN: {}", filename, memberTpin);
            } else {
                // Individual - use standard filename
                filename = isApproval ? "approval_certificate.pdf" : "rejection_letter.pdf";
            }
            Path targetLocation = certificatePath.resolve(filename);

            // Save PDF bytes to file
            Files.copy(new ByteArrayInputStream(pdfBytes), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path for database storage
            String relativePath = certificateDir + "/" + filename;
            log.info("✅ Certificate PDF saved successfully: {}", relativePath);

            return relativePath;

        } catch (IOException e) {
            log.error("❌ Failed to save certificate PDF for identifier {}: {}", folderIdentifier, e.getMessage(), e);
            throw new RuntimeException("Failed to save certificate PDF: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<List<TaxProfessionalResponse>> getApplicationsReviewedByOfficer(String employeeId) {
        try {
            if (!officerRepository.existsByEmployeeId(employeeId)) {
                throw new ResourceNotFoundException("Officer not found with employee ID: " + employeeId);
            }

            List<TaxProfessional> applications = taxProfessionalRepository.findAll().stream()
                    .filter(app -> employeeId.equals(app.getReviewedBy()))
                    .collect(Collectors.toList());

            List<TaxProfessionalResponse> responses = applications.stream()
                    .map(this::mapToTaxProfessionalResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Applications retrieved successfully", responses);

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch applications: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<List<TaxProfessionalResponse>> getApplicationsByStatusAndOfficer(
            ApplicationStatus status, String employeeId) {
        try {
            if (!officerRepository.existsByEmployeeId(employeeId)) {
                throw new ResourceNotFoundException("Officer not found with employee ID: " + employeeId);
            }

            List<TaxProfessional> applications = taxProfessionalRepository.findByStatusAndReviewedBy(status,
                    employeeId);

            List<TaxProfessionalResponse> responses = applications.stream()
                    .map(this::mapToTaxProfessionalResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Applications retrieved successfully", responses);

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch applications: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<List<TaxProfessionalResponse>> getAllApplications() {
        try {
            List<TaxProfessional> applications = taxProfessionalRepository.findAll();

            List<TaxProfessionalResponse> responses = applications.stream()
                    .map(this::mapToTaxProfessionalResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("All applications retrieved successfully", responses);

        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch applications: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<List<TaxProfessionalResponse>> getApplicationsByOfficer(String employeeId) {
        try {
            if (!officerRepository.existsByEmployeeId(employeeId)) {
                throw new ResourceNotFoundException("Officer not found with employee ID: " + employeeId);
            }

            List<TaxProfessional> applications = taxProfessionalRepository.findAll().stream()
                    .filter(app -> employeeId.equals(app.getReviewedBy()))
                    .collect(Collectors.toList());

            List<TaxProfessionalResponse> responses = applications.stream()
                    .map(this::mapToTaxProfessionalResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Applications by officer retrieved successfully", responses);

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch applications: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<List<TaxProfessionalResponse>> getApplicationsByStatus(ApplicationStatus status) {
        try {
            List<TaxProfessional> applications = taxProfessionalRepository.findByStatus(status);

            List<TaxProfessionalResponse> responses = applications.stream()
                    .map(this::mapToTaxProfessionalResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Applications by status retrieved successfully", responses);

        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch applications: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<OfficerResponse> getOfficerByEmployeeId(String employeeId) {
        try {
            Officer officer = officerRepository.findByEmployeeId(employeeId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Officer not found with employee ID: " + employeeId));

            return ApiResponse.success("Officer retrieved successfully", mapToOfficerResponse(officer));

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch officer: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<List<OfficerResponse>> getAllOfficers() {
        try {
            List<Officer> officers = officerRepository.findAll();
            List<OfficerResponse> responses = officers.stream()
                    .map(this::mapToOfficerResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Officers retrieved successfully", responses);

        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch officers: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<String> deleteOfficer(Long officerId) {
        try {
            Officer officer = officerRepository.findById(officerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Officer not found with ID: " + officerId));

            officerRepository.delete(officer);

            return ApiResponse.success("Officer deleted successfully", "Officer ID: " + officerId);

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete officer: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<String> resetOfficerPassword(Long officerId, String newPassword) {
        try {
            Officer officer = officerRepository.findById(officerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Officer not found with ID: " + officerId));

            // Set new password
            officer.setPassword(passwordEncoder.encode(newPassword));

            // If officer was inactive (pending invitation), activate them
            if (!officer.getIsActivated()) {
                officer.setIsActivated(true);
                officer.setActivatedAt(LocalDateTime.now());
                // Clear invitation token if exists
                officer.setInvitationToken(null);
                officer.setTokenExpiry(null);
            }

            officerRepository.save(officer);

            return ApiResponse.success(
                    "Password reset successfully for officer: " + officer.getEmployeeId(),
                    "Officer can now login with the new password");

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to reset password: " + e.getMessage(), e);
        }
    }

    private OfficerResponse mapToOfficerResponse(Officer officer) {
        OfficerResponse response = new OfficerResponse();
        response.setOfficerId(officer.getOfficerId());
        response.setEmployeeId(officer.getEmployeeId());
        response.setEmail(officer.getEmail());
        response.setPhoneNumber(officer.getPhoneNumber());
        response.setNames(officer.getNames());
        response.setDepartment(officer.getDepartment());
        response.setOfficerType(officer.getOfficerType());
        response.setIsActivated(officer.getIsActivated());
        return response;
    }

    private TaxProfessionalResponse mapToTaxProfessionalResponse(TaxProfessional tp) {
        TaxProfessionalResponse response = new TaxProfessionalResponse();
        response.setTpin(tp.getTpin());
        response.setTinCompany(tp.getTinCompany());
        response.setCompanyName(tp.getCompanyName());
        response.setNid(tp.getNid());
        response.setFullName(tp.getFullName());
        response.setPhoneNumber(tp.getPhoneNumber());
        response.setBusinessStatus(tp.getBusinessStatus());
        response.setBachelorDegree(tp.getBachelorDegree());
        response.setMastersDegree(tp.getMastersDegree());
        response.setProfessionalQualification(tp.getProfessionalQualification());
        response.setOtherProfessionalDetails(tp.getOtherProfessionalDetails());
        response.setApplicationDate(tp.getApplicationDate());
        response.setStatus(tp.getStatus());
        response.setReviewedBy(tp.getReviewedBy());
        response.setReviewedAt(tp.getReviewedAt());
        response.setApprovalDate(tp.getApprovalDate());
        response.setExpiryDate(tp.getExpiryDate());
        response.setRejectionReason(tp.getRejectionReason());
        response.setCertificateFilePath(tp.getCertificateFilePath());

        // ==================== REAPPLICATION FIELDS ====================
        response.setPreviousRejectionReason(tp.getPreviousRejectionReason());
        response.setPreviousReviewedBy(tp.getPreviousReviewedBy());
        response.setPreviousReviewedAt(tp.getPreviousReviewedAt());
        // Ensure rejectionCount defaults to 0 if null
        response.setRejectionCount(tp.getRejectionCount() != null ? tp.getRejectionCount() : 0);
        response.setReapplicationDate(tp.getReapplicationDate());
        response.setIsReapplication(tp.getIsReapplication());
        // hasReapplied should only be true if they've actually resubmitted
        // (isReapplication == true)
        // NOT just because they've been rejected (rejectionCount > 0)
        Boolean hasReapplied = (tp.getIsReapplication() != null && tp.getIsReapplication());
        response.setHasReapplied(hasReapplied);
        
        // ==================== RESUBMISSION DEADLINE FIELDS ====================
        response.setFirstRejectionDate(tp.getFirstRejectionDate());
        response.setResubmissionDeadline(tp.calculateResubmissionDeadline());
        // ======================================================================
        // ==============================================================

        // ==================== MANUAL RESET FIELDS ====================
        response.setIsManualReset(tp.getIsManualReset());
        response.setManualResetDate(tp.getManualResetDate());
        response.setManualResetBy(tp.getManualResetBy());
        response.setManualResetReason(tp.getManualResetReason());
        response.setManualResetCount(tp.getManualResetCount());
        response.setRejectionCountAtReset(tp.getRejectionCountAtReset());
        // =============================================================

        // ==================== COMPANY ACCOUNT FIELDS ====================
        // Check if this is a company member
        if (tp.getCompanyId() != null) {
            response.setAccountType("COMPANY");
            response.setCompanyId(tp.getCompanyId());

            // Fetch company to get company email
            try {
                Company company = companyRepository.findById(tp.getCompanyId()).orElse(null);
                if (company != null) {
                    response.setCompanyEmail(company.getCompanyEmail());
                    response.setCompanyName(company.getCompanyName());
                    // Use company email if individual email is null
                    response.setEmail(company.getCompanyEmail());
                } else {
                    // Company not found, use individual email if available
                    response.setEmail(tp.getEmail());
                }
            } catch (Exception e) {
                log.warn("Failed to fetch company for TPIN {}: {}", tp.getTpin(), e.getMessage());
                // Fallback to individual email if available
                response.setEmail(tp.getEmail());
            }
        } else {
            // Individual account
            response.setAccountType("INDIVIDUAL");
            response.setEmail(tp.getEmail());
        }
        // ==============================================================

        // ==================== DOCUMENT REJECTION FIELDS ====================
        // Populate problematicDocumentIds when status is REJECTED
        if (tp.getStatus() == ApplicationStatus.REJECTED) {
            List<DocumentRejection> documentRejections = documentRejectionRepository
                    .findByTaxProfessionalTpin(tp.getTpin());
            List<Long> problematicDocumentIds = documentRejections.stream()
                    .map(dr -> dr.getDocument().getDocId())
                    .collect(Collectors.toList());
            response.setProblematicDocumentIds(problematicDocumentIds);
        }
        // ====================================================================

        // Build work address from string locations
        LocationResponse workAddress = new LocationResponse();
        StringBuilder addressBuilder = new StringBuilder();
        
        if (tp.getProvince() != null && !tp.getProvince().trim().isEmpty()) {
            addressBuilder.append(tp.getProvince());
        }
        if (tp.getDistrict() != null && !tp.getDistrict().trim().isEmpty()) {
            if (addressBuilder.length() > 0) addressBuilder.append(", ");
            addressBuilder.append(tp.getDistrict());
        }
        if (tp.getSector() != null && !tp.getSector().trim().isEmpty()) {
            if (addressBuilder.length() > 0) addressBuilder.append(", ");
            addressBuilder.append(tp.getSector());
        }
        if (tp.getCell() != null && !tp.getCell().trim().isEmpty()) {
            if (addressBuilder.length() > 0) addressBuilder.append(", ");
            addressBuilder.append(tp.getCell());
        }
        if (tp.getVillage() != null && !tp.getVillage().trim().isEmpty()) {
            if (addressBuilder.length() > 0) addressBuilder.append(", ");
            addressBuilder.append(tp.getVillage());
        }
        
        if (addressBuilder.length() > 0) {
            workAddress.setName(addressBuilder.toString());
        }
        response.setWorkAddress(workAddress);

        return response;
    }
}
