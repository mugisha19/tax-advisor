package com.rra.taxprofessionals.service;

import com.rra.taxprofessionals.dto.AdminPasswordResetResponse;
import com.rra.taxprofessionals.dto.UserManagementDTO;
import com.rra.taxprofessionals.dto.UserUpdateRequest;
import org.springframework.data.domain.Page;

public interface UserManagementService {
    
    Page<UserManagementDTO> getAllUsers(
        String search,
        String type,
        Boolean hasSubmittedDocuments,
        int page,
        int size
    );
    
    UserManagementDTO getUserById(String id, String type);
    
    UserManagementDTO updateUser(String id, String type, UserUpdateRequest request);
    
    AdminPasswordResetResponse resetUserPassword(String id, String type);
    
    void deleteUser(String id, String type);
}
