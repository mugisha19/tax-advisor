package com.rra.taxprofessionals.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rra.taxprofessionals.dto.AdminPasswordResetRequest;
import com.rra.taxprofessionals.dto.AdminPasswordResetResponse;
import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.OfficerCreationRequest;
import com.rra.taxprofessionals.dto.OfficerResponse;
import com.rra.taxprofessionals.dto.OfficerUpdateRequest;
import com.rra.taxprofessionals.dto.TaxProfessionalResponse;
import com.rra.taxprofessionals.dto.UserManagementDTO;
import com.rra.taxprofessionals.dto.UserUpdateRequest;
import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.exception.ResourceNotFoundException;
import com.rra.taxprofessionals.model.Officer;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.OfficerRepository;
import com.rra.taxprofessionals.repository.TaxProfessionalRepository;
import com.rra.taxprofessionals.service.CertificatePdfService;
import com.rra.taxprofessionals.service.EmailService;
import com.rra.taxprofessionals.service.OfficerService;
import com.rra.taxprofessionals.service.UserManagementService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private OfficerService officerService;

    @Autowired
    private TaxProfessionalRepository taxProfessionalRepository;

    @Autowired
    private OfficerRepository officerRepository;

    @Autowired
    private CertificatePdfService certificatePdfService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserManagementService userManagementService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    // ==================== USER MANAGEMENT ENDPOINTS ====================
    
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<UserManagementDTO>>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean hasSubmittedDocuments,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<UserManagementDTO> users = userManagementService.getAllUsers(search, type, hasSubmittedDocuments, page, size);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserManagementDTO>> getUserById(
            @PathVariable String id,
            @RequestParam String type
    ) {
        UserManagementDTO user = userManagementService.getUserById(id, type);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", user));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserManagementDTO>> updateUser(
            @PathVariable String id,
            @RequestParam String type,
            @RequestBody UserUpdateRequest request
    ) {
        UserManagementDTO user = userManagementService.updateUser(id, type, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", user));
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<ApiResponse<AdminPasswordResetResponse>> resetUserPassword(
            @PathVariable String id,
            @RequestParam String type
    ) {
        AdminPasswordResetResponse response = userManagementService.resetUserPassword(id, type);
        return ResponseEntity.ok(ApiResponse.success("Password reset link generated", response));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable String id,
            @RequestParam String type
    ) {
        userManagementService.deleteUser(id, type);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    // ==================== OFFICER MANAGEMENT ENDPOINTS ====================

    @PostMapping("/officers")
    public ResponseEntity<ApiResponse<OfficerResponse>> createOfficer(
            @Valid @RequestBody OfficerCreationRequest request) {
        ApiResponse<OfficerResponse> response = officerService.createOfficer(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/officers/{officerId}")
    public ResponseEntity<ApiResponse<OfficerResponse>> updateOfficer(
            @PathVariable Long officerId,
            @Valid @RequestBody OfficerUpdateRequest request) {
        ApiResponse<OfficerResponse> response = officerService.updateOfficer(officerId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/officers/{officerId}/password")
    public ResponseEntity<ApiResponse<String>> resetOfficerPassword(
            @PathVariable Long officerId,
            @Valid @RequestBody AdminPasswordResetRequest request) {
        ApiResponse<String> response = officerService.resetOfficerPassword(officerId, request.getNewPassword());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/officers")
    public ResponseEntity<ApiResponse<List<OfficerResponse>>> getAllOfficers() {
        ApiResponse<List<OfficerResponse>> response = officerService.getAllOfficers();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/officers/{employeeId}")
    public ResponseEntity<ApiResponse<OfficerResponse>> getOfficerByEmployeeId(
            @PathVariable String employeeId) {
        ApiResponse<OfficerResponse> response = officerService.getOfficerByEmployeeId(employeeId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/officers/{officerId}")
    public ResponseEntity<ApiResponse<String>> deleteOfficer(@PathVariable Long officerId) {
        ApiResponse<String> response = officerService.deleteOfficer(officerId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/applications")
    public ResponseEntity<ApiResponse<List<TaxProfessionalResponse>>> getAllApplications() {
        ApiResponse<List<TaxProfessionalResponse>> response = officerService.getAllApplications();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/applications/officer/{employeeId}")
    public ResponseEntity<ApiResponse<List<TaxProfessionalResponse>>> getApplicationsByOfficer(
            @PathVariable String employeeId) {
        ApiResponse<List<TaxProfessionalResponse>> response = officerService.getApplicationsByOfficer(employeeId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/applications/status/{status}")
    public ResponseEntity<ApiResponse<List<TaxProfessionalResponse>>> getApplicationsByStatus(
            @PathVariable ApplicationStatus status) {
        ApiResponse<List<TaxProfessionalResponse>> response = officerService.getApplicationsByStatus(status);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/applications/officer/{employeeId}/status/{status}")
    public ResponseEntity<ApiResponse<List<TaxProfessionalResponse>>> getApplicationsByStatusAndOfficer(
            @PathVariable String employeeId,
            @PathVariable ApplicationStatus status) {
        ApiResponse<List<TaxProfessionalResponse>> response = officerService.getApplicationsByStatusAndOfficer(status,
                employeeId);
        return ResponseEntity.ok(response);
    }

    /**
     * TEMPORARY ADMIN ENDPOINT: Manually generate/regenerate certificate for an approved application
     * This is useful when a certificate is missing due to frontend upload failure
     * 
     * @param tpin The TPIN of the tax professional
     * @return Success message with certificate path
     */
    @PostMapping("/regenerate-certificate/{tpin}")
    public ResponseEntity<ApiResponse<String>> regenerateCertificate(@PathVariable String tpin) {
        try {
            log.info("🔧 [Admin] Manual certificate regeneration requested for TPIN: {}", tpin);

            // Fetch the tax professional
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin)
                    .orElseThrow(() -> new ResourceNotFoundException("Tax professional not found with TPIN: " + tpin));

            // Check if approved
            if (taxProfessional.getStatus() != ApplicationStatus.APPROVED) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Application is not approved. Current status: " + taxProfessional.getStatus()));
            }

            // Get the reviewing officer
            String reviewedByEmployeeId = taxProfessional.getReviewedBy();
            if (reviewedByEmployeeId == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("No reviewer information found. Cannot generate certificate."));
            }

            Officer officer = officerRepository.findByEmployeeId(reviewedByEmployeeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Reviewer officer not found: " + reviewedByEmployeeId));

            // Generate the certificate
            log.info("📄 Generating approval certificate for TPIN: {}", tpin);
            byte[] pdfDocument = certificatePdfService.generateApprovalCertificate(taxProfessional, officer);

            // Determine folder identifier: use company TIN for company members, TPIN for individuals
            String folderIdentifier;
            if (taxProfessional.getCompanyId() != null && taxProfessional.getTinCompany() != null) {
                folderIdentifier = taxProfessional.getTinCompany();
                log.info("📁 Using company TIN {} for certificate storage (member TPIN: {})", 
                        folderIdentifier, tpin);
            } else {
                folderIdentifier = tpin;
            }

            // Create certificates directory
            String certificateDir = "certificates/" + folderIdentifier;
            Path certificatePath = Paths.get(uploadDir, certificateDir).toAbsolutePath().normalize();
            Files.createDirectories(certificatePath);

            // Save the PDF
            String filename = "approval_certificate.pdf";
            Path targetLocation = certificatePath.resolve(filename);
            Files.write(targetLocation, pdfDocument);

            // Update database
            String relativePath = certificateDir + "/" + filename;
            taxProfessional.setCertificateFilePath(relativePath);
            taxProfessionalRepository.save(taxProfessional);

            log.info("✅ Certificate generated and saved successfully: {}", relativePath);

            // Send email with certificate
            String emailResult = "Email not sent";
            try {
                String recipientEmail = taxProfessional.getEmail();
                String recipientName = taxProfessional.getFullName();
                
                log.info("📧 Sending approval email with certificate to: {}", recipientEmail);
                emailService.sendApprovalEmailWithCertificate(recipientEmail, recipientName, pdfDocument);
                emailResult = "Email sent successfully to " + recipientEmail;
                log.info("✅ " + emailResult);
            } catch (Exception emailEx) {
                log.error("❌ Failed to send email: {}", emailEx.getMessage(), emailEx);
                emailResult = "Email sending failed: " + emailEx.getMessage();
            }

            return ResponseEntity.ok(ApiResponse.success(
                    "Certificate generated successfully", 
                    "Certificate saved to: " + relativePath + 
                    " (File size: " + pdfDocument.length + " bytes). " + emailResult));

        } catch (ResourceNotFoundException e) {
            log.error("❌ Resource not found: {}", e.getMessage());
            return ResponseEntity.status(404).body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Failed to regenerate certificate for TPIN {}: {}", tpin, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to generate certificate: " + e.getMessage()));
        }
    }
}
