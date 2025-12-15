package com.rra.taxprofessionals.service;

import com.rra.taxprofessionals.dto.ApiResponse;

public interface ExternalSupplierService {
    
    /**
     * Fetch supplier details from external API by TIN
     * @param tin Supplier TIN
     * @return Supplier details from external system
     */
    ApiResponse<Object> getSupplierByTin(String tin);
    
    /**
     * Refresh access token using refresh token
     * @return Authentication response with new tokens
     */
    ApiResponse<Object> authenticate();
    
    /**
     * Get current refresh token (for monitoring/debugging)
     * @return Current refresh token
     */
    String getCurrentRefreshToken();
}

