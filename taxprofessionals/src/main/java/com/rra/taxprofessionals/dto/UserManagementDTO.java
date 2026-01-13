package com.rra.taxprofessionals.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserManagementDTO {
    private String id;
    private String type; // "INDIVIDUAL", "MEMBER", "COMPANY"
    private String tpin;
    private String nid;
    private String names;
    private String email;
    private String phoneNumber;
    private String companyName;
    private String companyTin;
    private Boolean hasSubmittedDocuments;
    private LocalDateTime createdAt;
    private Integer memberCount; // For companies only
}
