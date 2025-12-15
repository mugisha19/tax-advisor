package com.rra.taxprofessionals.model;

import java.time.LocalDateTime;

import com.rra.taxprofessionals.enums.OfficerType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "officers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Officer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long officerId;

    @Column(nullable = false, unique = true)
    private String employeeId;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String names;

    @Column
    private String department;

    @Column // Made nullable to support invitation flow
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfficerType officerType;

    @Column(unique = true)
    private String invitationToken;

    @Column
    private LocalDateTime tokenExpiry;

    @Column(unique = true)
    private String resetToken;

    @Column
    private LocalDateTime resetTokenExpiry;

    @Column(nullable = false)
    private Boolean isActivated = false;

    @Column
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime activatedAt;
}
