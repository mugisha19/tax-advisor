package com.rra.taxprofessionals.service;

import java.util.List;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.ApplicationReviewRequest;
import com.rra.taxprofessionals.dto.OfficerCreationRequest;
import com.rra.taxprofessionals.dto.OfficerResponse;
import com.rra.taxprofessionals.dto.OfficerUpdateRequest;
import com.rra.taxprofessionals.dto.SetPasswordRequest;
import com.rra.taxprofessionals.dto.TaxProfessionalResponse;
import com.rra.taxprofessionals.dto.ValidateInvitationResponse;
import com.rra.taxprofessionals.enums.ApplicationStatus;

public interface OfficerService {

    ApiResponse<OfficerResponse> createOfficer(OfficerCreationRequest request);

    ApiResponse<OfficerResponse> updateOfficer(Long officerId, OfficerUpdateRequest request);

    ApiResponse<TaxProfessionalResponse> reviewApplication(String employeeId, ApplicationReviewRequest request);

    ApiResponse<List<TaxProfessionalResponse>> getApplicationsReviewedByOfficer(String employeeId);

    ApiResponse<List<TaxProfessionalResponse>> getApplicationsByStatusAndOfficer(ApplicationStatus status, String employeeId);

    ApiResponse<List<TaxProfessionalResponse>> getAllApplications();

    ApiResponse<List<TaxProfessionalResponse>> getApplicationsByOfficer(String employeeId);

    ApiResponse<List<TaxProfessionalResponse>> getApplicationsByStatus(ApplicationStatus status);

    ApiResponse<OfficerResponse> getOfficerByEmployeeId(String employeeId);

    ApiResponse<List<OfficerResponse>> getAllOfficers();

    ApiResponse<String> deleteOfficer(Long officerId);

    // ========== NEW METHODS FOR INVITATION FLOW ==========
    ApiResponse<ValidateInvitationResponse> validateInvitationToken(String token);

    ApiResponse<String> setPassword(SetPasswordRequest request);

    ApiResponse<String> resetOfficerPassword(Long officerId, String newPassword);

    // ========== PASSWORD RESET FLOW ==========
    ApiResponse<String> forgotPassword(String identifier); // Can be TIN or Email
}
