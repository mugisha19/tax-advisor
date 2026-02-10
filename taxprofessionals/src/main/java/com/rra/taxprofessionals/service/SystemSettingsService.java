package com.rra.taxprofessionals.service;

import java.util.List;

import com.rra.taxprofessionals.dto.SystemLockHistoryResponse;
import com.rra.taxprofessionals.dto.SystemStatusResponse;

/**
 * Service interface for managing system settings (lock/unlock).
 */
public interface SystemSettingsService {

    /**
     * Get the current system status (lock state)
     * 
     * @return SystemStatusResponse with current status
     */
    SystemStatusResponse getSystemStatus();

    /**
     * Check if the system is currently locked
     * 
     * @return true if locked, false otherwise
     */
    boolean isSystemLocked();

    /**
     * Validate that the system is not locked.
     * Throws SystemLockedException if the system is locked.
     * 
     * @throws SystemLockedException if system is locked
     */
    void validateSystemNotLocked();

    /**
     * Lock the system (admin only)
     * 
     * @param officerId ID of the officer performing the action
     * @param officerName Name of the officer
     * @param notes Optional notes/reason
     * @return Updated system status
     */
    SystemStatusResponse lockSystem(Long officerId, String officerName, String notes);

    /**
     * Unlock the system (admin only)
     * 
     * @param officerId ID of the officer performing the action
     * @param officerName Name of the officer
     * @param notes Optional notes/reason
     * @return Updated system status
     */
    SystemStatusResponse unlockSystem(Long officerId, String officerName, String notes);

    /**
     * Get lock/unlock history
     * 
     * @return List of history records ordered by most recent first
     */
    List<SystemLockHistoryResponse> getLockHistory();

    /**
     * Initialize default system settings if not exists
     * Creates the initial record with system unlocked
     */
    void initializeDefaultSettings();
}
