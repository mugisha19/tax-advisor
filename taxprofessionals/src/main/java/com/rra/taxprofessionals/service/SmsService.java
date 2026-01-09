package com.rra.taxprofessionals.service;

public interface SmsService {
    /**
     * Send SMS to the given phone number
     * @param phoneNumber - Phone number (will be auto-formatted)
     * @param message - SMS body content
     * @return true if SMS sent successfully, false otherwise
     */
    boolean sendSms(String phoneNumber, String message);
    
    /**
     * Format phone number to ensure proper format
     * Adds leading 0 if number doesn't start with + or 0
     * @param phoneNumber - Raw phone number
     * @return formatted phone number
     */
    String formatPhoneNumber(String phoneNumber);
}
