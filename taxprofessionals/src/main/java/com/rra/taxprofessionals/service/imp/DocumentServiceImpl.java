package com.rra.taxprofessionals.service.imp;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.DocumentResponse;
import com.rra.taxprofessionals.enums.ApplicationStatus;
import com.rra.taxprofessionals.enums.BachelorDegree;
import com.rra.taxprofessionals.enums.DocumentType;
import com.rra.taxprofessionals.enums.ProfessionalQualification;
import com.rra.taxprofessionals.exception.FileStorageException;
import com.rra.taxprofessionals.exception.InvalidRequestException;
import com.rra.taxprofessionals.exception.ResourceNotFoundException;
import com.rra.taxprofessionals.model.Document;
import com.rra.taxprofessionals.model.DocumentRejection;
import com.rra.taxprofessionals.model.TaxProfessional;
import com.rra.taxprofessionals.repository.DocumentRejectionRepository;
import com.rra.taxprofessionals.repository.DocumentRepository;
import com.rra.taxprofessionals.repository.TaxProfessionalRepository;
import com.rra.taxprofessionals.service.DocumentService;

@Service
@Transactional
public class DocumentServiceImpl implements DocumentService {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private TaxProfessionalRepository taxProfessionalRepository;

    @Autowired
    private DocumentRejectionRepository documentRejectionRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    // ==================== RESUBMISSION LIMIT ERROR MESSAGES ====================
    private static final String RESUBMISSION_LIMIT_ERROR_INDIVIDUAL
            = "Application Rejected - Resubmission Not Available. "
            + "Your application has been rejected for the second time. "
            + "You have already used your one-time resubmission opportunity after the first rejection. "
            + "Unfortunately, no further resubmissions are allowed for this individual application. "
            + "Please contact the Rwanda Revenue Authority for guidance on how to proceed with a new application.";

    private static final String RESUBMISSION_LIMIT_ERROR_COMPANY_MEMBER
            = "Application Rejected - Resubmission Not Available. "
            + "Your application has been rejected for the second time. "
            + "You have already used your one-time resubmission opportunity after the first rejection. "
            + "Unfortunately, no further resubmissions are allowed for this company member application. "
            + "Please contact the Rwanda Revenue Authority for guidance on how to proceed with a new application.";
    
    // ==================== RESUBMISSION DEADLINE EXPIRED ERROR MESSAGES ====================
    private static final String RESUBMISSION_DEADLINE_EXPIRED_INDIVIDUAL
            = "Application Rejected - Resubmission Period Expired. "
            + "The 3 working day window for resubmitting your application has passed. "
            + "After your first rejection, you had 3 working days (excluding weekends) to resubmit your corrected documents. "
            + "Unfortunately, this deadline has now expired and resubmission is no longer available for this individual application. "
            + "Please contact the Rwanda Revenue Authority for assistance with starting a new application.";

    private static final String RESUBMISSION_DEADLINE_EXPIRED_COMPANY_MEMBER
            = "Application Rejected - Resubmission Period Expired. "
            + "The 3 working day window for resubmitting your application has passed. "
            + "After your first rejection, you had 3 working days (excluding weekends) to resubmit your corrected documents. "
            + "Unfortunately, this deadline has now expired and resubmission is no longer available for this company member application. "
            + "Please contact the Rwanda Revenue Authority for assistance with starting a new application.";
    // ============================================================================

    /**
     * Gets the appropriate resubmission limit error message based on
     * application type and reason for blocking
     *
     * @param taxProfessional the tax professional entity
     * @return the appropriate error message
     */
    private String getResubmissionLimitErrorMessage(TaxProfessional taxProfessional) {
        // Check if deadline has passed (first priority)
        if (taxProfessional.isResubmissionDeadlinePassed()) {
            if (taxProfessional.isIndividualApplication()) {
                return RESUBMISSION_DEADLINE_EXPIRED_INDIVIDUAL;
            } else {
                return RESUBMISSION_DEADLINE_EXPIRED_COMPANY_MEMBER;
            }
        }
        
        // Otherwise, it's because of rejection count limit
        if (taxProfessional.isIndividualApplication()) {
            return RESUBMISSION_LIMIT_ERROR_INDIVIDUAL;
        } else {
            return RESUBMISSION_LIMIT_ERROR_COMPANY_MEMBER;
        }
    }

