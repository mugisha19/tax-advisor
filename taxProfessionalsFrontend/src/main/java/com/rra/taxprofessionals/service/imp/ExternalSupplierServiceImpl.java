package com.rra.taxprofessionals.service.imp;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.service.ExternalSupplierService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ExternalSupplierServiceImpl implements ExternalSupplierService {

    @Value("${external.api.auth-base-url}")
    private String authBaseUrl;

    @Value("${external.api.supplier-base-url}")
    private String supplierBaseUrl;

    @Value("${external.api.refresh-token}")
    private String initialRefreshToken;

    @Value("${external.api.refresh-endpoint}")
    private String refreshEndpoint;

    @Value("${external.api.supplier-endpoint}")
    private String supplierEndpoint;

    private String cachedAccessToken;
    private String cachedRefreshToken;  // Store current refresh token
    private LocalDateTime tokenExpiryTime;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Initialize the refresh token from configuration
     */
    @jakarta.annotation.PostConstruct
    private void init() {
        cachedRefreshToken = initialRefreshToken;
        log.info("🔑 External API Service initialized with refresh token");
    }

    @Override
    public ApiResponse<Object> authenticate() {
        try {
            log.info("🔄 Refreshing access token with external API...");
            
            String refreshUrl = authBaseUrl + refreshEndpoint;
            log.debug("Refresh URL: {}", refreshUrl);
            log.debug("Using refresh token: {}...", cachedRefreshToken != null ? cachedRefreshToken.substring(0, 20) : "null");

            // Create headers with Bearer token
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            headers.set("Authorization", "Bearer " + cachedRefreshToken);
            
            log.debug("Sending GET request with Authorization: Bearer {token}");
            
            // Create request entity (no body for GET)
            HttpEntity<String> requestEntity = new HttpEntity<>(headers);

            // Make GET request to refresh token endpoint
            ResponseEntity<Map> response = restTemplate.exchange(
                refreshUrl,
                HttpMethod.GET,
                requestEntity,
                Map.class
            );

            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody != null && responseBody.get("MessageCode").equals(1)) {
                Map<String, Object> responseObject = (Map<String, Object>) responseBody.get("ResponseObject");
                
                // Get new access token
                cachedAccessToken = (String) responseObject.get("AccessToken");
                
                // Get and store new refresh token for future use
                String newRefreshToken = (String) responseObject.get("RefreshToken");
                if (newRefreshToken != null && !newRefreshToken.isEmpty()) {
                    cachedRefreshToken = newRefreshToken;
                    log.info("🔑 Updated refresh token for future use");
                    log.debug("New refresh token: {}...", newRefreshToken.substring(0, 20));
                }
                
                // Set token expiry (assume 24 hours, refresh at 23 hours)
                tokenExpiryTime = LocalDateTime.now().plusHours(23);
                
                log.info("✅ Successfully refreshed access token");
                log.debug("Access Token: {}...", cachedAccessToken != null ? cachedAccessToken.substring(0, 20) : "null");
                
                return ApiResponse.success("Successfully refreshed access token", responseBody);
            } else {
                log.error("❌ Token refresh failed: {}", responseBody);
                return ApiResponse.error("Failed to refresh access token");
            }

        } catch (Exception e) {
            log.error("❌ Error refreshing access token: {}", e.getMessage(), e);
            return ApiResponse.error("Error connecting to external API: " + e.getMessage());
        }
    }

    @Override
    public ApiResponse<Object> getSupplierByTin(String tin) {
        try {
            log.info("📋 Fetching supplier details for TIN: {}", tin);
            
            // Check if we have a valid token
            if (cachedAccessToken == null || isTokenExpired()) {
                log.info("🔄 No valid token, authenticating...");
                ApiResponse<Object> authResponse = authenticate();
                if (!authResponse.getSuccess()) {
                    return authResponse;
                }
            }

            // Build supplier URL (using different base URL)
            String supplierUrl = supplierBaseUrl + supplierEndpoint + "/" + tin;
            log.debug("Supplier URL: {}", supplierUrl);

            // Create headers with JWT token
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + cachedAccessToken);
            headers.set("Content-Type", "application/json");

            // Create request entity
            HttpEntity<String> requestEntity = new HttpEntity<>(headers);

            // Make GET request to external supplier endpoint
            ResponseEntity<Map> response = restTemplate.exchange(
                supplierUrl,
                HttpMethod.GET,
                requestEntity,
                Map.class
            );

            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody != null && responseBody.get("MessageCode").equals(1)) {
                log.info("✅ Successfully fetched supplier details for TIN: {}", tin);
                return ApiResponse.success("Supplier details retrieved successfully", responseBody.get("ResponseObject"));
            } else {
                log.error("❌ Failed to fetch supplier: {}", responseBody);
                return ApiResponse.error("Failed to retrieve supplier details");
            }

        } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized e) {
            log.warn("⚠️  Token expired or unauthorized, re-authenticating...");
            // Clear cached token and retry
            cachedAccessToken = null;
            return getSupplierByTin(tin); // Retry once
            
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            // Handle 4xx errors from external API (like 404 Not Found)
            log.error("❌ External API returned error {}: {}", e.getStatusCode(), e.getMessage());
            String errorMessage = "Supplier not found with TIN: " + tin;
            
            // Try to parse error response from external API
            try {
                String responseBody = e.getResponseBodyAsString();
                if (responseBody != null && !responseBody.isEmpty()) {
                    log.debug("External API error response: {}", responseBody);
                    errorMessage = "External API error: " + responseBody;
                }
            } catch (Exception ex) {
                log.debug("Could not parse external API error response");
            }
            
            return ApiResponse.error(errorMessage);
            
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            // Handle 5xx errors from external API
            log.error("❌ External API server error {}: {}", e.getStatusCode(), e.getMessage());
            return ApiResponse.error("External API is currently unavailable. Please try again later.");
            
        } catch (Exception e) {
            log.error("❌ Error fetching supplier details: {}", e.getMessage(), e);
            return ApiResponse.error("Error retrieving supplier details: " + e.getMessage());
        }
    }

    /**
     * Check if the cached token is expired
     */
    private boolean isTokenExpired() {
        return tokenExpiryTime == null || LocalDateTime.now().isAfter(tokenExpiryTime);
    }

    /**
     * Get current refresh token (for monitoring/logging purposes)
     */
    public String getCurrentRefreshToken() {
        return cachedRefreshToken;
    }
}

