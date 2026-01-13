package com.rra.taxprofessionals.service.imp;

import com.rra.taxprofessionals.dto.AdminPasswordResetResponse;
import com.rra.taxprofessionals.dto.UserManagementDTO;
import com.rra.taxprofessionals.dto.UserUpdateRequest;
import com.rra.taxprofessionals.exception.InvalidRequestException;
import com.rra.taxprofessionals.exception.ResourceNotFoundException;
import com.rra.taxprofessionals.model.Company;
import com.rra.taxprofessionals.model.Document;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.CompanyRepository;
import com.rra.taxprofessionals.repository.DocumentRepository;
import com.rra.taxprofessionals.repository.TaxProfessionalRepository;
import com.rra.taxprofessionals.service.SmsService;
import com.rra.taxprofessionals.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.internet.MimeMessage;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    private final TaxProfessionalRepository taxProfessionalRepository;
    private final CompanyRepository companyRepository;
    private final DocumentRepository documentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final SmsService smsService;

    @Value("${app.frontend.taxprofessional.url}")
    private String taxProfessionalFrontendUrl;

    @Value("${app.password.reset.token.expiry.hours:24}")
    private int resetTokenExpiryHours;

    @Override
    @Transactional(readOnly = true)
    public Page<UserManagementDTO> getAllUsers(String search, String type, Boolean hasSubmittedDocuments, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        List<UserManagementDTO> allUsers = new ArrayList<>();

        // Fetch individuals
        if (type == null || type.equalsIgnoreCase("INDIVIDUAL")) {
            List<TaxProfessional> individuals = taxProfessionalRepository.findAll().stream()
                .filter(tp -> tp.getCompanyId() == null || tp.getCompanyId().isEmpty())
                .collect(Collectors.toList());
            
            for (TaxProfessional tp : individuals) {
                if (matchesSearch(tp, null, search) && matchesDocumentFilter(tp.getTpin(), "INDIVIDUAL", hasSubmittedDocuments)) {
                    allUsers.add(mapToDTO(tp, "INDIVIDUAL"));
                }
            }
        }

        // Fetch members
        if (type == null || type.equalsIgnoreCase("MEMBER")) {
            List<TaxProfessional> members = taxProfessionalRepository.findAll().stream()
                .filter(tp -> tp.getCompanyId() != null && !tp.getCompanyId().isEmpty())
                .collect(Collectors.toList());
            
            for (TaxProfessional tp : members) {
                if (matchesSearch(tp, null, search) && matchesDocumentFilter(tp.getTpin(), "MEMBER", hasSubmittedDocuments)) {
                    allUsers.add(mapToDTO(tp, "MEMBER"));
                }
            }
        }

        // Fetch companies
        if (type == null || type.equalsIgnoreCase("COMPANY")) {
            List<Company> companies = companyRepository.findAll();
            
            for (Company company : companies) {
                if (matchesSearch(null, company, search) && matchesDocumentFilter(company.getCompanyId(), "COMPANY", hasSubmittedDocuments)) {
                    allUsers.add(mapToDTO(company));
                }
            }
        }

        // Sort by createdAt descending
        allUsers.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        // Manual pagination
        int start = page * size;
        int end = Math.min(start + size, allUsers.size());
        List<UserManagementDTO> pageContent = start < allUsers.size() ? allUsers.subList(start, end) : new ArrayList<>();

        return new PageImpl<>(pageContent, pageable, allUsers.size());
    }

    @Override
    @Transactional(readOnly = true)
    public UserManagementDTO getUserById(String id, String type) {
        if ("COMPANY".equalsIgnoreCase(type)) {
            Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
            return mapToDTO(company);
        } else {
            TaxProfessional tp = taxProfessionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            String userType = (tp.getCompanyId() == null || tp.getCompanyId().isEmpty()) ? "INDIVIDUAL" : "MEMBER";
            return mapToDTO(tp, userType);
        }
    }

    @Override
    @Transactional
    public UserManagementDTO updateUser(String id, String type, UserUpdateRequest request) {
        if ("COMPANY".equalsIgnoreCase(type)) {
            Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
            
            if (request.getCompanyName() != null) company.setCompanyName(request.getCompanyName());
            if (request.getEmail() != null) company.setCompanyEmail(request.getEmail());
            if (request.getPhoneNumber() != null) company.setCompanyPhone(request.getPhoneNumber());
            
            company = companyRepository.save(company);
            return mapToDTO(company);
        } else {
            TaxProfessional tp = taxProfessionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            
            if (request.getNames() != null) tp.setFullName(request.getNames());
            if (request.getEmail() != null) tp.setEmail(request.getEmail());
            if (request.getPhoneNumber() != null) tp.setPhoneNumber(request.getPhoneNumber());
            
            tp = taxProfessionalRepository.save(tp);
            String userType = (tp.getCompanyId() == null || tp.getCompanyId().isEmpty()) ? "INDIVIDUAL" : "MEMBER";
            return mapToDTO(tp, userType);
        }
    }

    @Override
    @Transactional
    public AdminPasswordResetResponse resetUserPassword(String id, String type) {
        String resetToken = UUID.randomUUID().toString();
        LocalDateTime expiry = LocalDateTime.now().plusHours(resetTokenExpiryHours);
        
        String email = null;
        String phone = null;
        String userType = null;

        if ("COMPANY".equalsIgnoreCase(type)) {
            Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
            
            company.setResetToken(resetToken);
            company.setResetTokenExpiry(expiry);
            companyRepository.save(company);
            
            email = company.getCompanyEmail();
            phone = company.getCompanyPhone();
            userType = "company";
        } else {
            TaxProfessional tp = taxProfessionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            
            tp.setResetToken(resetToken);
            tp.setResetTokenExpiry(expiry);
            taxProfessionalRepository.save(tp);
            
            email = tp.getEmail();
            phone = tp.getPhoneNumber();
            userType = "taxprofessional";
        }

        String encodedToken = URLEncoder.encode(resetToken, StandardCharsets.UTF_8);
        String resetUrl = taxProfessionalFrontendUrl + "/reset-password?token=" + encodedToken + "&type=" + userType;

        // Try email first
        String contactUsed = "EMAIL";
        try {
            sendResetEmail(email, resetUrl);
        } catch (Exception e) {
            // Email failed, try SMS
            if (phone != null && !phone.isEmpty()) {
                try {
                    smsService.sendSms(phone, "Password reset link: " + resetUrl);
                    contactUsed = "SMS";
                } catch (Exception smsEx) {
                    throw new InvalidRequestException("Failed to send reset link via email or SMS");
                }
            } else {
                throw new InvalidRequestException("Failed to send reset email and no phone number available");
            }
        }

        return new AdminPasswordResetResponse(
            maskEmail(email),
            maskPhone(phone),
            resetUrl,
            contactUsed,
            "Password reset link generated successfully"
        );
    }

    @Override
    @Transactional
    public void deleteUser(String id, String type) {
        if ("COMPANY".equalsIgnoreCase(type)) {
            Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
            
            List<TaxProfessional> members = taxProfessionalRepository.findByCompanyId(id);
            if (!members.isEmpty()) {
                throw new InvalidRequestException("Cannot delete company with registered members");
            }
            
            companyRepository.delete(company);
        } else {
            TaxProfessional tp = taxProfessionalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            
            List<Document> documents = documentRepository.findByTaxProfessionalTpin(id);
            if (!documents.isEmpty()) {
                throw new InvalidRequestException("Cannot delete user who has submitted documents");
            }
            
            taxProfessionalRepository.delete(tp);
        }
    }

    // Helper methods
    private boolean matchesSearch(TaxProfessional tp, Company company, String search) {
        if (search == null || search.trim().isEmpty()) return true;
        
        String searchLower = search.toLowerCase();
        
        if (tp != null) {
            return (tp.getTpin() != null && tp.getTpin().toLowerCase().contains(searchLower)) ||
                   (tp.getNid() != null && tp.getNid().toLowerCase().contains(searchLower)) ||
                   (tp.getFullName() != null && tp.getFullName().toLowerCase().contains(searchLower)) ||
                   (tp.getEmail() != null && tp.getEmail().toLowerCase().contains(searchLower)) ||
                   (tp.getPhoneNumber() != null && tp.getPhoneNumber().toLowerCase().contains(searchLower)) ||
                   (tp.getCompanyName() != null && tp.getCompanyName().toLowerCase().contains(searchLower)) ||
                   (tp.getTinCompany() != null && tp.getTinCompany().toLowerCase().contains(searchLower));
        }
        
        if (company != null) {
            return (company.getCompanyTin() != null && company.getCompanyTin().toLowerCase().contains(searchLower)) ||
                   (company.getCompanyName() != null && company.getCompanyName().toLowerCase().contains(searchLower)) ||
                   (company.getCompanyEmail() != null && company.getCompanyEmail().toLowerCase().contains(searchLower)) ||
                   (company.getCompanyPhone() != null && company.getCompanyPhone().toLowerCase().contains(searchLower));
        }
        
        return false;
    }

    private boolean matchesDocumentFilter(String id, String type, Boolean hasSubmittedDocuments) {
        if (hasSubmittedDocuments == null) return true;
        
        if ("COMPANY".equalsIgnoreCase(type)) {
            List<TaxProfessional> members = taxProfessionalRepository.findByCompanyId(id);
            boolean hasDocuments = members.stream()
                .anyMatch(member -> !documentRepository.findByTaxProfessionalTpin(member.getTpin()).isEmpty());
            return hasDocuments == hasSubmittedDocuments;
        } else {
            List<Document> documents = documentRepository.findByTaxProfessionalTpin(id);
            return (!documents.isEmpty()) == hasSubmittedDocuments;
        }
    }

    private UserManagementDTO mapToDTO(TaxProfessional tp, String type) {
        List<Document> documents = documentRepository.findByTaxProfessionalTpin(tp.getTpin());
        
        UserManagementDTO dto = new UserManagementDTO();
        dto.setId(tp.getTpin());
        dto.setType(type);
        dto.setTpin(tp.getTpin());
        dto.setNid(tp.getNid());
        dto.setNames(tp.getFullName());
        dto.setEmail(tp.getEmail());
        dto.setPhoneNumber(tp.getPhoneNumber());
        dto.setCompanyName(tp.getCompanyName());
        dto.setCompanyTin(tp.getTinCompany());
        dto.setHasSubmittedDocuments(!documents.isEmpty());
        dto.setCreatedAt(tp.getApplicationDate());
        dto.setMemberCount(null);
        
        return dto;
    }

    private UserManagementDTO mapToDTO(Company company) {
        List<TaxProfessional> members = taxProfessionalRepository.findByCompanyId(company.getCompanyId());
        boolean hasDocuments = members.stream()
            .anyMatch(member -> !documentRepository.findByTaxProfessionalTpin(member.getTpin()).isEmpty());
        
        UserManagementDTO dto = new UserManagementDTO();
        dto.setId(company.getCompanyId());
        dto.setType("COMPANY");
        dto.setTpin(null);
        dto.setNid(null);
        dto.setNames(null);
        dto.setEmail(company.getCompanyEmail());
        dto.setPhoneNumber(company.getCompanyPhone());
        dto.setCompanyName(company.getCompanyName());
        dto.setCompanyTin(company.getCompanyTin());
        dto.setHasSubmittedDocuments(hasDocuments);
        dto.setCreatedAt(company.getCreatedAt());
        dto.setMemberCount(members.size());
        
        return dto;
    }

    private void sendResetEmail(String email, String resetUrl) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setTo(email);
        helper.setSubject("Password Reset Request");
        helper.setText("Click the link to reset your password: " + resetUrl, false);
        
        mailSender.send(message);
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "N/A";
        String[] parts = email.split("@");
        String local = parts[0];
        String masked = local.length() > 2 ? local.substring(0, 2) + "***" : "***";
        return masked + "@" + parts[1];
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "N/A";
        return "***" + phone.substring(phone.length() - 4);
    }
}