    @Override
    public ApiResponse<DocumentResponse> uploadDocument(String tpin, DocumentType documentType, MultipartFile file) {
        // Call overloaded method with null metadata (backward compatibility)
        return uploadDocument(tpin, documentType, file, null, null, null, null, null);
    }

    @Override
    public ApiResponse<DocumentResponse> uploadDocument(String tpin, DocumentType documentType, MultipartFile file,
            String certificateType, BachelorDegree bachelorDegree, ProfessionalQualification professionalQualification,
            String otherProfessionalQualification, String mastersDegreeName) {
        try {
            TaxProfessional taxProfessional = taxProfessionalRepository.findById(tpin)
                    .orElseThrow(() -> new ResourceNotFoundException("Tax professional not found with TPIN: " + tpin));

            // ==================== VALIDATION FOR EDUCATION CERTIFICATE METADATA ====================
            if (documentType == DocumentType.EDUCERTIFICATE && certificateType != null && !certificateType.trim().isEmpty()) {
                validateEducationCertificateMetadata(certificateType, bachelorDegree, professionalQualification,
                        otherProfessionalQualification, mastersDegreeName);
            }
            // ====================================================================================

            // ==================== STATUS TRANSITION LOGIC ====================
            // Check if this is a reapplication (status is REJECTED)
            if (taxProfessional.getStatus() == ApplicationStatus.REJECTED) {
                System.out.println("[REAPPLICATION DETECTED] TPIN: " + tpin
                        + " - Processing reapplication for document type: " + documentType);

                // ==================== REJECTION LIMIT VALIDATION ====================
                // Check if applicant can reapply (rejection count < 2)
                if (!taxProfessional.canReapply()) {
                    System.out.println("[REAPPLICATION BLOCKED] TPIN: " + tpin
                            + " - Rejection count: " + taxProfessional.getRejectionCount()
                            + " - Maximum resubmission attempts exceeded");
                    throw new InvalidRequestException(getResubmissionLimitErrorMessage(taxProfessional));
                }
                // ====================================================================

                // Archive rejection details and change status to PENDING
                taxProfessional.processReapplication();

                // ==================== CLEANUP DOCUMENT REJECTION RECORDS ====================
                // Delete all DocumentRejection records for this TPIN on reapplication
                documentRejectionRepository.deleteByTaxProfessionalTpin(tpin);
                System.out.println("[REAPPLICATION CLEANUP] TPIN: " + tpin
                        + " - Deleted all document rejection records");
                // =============================================================================

                // Save the updated tax professional entity
                taxProfessionalRepository.save(taxProfessional);

                System.out.println("[REAPPLICATION SUCCESS] TPIN: " + tpin
                        + " - Status changed to PENDING, rejection details archived");
            } // Check if this is first document upload (status is REGISTERED)
            else if (taxProfessional.getStatus() == ApplicationStatus.REGISTERED) {
                System.out.println("[FIRST DOCUMENT UPLOAD] TPIN: " + tpin
                        + " - Changing status from REGISTERED to PENDING for document type: " + documentType);

                // Change status from REGISTERED to PENDING when first document is uploaded
                taxProfessional.setStatus(ApplicationStatus.PENDING);

                // Save the updated tax professional entity
                taxProfessionalRepository.save(taxProfessional);

                System.out.println("[STATUS UPDATE SUCCESS] TPIN: " + tpin
                        + " - Status changed from REGISTERED to PENDING");
            }
            // ============================================================

            // ==================== DOCUMENT REPLACEMENT LOGIC ====================
            // For EDUCERTIFICATE documents with certificateType, allow multiple documents
            // For other documents or EDUCERTIFICATE without certificateType, replace existing
            if (documentType == DocumentType.EDUCERTIFICATE && certificateType != null && !certificateType.trim().isEmpty()) {
                // Allow multiple education certificates with different certificateType
                // Check if same certificateType already exists and replace it
                documentRepository.findByTaxProfessionalTpinAndDocumentTypeAndCertificateType(tpin, documentType, certificateType)
                        .ifPresent(doc -> {
                            System.out.println("[DOCUMENT REPLACEMENT] TPIN: " + tpin
                                    + " - Replacing existing " + documentType + " document with certificateType: " + certificateType);
                            // Delete old file
                            deleteFileFromStorage(doc.getFilePath());
                            // Delete old record
                            documentRepository.delete(doc);
                        });
            } else {
                // For non-EDUCERTIFICATE or EDUCERTIFICATE without certificateType, replace existing
                documentRepository.findByTaxProfessionalTpinAndDocumentType(tpin, documentType)
                        .ifPresent(doc -> {
                            // For EDUCERTIFICATE without certificateType, only replace if it also has no certificateType
                            if (documentType == DocumentType.EDUCERTIFICATE) {
                                if (doc.getCertificateType() == null || doc.getCertificateType().trim().isEmpty()) {
                                    System.out.println("[DOCUMENT REPLACEMENT] TPIN: " + tpin
                                            + " - Replacing existing main " + documentType + " document");
                                    deleteFileFromStorage(doc.getFilePath());
                                    documentRepository.delete(doc);
                                }
                            } else {
                                System.out.println("[DOCUMENT REPLACEMENT] TPIN: " + tpin
                                        + " - Replacing existing " + documentType + " document");
                                deleteFileFromStorage(doc.getFilePath());
                                documentRepository.delete(doc);
                            }
                        });
            }
            // ====================================================================

            // Store new file
            String fileName = storeFile(file);

            // Create new document record
            Document document = new Document();
            document.setTaxProfessional(taxProfessional);
            document.setDocumentType(documentType);
            document.setFilePath(fileName);
            document.setUploadedAt(LocalDateTime.now());
            document.setIsVerified(false);

            // Set metadata fields for education certificates
            if (documentType == DocumentType.EDUCERTIFICATE) {
                document.setCertificateType(certificateType != null && !certificateType.trim().isEmpty() ? certificateType.trim() : null);
                document.setBachelorDegree(bachelorDegree);
                document.setProfessionalQualification(professionalQualification);
                document.setOtherProfessionalQualification(otherProfessionalQualification);
                document.setMastersDegreeName(mastersDegreeName);
            }

            Document saved = documentRepository.save(document);

            // ==================== UPDATE TAX PROFESSIONAL ENTITY ====================
            // Update TaxProfessional with education/qualification fields after successful upload
            if (documentType == DocumentType.EDUCERTIFICATE && certificateType != null && !certificateType.trim().isEmpty()) {
                updateTaxProfessionalWithEducationData(taxProfessional, certificateType, bachelorDegree,
                        professionalQualification, otherProfessionalQualification, mastersDegreeName);
                taxProfessionalRepository.save(taxProfessional);
            }
            // ========================================================================

            System.out.println("[DOCUMENT UPLOADED] TPIN: " + tpin
                    + " - Document type: " + documentType
                    + " - File: " + fileName);

            return ApiResponse.success("Document uploaded successfully", mapToDocumentResponse(saved));

        } catch (ResourceNotFoundException | InvalidRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new FileStorageException("Failed to upload document: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<DocumentResponse> getDocumentById(Long docId) {
        try {
            Document document = documentRepository.findById(docId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + docId));
            return ApiResponse.success("Document retrieved successfully", mapToDocumentResponse(document));
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch document: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<DocumentResponse> getDocumentByTypeAndTpin(String tpin, DocumentType documentType) {
        try {
            Document document = documentRepository.findByTaxProfessionalTpinAndDocumentType(tpin, documentType)
                    .orElseThrow(() -> new ResourceNotFoundException(
                    "Document not found for TPIN: " + tpin + " and type: " + documentType));
            return ApiResponse.success("Document retrieved successfully", mapToDocumentResponse(document));
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch document: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<List<DocumentResponse>> getDocumentsByTpinAndVerificationStatus(String tpin, Boolean isVerified) {
        try {
            List<Document> documents = documentRepository.findByTpinAndVerificationStatus(tpin, isVerified);
            List<DocumentResponse> responses = documents.stream()
                    .map(this::mapToDocumentResponse)
                    .collect(Collectors.toList());
            return ApiResponse.success("Documents retrieved successfully", responses);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch documents: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<List<DocumentResponse>> getAllDocuments() {
        try {
            List<Document> documents = documentRepository.findAll();
            List<DocumentResponse> responses = documents.stream()
                    .map(this::mapToDocumentResponse)
                    .collect(Collectors.toList());
            return ApiResponse.success("All documents retrieved successfully", responses);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch documents: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<Long> getDocumentCountByTpin(String tpin) {
        try {
            Long count = documentRepository.countByTaxProfessionalTpin(tpin);
            return ApiResponse.success("Document count retrieved successfully", count);
        } catch (Exception e) {
            throw new RuntimeException("Failed to count documents: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<String> unverifyDocument(Long docId) {
        try {
            Document document = documentRepository.findById(docId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + docId));
            document.setIsVerified(false);
            documentRepository.save(document);
            return ApiResponse.success("Document unverified successfully", "Document ID: " + docId);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to unverify document: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<DocumentResponse> updateDocument(Long docId, MultipartFile file) {
        try {
            Document document = documentRepository.findById(docId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + docId));

            // Delete old file
            deleteFileFromStorage(document.getFilePath());

            // Store new file
            String fileName = storeFile(file);
            document.setFilePath(fileName);
            document.setUploadedAt(LocalDateTime.now());
            document.setIsVerified(false); // Reset verification status

            Document updated = documentRepository.save(document);
            return ApiResponse.success("Document updated successfully", mapToDocumentResponse(updated));
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update document: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<DocumentResponse> updateRejectedDocument(Long docId, MultipartFile file, DocumentType documentType) {
        // Call the overloaded method with null metadata
        return updateRejectedDocument(docId, file, documentType, null, null, null, null, null);
    }

    @Override
    public ApiResponse<DocumentResponse> updateRejectedDocument(Long docId, MultipartFile file, DocumentType documentType,
            String certificateType, BachelorDegree bachelorDegree, ProfessionalQualification professionalQualification,
            String otherProfessionalQualification, String mastersDegreeName) {
        try {
            Document document = documentRepository.findById(docId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + docId));

            // Validate documentType matches the document's type
            if (document.getDocumentType() != documentType) {
                throw new InvalidRequestException(
                        "Document type mismatch. Expected: " + document.getDocumentType() + ", but received: " + documentType);
            }

            // Get the TaxProfessional
            TaxProfessional taxProfessional = document.getTaxProfessional();

            // ==================== REJECTION LIMIT VALIDATION ====================
            // Check if applicant can reapply (rejection count < 2)
            if (taxProfessional.getStatus() == ApplicationStatus.REJECTED && !taxProfessional.canReapply()) {
                System.out.println("[UPDATE REJECTED DOCUMENT BLOCKED] TPIN: " + taxProfessional.getTpin()
                        + " - Rejection count: " + taxProfessional.getRejectionCount()
                        + " - Maximum resubmission attempts exceeded");
                throw new InvalidRequestException(getResubmissionLimitErrorMessage(taxProfessional));
            }
            // ====================================================================

            // Delete old file
            deleteFileFromStorage(document.getFilePath());

            // Store new file
            String fileName = storeFile(file);
            document.setFilePath(fileName);
            document.setUploadedAt(LocalDateTime.now());
            document.setIsVerified(false); // Reset verification status

            // ==================== UPDATE METADATA FOR EDUCATION CERTIFICATES ====================
            // If this is an education certificate, update the metadata fields
            if (documentType == DocumentType.EDUCERTIFICATE) {
                document.setCertificateType(certificateType);
                document.setBachelorDegree(bachelorDegree);
                document.setProfessionalQualification(professionalQualification);
                document.setOtherProfessionalQualification(otherProfessionalQualification);
                document.setMastersDegreeName(mastersDegreeName);
            }
            // ===================================================================================

            // Find and delete DocumentRejection record for this document
            List<DocumentRejection> documentRejections
                    = documentRejectionRepository.findByDocumentDocId(docId);
            if (!documentRejections.isEmpty()) {
                documentRejectionRepository.deleteAll(documentRejections);
                System.out.println("[UPDATE REJECTED DOCUMENT] TPIN: " + document.getTaxProfessional().getTpin()
                        + " - Removed " + documentRejections.size() + " DocumentRejection record(s) for document ID: " + docId);
            }

            // Update status if REJECTED
            if (taxProfessional.getStatus() == ApplicationStatus.REJECTED) {
                taxProfessional.setStatus(ApplicationStatus.PENDING);
                // Set isReapplication flag if not already set
                if (taxProfessional.getIsReapplication() == null || !taxProfessional.getIsReapplication()) {
                    taxProfessional.setIsReapplication(true);
                }
                taxProfessionalRepository.save(taxProfessional);
                System.out.println("[UPDATE REJECTED DOCUMENT] TPIN: " + taxProfessional.getTpin()
                        + " - Status changed from REJECTED to PENDING");
            }

            Document updated = documentRepository.save(document);
            return ApiResponse.success("Rejected document updated successfully", mapToDocumentResponse(updated));
        } catch (ResourceNotFoundException | InvalidRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update rejected document: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<String> deleteAllDocumentsByTpin(String tpin) {
        try {
            List<Document> documents = documentRepository.findByTaxProfessionalTpin(tpin);

            if (documents.isEmpty()) {
                throw new ResourceNotFoundException("No documents found for TPIN: " + tpin);
            }

            // Delete all files
            documents.forEach(doc -> deleteFileFromStorage(doc.getFilePath()));

            // Delete all records
            documentRepository.deleteAll(documents);

            return ApiResponse.success("All documents deleted successfully",
                    "Deleted " + documents.size() + " documents for TPIN: " + tpin);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete documents: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<String> deleteDocumentByTypeAndTpin(String tpin, DocumentType documentType) {
        try {
            Document document = documentRepository.findByTaxProfessionalTpinAndDocumentType(tpin, documentType)
                    .orElseThrow(() -> new ResourceNotFoundException(
                    "Document not found for TPIN: " + tpin + " and type: " + documentType));

            deleteFileFromStorage(document.getFilePath());
            documentRepository.delete(document);

            return ApiResponse.success("Document deleted successfully",
                    "Deleted " + documentType + " for TPIN: " + tpin);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete document: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<List<DocumentResponse>> uploadMultipleDocuments(
            String tpin,
            Map<DocumentType, MultipartFile> documents) {

        List<DocumentResponse> responses = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        // Note: The reapplication logic will be triggered on the FIRST document upload
        // because uploadDocument() is called for each document
        // The status will already be PENDING by the time the second document is uploaded
        for (Map.Entry<DocumentType, MultipartFile> entry : documents.entrySet()) {
            try {
                ApiResponse<DocumentResponse> response
                        = uploadDocument(tpin, entry.getKey(), entry.getValue());
                responses.add(response.getData());
            } catch (Exception e) {
                errors.add(entry.getKey() + ": " + e.getMessage());
            }
        }

        if (!errors.isEmpty()) {
            return ApiResponse.error("Some documents failed: " + String.join(", ", errors));
        }

        return ApiResponse.success(
                responses.size() + " documents uploaded successfully",
                responses);
    }

    @Override
    public ApiResponse<List<DocumentResponse>> getDocumentsByTpin(String tpin) {
        try {
            if (!taxProfessionalRepository.existsByTpin(tpin)) {
                throw new ResourceNotFoundException("Tax professional not found with TPIN: " + tpin);
            }

            List<Document> documents = documentRepository.findByTaxProfessionalTpin(tpin);
            List<DocumentResponse> responses = documents.stream()
                    .map(this::mapToDocumentResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Documents retrieved successfully", responses);

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch documents: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<Resource> downloadDocument(Long docId) {
        try {
            Document document = documentRepository.findById(docId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + docId));

            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(document.getFilePath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return ApiResponse.success("Document retrieved successfully", resource);
            } else {
                throw new FileStorageException("File not found or not readable: " + document.getFilePath());
            }

        } catch (ResourceNotFoundException | FileStorageException e) {
            throw e;
        } catch (MalformedURLException e) {
            throw new FileStorageException("Invalid file path: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to download document: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<String> verifyDocument(Long docId) {
        try {
            Document document = documentRepository.findById(docId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + docId));

            document.setIsVerified(true);
            documentRepository.save(document);

            return ApiResponse.success("Document verified successfully", "Document ID: " + docId);

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify document: " + e.getMessage(), e);
        }
    }

    @Override
    public ApiResponse<String> deleteDocument(Long docId) {
        try {
            Document document = documentRepository.findById(docId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + docId));

            deleteFileFromStorage(document.getFilePath());
            documentRepository.delete(document);

            return ApiResponse.success("Document deleted successfully", "Document ID: " + docId);

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete document: " + e.getMessage(), e);
        }
    }

    private String storeFile(MultipartFile file) {
        try {
            String fileName = StringUtils.cleanPath(file.getOriginalFilename());
            String uniqueFileName = UUID.randomUUID().toString() + "_" + fileName;

            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            Path targetLocation = uploadPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return uniqueFileName;

        } catch (IOException ex) {
            throw new FileStorageException("Failed to store file: " + ex.getMessage(), ex);
        }
    }

    private void deleteFileFromStorage(String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(fileName);
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            throw new FileStorageException("Failed to delete file: " + ex.getMessage(), ex);
        }
    }

    private DocumentResponse mapToDocumentResponse(Document document) {
        DocumentResponse response = new DocumentResponse();
        response.setDocId(document.getDocId());
        response.setTpin(document.getTaxProfessional().getTpin());
        response.setDocumentType(document.getDocumentType());
        response.setFilePath(document.getFilePath());
        response.setUploadedAt(document.getUploadedAt());
        response.setIsVerified(document.getIsVerified());

        // Include metadata fields for education certificates
        response.setCertificateType(document.getCertificateType());
        response.setBachelorDegree(document.getBachelorDegree());
        response.setProfessionalQualification(document.getProfessionalQualification());
        response.setOtherProfessionalQualification(document.getOtherProfessionalQualification());
        response.setMastersDegreeName(document.getMastersDegreeName());

        return response;
    }

    /**
     * Validates education certificate metadata based on certificateType
     */
    private void validateEducationCertificateMetadata(String certificateType, BachelorDegree bachelorDegree,
            ProfessionalQualification professionalQualification, String otherProfessionalQualification,
            String mastersDegreeName) {
        String certType = certificateType.trim().toUpperCase();

        switch (certType) {
            case "BACHELOR":
                if (bachelorDegree == null) {
                    throw new InvalidRequestException(
                            "bachelorDegree is required when certificateType is 'BACHELOR'");
                }
                break;

            case "PROFESSIONAL_QUALIFICATION":
                if (professionalQualification == null) {
                    throw new InvalidRequestException(
                            "professionalQualification is required when certificateType is 'PROFESSIONAL_QUALIFICATION'");
                }
                if (professionalQualification == ProfessionalQualification.OTHER
                        && (otherProfessionalQualification == null || otherProfessionalQualification.trim().isEmpty())) {
                    throw new InvalidRequestException(
                            "otherProfessionalQualification is required when professionalQualification is 'OTHER'");
                }
                break;

            case "MASTERS":
                if (mastersDegreeName == null || mastersDegreeName.trim().isEmpty()) {
                    throw new InvalidRequestException(
                            "mastersDegreeName is required when certificateType is 'MASTERS'");
                }
                break;

            default:
                throw new InvalidRequestException(
                        "Invalid certificateType: " + certificateType + ". Valid values are: BACHELOR, PROFESSIONAL_QUALIFICATION, MASTERS");
        }
    }

    /**
     * Updates TaxProfessional entity with education/qualification data after
     * certificate upload
     */
    private void updateTaxProfessionalWithEducationData(TaxProfessional taxProfessional, String certificateType,
            BachelorDegree bachelorDegree, ProfessionalQualification professionalQualification,
            String otherProfessionalQualification, String mastersDegreeName) {
        String certType = certificateType.trim().toUpperCase();

        switch (certType) {
            case "BACHELOR":
                if (bachelorDegree != null) {
                    taxProfessional.setBachelorDegree(bachelorDegree);
                    System.out.println("[TAX PROFESSIONAL UPDATE] TPIN: " + taxProfessional.getTpin()
                            + " - Updated bachelorDegree to: " + bachelorDegree);
                }
                break;

            case "PROFESSIONAL_QUALIFICATION":
                if (professionalQualification != null) {
                    taxProfessional.setProfessionalQualification(professionalQualification);
                    System.out.println("[TAX PROFESSIONAL UPDATE] TPIN: " + taxProfessional.getTpin()
                            + " - Updated professionalQualification to: " + professionalQualification);
                }
                if (professionalQualification == ProfessionalQualification.OTHER
                        && otherProfessionalQualification != null && !otherProfessionalQualification.trim().isEmpty()) {
                    taxProfessional.setOtherProfessionalDetails(otherProfessionalQualification.trim());
                    System.out.println("[TAX PROFESSIONAL UPDATE] TPIN: " + taxProfessional.getTpin()
                            + " - Updated otherProfessionalDetails to: " + otherProfessionalQualification);
                }
                break;

            case "MASTERS":
                // Note: TaxProfessional has mastersDegree as enum (BachelorDegree), but we receive mastersDegreeName as string
                // Store the masters degree name in otherProfessionalDetails
                // TODO: Consider adding a dedicated mastersDegreeName field to TaxProfessional entity
                if (mastersDegreeName != null && !mastersDegreeName.trim().isEmpty()) {
                    String currentDetails = taxProfessional.getOtherProfessionalDetails();
                    String mastersInfo = "Master's Degree: " + mastersDegreeName.trim();

                    // Append to existing otherProfessionalDetails if it exists, otherwise set it
                    if (currentDetails != null && !currentDetails.trim().isEmpty()) {
                        // Check if masters info already exists
                        if (!currentDetails.contains("Master's Degree:")) {
                            taxProfessional.setOtherProfessionalDetails(currentDetails + "; " + mastersInfo);
                        }
                    } else {
                        taxProfessional.setOtherProfessionalDetails(mastersInfo);
                    }

                    System.out.println("[TAX PROFESSIONAL UPDATE] TPIN: " + taxProfessional.getTpin()
                            + " - Updated otherProfessionalDetails with Masters degree: " + mastersDegreeName);
                }
                break;
        }
    }
}
