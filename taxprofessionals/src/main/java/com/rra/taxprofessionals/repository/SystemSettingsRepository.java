package com.rra.taxprofessionals.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.rra.taxprofessionals.model.SystemSettings;

@Repository
public interface SystemSettingsRepository extends JpaRepository<SystemSettings, Long> {

    /**
     * Find the first (and should be only) system settings record
     */
    Optional<SystemSettings> findFirstByOrderByIdAsc();
}
