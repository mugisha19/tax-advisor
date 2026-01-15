package com.rra.taxprofessionals.service.imp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rra.taxprofessionals.dto.AddCompanyMemberRequest;
import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.CompanyMemberRequest;
import com.rra.taxprofessionals.dto.CompanyMemberResponse;
import com.rra.taxprofessionals.dto.CompanyRegistrationRequest;
import com.rra.taxprofessionals.dto.TaxProfessionalResponse;
import com.rra.taxprofessionals.dto.UpdateCompanyMemberRequest;
import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.enums.BusinessStatus;
import com.rra.taxprofessionals.exception.DuplicateResourceException;
import com.rra.taxprofessionals.exception.InvalidRequestException;
import com.rra.taxprofessionals.exception.ResourceNotFoundException;
import com.rra.taxprofessionals.exception.UnauthorizedException;
import com.rra.taxprofessionals.model.Company;
import com.rra.taxprofessionals.model.DocumentRejection;
import com.rra.taxprofessionals.model.Location;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.CompanyRepository;
import com.rra.taxprofessionals.repository.DocumentRejectionRepository;
import com.rra.taxprofessionals.repository.LocationRepository;
import com.rra.taxprofessionals.repository.TaxProfessionalRepository;
import com.rra.taxprofessionals.service.CompanyService;
import com.rra.taxprofessionals.service.EmailService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Transactional
public class CompanyServiceImpl implements CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private TaxProfessionalRepository taxProfessionalRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private DocumentRejectionRepository documentRejectionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Override
    public ApiResponse<List<TaxProfessionalResponse>> registerCompany(CompanyRegistrationRequest request) {
        try {
            log.info("📝 Registering company: {}", request.getCompanyName());

            // Validate company email
            if (request.getCompanyEmail() == null || request.getCompanyEmail().trim().isEmpty()) {
                throw new InvalidRequestException("Company email is required");
            }

            // Check company TIN uniqueness
            if (companyRepository.existsByCompanyTin(request.getCompanyTin())) {
                throw new DuplicateResourceException("Company TIN already exists: " + request.getCompanyTin());
            }

            // Check company email uniqueness
            if (companyRepository.existsByCompanyEmail(request.getCompanyEmail())) {
                throw new DuplicateResourceException("Company email already exists: " + request.getCompanyEmail());
            }

            // Handle applicants if provided (optional - members can be added later)
            if (request.getApplicants() != null && !request.getApplicants().isEmpty()) {
                // Auto-calculate numberOfApplicants from applicants list if not provided
                if (request.getNumberOfApplicants() == null) {
                    request.setNumberOfApplicants(request.getApplicants().size());
                    log.info("📊 Auto-calculated numberOfApplicants: {}", request.getNumberOfApplicants());
                }

                // Validate match if both are provided (for backward compatibility)
                if (request.getApplicants().size() != request.getNumberOfApplicants()) {
                    throw new InvalidRequestException("Number of applicants does not match the list size");
                }
            } else {
                log.info("📝 No members provided during registration - members can be added later from dashboard");
            }

            // Get company's shared location (use names from request)
            String companyProvince = request.getProvince();
            String companyDistrict = request.getDistrict();
            String companySector = request.getSector();
            String companyCell = request.getCell();
            String companyVillage = request.getVillage();

            // Generate company ID
            String companyId = UUID.randomUUID().toString();
            log.info("🏢 Creating company with ID: {}", companyId);

            // Create Company entity
            Company company = new Company();
            company.setCompanyId(companyId);
            company.setCompanyTin(request.getCompanyTin());
            company.setCompanyName(request.getCompanyName());
            company.setCompanyEmail(request.getCompanyEmail());
            company.setCompanyPhone(request.getCompanyPhone());
            company.setPassword(passwordEncoder.encode(request.getPassword()));
            company.setProvince(companyProvince);
            company.setDistrict(companyDistrict);
            company.setSector(companySector);
            company.setCell(companyCell);
            company.setVillage(companyVillage);
            company.setCreatedAt(LocalDateTime.now());

            Company savedCompany = companyRepository.save(company);
            log.info("✅ Company created: {}", savedCompany.getCompanyId());

            // Send welcome email to company with password and reset link
            try {
                // Generate reset token for company
                String resetToken = UUID.randomUUID().toString();
                LocalDateTime resetTokenExpiry = LocalDateTime.now().plusHours(24); // 24 hours expiry
                
                savedCompany.setResetToken(resetToken);
                savedCompany.setResetTokenExpiry(resetTokenExpiry);
                companyRepository.save(savedCompany);
                
                log.info("📧 Sending welcome email to company: {}", savedCompany.getCompanyEmail());
                emailService.sendWelcomePasswordEmail(
                        savedCompany.getCompanyEmail(),
                        request.getPassword(), // Send the original password
                        savedCompany.getCompanyName(),
                        "COMPANY", // Account type
                        resetToken
                );
                log.info("✅ Welcome email sent successfully to company: {}", savedCompany.getCompanyEmail());
            } catch (Exception emailException) {
                log.error("❌ Failed to send welcome email to company {}: {}", 
                        savedCompany.getCompanyEmail(), emailException.getMessage());
                // Don't fail the registration if email fails
            }

            // Create members if provided (optional - members can be added later from dashboard)
            List<TaxProfessional> savedProfessionals = new ArrayList<>();
            
            if (request.getApplicants() != null && !request.getApplicants().isEmpty()) {
                int memberIndex = 1;

                for (CompanyMemberRequest member : request.getApplicants()) {
                    // Validate unique constraints for each member (NID only, no email)
                    validateUniqueNid(member.getNid());

                    // Generate unique TPIN for company member
                    String uniqueTpin = generateCompanyMemberTpin(request.getCompanyTin(), memberIndex);

                    // Create company member
                    TaxProfessional taxProfessional = createCompanyMember(
                            member,
                            uniqueTpin,
                            companyId,
                            request.getCompanyTin(),
                            request.getCompanyName(),
                            memberIndex == 1, // First member is admin
                            companyProvince,
                            companyDistrict,
                            companySector,
                            companyCell,
                            companyVillage);

                    TaxProfessional saved = taxProfessionalRepository.save(taxProfessional);
                    savedProfessionals.add(saved);
                    memberIndex++;

                    log.info("✅ Registered company member: {} ({}) - Admin: {}", 
                            saved.getFullName(), saved.getTpin(), saved.getIsCompanyAdmin());
                }
            }

            List<TaxProfessionalResponse> responses = savedProfessionals.stream()
                    .map(this::mapToTaxProfessionalResponse)
                    .collect(Collectors.toList());

            if (savedProfessionals.isEmpty()) {
                log.info("✅ Company registration successful - no members added during registration");
                return ApiResponse.success("Company registration successful. You can add members from the dashboard.", responses);
            } else {
                log.info("✅ Company registration successful for {} applicants", savedProfessionals.size());
                return ApiResponse.success("Company registration successful for " + savedProfessionals.size() + " applicants", responses);
            }

        } catch (DuplicateResourceException | InvalidRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Failed to register company: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to register company: " + e.getMessage(), e);
        }
    }

    @Override
    public Company getCompanyByTin(String companyTin) {
        return companyRepository.findByCompanyTin(companyTin)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with TIN: " + companyTin));
    }

    @Override
    public ApiResponse<List<CompanyMemberResponse>> getCompanyMembers(String companyId, String userTpin) {
        try {
            // Verify user belongs to the company (any authenticated company user can view members)
            verifyCompanyMemberAccess(companyId, userTpin);

            List<TaxProfessional> members = taxProfessionalRepository.findByCompanyId(companyId);
            List<CompanyMemberResponse> responses = members.stream()
                    .map(this::mapToCompanyMemberResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Company members retrieved successfully", responses);

        } catch (UnauthorizedException | ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Failed to get company members: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get company members: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<TaxProfessionalResponse> addCompanyMember(String companyId, AddCompanyMemberRequest request, String userTpin) {
        try {
            log.info("➕ Adding member to company: {} by user: {}", companyId, userTpin);

            // Verify user belongs to the company (any authenticated company user can add members)
            verifyCompanyMemberAccess(companyId, userTpin);

            // Get company
            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found with ID: " + companyId));

            // Get company's shared location (now stored as strings)
            String companyProvince = company.getProvince();
            String companyDistrict = company.getDistrict();
            String companySector = company.getSector();
            String companyCell = company.getCell();
            String companyVillage = company.getVillage();

            // Validate unique constraints for the new member
            validateUniqueNid(request.getNid());

            // Generate unique TPIN for the new member
            List<TaxProfessional> existingMembers = taxProfessionalRepository.findByCompanyId(companyId);
            int memberIndex = existingMembers.size() + 1;
            String uniqueTpin = generateCompanyMemberTpin(company.getCompanyTin(), memberIndex);
            
            // First member added to company becomes the admin
            boolean isFirstMember = existingMembers.isEmpty();

            // Create CompanyMemberRequest from AddCompanyMemberRequest
            CompanyMemberRequest memberInfo = new CompanyMemberRequest();
            memberInfo.setNid(request.getNid());
            memberInfo.setFullName(request.getFullName());
            memberInfo.setPhoneNumber(request.getPhoneNumber());

            // Create company member (first member is admin)
            TaxProfessional taxProfessional = createCompanyMember(
                    memberInfo,
                    uniqueTpin,
                    companyId,
                    company.getCompanyTin(),
                    company.getCompanyName(),
                    isFirstMember, // First member becomes admin
                    companyProvince,
                    companyDistrict,
                    companySector,
                    companyCell,
                    companyVillage);

            TaxProfessional saved = taxProfessionalRepository.save(taxProfessional);

            log.info("✅ Successfully added member {} to company {} - Admin: {}", saved.getFullName(), company.getCompanyName(), saved.getIsCompanyAdmin());
            
            String message = isFirstMember 
                    ? "Member added successfully as company admin" 
                    : "Member added successfully to company";
            return ApiResponse.success(message, mapToTaxProfessionalResponse(saved));

        } catch (DuplicateResourceException | ResourceNotFoundException | InvalidRequestException | UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("❌ Failed to add company member: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to add company member: " + e.getMessage(), e);
        }
    }

    private void verifyAdminAccess(String companyId, String adminTpin) {
        TaxProfessional admin = taxProfessionalRepository.findById(adminTpin)
                .orElseThrow(() -> new ResourceNotFoundException("Tax professional not found with TPIN: " + adminTpin));

        if (!admin.getIsCompanyAdmin() || !companyId.equals(admin.getCompanyId())) {
            throw new UnauthorizedException("Only company admin can perform this action");
        }
    }

    private void verifyCompanyMemberAccess(String companyId, String userIdentifier) {
        // First, try to find as TaxProfessional (for admin members or individuals)
        java.util.Optional<TaxProfessional> userOptional = taxProfessionalRepository.findById(userIdentifier);
        
        if (userOptional.isPresent()) {
            TaxProfessional user = userOptional.get();
            // Verify user belongs to the company
            if (user.getCompanyId() == null || !companyId.equals(user.getCompanyId())) {
                throw new UnauthorizedException("You can only perform this action for your own company");
            }
        } else {
            // Not found as TPIN - check if it's a companyId (for companies without members)
            java.util.Optional<Company> companyOptional = companyRepository.findById(userIdentifier);
            if (companyOptional.isPresent()) {
                // Verify the companyId matches (company is accessing its own resources)
                if (!companyId.equals(userIdentifier)) {
                    throw new UnauthorizedException("You can only perform this action for your own company");
                }
            } else {
                throw new ResourceNotFoundException("User not found with identifier: " + userIdentifier);
            }
        }
    }

    private void validateUniqueNid(String nid) {
        if (taxProfessionalRepository.existsByNid(nid)) {
            throw new DuplicateResourceException("NID already exists: " + nid);
        }
    }

    private String generateCompanyMemberTpin(String companyTin, int memberIndex) {
        String baseTpin = companyTin + "-" + memberIndex;
        String tpin = baseTpin;
        int suffix = 1;

        while (taxProfessionalRepository.existsByTpin(tpin)) {
            tpin = baseTpin + "-" + suffix;
            suffix++;
        }

        return tpin;
    }

    private TaxProfessional createCompanyMember(
            CompanyMemberRequest member,
            String tpin,
            String companyId,
            String companyTin,
            String companyName,
            boolean isAdmin,
            String province,
            String district,
            String sector,
            String cell,
            String village) {

        TaxProfessional taxProfessional = new TaxProfessional();

        // Set unique TPIN for this member
        taxProfessional.setTpin(tpin);

        // Set member-specific fields
        taxProfessional.setNid(member.getNid());
        taxProfessional.setFullName(member.getFullName());
        taxProfessional.setPhoneNumber(member.getPhoneNumber());
        // Email is null for company members
        taxProfessional.setEmail(null);

        // Set password only for admin
        if (isAdmin) {
            // Admin password is stored in Company entity, not here
            // Set a placeholder or null - authentication will use Company.password
            taxProfessional.setPassword(null);
        } else {
            taxProfessional.setPassword(null);
        }

        // Set company-related fields
        taxProfessional.setCompanyId(companyId);
        taxProfessional.setTinCompany(companyTin);
        taxProfessional.setCompanyName(companyName);
        taxProfessional.setIsCompanyAdmin(isAdmin);
        taxProfessional.setBusinessStatus(BusinessStatus.COMPANY);

        // Set company-shared location
        taxProfessional.setProvince(province);
        taxProfessional.setDistrict(district);
        taxProfessional.setSector(sector);
        taxProfessional.setCell(cell);
        taxProfessional.setVillage(village);

        // Set default values
        taxProfessional.setApplicationDate(LocalDateTime.now());
        taxProfessional.setStatus(ApplicationStatus.REGISTERED);

        return taxProfessional;
    }

    private TaxProfessionalResponse mapToTaxProfessionalResponse(TaxProfessional tp) {
        TaxProfessionalResponse response = new TaxProfessionalResponse();
        response.setTpin(tp.getTpin());
        response.setTinCompany(tp.getTinCompany());
        response.setCompanyName(tp.getCompanyName());
        response.setNid(tp.getNid());
        response.setFullName(tp.getFullName());
        response.setEmail(tp.getEmail());
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
        
        // ==================== RESUBMISSION DEADLINE FIELDS ====================
        response.setFirstRejectionDate(tp.getFirstRejectionDate());
        response.setResubmissionDeadline(tp.calculateResubmissionDeadline());
        // ======================================================================

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
        com.rra.taxprofessionals.dto.LocationResponse workAddress = new com.rra.taxprofessionals.dto.LocationResponse();
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

    @Override
    public ApiResponse<TaxProfessionalResponse> updateCompanyMember(String memberTpin, UpdateCompanyMemberRequest request, String userTpin) {
        try {
            log.info("📝 Updating company member with TPIN: {}", memberTpin);

            // Find the member to update
            TaxProfessional member = taxProfessionalRepository.findById(memberTpin)
                    .orElseThrow(() -> new ResourceNotFoundException("Company member not found with TPIN: " + memberTpin));

            // Verify the member belongs to a company
            if (member.getCompanyId() == null) {
                throw new InvalidRequestException("This user is not a company member");
            }

            // Get the company
            Company company = companyRepository.findById(member.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

            // userTpin could be either a TPIN (for admin member) or companyId (for company login)
            // First try to find admin by TPIN
            TaxProfessional admin = taxProfessionalRepository.findById(userTpin).orElse(null);
            
            // If not found as TPIN, userTpin might be companyId - find admin member of that company
            if (admin == null) {
                log.info("🔍 UserTpin not found as TPIN, checking if it's a companyId: {}", userTpin);
                // Try to find company by this ID
                Company authenticatedCompany = companyRepository.findById(userTpin).orElse(null);
                if (authenticatedCompany != null) {
                    // Find any admin member of this company
                    List<TaxProfessional> admins = taxProfessionalRepository.findByCompanyIdAndIsCompanyAdmin(
                            authenticatedCompany.getCompanyId(), true);
                    if (!admins.isEmpty()) {
                        admin = admins.get(0); // Use first admin
                        log.info("✅ Found company admin: {}", admin.getTpin());
                    }
                }
            }

            // If still no admin found, unauthorized
            if (admin == null) {
                throw new UnauthorizedException("Admin not found. You must be a company admin to update members.");
            }

            // Verify the admin belongs to the same company and is an admin
            if (!admin.getCompanyId().equals(company.getCompanyId())) {
                throw new UnauthorizedException("You can only update members of your own company");
            }
            if (!Boolean.TRUE.equals(admin.getIsCompanyAdmin())) {
                throw new UnauthorizedException("Only company admin can update members");
            }

            // Check for email uniqueness (if email is being changed and provided)
            if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
                // Only check uniqueness if email is changing
                if (member.getEmail() == null || !member.getEmail().equals(request.getEmail())) {
                    if (taxProfessionalRepository.findByEmail(request.getEmail()).isPresent()) {
                        throw new DuplicateResourceException("Email already exists: " + request.getEmail());
                    }
                }
            }

            // Check for NID uniqueness (if NID is being changed)
            if (!member.getNid().equals(request.getNid())) {
                if (taxProfessionalRepository.findByNid(request.getNid()).isPresent()) {
                    throw new DuplicateResourceException("NID already exists: " + request.getNid());
                }
            }

            // Update member fields
            member.setFullName(request.getFullName());
            // Only update email if provided (company members may not have email)
            if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
                member.setEmail(request.getEmail());
            }
            member.setPhoneNumber(request.getPhoneNumber());
            member.setNid(request.getNid());

            TaxProfessional updated = taxProfessionalRepository.save(member);
            log.info("✅ Company member updated successfully: {}", memberTpin);

            return ApiResponse.success("Company member updated successfully", mapToTaxProfessionalResponse(updated));

        } catch (ResourceNotFoundException | DuplicateResourceException | InvalidRequestException | UnauthorizedException e) {
            log.error("❌ Failed to update company member {}: {}", memberTpin, e.getMessage());
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Unexpected error updating company member {}: {}", memberTpin, e.getMessage(), e);
            return ApiResponse.error("Failed to update company member: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<String> deleteCompanyMember(String memberTpin, String userTpin) {
        try {
            log.info("🗑️ Deleting company member with TPIN: {}", memberTpin);

            // Find the member to delete
            TaxProfessional member = taxProfessionalRepository.findById(memberTpin)
                    .orElseThrow(() -> new ResourceNotFoundException("Company member not found with TPIN: " + memberTpin));

            // Verify the member belongs to a company
            if (member.getCompanyId() == null) {
                throw new InvalidRequestException("This user is not a company member");
            }

            // Get the company
            Company company = companyRepository.findById(member.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

            // userTpin could be either a TPIN (for admin member) or companyId (for company login)
            // First try to find admin by TPIN
            TaxProfessional admin = taxProfessionalRepository.findById(userTpin).orElse(null);
            
            // If not found as TPIN, userTpin might be companyId - find admin member of that company
            if (admin == null) {
                log.info("🔍 UserTpin not found as TPIN, checking if it's a companyId: {}", userTpin);
                // Try to find company by this ID
                Company authenticatedCompany = companyRepository.findById(userTpin).orElse(null);
                if (authenticatedCompany != null) {
                    // Find any admin member of this company
                    List<TaxProfessional> admins = taxProfessionalRepository.findByCompanyIdAndIsCompanyAdmin(
                            authenticatedCompany.getCompanyId(), true);
                    if (!admins.isEmpty()) {
                        admin = admins.get(0); // Use first admin
                        log.info("✅ Found company admin: {}", admin.getTpin());
                    }
                }
            }

            // If still no admin found, unauthorized
            if (admin == null) {
                throw new UnauthorizedException("Admin not found. You must be a company admin to delete members.");
            }

            // Verify the admin belongs to the same company and is an admin
            if (!admin.getCompanyId().equals(company.getCompanyId())) {
                throw new UnauthorizedException("You can only delete members of your own company");
            }
            if (!Boolean.TRUE.equals(admin.getIsCompanyAdmin())) {
                throw new UnauthorizedException("Only company admin can delete members");
            }

            // Delete the member (no restrictions on admin deletion)
            taxProfessionalRepository.delete(member);
            log.info("✅ Company member deleted successfully: {}", memberTpin);

            return ApiResponse.success("Company member deleted successfully", "Member removed from company");

        } catch (ResourceNotFoundException | InvalidRequestException | UnauthorizedException e) {
            log.error("❌ Failed to delete company member {}: {}", memberTpin, e.getMessage());
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            log.error("❌ Unexpected error deleting company member {}: {}", memberTpin, e.getMessage(), e);
            return ApiResponse.error("Failed to delete company member: " + e.getMessage());
        }
    }
}


