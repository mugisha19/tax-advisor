// ============= LoginResponse.java - FIXED =============
package com.rra.taxprofessionals.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String type = "Bearer";
    private String username;
    private String role;
    private String accountType; // "INDIVIDUAL" or "COMPANY"
    private String companyId; // Only populated for COMPANY accounts

    // Custom constructor that properly sets the type
    public LoginResponse(String token, String username, String role) {
        this.token = token;
        this.type = "Bearer"; // ✅ Make sure type is set
        this.username = username;
        this.role = role;
    }

    // Constructor with account type
    public LoginResponse(String token, String username, String role, String accountType, String companyId) {
        this.token = token;
        this.type = "Bearer";
        this.username = username;
        this.role = role;
        this.accountType = accountType;
        this.companyId = companyId;
    }

    // Ensure role is always clean when retrieved
    public String getRole() {
        if (role == null) {
            return null;
        }
        return role.trim();
    }
}