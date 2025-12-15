package com.rra.taxprofessionals.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rra.taxprofessionals.dto.AddCompanyMemberRequest;
import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.CompanyMemberResponse;
import com.rra.taxprofessionals.dto.TaxProfessionalResponse;
import com.rra.taxprofessionals.dto.UpdateCompanyMemberRequest;
import com.rra.taxprofessionals.service.CompanyService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    @GetMapping("/{companyTin}/members")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<List<CompanyMemberResponse>>> getCompanyMembers(
            @PathVariable String companyTin,
            Authentication authentication) {
        String username = authentication.getName();
        
        // Parse COMPANY format: COMPANY:{companyId} or COMPANY:{companyId}:{adminTpin}
        String userIdentifier = parseUserIdentifier(username);
        
        // Get company by TIN to get companyId
        com.rra.taxprofessionals.model.Company company = companyService.getCompanyByTin(companyTin);
        
        ApiResponse<List<CompanyMemberResponse>> response = companyService.getCompanyMembers(company.getCompanyId(), userIdentifier);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{companyTin}/members")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<TaxProfessionalResponse>> addCompanyMember(
            @PathVariable String companyTin,
            @Valid @RequestBody AddCompanyMemberRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        
        // Parse COMPANY format: COMPANY:{companyId} or COMPANY:{companyId}:{adminTpin}
        String userIdentifier = parseUserIdentifier(username);
        
        // Get company by TIN to get companyId
        com.rra.taxprofessionals.model.Company company = companyService.getCompanyByTin(companyTin);
        
        ApiResponse<TaxProfessionalResponse> response = companyService.addCompanyMember(company.getCompanyId(), request, userIdentifier);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/members/{memberTpin}")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<TaxProfessionalResponse>> updateCompanyMember(
            @PathVariable String memberTpin,
            @Valid @RequestBody UpdateCompanyMemberRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        
        // Parse COMPANY format: COMPANY:{companyId} or COMPANY:{companyId}:{adminTpin}
        String userIdentifier = parseUserIdentifier(username);
        
        ApiResponse<TaxProfessionalResponse> response = companyService.updateCompanyMember(memberTpin, request, userIdentifier);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/members/{memberTpin}")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<String>> deleteCompanyMember(
            @PathVariable String memberTpin,
            Authentication authentication) {
        String username = authentication.getName();
        
        // Parse COMPANY format: COMPANY:{companyId} or COMPANY:{companyId}:{adminTpin}
        String userIdentifier = parseUserIdentifier(username);
        
        ApiResponse<String> response = companyService.deleteCompanyMember(memberTpin, userIdentifier);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Parse user identifier from authentication name.
     * Handles COMPANY:{companyId} or COMPANY:{companyId}:{adminTpin} format.
     */
    private String parseUserIdentifier(String username) {
        if (username.startsWith("COMPANY:")) {
            String[] parts = username.split(":");
            if (parts.length >= 3) {
                // Has admin TPIN - return admin TPIN
                return parts[2];
            } else if (parts.length >= 2) {
                // No admin member - return companyId
                return parts[1];
            }
        }
        // Individual account or plain TPIN
        return username;
    }
}


