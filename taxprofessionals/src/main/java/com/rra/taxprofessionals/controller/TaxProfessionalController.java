package com.rra.taxprofessionals.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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

import com.rra.taxprofessionals.dto.AddCompanyMemberRequest;
import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.ApplicationReviewRequest;
import com.rra.taxprofessionals.dto.CompanyRegistrationRequest;
import com.rra.taxprofessionals.dto.ProfessionalQualificationRequest;
import com.rra.taxprofessionals.dto.RegistrationRequest;
import com.rra.taxprofessionals.dto.SignupTypeRequest;
import com.rra.taxprofessionals.dto.TaxProfessionalResponse;
import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.exception.InvalidRequestException;
import com.rra.taxprofessionals.exception.ResourceNotFoundException;
import com.rra.taxprofessionals.service.CompanyService;
import com.rra.taxprofessionals.service.ExternalSupplierService;
import com.rra.taxprofessionals.service.OfficerService;
import com.rra.taxprofessionals.service.TaxProfessionalService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/taxprofessionals")
public class TaxProfessionalController {

    @Autowired
    private TaxProfessionalService taxProfessionalService;

    @Autowired
    private OfficerService officerService;

    @Autowired
    private CompanyService companyService;

    @Autowired
    private ExternalSupplierService externalSupplierService;

    /**
     * Fetch supplier details from external API by TIN
     * This endpoint proxies requests to the external supplier service
     * Public endpoint - used for TIN validation during registration
     */
    @GetMapping("/v1/tp/suppliers_wsp/{tin}")
    public ResponseEntity<ApiResponse<Object>> getSupplierFromExternalApi(
            @PathVariable String tin) {
        ApiResponse<Object> response = externalSupplierService.getSupplierByTin(tin);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<TaxProfessionalResponse>> registerIndividual(
            @Valid @RequestBody RegistrationRequest request) {
        ApiResponse<TaxProfessionalResponse> response = taxProfessionalService.registerIndividual(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup-type")
    public ResponseEntity<ApiResponse<String>> determineSignupType(
            @Valid @RequestBody SignupTypeRequest request) {
        ApiResponse<String> response = taxProfessionalService.determineSignupType(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/qualifications/{tpin}")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<TaxProfessionalResponse>> updateQualifications(
            @PathVariable String tpin,
            @Valid @RequestBody ProfessionalQualificationRequest request) {
        ApiResponse<TaxProfessionalResponse> response = taxProfessionalService.updateProfessionalQualifications(tpin, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register-company")
    public ResponseEntity<ApiResponse<List<TaxProfessionalResponse>>> registerCompany(
            @Valid @RequestBody CompanyRegistrationRequest request) {
        ApiResponse<List<TaxProfessionalResponse>> response = taxProfessionalService.registerCompany(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/company/{companyTin}/add-member")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<TaxProfessionalResponse>> addCompanyMember(
            @PathVariable String companyTin,
            @Valid @RequestBody AddCompanyMemberRequest request,
            Authentication authentication) {
        // Get company by TIN to get companyId
        com.rra.taxprofessionals.model.Company company = companyService.getCompanyByTin(companyTin);
        
        String adminTpin = authentication.getName();
        ApiResponse<TaxProfessionalResponse> response = companyService.addCompanyMember(company.getCompanyId(), request, adminTpin);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/application/tpin/{tpin}")
    @PreAuthorize("hasAnyRole('TAXPROFESSIONAL', 'ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<TaxProfessionalResponse>> getApplicationByTpin(
            @PathVariable String tpin) {
        ApiResponse<TaxProfessionalResponse> response = taxProfessionalService.getApplicationByTpin(tpin);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/application/tin/{tin}")
    @PreAuthorize("hasAnyRole('TAXPROFESSIONAL', 'ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<TaxProfessionalResponse>> getApplicationByTin(
            @PathVariable String tin) {
        ApiResponse<TaxProfessionalResponse> response = taxProfessionalService.getApplicationByTin(tin);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/applications")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<TaxProfessionalResponse>>> getAllApplications() {
        ApiResponse<List<TaxProfessionalResponse>> response = taxProfessionalService.getAllApplications();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/applications/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<TaxProfessionalResponse>>> getApplicationsByStatus(
            @PathVariable ApplicationStatus status) {
        ApiResponse<List<TaxProfessionalResponse>> response = taxProfessionalService.getApplicationsByStatus(status);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/upload-other-professional/{tpin}")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<String>> uploadOtherProfessionalDocument(
            @PathVariable String tpin,
            @RequestParam("file") MultipartFile file) {
        ApiResponse<String> response = taxProfessionalService.uploadOtherProfessionalDocument(tpin, file);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<TaxProfessionalResponse>> reviewApplication(
            Authentication authentication,
            @Valid @RequestBody ApplicationReviewRequest request) {
        String employeeId = authentication.getName();
        ApiResponse<TaxProfessionalResponse> response = officerService.reviewApplication(employeeId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<TaxProfessionalResponse>> getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        
        // Handle COMPANY format: COMPANY:{companyId} or COMPANY:{companyId}:{adminTpin}
        String identifier;
        if (username.startsWith("COMPANY:")) {
            String[] parts = username.split(":");
            if (parts.length >= 3) {
                // Has admin TPIN - use admin TPIN
                identifier = parts[2];
            } else if (parts.length >= 2) {
                // No admin member - use companyId (service will handle this)
                identifier = parts[1];
            } else {
                identifier = username;
            }
        } else {
            // Individual account or admin TPIN
            identifier = username;
        }
        
        ApiResponse<TaxProfessionalResponse> response = taxProfessionalService.getCurrentUser(identifier);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/certificate/{tpin}")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<?> downloadCertificate(
            @PathVariable String tpin,
            Authentication authentication) {
        try {
            String authenticatedTpin = authentication.getName();
            System.out.println("🔍 [Certificate Download] Request - TPIN: " + tpin + ", Authenticated User: " + authenticatedTpin);

            ApiResponse<Resource> response = taxProfessionalService.downloadCertificate(tpin, authenticatedTpin);

            if (response == null || response.getData() == null) {
                System.err.println("❌ [Certificate Download] Response or data is null for TPIN: " + tpin);
                return ResponseEntity.status(404)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(ApiResponse.error("Certificate not found"));
            }

            Resource resource = response.getData();

            if (!resource.exists() || !resource.isReadable()) {
                System.err.println("❌ [Certificate Download] Resource not accessible for TPIN: " + tpin);
                return ResponseEntity.status(404)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(ApiResponse.error("Certificate file is not accessible"));
            }

            String filename = "certificate_" + tpin + ".pdf";
            System.out.println("✅ [Certificate Download] Successful for TPIN: " + tpin);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (ResourceNotFoundException e) {
            System.err.println("❌ [Certificate Download] ResourceNotFoundException for TPIN " + tpin + ": " + e.getMessage());
            return ResponseEntity.status(404)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (InvalidRequestException e) {
            System.err.println("❌ [Certificate Download] InvalidRequestException for TPIN " + tpin + ": " + e.getMessage());
            return ResponseEntity.status(403)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ [Certificate Download] Unexpected error for TPIN " + tpin + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error("Failed to download certificate: " + e.getMessage()));
        }
    }
}
