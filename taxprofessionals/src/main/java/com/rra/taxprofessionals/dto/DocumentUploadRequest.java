package com.rra.taxprofessionals.dto;

import com.rra.taxprofessionals.enums.DocumentType;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DocumentUploadRequest {

    @NotBlank(message = "TPIN is required")
    private String tpin;

    @NotNull(message = "Document type is required")
    private DocumentType documentType;
}
