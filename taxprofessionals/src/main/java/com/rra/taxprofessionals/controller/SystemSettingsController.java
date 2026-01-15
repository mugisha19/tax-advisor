package com.rra.taxprofessionals.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.SystemLockHistoryResponse;
import com.rra.taxprofessionals.dto.SystemLockRequest;
import com.rra.taxprofessionals.dto.SystemStatusResponse;
import com.rra.taxprofessionals.model.Officer;
import com.rra.taxprofessionals.repository.OfficerRepository;
import com.rra.taxprofessionals.service.SystemSettingsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemSettingsController {

    private final SystemSettingsService systemSettingsService;
    private final OfficerRepository officerRepository;

    // ==================== PUBLIC ENDPOINT ====================
    
    /**
     * Get system status (public - for applicant frontend to check lock state)
     * Returns minimal information: just the lock status
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<SystemStatusResponse>> getSystemStatus() {
        SystemStatusResponse status = systemSettingsService.getSystemStatus();
        return ResponseEntity.ok(ApiResponse.success("System status retrieved", status));
    }

    // ==================== ADMIN ONLY ENDPOINTS ====================

    /**
     * Get detailed system status (admin only)
     */
    @GetMapping("/admin/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SystemStatusResponse>> getAdminSystemStatus() {
        SystemStatusResponse status = systemSettingsService.getSystemStatus();
        return ResponseEntity.ok(ApiResponse.success("System status retrieved", status));
    }

    /**
     * Lock the system (admin only)
     */
    @PostMapping("/admin/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SystemStatusResponse>> lockSystem(
            Authentication authentication,
            @RequestBody(required = false) SystemLockRequest request) {
        
        Officer officer = getOfficerFromAuth(authentication);
        String notes = request != null ? request.getNotes() : null;
        
        SystemStatusResponse status = systemSettingsService.lockSystem(
                officer.getOfficerId(),
                officer.getNames(),
                notes
        );
        
        log.info("System locked by admin: {} (ID: {})", officer.getNames(), officer.getOfficerId());
        return ResponseEntity.ok(ApiResponse.success("System has been locked successfully", status));
    }

    /**
     * Unlock the system (admin only)
     */
    @PostMapping("/admin/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SystemStatusResponse>> unlockSystem(
            Authentication authentication,
            @RequestBody(required = false) SystemLockRequest request) {
        
        Officer officer = getOfficerFromAuth(authentication);
        String notes = request != null ? request.getNotes() : null;
        
        SystemStatusResponse status = systemSettingsService.unlockSystem(
                officer.getOfficerId(),
                officer.getNames(),
                notes
        );
        
        log.info("System unlocked by admin: {} (ID: {})", officer.getNames(), officer.getOfficerId());
        return ResponseEntity.ok(ApiResponse.success("System has been unlocked successfully", status));
    }

    /**
     * Get lock/unlock history (admin only)
     */
    @GetMapping("/admin/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SystemLockHistoryResponse>>> getLockHistory() {
        List<SystemLockHistoryResponse> history = systemSettingsService.getLockHistory();
        return ResponseEntity.ok(ApiResponse.success("Lock history retrieved", history));
    }

    // ==================== HELPER METHODS ====================

    private Officer getOfficerFromAuth(Authentication authentication) {
        String employeeId = authentication.getName();
        return officerRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new RuntimeException("Officer not found: " + employeeId));
    }
}
