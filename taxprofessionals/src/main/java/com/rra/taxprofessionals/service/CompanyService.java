package com.rra.taxprofessionals.service;

import java.util.List;

import com.rra.taxprofessionals.dto.AddCompanyMemberRequest;
import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.CompanyMemberResponse;
import com.rra.taxprofessionals.dto.CompanyRegistrationRequest;
import com.rra.taxprofessionals.dto.TaxProfessionalResponse;
import com.rra.taxprofessionals.dto.UpdateCompanyMemberRequest;
import com.rra.taxprofessionals.model.Company;

public interface CompanyService {

    /**
     * Register a new company with admin member and other members
     */
    ApiResponse<List<TaxProfessionalResponse>> registerCompany(CompanyRegistrationRequest request);

    /**
     * Get company by TIN
     */
    Company getCompanyByTin(String companyTin);

    /**
     * Get all members of a company (any authenticated company user)
     */
    ApiResponse<List<CompanyMemberResponse>> getCompanyMembers(String companyId, String userTpin);

    /**
     * Add a new member to an existing company (any authenticated company user)
     */
    ApiResponse<TaxProfessionalResponse> addCompanyMember(String companyId, AddCompanyMemberRequest request, String userTpin);

    /**
     * Update an existing company member (only company admin)
     */
    ApiResponse<TaxProfessionalResponse> updateCompanyMember(String memberTpin, UpdateCompanyMemberRequest request, String userTpin);

    /**
     * Delete a company member (only company admin)
     */
    ApiResponse<String> deleteCompanyMember(String memberTpin, String userTpin);
}


