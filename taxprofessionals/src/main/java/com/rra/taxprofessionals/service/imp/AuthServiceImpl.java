// ============= AuthServiceImpl.java - CORRECTED =============
package com.rra.taxprofessionals.service.imp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.LoginRequest;
import com.rra.taxprofessionals.dto.LoginResponse;
import com.rra.taxprofessionals.security.JwtTokenProvider;
import com.rra.taxprofessionals.service.AuthService;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Override
    public ApiResponse<LoginResponse> login(LoginRequest loginRequest) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()));

            // Set authentication context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Generate JWT token
            String token = tokenProvider.generateToken(authentication);

            // Extract and clean role
            String role = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .findFirst()
                    .orElse("ROLE_OFFICER");

            // Clean role to remove any extra characters
            role = role.trim();

            // Debug logging (remove after fixing)
            System.out.println("DEBUG - Extracted role: '" + role + "'");
            System.out.println("DEBUG - Role length: " + role.length());

            // Extract account type and company ID from token
            String accountType = tokenProvider.getAccountTypeFromToken(token);
            String companyId = tokenProvider.getCompanyIdFromToken(token);
            
            // Get actual username (remove COMPANY: prefix if present)
            String username = authentication.getName();
            if (username.startsWith("COMPANY:")) {
                String[] parts = username.split(":");
                if (parts.length >= 3) {
                    username = parts[2]; // Admin TPIN
                } else if (parts.length >= 2) {
                    username = parts[1]; // Company ID as fallback
                }
            }

            // Create login response with account type
            LoginResponse loginResponse = new LoginResponse(
                    token,
                    username,
                    role,
                    accountType != null ? accountType : "INDIVIDUAL",
                    companyId);

            // ✅ Your ApiResponse.success() expects (String message, T data)
            return ApiResponse.success("Login successful", loginResponse);

        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid username or password");
        } catch (Exception e) {
            throw new RuntimeException("Authentication failed: " + e.getMessage(), e);
        }
    }
}