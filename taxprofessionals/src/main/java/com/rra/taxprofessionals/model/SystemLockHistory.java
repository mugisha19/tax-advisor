package com.rra.taxprofessionals.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity to track history of system lock/unlock events.
 * Records who locked/unlocked the system and when.
 */
@Entity
@Table(name = "system_lock_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemLockHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The action performed: LOCKED or UNLOCKED
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LockAction action;

    /**
     * Officer ID who performed the action (null for system-generated records)
     */
    @Column
    private Long performedByOfficerId;

    /**
     * Name of the officer who performed the action (or "System" for initial record)
     */
    @Column(nullable = false)
    private String performedByName;

    /**
     * Timestamp when the action was performed
     */
    @Column(nullable = false)
    private LocalDateTime performedAt;

    /**
     * Optional notes or reason for the action
     */
    @Column(length = 500)
    private String notes;

    /**
     * Enum for lock actions
     */
    public enum LockAction {
        LOCKED,
        UNLOCKED
    }
}
