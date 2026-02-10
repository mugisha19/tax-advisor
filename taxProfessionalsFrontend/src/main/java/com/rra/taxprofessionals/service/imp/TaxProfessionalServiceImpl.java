package com.rra.taxprofessionals.service.imp;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.rra.taxprofessionals.dto.AddCompanyMemberRequest;
import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.CompanyMemberResponse;
import com.rra.taxprofessionals.dto.CompanyRegistrationRequest;
import com.rra.taxprofessionals.dto.LocationResponse;
import com.rra.taxprofessionals.dto.ProfessionalQualificationRequest;
import com.rra.taxprofessionals.dto.RegistrationRequest;
import com.rra.taxprofessionals.dto.SignupTypeRequest;
import com.rra.taxprofessionals.dto.TaxProfessionalResponse;
import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.enums.BusinessStatus;
import com.rra.taxprofessionals.exception.DuplicateResourceException;
import com.rra.taxprofessionals.exception.FileStorageException;
import com.rra.taxprofessionals.exception.InvalidRequestException;
import com.rra.taxprofessionals.exception.ResourceNotFoundException;
import com.rra.taxprofessionals.model.Company;
import com.rra.taxprofessionals.model.DocumentRejection;
import com.rra.taxprofessionals.model.Location;
import com.rra.taxprofessionals.model.Officer;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.CompanyRepository;
import com.rra.taxprofessionals.repository.DocumentRejectionRepository;
import com.rra.taxprofessionals.repository.LocationRepository;
import com.rra.taxprofessionals.repository.OfficerRepository;
import com.rra.taxprofessionals.repository.TaxProfessionalRepository;
import com.rra.taxprofessionals.service.CertificatePdfService;
import com.rra.taxprofessionals.service.CompanyService;
import com.rra.taxprofessionals.service.TaxProfessionalService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
public class TaxProfessionalServiceImpl implements TaxProfessionalService {

    @Autowired
    private TaxProfessionalRepository taxProfessionalRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CompanyService companyService;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private DocumentRejectionRepository documentRejectionRepository;

    @Autowired
    private CertificatePdfService certificatePdfService;

    @Autowired
    private OfficerRepository officerRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    // ==================== RESUBMISSION LIMIT ERROR MESSAGES ====================
    private static final String RESUBMISSION_LIMIT_ERROR_INDIVIDUAL
            = "Application Rejected - Resubmission Not Available. "
            + "Your application has been rejected for the second time. "
            + "You have already used your one-time resubmission opportunity after the first rejection. "
            + "Unfortunately, no further resubmissions are allowed for this individual application. "
            + "Please contact the Rwanda Revenue Authority for guidance on how to proceed with a new application.";

    private static final String RESUBMISSION_LIMIT_ERROR_COMPANY_MEMBER
            = "Application Rejected - Resubmission Not Available. "
            + "Your application has been rejected for the second time. "
            + "You have already used your one-time resubmission opportunity after the first rejection. "
            + "Unfortunately, no further resubmissions are allowed for this company member application. "
            + "Please contact the Rwanda Revenue Authority for guidance on how to proceed with a new application.";
    // ============================================================================

