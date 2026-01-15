package com.rra.taxprofessionals.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request DTO for locking/unlocking the system.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SystemLockRequest {

    /**
     * Optional notes or reason for the lock/unlock action
     */
    private String notes;
}
