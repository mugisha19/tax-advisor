package com.rra.taxprofessionals.controller;

import com.rra.taxprofessionals.dto.AdminPasswordResetResponse;
import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.UserManagementDTO;
import com.rra.taxprofessionals.dto.UserUpdateRequest;
import com.rra.taxprofessionals.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserManagementService userManagementService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserManagementDTO>>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean hasSubmittedDocuments,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<UserManagementDTO> users = userManagementService.getAllUsers(search, type, hasSubmittedDocuments, page, size);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserManagementDTO>> getUserById(
            @PathVariable String id,
            @RequestParam String type
    ) {
        UserManagementDTO user = userManagementService.getUserById(id, type);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserManagementDTO>> updateUser(
            @PathVariable String id,
            @RequestParam String type,
            @RequestBody UserUpdateRequest request
    ) {
        UserManagementDTO user = userManagementService.updateUser(id, type, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", user));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<AdminPasswordResetResponse>> resetUserPassword(
            @PathVariable String id,
            @RequestParam String type
    ) {
        AdminPasswordResetResponse response = userManagementService.resetUserPassword(id, type);
        return ResponseEntity.ok(ApiResponse.success("Password reset link generated", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable String id,
            @RequestParam String type
    ) {
        userManagementService.deleteUser(id, type);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }
}
