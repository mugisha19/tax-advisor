package com.rra.taxprofessionals.service.imp;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rra.taxprofessionals.dto.SystemLockHistoryResponse;
import com.rra.taxprofessionals.dto.SystemStatusResponse;
import com.rra.taxprofessionals.model.SystemLockHistory;
import com.rra.taxprofessionals.model.SystemLockHistory.LockAction;
import com.rra.taxprofessionals.model.SystemSettings;
import com.rra.taxprofessionals.repository.SystemLockHistoryRepository;
import com.rra.taxprofessionals.repository.SystemSettingsRepository;
import com.rra.taxprofessionals.service.SystemSettingsService;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemSettingsServiceImpl implements SystemSettingsService {

    private final SystemSettingsRepository systemSettingsRepository;
    private final SystemLockHistoryRepository systemLockHistoryRepository;

    @PostConstruct
    public void init() {
        initializeDefaultSettings();
    }

    @Override
    @Transactional
    public void initializeDefaultSettings() {
        // Check if settings already exist
        if (systemSettingsRepository.findFirstByOrderByIdAsc().isEmpty()) {
            log.info("Initializing default system settings...");
            
            // Create default settings (unlocked)
            SystemSettings settings = new SystemSettings();
            settings.setIsSystemLocked(false);
            settings.setLockedAt(null);
            settings.setLockedByOfficerId(null);
            settings.setLockedByOfficerName(null);
            settings.setCreatedAt(LocalDateTime.of(2025, 12, 30, 0, 0, 0)); // Dec 30, 2025 12:00 AM
            settings.setUpdatedAt(LocalDateTime.of(2025, 12, 30, 0, 0, 0));
            systemSettingsRepository.save(settings);

            // Create initial history record
            SystemLockHistory initialHistory = SystemLockHistory.builder()
                    .action(LockAction.UNLOCKED)
                    .performedByOfficerId(null)
                    .performedByName("System")
                    .performedAt(LocalDateTime.of(2025, 12, 30, 0, 0, 0)) // Dec 30, 2025 12:00 AM
                    .notes("Initial system setup - system unlocked by default")
                    .build();
            systemLockHistoryRepository.save(initialHistory);

            log.info("Default system settings initialized successfully");
        }
    }

    @Override
    public SystemStatusResponse getSystemStatus() {
        SystemSettings settings = getOrCreateSettings();
        return mapToStatusResponse(settings);
    }

    @Override
    public boolean isSystemLocked() {
        SystemSettings settings = getOrCreateSettings();
        return Boolean.TRUE.equals(settings.getIsSystemLocked());
    }

    @Override
    @Transactional
    public SystemStatusResponse lockSystem(Long officerId, String officerName, String notes) {
        SystemSettings settings = getOrCreateSettings();

        // Already locked - no action needed
        if (Boolean.TRUE.equals(settings.getIsSystemLocked())) {
            log.warn("System is already locked. No action taken.");
            return mapToStatusResponse(settings);
        }

        // Lock the system
        LocalDateTime now = LocalDateTime.now();
        settings.setIsSystemLocked(true);
        settings.setLockedAt(now);
        settings.setLockedByOfficerId(officerId);
        settings.setLockedByOfficerName(officerName);
        settings.setUpdatedAt(now);
        systemSettingsRepository.save(settings);

        // Record history
        SystemLockHistory history = SystemLockHistory.builder()
                .action(LockAction.LOCKED)
                .performedByOfficerId(officerId)
                .performedByName(officerName)
                .performedAt(now)
                .notes(notes)
                .build();
        systemLockHistoryRepository.save(history);

        log.info("System locked by {} (ID: {})", officerName, officerId);
        return mapToStatusResponse(settings);
    }

    @Override
    @Transactional
    public SystemStatusResponse unlockSystem(Long officerId, String officerName, String notes) {
        SystemSettings settings = getOrCreateSettings();

        // Already unlocked - no action needed
        if (Boolean.FALSE.equals(settings.getIsSystemLocked())) {
            log.warn("System is already unlocked. No action taken.");
            return mapToStatusResponse(settings);
        }

        // Unlock the system
        LocalDateTime now = LocalDateTime.now();
        settings.setIsSystemLocked(false);
        settings.setLockedAt(null);
        settings.setLockedByOfficerId(null);
        settings.setLockedByOfficerName(null);
        settings.setUpdatedAt(now);
        systemSettingsRepository.save(settings);

        // Record history
        SystemLockHistory history = SystemLockHistory.builder()
                .action(LockAction.UNLOCKED)
                .performedByOfficerId(officerId)
                .performedByName(officerName)
                .performedAt(now)
                .notes(notes)
                .build();
        systemLockHistoryRepository.save(history);

        log.info("System unlocked by {} (ID: {})", officerName, officerId);
        return mapToStatusResponse(settings);
    }

    @Override
    public List<SystemLockHistoryResponse> getLockHistory() {
        return systemLockHistoryRepository.findAllByOrderByPerformedAtDesc()
                .stream()
                .map(this::mapToHistoryResponse)
                .collect(Collectors.toList());
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private SystemSettings getOrCreateSettings() {
        return systemSettingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> {
                    initializeDefaultSettings();
                    return systemSettingsRepository.findFirstByOrderByIdAsc()
                            .orElseThrow(() -> new RuntimeException("Failed to initialize system settings"));
                });
    }

    private SystemStatusResponse mapToStatusResponse(SystemSettings settings) {
        return SystemStatusResponse.builder()
                .isSystemLocked(settings.getIsSystemLocked())
                .lockedAt(settings.getLockedAt())
                .lockedByOfficerName(settings.getLockedByOfficerName())
                .lastUpdatedAt(settings.getUpdatedAt())
                .build();
    }

    private SystemLockHistoryResponse mapToHistoryResponse(SystemLockHistory history) {
        return SystemLockHistoryResponse.builder()
                .id(history.getId())
                .action(history.getAction().name())
                .performedByName(history.getPerformedByName())
                .performedAt(history.getPerformedAt())
                .notes(history.getNotes())
                .build();
    }
}
