package com.rra.taxprofessionals.service;

import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.AddCompanyMemberRequest;
import com.rra.taxprofessionals.dto.CompanyRegistrationRequest;
import com.rra.taxprofessionals.dto.ProfessionalQualificationRequest;
import com.rra.taxprofessionals.dto.RegistrationRequest;
import com.rra.taxprofessionals.dto.SignupTypeRequest;
import com.rra.taxprofessionals.dto.TaxProfessionalResponse;
import com.rra.taxprofessionals.enums.ApplicationStatus;

public interface TaxProfessionalService {

    ApiResponse<TaxProfessionalResponse> registerIndividual(RegistrationRequest request);

    ApiResponse<List<TaxProfessionalResponse>> registerCompany(CompanyRegistrationRequest request);

    ApiResponse<TaxProfessionalResponse> getApplicationByTpin(String tpin);

    ApiResponse<TaxProfessionalResponse> getApplicationByTin(String tin);

    ApiResponse<List<TaxProfessionalResponse>> getAllApplications();

    ApiResponse<List<TaxProfessionalResponse>> getApplicationsByStatus(ApplicationStatus status);

    ApiResponse<String> uploadOtherProfessionalDocument(String tpin, MultipartFile file);

    ApiResponse<TaxProfessionalResponse> updateProfessionalQualifications(String tpin, ProfessionalQualificationRequest request);

    /**
     * Download certificate PDF for approved/rejected application
     */
    ApiResponse<Resource> downloadCertificate(String tpin, String authenticatedUserTpin);

    /**
     * Download certificate for any tax professional (Officer/Admin access)
     */
    ApiResponse<Resource> getCertificateByTpin(String tpin);

    /**
     * Get current authenticated tax professional details
     */
    ApiResponse<TaxProfessionalResponse> getCurrentUser(String authenticatedUserTpin);

    /**
     * Determine and validate signup type
     */
    ApiResponse<String> determineSignupType(SignupTypeRequest request);

    /**
     * Add a new member to an existing company
     */
    ApiResponse<TaxProfessionalResponse> addCompanyMember(String companyTin, AddCompanyMemberRequest request);

    /**
     * Resubmit a rejected application by changing status to PENDING
     */
    ApiResponse<TaxProfessionalResponse> resubmitApplication(String tpin);
}
