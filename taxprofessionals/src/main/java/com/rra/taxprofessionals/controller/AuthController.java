package com.rra.taxprofessionals.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.ForgotPasswordRequest;
import com.rra.taxprofessionals.dto.LoginRequest;
import com.rra.taxprofessionals.dto.LoginResponse;
import com.rra.taxprofessionals.dto.SetPasswordRequest;
import com.rra.taxprofessionals.dto.ValidateInvitationRequest;
import com.rra.taxprofessionals.dto.ValidateInvitationResponse;
import com.rra.taxprofessionals.service.AuthService;
import com.rra.taxprofessionals.service.OfficerService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private OfficerService officerService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        ApiResponse<LoginResponse> response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate-invitation")
    public ResponseEntity<ApiResponse<ValidateInvitationResponse>> validateInvitation(
            @Valid @RequestBody ValidateInvitationRequest request) {
        ApiResponse<ValidateInvitationResponse> response = officerService.validateInvitationToken(request.getToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/set-password")
    public ResponseEntity<ApiResponse<String>> setPassword(@Valid @RequestBody SetPasswordRequest request) {
        log.info("📝 Received set-password request");
        log.info("   Token present: {}", request.getToken() != null);
        log.info("   Token length: {}", request.getToken() != null ? request.getToken().length() : 0);
        log.info("   Password present: {}", request.getPassword() != null);
        log.info("   Password length: {}", request.getPassword() != null ? request.getPassword().length() : 0);

        try {
            ApiResponse<String> response = officerService.setPassword(request);
            log.info("✅ Password set successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Failed to set password: {}", e.getMessage());
            log.error("   Exception type: {}", e.getClass().getSimpleName());
            throw e;
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("📧 Received forgot password request for identifier: {}", request.getIdentifier());

        try {
            ApiResponse<String> response = officerService.forgotPassword(request.getIdentifier());
            log.info("✅ Forgot password request processed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Failed to process forgot password request: {}", e.getMessage());
            log.error("   Exception type: {}", e.getClass().getSimpleName());
            throw e;
        }
    }
}
