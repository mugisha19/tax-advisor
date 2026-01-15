package com.rra.taxprofessionals.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for returning system lock history records.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemLockHistoryResponse {

    private Long id;

    /**
     * The action performed: "LOCKED" or "UNLOCKED"
     */
    private String action;

    /**
     * Name of the officer who performed the action
     */
    private String performedByName;

    /**
     * Timestamp when the action was performed
     */
    private LocalDateTime performedAt;

    /**
     * Optional notes or reason for the action
     */
    private String notes;
}
