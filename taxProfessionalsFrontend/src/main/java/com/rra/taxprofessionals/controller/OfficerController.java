package com.rra.taxprofessionals.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.ApplicationReviewRequest;
import com.rra.taxprofessionals.dto.OfficerResponse;
import com.rra.taxprofessionals.dto.TaxProfessionalResponse;
import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.exception.InvalidRequestException;
import com.rra.taxprofessionals.exception.ResourceNotFoundException;
import com.rra.taxprofessionals.model.Company;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.CompanyRepository;
import com.rra.taxprofessionals.repository.TaxProfessionalRepository;
import com.rra.taxprofessionals.service.EmailService;
import com.rra.taxprofessionals.service.OfficerService;
import com.rra.taxprofessionals.service.TaxProfessionalService;

import lombok.extern.slf4j.Slf4j;

import jakarta.validation.Valid;

@Slf4j
@RestController
@RequestMapping("/api/officer")
public class OfficerController {

    @Autowired
    private OfficerService officerService;

    @Autowired
    private TaxProfessionalService taxProfessionalService;

    @Autowired
    private TaxProfessionalRepository taxProfessionalRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private EmailService emailService;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @PostMapping("/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<TaxProfessionalResponse>> reviewApplication(
            Authentication authentication,
            @Valid @RequestBody ApplicationReviewRequest request) {
        String employeeId = authentication.getName();
        ApiResponse<TaxProfessionalResponse> response = officerService.reviewApplication(employeeId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<TaxProfessionalResponse>> reviewApplicationPut(
            Authentication authentication,
            @Valid @RequestBody ApplicationReviewRequest request) {
        String employeeId = authentication.getName();
        ApiResponse<TaxProfessionalResponse> response = officerService.reviewApplication(employeeId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-reviews")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<TaxProfessionalResponse>>> getMyReviews(
            Authentication authentication) {
        String employeeId = authentication.getName();
        ApiResponse<List<TaxProfessionalResponse>> response = officerService
                .getApplicationsReviewedByOfficer(employeeId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-reviews/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<TaxProfessionalResponse>>> getMyReviewsByStatus(
            Authentication authentication,
            @PathVariable ApplicationStatus status) {
        String employeeId = authentication.getName();
        ApiResponse<List<TaxProfessionalResponse>> response = officerService.getApplicationsByStatusAndOfficer(status,
                employeeId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<OfficerResponse>> getProfile(Authentication authentication) {
        String employeeId = authentication.getName();
        ApiResponse<OfficerResponse> response = officerService.getOfficerByEmployeeId(employeeId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/applications")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<TaxProfessionalResponse>>> getAllApplications() {
        ApiResponse<List<TaxProfessionalResponse>> response = officerService.getAllApplications();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/taxprofessionals/applications")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<TaxProfessionalResponse>>> getAllApplicationsAlternative() {
        ApiResponse<List<TaxProfessionalResponse>> response = officerService.getAllApplications();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/certificate/{tpin}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<?> downloadCertificateForApplicant(@PathVariable String tpin) {
        try {
            // Officers can download any approved applicant's certificate
            ApiResponse<Resource> response = taxProfessionalService.getCertificateByTpin(tpin);

            if (response == null || response.getData() == null) {
                return ResponseEntity.status(404)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(ApiResponse.error("Certificate not found"));
            }

            Resource resource = response.getData();

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.status(404)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(ApiResponse.error("Certificate file is not accessible"));
            }

            String filename = "Tax_Professional_Certificate_" + tpin + ".pdf";

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(404)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (InvalidRequestException e) {
            return ResponseEntity.status(403)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("[Officer Certificate Download Error] Unexpected error for TPIN " + tpin + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error("Failed to download certificate: " + e.getMessage()));
        }
    }

    @PostMapping("/upload-certificate/{tpin}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<String>> uploadCertificate(
            @PathVariable String tpin,
            @RequestParam("file") MultipartFile file) {
        try {
            log.info("📥 Receiving certificate upload for TPIN: {}", tpin);
            
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("No file provided"));
            }
            
            if (!"application/pdf".equals(file.getContentType())) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("Only PDF files are allowed"));
            }
            
            // Get tax professional
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin)
                    .orElseThrow(() -> new ResourceNotFoundException("Tax professional not found with TPIN: " + tpin));
            
            // Determine folder identifier
            String folderIdentifier;
            if (taxProfessional.getCompanyId() != null && taxProfessional.getTinCompany() != null) {
                folderIdentifier = taxProfessional.getTinCompany();
                log.debug("📁 Using company TIN {} for certificate storage (member TPIN: {})", 
                        folderIdentifier, tpin);
            } else {
                folderIdentifier = tpin;
            }
            
            // Create directory structure
            String certificateDir = "certificates/" + folderIdentifier;
            Path certificatePath = Paths.get(uploadDir, certificateDir).toAbsolutePath().normalize();
            Files.createDirectories(certificatePath);
            
            // Save file
            String filename = taxProfessional.getStatus() == ApplicationStatus.APPROVED 
                    ? "approval_certificate.pdf" 
                    : "rejection_letter.pdf";
            Path targetLocation = certificatePath.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            // Update database
            String relativePath = certificateDir + "/" + filename;
            taxProfessional.setCertificateFilePath(relativePath);
            taxProfessionalRepository.save(taxProfessional);
            
            log.info("✅ Certificate uploaded successfully: {}", relativePath);
            
            // Send email with the uploaded PDF
            if (taxProfessional.getStatus() == ApplicationStatus.APPROVED || 
                taxProfessional.getStatus() == ApplicationStatus.REJECTED) {
                try {
                    // Determine recipient email: use company email for company members, individual email for others
                    String recipientEmail;
                    String recipientName;
                    
                    if (taxProfessional.getCompanyId() != null) {
                        // Company member - send to company email
                        Company company = companyRepository.findById(taxProfessional.getCompanyId())
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                        recipientEmail = company.getCompanyEmail();
                        recipientName = company.getCompanyName();
                        log.info("📧 Sending to company email: {} for member: {}", recipientEmail, taxProfessional.getFullName());
                    } else {
                        // Individual account
                        recipientEmail = taxProfessional.getEmail();
                        recipientName = taxProfessional.getFullName();
                        log.info("📧 Sending to individual email: {}", recipientEmail);
                    }
                    
                    byte[] pdfBytes = file.getBytes();
                    
                    if (taxProfessional.getStatus() == ApplicationStatus.APPROVED) {
                        emailService.sendApprovalEmailWithCertificate(
                                recipientEmail,
                                recipientName,
                                pdfBytes
                        );
                        log.info("✅ Approval email sent successfully to: {}", recipientEmail);
                    } else {
                        // REJECTED - send rejection email with problematic documents
                        emailService.sendRejectionEmailWithLetter(
                                recipientEmail,
                                recipientName,
                                tpin,
                                pdfBytes
                        );
                        log.info("✅ Rejection email sent successfully to: {}", recipientEmail);
                    }
                } catch (IOException e) {
                    log.error("❌ Failed to send email with certificate: {}", e.getMessage(), e);
                    // Don't fail the upload if email fails
                } catch (Exception e) {
                    log.error("❌ Failed to send email with certificate: {}", e.getMessage(), e);
                    // Don't fail the upload if email fails
                }
            }
            
            return ResponseEntity.ok(ApiResponse.success(
                    "Certificate uploaded successfully and email sent", 
                    relativePath));
            
        } catch (ResourceNotFoundException e) {
            log.error("❌ Tax professional not found: {}", e.getMessage());
            return ResponseEntity.status(404)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (IOException e) {
            log.error("❌ Error uploading certificate: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to upload certificate: " + e.getMessage()));
        } catch (Exception e) {
            log.error("❌ Unexpected error uploading certificate: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to upload certificate: " + e.getMessage()));
        }
    }
}