    @Override
    public ApiResponse<TaxProfessionalResponse> registerIndividual(RegistrationRequest request) {
        try {
            // Validate unique constraints
            validateUniqueFields(request.getTin(), request.getEmail(), request.getNid());

            TaxProfessional taxProfessional = createTaxProfessional(request);
            taxProfessional.setBusinessStatus(BusinessStatus.INDIVIDUAL);

            TaxProfessional saved = taxProfessionalRepository.save(taxProfessional);

            return ApiResponse.success("Registration successful. Please login to continue.",
                    mapToTaxProfessionalResponse(saved));

        } catch (DuplicateResourceException | InvalidRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to register individual: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<List<TaxProfessionalResponse>> registerCompany(CompanyRegistrationRequest request) {
        // Delegate to CompanyService
        return companyService.registerCompany(request);
    }

    @Override
    public ApiResponse<TaxProfessionalResponse> getApplicationByTpin(String tpin) {
        try {
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin)
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found with TPIN: " + tpin));

            return ApiResponse.success("Application retrieved successfully",
                    mapToTaxProfessionalResponse(taxProfessional));

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch application: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<TaxProfessionalResponse> getApplicationByTin(String tin) {
        try {
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tin)
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found with TIN: " + tin));

            return ApiResponse.success("Application retrieved successfully",
                    mapToTaxProfessionalResponse(taxProfessional));

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch application: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<List<TaxProfessionalResponse>> getAllApplications() {
        try {
            List<TaxProfessional> applications = taxProfessionalRepository.findAll();
            List<TaxProfessionalResponse> responses = applications.stream()
                    .map(this::mapToTaxProfessionalResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Applications retrieved successfully", responses);

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

            return ApiResponse.success("Applications retrieved successfully", responses);

        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch applications by status: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<String> uploadOtherProfessionalDocument(String tpin, MultipartFile file) {
        try {
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin)
                    .orElseThrow(() -> new ResourceNotFoundException("Tax professional not found with TPIN: " + tpin));

            String fileName = storeFile(file);
            taxProfessional.setOtherProfessionalFilePath(fileName);
            taxProfessionalRepository.save(taxProfessional);

            return ApiResponse.success("Document uploaded successfully", fileName);

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload document: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<TaxProfessionalResponse> updateProfessionalQualifications(String tpin, ProfessionalQualificationRequest request) {
        try {
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin)
                    .orElseThrow(() -> new ResourceNotFoundException("Tax professional not found with TPIN: " + tpin));

            // Validate masters degree requires bachelor
            if (request.getMastersDegree() != null && request.getBachelorDegree() == null) {
                throw new InvalidRequestException("Bachelor degree is required before adding masters degree");
            }

            taxProfessional.setBachelorDegree(request.getBachelorDegree());
            taxProfessional.setMastersDegree(request.getMastersDegree());
            taxProfessional.setProfessionalQualification(request.getProfessionalQualification());
            taxProfessional.setOtherProfessionalDetails(request.getOtherProfessionalDetails());

            TaxProfessional updated = taxProfessionalRepository.save(taxProfessional);

            return ApiResponse.success("Professional qualifications updated successfully",
                    mapToTaxProfessionalResponse(updated));

        } catch (ResourceNotFoundException | InvalidRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update qualifications: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<Resource> getCertificateByTpin(String tpin) {
        try {
            log.info("📥 Officer/Admin certificate download request for TPIN: {}", tpin);

            // Fetch target member's record
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin)
                    .orElseThrow(() -> new ResourceNotFoundException("Tax professional not found with TPIN: " + tpin));

            // Officers/Admins can download any certificate, no authorization check needed

            // Check if application has been reviewed
            if (taxProfessional.getStatus() == ApplicationStatus.PENDING) {
                log.warn("⚠️ Certificate not available - Application still pending for TPIN: {}", tpin);
                throw new InvalidRequestException("Certificate not available. Application is still pending review.");
            }

            // Determine expected certificate path
            String certificatePath = taxProfessional.getCertificateFilePath();
            boolean isApproval = taxProfessional.getStatus() == ApplicationStatus.APPROVED;
            String expectedFilename = isApproval ? "approval_certificate.pdf" : "rejection_letter.pdf";

            // Determine folder identifier: use company TIN for company members, TPIN for individuals
            String folderIdentifier;
            if (taxProfessional.getCompanyId() != null && taxProfessional.getTinCompany() != null) {
                folderIdentifier = taxProfessional.getTinCompany();
                log.debug("📁 Using company TIN {} for certificate lookup (member TPIN: {})",
                        folderIdentifier, tpin);
            } else {
                folderIdentifier = tpin;
            }

            // If no path stored, construct the expected path
            if (certificatePath == null || certificatePath.isEmpty()) {
                certificatePath = "certificates/" + folderIdentifier + "/" + expectedFilename;
            }

            // Load file as Resource
            Path filePath = Paths.get(uploadDir).resolve(certificatePath).normalize();

            // If file doesn't exist, try to regenerate it
            if (!Files.exists(filePath)) {
                log.warn("⚠️ Certificate file does not exist at path: {}, attempting to regenerate...", filePath);

                // Only regenerate for approved/rejected applications
                if (taxProfessional.getStatus() == ApplicationStatus.APPROVED
                        || taxProfessional.getStatus() == ApplicationStatus.REJECTED) {

                    // Get the reviewing officer
                    String reviewedByEmployeeId = taxProfessional.getReviewedBy();
                    if (reviewedByEmployeeId == null) {
                        throw new InvalidRequestException("Cannot regenerate certificate - no reviewing officer found");
                    }

                    Officer reviewer = officerRepository.findByEmployeeId(reviewedByEmployeeId)
                            .orElseThrow(() -> new ResourceNotFoundException("Officer not found with employeeId: " + reviewedByEmployeeId));

                    // Regenerate certificate
                    byte[] pdfBytes;
                    if (isApproval) {
                        pdfBytes = certificatePdfService.generateApprovalCertificate(taxProfessional, reviewer);
                    } else {
                        String rejectionReason = taxProfessional.getRejectionReason() != null
                                ? taxProfessional.getRejectionReason()
                                : "Application did not meet requirements";
                        pdfBytes = certificatePdfService.generateRejectionLetter(taxProfessional, reviewer, rejectionReason);
                    }

                    // Save regenerated certificate
                    Files.createDirectories(filePath.getParent());
                    Files.write(filePath, pdfBytes);
                    log.info("✅ Certificate regenerated successfully at: {}", filePath);
                } else {
                    throw new ResourceNotFoundException("Certificate not found for TPIN: " + tpin);
                }
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                log.info("✅ Certificate file loaded successfully for TPIN: {}", tpin);
                return ApiResponse.success("Certificate retrieved successfully", resource);
            } else {
                throw new ResourceNotFoundException("Certificate file is not accessible");
            }

        } catch (ResourceNotFoundException | InvalidRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Error downloading certificate for TPIN {}: {}", tpin, e.getMessage(), e);
            throw new RuntimeException("Failed to download certificate: " + e.getMessage(), e);
        }
    }

    public ApiResponse<Resource> downloadCertificate(String tpin, String authenticatedUserTpin) {
        try {
            log.info("📥 Download certificate request for TPIN: {} by user: {}", tpin, authenticatedUserTpin);

            // Fetch target member's record
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin)
                    .orElseThrow(() -> new ResourceNotFoundException("Tax professional not found with TPIN: " + tpin));

            // ==================== AUTHORIZATION LOGIC ====================
            // Check if user is downloading their own certificate (individual accounts)
            if (tpin.equals(authenticatedUserTpin)) {
                // User is downloading their own certificate - allow
                log.debug("✅ User downloading own certificate");
            } else {
                // User is trying to download someone else's certificate
                // Check if authenticated user is a company admin
                TaxProfessional authenticatedUser = taxProfessionalRepository.findById(authenticatedUserTpin)
                        .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found with TPIN: " + authenticatedUserTpin));

                // Check if authenticated user is a company admin
                if (authenticatedUser.getIsCompanyAdmin() != null && authenticatedUser.getIsCompanyAdmin()
                        && authenticatedUser.getCompanyId() != null) {
                    // Authenticated user is a company admin - verify they belong to the same company
                    if (authenticatedUser.getCompanyId().equals(taxProfessional.getCompanyId())) {
                        // Both belong to the same company - allow download
                        log.info("✅ Company admin {} downloading certificate for company member {}",
                                authenticatedUserTpin, tpin);
                    } else {
                        // Different companies - deny access
                        log.warn("⚠️ Unauthorized certificate access - Company admin {} from company {} attempted to access certificate for TPIN {} from company {}",
                                authenticatedUserTpin, authenticatedUser.getCompanyId(), tpin, taxProfessional.getCompanyId());
                        throw new InvalidRequestException("You can only download certificates for members of your company");
                    }
                } else {
                    // Authenticated user is not a company admin - deny access
                    log.warn("⚠️ Unauthorized certificate access attempt - TPIN: {} by user: {}", tpin, authenticatedUserTpin);
                    throw new InvalidRequestException("You can only download your own certificate");
                }
            }
            // ==============================================================

            // Check if application has been reviewed
            if (taxProfessional.getStatus() == ApplicationStatus.PENDING) {
                log.warn("⚠️ Certificate not available - Application still pending for TPIN: {}", tpin);
                throw new InvalidRequestException("Certificate not available. Your application is still pending review.");
            }

            // Determine expected certificate path
            String certificatePath = taxProfessional.getCertificateFilePath();
            boolean isApproval = taxProfessional.getStatus() == ApplicationStatus.APPROVED;
            String expectedFilename = isApproval ? "approval_certificate.pdf" : "rejection_letter.pdf";

            // Determine folder identifier: use company TIN for company members, TPIN for individuals
            String folderIdentifier;
            if (taxProfessional.getCompanyId() != null && taxProfessional.getTinCompany() != null) {
                folderIdentifier = taxProfessional.getTinCompany();
                log.debug("📁 Using company TIN {} for certificate lookup (member TPIN: {})",
                        folderIdentifier, tpin);
            } else {
                folderIdentifier = tpin;
            }

            // If no path stored, construct the expected path
            if (certificatePath == null || certificatePath.isEmpty()) {
                certificatePath = "certificates/" + folderIdentifier + "/" + expectedFilename;
            }

            // Load file as Resource
            Path filePath = Paths.get(uploadDir).resolve(certificatePath).normalize();

            // If file doesn't exist, try to regenerate it
            if (!Files.exists(filePath)) {
                log.warn("⚠️ Certificate file does not exist at path: {}, attempting to regenerate...", filePath);

                // Only regenerate for approved/rejected applications
                if (taxProfessional.getStatus() == ApplicationStatus.APPROVED
                        || taxProfessional.getStatus() == ApplicationStatus.REJECTED) {

                    // Get the reviewing officer
                    String reviewedByEmployeeId = taxProfessional.getReviewedBy();
                    if (reviewedByEmployeeId == null) {
                        log.error("❌ Cannot regenerate certificate - no reviewer information for TPIN: {}", tpin);
                        throw new ResourceNotFoundException("Certificate cannot be regenerated. Please contact support.");
                    }

                    Officer officer = officerRepository.findByEmployeeId(reviewedByEmployeeId)
                            .orElseThrow(() -> {
                                log.error("❌ Reviewer officer not found: {}", reviewedByEmployeeId);
                                return new ResourceNotFoundException("Certificate cannot be regenerated. Please contact support.");
                            });

                    try {
                        // Generate the certificate/letter
                        byte[] pdfDocument;
                        if (isApproval) {
                            log.info("📄 Regenerating approval certificate for TPIN: {}", tpin);
                            pdfDocument = certificatePdfService.generateApprovalCertificate(taxProfessional, officer);
                        } else {
                            log.info("📄 Regenerating rejection letter for TPIN: {}", tpin);
                            pdfDocument = certificatePdfService.generateRejectionLetter(
                                    taxProfessional, officer, taxProfessional.getRejectionReason());
                        }

                        // Save the regenerated certificate (use company TIN for company members)
                        String savedPath = saveCertificatePdf(pdfDocument, taxProfessional, isApproval);
                        taxProfessional.setCertificateFilePath(savedPath);
                        taxProfessionalRepository.save(taxProfessional);

                        // Update the file path
                        filePath = Paths.get(uploadDir).resolve(savedPath).normalize();
                        log.info("✅ Certificate regenerated and saved successfully: {}", savedPath);

                    } catch (Exception e) {
                        log.error("❌ Failed to regenerate certificate for TPIN {}: {}", tpin, e.getMessage(), e);
                        throw new FileStorageException("Failed to regenerate certificate. Please contact support.", e);
                    }
                } else {
                    log.error("❌ Certificate file does not exist at path: {}", filePath);
                    throw new ResourceNotFoundException("Certificate file not found on server. Please contact support.");
                }
            }

            Resource resource;
            try {
                resource = new UrlResource(filePath.toUri());
                if (!resource.exists() || !resource.isReadable()) {
                    throw new ResourceNotFoundException("Certificate file is not accessible");
                }
            } catch (MalformedURLException e) {
                log.error("❌ Invalid file path for certificate: {}", filePath, e);
                throw new FileStorageException("Error loading certificate file: " + e.getMessage(), e);
            }

            log.info("✅ Certificate download successful for TPIN: {}", tpin);
            return ApiResponse.success("Certificate retrieved successfully", resource);

        } catch (ResourceNotFoundException | InvalidRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Unexpected error downloading certificate for TPIN {}: {}", tpin, e.getMessage(), e);
            throw new RuntimeException("Failed to download certificate: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<TaxProfessionalResponse> getCurrentUser(String authenticatedUserTpin) {
        try {
            log.info("👤 Getting current user details for identifier: {}", authenticatedUserTpin);

            // Check if this is a companyId (UUID format) instead of TPIN
            TaxProfessional taxProfessional = null;

            // Try to find as TaxProfessional first (for admin members or individuals)
            Optional<TaxProfessional> tpOptional = taxProfessionalRepository.findById(authenticatedUserTpin);
            if (tpOptional.isPresent()) {
                taxProfessional = tpOptional.get();
            } else {
                // Not found as TPIN - check if it's a companyId (UUID format)
                Optional<Company> companyOptional = companyRepository.findById(authenticatedUserTpin);
                if (companyOptional.isPresent()) {
                    Company company = companyOptional.get();
                    // Company exists - return company info with members
                    TaxProfessionalResponse response = new TaxProfessionalResponse();
                    response.setAccountType("COMPANY");
                    response.setCompanyId(company.getCompanyId());
                    response.setCompanyName(company.getCompanyName());
                    response.setCompanyEmail(company.getCompanyEmail());
                    response.setTinCompany(company.getCompanyTin());
                    response.setStatus(ApplicationStatus.REGISTERED); // Default status

                    // Fetch actual company members from database
                    List<TaxProfessional> members = taxProfessionalRepository.findByCompanyId(company.getCompanyId());
                    List<CompanyMemberResponse> memberResponses = members.stream()
                            .map(this::mapToCompanyMemberResponse)
                            .collect(Collectors.toList());
                    response.setMembers(memberResponses);

                    // Set rejectionCount to 0 if null
                    response.setRejectionCount(0);
                    response.setIsReapplication(false);
                    response.setHasReapplied(false);

                    log.info("✅ Current company retrieved successfully: {} - {} members", authenticatedUserTpin, members.size());
                    String message = members.isEmpty()
                            ? "Company details retrieved successfully. No members added yet."
                            : "Company details retrieved successfully with " + members.size() + " member(s).";
                    return ApiResponse.success(message, response);
                } else {
                    throw new ResourceNotFoundException("Tax professional or company not found with identifier: " + authenticatedUserTpin);
                }
            }

            TaxProfessionalResponse response = mapToTaxProfessionalResponse(taxProfessional);

            // Check if this is a company account
            if (taxProfessional.getCompanyId() != null) {
                response.setAccountType("COMPANY");
                response.setCompanyId(taxProfessional.getCompanyId());

                // Fetch company details
                com.rra.taxprofessionals.model.Company companyDetails = companyRepository.findById(taxProfessional.getCompanyId())
                        .orElse(null);
                if (companyDetails != null) {
                    response.setCompanyName(companyDetails.getCompanyName());
                    response.setCompanyEmail(companyDetails.getCompanyEmail());

                    // Fetch all company members
                    List<TaxProfessional> members = taxProfessionalRepository.findByCompanyId(taxProfessional.getCompanyId());
                    List<com.rra.taxprofessionals.dto.CompanyMemberResponse> memberResponses = members.stream()
                            .map(this::mapToCompanyMemberResponse)
                            .collect(Collectors.toList());
                    response.setMembers(memberResponses);
                }
            } else {
                response.setAccountType("INDIVIDUAL");
            }

            log.info("✅ Current user retrieved successfully: {} - Account Type: {}", authenticatedUserTpin, response.getAccountType());
            return ApiResponse.success("User details retrieved successfully", response);

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Failed to get current user for TPIN {}: {}", authenticatedUserTpin, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve user details: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<String> determineSignupType(SignupTypeRequest request) {
        try {
            log.info("🔍 Determining signup type: {}", request.getAccountType());
            String accountType = request.getAccountType();
            String message = String.format("Account type '%s' confirmed. Please proceed with registration.", accountType);
            log.info("✅ Signup type confirmed: {}", accountType);
            return ApiResponse.success(message, accountType);
        } catch (Exception e) {
            log.error("❌ Failed to determine signup type: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to determine signup type: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<TaxProfessionalResponse> addCompanyMember(String companyTin, AddCompanyMemberRequest request) {
        try {
            // Get company by TIN to get companyId
            com.rra.taxprofessionals.model.Company company = companyService.getCompanyByTin(companyTin);

            // Get admin TPIN from authenticated user (should be passed as parameter)
            // For now, find admin member
            List<TaxProfessional> adminMembers = taxProfessionalRepository.findByCompanyIdAndIsCompanyAdmin(company.getCompanyId(), true);
            if (adminMembers.isEmpty()) {
                throw new ResourceNotFoundException("Company admin not found");
            }
            String adminTpin = adminMembers.get(0).getTpin();

            // Delegate to CompanyService
            return companyService.addCompanyMember(company.getCompanyId(), request, adminTpin);
        } catch (Exception e) {
            log.error("❌ Failed to add company member: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to add company member: " + e.getMessage(), e);
        }
    }

    private void validateUniqueFields(String tin, String email, String nid) {
        if (taxProfessionalRepository.existsByTpin(tin)) {
            throw new DuplicateResourceException("TIN already exists: " + tin);
        }
        if (taxProfessionalRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already exists: " + email);
        }
        if (taxProfessionalRepository.existsByNid(nid)) {
            throw new DuplicateResourceException("NID already exists: " + nid);
        }
    }
    // In your service implementation (e.g., TaxProfessionalServiceImpl)

    private TaxProfessionalResponse mapToResponse(TaxProfessional entity) {
        TaxProfessionalResponse response = new TaxProfessionalResponse();

        // Existing fields
        response.setTpin(entity.getTpin());
        response.setTinCompany(entity.getTinCompany());
        response.setNid(entity.getNid());
        response.setFullName(entity.getFullName());
        response.setEmail(entity.getEmail());
        response.setPhoneNumber(entity.getPhoneNumber());

        // Location mapping (now using strings)
        if (entity.getVillage() != null && !entity.getVillage().trim().isEmpty()) {
            LocationResponse location = new LocationResponse();
            location.setName(entity.getVillage());
            response.setWorkAddress(location);
        }

        response.setBusinessStatus(entity.getBusinessStatus());
        response.setBachelorDegree(entity.getBachelorDegree());
        response.setMastersDegree(entity.getMastersDegree());
        response.setProfessionalQualification(entity.getProfessionalQualification());
        response.setOtherProfessionalDetails(entity.getOtherProfessionalDetails());
        response.setApplicationDate(entity.getApplicationDate());
        response.setStatus(entity.getStatus());
        response.setReviewedBy(entity.getReviewedBy());
        response.setReviewedAt(entity.getReviewedAt());
        response.setApprovalDate(entity.getApprovalDate());
        response.setExpiryDate(entity.getExpiryDate());
        response.setRejectionReason(entity.getRejectionReason());
        response.setCertificateFilePath(entity.getCertificateFilePath());

        // ==================== NEW REAPPLICATION FIELDS ====================
        response.setPreviousRejectionReason(entity.getPreviousRejectionReason());
        response.setPreviousReviewedBy(entity.getPreviousReviewedBy());
        response.setPreviousReviewedAt(entity.getPreviousReviewedAt());
        // Ensure rejectionCount defaults to 0 if null
        response.setRejectionCount(entity.getRejectionCount() != null ? entity.getRejectionCount() : 0);
        response.setReapplicationDate(entity.getReapplicationDate());
        response.setIsReapplication(entity.getIsReapplication());
        // hasReapplied should only be true if they've actually resubmitted (isReapplication == true)
        // NOT just because they've been rejected (rejectionCount > 0)
        Boolean hasReapplied = (entity.getIsReapplication() != null && entity.getIsReapplication());
        response.setHasReapplied(hasReapplied);

        return response;
    }

    private TaxProfessional createTaxProfessional(RegistrationRequest request) {
        TaxProfessional taxProfessional = new TaxProfessional();

        // Required fields
        taxProfessional.setTpin(request.getTin());
        taxProfessional.setNid(request.getNid());
        taxProfessional.setFullName(request.getFullName());
        taxProfessional.setEmail(request.getEmail());
        taxProfessional.setPhoneNumber(request.getPhoneNumber());
        taxProfessional.setPassword(passwordEncoder.encode(request.getPassword()));

        // Set locations as simple strings (no lookup needed)
        taxProfessional.setProvince(request.getProvince());
        taxProfessional.setDistrict(request.getDistrict());
        taxProfessional.setSector(request.getSector());
        taxProfessional.setCell(request.getCell());
        taxProfessional.setVillage(request.getVillage());

        // Set default values
        taxProfessional.setApplicationDate(LocalDateTime.now());
        taxProfessional.setStatus(ApplicationStatus.REGISTERED);

        // Optional fields are null by default - can be updated later through profile update
        return taxProfessional;
    }

    private void validateUniqueEmailAndNid(String email, String nid) {
        if (taxProfessionalRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already exists: " + email);
        }
        if (taxProfessionalRepository.existsByNid(nid)) {
            throw new DuplicateResourceException("NID already exists: " + nid);
        }
    }

    private String generateCompanyMemberTpin(String companyTin, int memberIndex) {
        // Generate TPIN as: {companyTin}-{memberIndex}
        // If that exists, append a suffix to ensure uniqueness
        String baseTpin = companyTin + "-" + memberIndex;
        String tpin = baseTpin;
        int suffix = 1;

        while (taxProfessionalRepository.existsByTpin(tpin)) {
            tpin = baseTpin + "-" + suffix;
            suffix++;
        }

        return tpin;
    }

    // Old createCompanyMember method removed - now handled by CompanyService
    private String storeFile(MultipartFile file) {
        try {
            String fileName = StringUtils.cleanPath(file.getOriginalFilename());
            String uniqueFileName = UUID.randomUUID().toString() + "_" + fileName;

            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            Path targetLocation = uploadPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return uniqueFileName;

        } catch (IOException ex) {
            throw new RuntimeException("Failed to store file: " + ex.getMessage(), ex);
        }
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

        // ==================== REAPPLICATION FIELDS ====================
        response.setPreviousRejectionReason(tp.getPreviousRejectionReason());
        response.setPreviousReviewedBy(tp.getPreviousReviewedBy());
        response.setPreviousReviewedAt(tp.getPreviousReviewedAt());
        // Ensure rejectionCount defaults to 0 if null
        response.setRejectionCount(tp.getRejectionCount() != null ? tp.getRejectionCount() : 0);
        response.setReapplicationDate(tp.getReapplicationDate());
        response.setIsReapplication(tp.getIsReapplication());
        // hasReapplied should only be true if they've actually resubmitted (isReapplication == true)
        // NOT just because they've been rejected (rejectionCount > 0)
        Boolean hasReapplied = (tp.getIsReapplication() != null && tp.getIsReapplication());
        response.setHasReapplied(hasReapplied);
        // ==============================================================

        // ==================== DOCUMENT REJECTION FIELDS ====================
        // Populate problematicDocumentIds when status is REJECTED
        if (tp.getStatus() == ApplicationStatus.REJECTED) {
            List<DocumentRejection> documentRejections = documentRejectionRepository.findByTaxProfessionalTpin(tp.getTpin());
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

    private CompanyMemberResponse mapToCompanyMemberResponse(TaxProfessional tp) {
        CompanyMemberResponse response = new CompanyMemberResponse();
        response.setTpin(tp.getTpin());
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
        response.setIsCompanyAdmin(tp.getIsCompanyAdmin());
        return response;
    }

    /**
     * Gets the appropriate resubmission limit error message based on
     * application type
     *
     * @param taxProfessional the tax professional entity
     * @return the appropriate error message
     */
    private String getResubmissionLimitErrorMessage(TaxProfessional taxProfessional) {
        if (taxProfessional.isIndividualApplication()) {
            return RESUBMISSION_LIMIT_ERROR_INDIVIDUAL;
        } else {
            return RESUBMISSION_LIMIT_ERROR_COMPANY_MEMBER;
        }
    }

    @Override
    public ApiResponse<TaxProfessionalResponse> resubmitApplication(String tpin) {
        try {
            log.info("🔄 Processing application resubmission for TPIN: {}", tpin);

            // Find TaxProfessional by TPIN
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin)
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found with TPIN: " + tpin));

            // Validate status is REJECTED
            if (taxProfessional.getStatus() != ApplicationStatus.REJECTED) {
                throw new InvalidRequestException(
                        "Application cannot be resubmitted. Current status: " + taxProfessional.getStatus()
                        + ". Only REJECTED applications can be resubmitted.");
            }

            // ==================== REJECTION LIMIT VALIDATION ====================
            // Check if applicant can reapply (rejection count < 2)
            if (!taxProfessional.canReapply()) {
                log.warn("⚠️ Resubmission blocked for TPIN: {} - Rejection count: {}",
                        tpin, taxProfessional.getRejectionCount());
                throw new InvalidRequestException(getResubmissionLimitErrorMessage(taxProfessional));
            }
            // ====================================================================

            // Call processReapplication() to archive rejection details and change status
            taxProfessional.processReapplication();

            // Delete all DocumentRejection records for the TPIN
            documentRejectionRepository.deleteByTaxProfessionalTpin(tpin);
            log.info("🗑️ Deleted all DocumentRejection records for TPIN: {}", tpin);

            // Save TaxProfessional
            TaxProfessional updated = taxProfessionalRepository.save(taxProfessional);
            log.info("✅ Application resubmitted successfully - TPIN: {}, Status changed to PENDING", tpin);

            // Return success response with updated TaxProfessionalResponse
            return ApiResponse.success("Application resubmitted successfully. Status changed to PENDING.",
                    mapToTaxProfessionalResponse(updated));

        } catch (ResourceNotFoundException | InvalidRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Failed to resubmit application for TPIN {}: {}", tpin, e.getMessage(), e);
            throw new RuntimeException("Failed to resubmit application: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<TaxProfessionalResponse> submitApplication(String tpin) {
        try {
            log.info("📤 Processing application submission for TPIN: {}", tpin);

            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin)
                    .orElseThrow(() -> new ResourceNotFoundException("Application not found with TPIN: " + tpin));

            // Validate status is REGISTERED
            if (taxProfessional.getStatus() != ApplicationStatus.REGISTERED) {
                throw new InvalidRequestException(
                        "Application cannot be submitted. Current status: " + taxProfessional.getStatus()
                        + ". Only REGISTERED applications can be submitted.");
            }

            // Change status to PENDING
            taxProfessional.setStatus(ApplicationStatus.PENDING);

            TaxProfessional updated = taxProfessionalRepository.save(taxProfessional);
            log.info("✅ Application submitted successfully - TPIN: {}, Status changed to PENDING", tpin);

            return ApiResponse.success("Application submitted successfully. Status changed to PENDING.",
                    mapToTaxProfessionalResponse(updated));

        } catch (ResourceNotFoundException | InvalidRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Failed to submit application for TPIN {}: {}", tpin, e.getMessage(), e);
            throw new RuntimeException("Failed to submit application: " + e.getMessage(), e);
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
            String filename = isApproval ? "approval_certificate.pdf" : "rejection_letter.pdf";
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
}
