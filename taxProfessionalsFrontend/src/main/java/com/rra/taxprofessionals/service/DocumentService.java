package com.rra.taxprofessionals.service;

import java.util.List;
import java.util.Map;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.DocumentResponse;
import com.rra.taxprofessionals.enums.BachelorDegree;
import com.rra.taxprofessionals.enums.DocumentType;
import com.rra.taxprofessionals.enums.ProfessionalQualification;

public interface DocumentService {

    // CREATE
    ApiResponse<DocumentResponse> uploadDocument(String tpin, DocumentType documentType, MultipartFile file);
    
    // Overloaded method with metadata for education certificates
    ApiResponse<DocumentResponse> uploadDocument(String tpin, DocumentType documentType, MultipartFile file,
            String certificateType, BachelorDegree bachelorDegree, ProfessionalQualification professionalQualification,
            String otherProfessionalQualification, String mastersDegreeName);

    // ADD THIS METHOD 👇
    ApiResponse<List<DocumentResponse>> uploadMultipleDocuments(String tpin, Map<DocumentType, MultipartFile> documents);

    // READ
    ApiResponse<List<DocumentResponse>> getDocumentsByTpin(String tpin);

    ApiResponse<DocumentResponse> getDocumentById(Long docId);

    ApiResponse<DocumentResponse> getDocumentByTypeAndTpin(String tpin, DocumentType documentType);

    ApiResponse<Resource> downloadDocument(Long docId);

    ApiResponse<List<DocumentResponse>> getDocumentsByTpinAndVerificationStatus(String tpin, Boolean isVerified);

    ApiResponse<List<DocumentResponse>> getAllDocuments();

    ApiResponse<Long> getDocumentCountByTpin(String tpin);

    // UPDATE
    ApiResponse<String> verifyDocument(Long docId);

    ApiResponse<String> unverifyDocument(Long docId);

    ApiResponse<DocumentResponse> updateDocument(Long docId, MultipartFile file);

    ApiResponse<DocumentResponse> updateRejectedDocument(Long docId, MultipartFile file, DocumentType documentType);

    ApiResponse<DocumentResponse> updateRejectedDocument(Long docId, MultipartFile file, DocumentType documentType,
            String certificateType, BachelorDegree bachelorDegree, ProfessionalQualification professionalQualification,
            String otherProfessionalQualification, String mastersDegreeName);

    // DELETE
    ApiResponse<String> deleteDocument(Long docId);

    ApiResponse<String> deleteAllDocumentsByTpin(String tpin);

    ApiResponse<String> deleteDocumentByTypeAndTpin(String tpin, DocumentType documentType);
}
