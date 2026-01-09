package com.rra.taxprofessionals.service.imp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rra.taxprofessionals.service.SmsService;

import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class SmsServiceImpl implements SmsService {

    @Value("${external.api.sms-base-url:http://192.168.14.147:8080}")
    private String smsBaseUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public SmsServiceImpl() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public boolean sendSms(String phoneNumber, String message) {
        try {
            if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
                log.warn("⚠️ Cannot send SMS: Phone number is null or empty");
                return false;
            }

            if (message == null || message.trim().isEmpty()) {
                log.warn("⚠️ Cannot send SMS: Message is null or empty");
                return false;
            }

            // Format phone number
            String formattedPhone = formatPhoneNumber(phoneNumber);
            log.info("📱 Attempting to send SMS to: {}", formattedPhone);

            // Prepare SMS request payload
            Map<String, String> smsRequest = new HashMap<>();
            smsRequest.put("phoneNumber", formattedPhone);
            smsRequest.put("smsBody", message);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Create request entity
            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(smsRequest, headers);

            // Send SMS request
            String smsEndpoint = smsBaseUrl + "/api/v1/sms/send";
            log.info("📤 Sending SMS to endpoint: {}", smsEndpoint);
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                smsEndpoint,
                requestEntity,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ SMS sent successfully to: {}", formattedPhone);
                return true;
            } else {
                log.error("❌ SMS API returned non-success status: {}", response.getStatusCode());
                return false;
            }

        } catch (Exception e) {
            log.error("❌ Failed to send SMS to {}: {}", phoneNumber, e.getMessage());
            log.error("Stack trace:", e);
            return false;
        }
    }

    @Override
    public String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return phoneNumber;
        }

        String trimmed = phoneNumber.trim();

        // If already starts with + or 0, return as is
        if (trimmed.startsWith("+") || trimmed.startsWith("0")) {
            return trimmed;
        }

        // Otherwise, prepend 0
        return "0" + trimmed;
    }
}
