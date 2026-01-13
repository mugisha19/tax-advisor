package com.rra.taxprofessionals.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminPasswordResetResponse {
    private String maskedEmail;
    private String maskedPhone;
    private String resetUrl;
    private String contactUsed; // "EMAIL" or "SMS"
    private String message;
}
