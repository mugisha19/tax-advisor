package com.rra.taxprofessionals.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for manual reset request - RRA Special Permission
 * Allows officer to reset rejected applications back to REGISTERED status
 * while preserving full audit trail
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ManualResetRequest {
    
    /**
     * TPIN of the application to reset
     */
    private String tpin;
    
    /**
     * Reason for the manual reset
     * Examples:
     * - "RRA Special Permission - Extended Deadline"
     * - "System Unlock - Missed Application Period"
     * - "Administrative Override - Special Circumstances"
     */
    private String reason;
}
