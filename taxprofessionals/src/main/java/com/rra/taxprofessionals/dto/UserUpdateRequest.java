package com.rra.taxprofessionals.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    private String names;
    private String email;
    private String phoneNumber;
    private String companyName; // For companies only
}
