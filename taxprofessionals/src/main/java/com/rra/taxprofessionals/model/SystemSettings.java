package com.rra.taxprofessionals.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Singleton entity to store system-wide settings.
 * Only one record should exist in the database.
 */
@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Indicates whether the system is locked.
     * When locked, new signups, applications, and member additions are blocked.
     * Default is FALSE (unlocked).
     */
    @Column(nullable = false)
    private Boolean isSystemLocked = false;

    /**
     * Timestamp when the system was locked (null if unlocked)
     */
    @Column
    private LocalDateTime lockedAt;

    /**
     * Officer ID who locked the system (null if unlocked)
     */
    @Column
    private Long lockedByOfficerId;

    /**
     * Name of the officer who locked the system (for display purposes)
     */
    @Column
    private String lockedByOfficerName;

    /**
     * Record creation timestamp
     */
    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * Last modification timestamp
     */
    @Column
    private LocalDateTime updatedAt;
}
