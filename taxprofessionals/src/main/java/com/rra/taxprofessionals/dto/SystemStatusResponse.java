package com.rra.taxprofessionals.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for returning system status information.
 * Used by both public endpoint (minimal info) and admin endpoint (full info).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemStatusResponse {

    /**
     * Whether the system is currently locked
     */
    private Boolean isSystemLocked;

    /**
     * Timestamp when the system was locked (null if unlocked)
     */
    private LocalDateTime lockedAt;

    /**
     * Name of the officer who locked the system (null if unlocked)
     */
    private String lockedByOfficerName;

    /**
     * Timestamp of last update to system settings
     */
    private LocalDateTime lastUpdatedAt;
}
