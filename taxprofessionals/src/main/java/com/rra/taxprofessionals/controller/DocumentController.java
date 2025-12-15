package com.rra.taxprofessionals.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.rra.taxprofessionals.dto.ApiResponse;
import com.rra.taxprofessionals.dto.DocumentResponse;
import com.rra.taxprofessionals.enums.BachelorDegree;
import com.rra.taxprofessionals.enums.DocumentType;
import com.rra.taxprofessionals.enums.ProfessionalQualification;
import com.rra.taxprofessionals.exception.FileStorageException;
import com.rra.taxprofessionals.exception.ResourceNotFoundException;
import com.rra.taxprofessionals.service.DocumentService;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired
    private DocumentService documentService;

    // ==================== CREATE ====================
    /**
     * 1. Upload Single Document POST /api/documents/upload
     * Supports optional metadata for education certificates
     */
    @PostMapping("/upload")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(
            @RequestParam("tpin") String tpin,
            @RequestParam("documentType") DocumentType documentType,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "certificateType", required = false) String certificateType,
            @RequestParam(value = "bachelorDegree", required = false) BachelorDegree bachelorDegree,
            @RequestParam(value = "professionalQualification", required = false) ProfessionalQualification professionalQualification,
            @RequestParam(value = "otherProfessionalQualification", required = false) String otherProfessionalQualification,
            @RequestParam(value = "mastersDegreeName", required = false) String mastersDegreeName) {
        ApiResponse<DocumentResponse> response = documentService.uploadDocument(
                tpin, documentType, file, certificateType, bachelorDegree, 
                professionalQualification, otherProfessionalQualification, mastersDegreeName);
        return ResponseEntity.ok(response);
    }

    /**
     * 2. Upload Multiple Documents at Once POST /api/documents/upload/bulk
     */
    @PostMapping("/upload/bulk")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> uploadBulkDocuments(
            @RequestParam("tpin") String tpin,
            @RequestParam(value = "signedLetter", required = false) MultipartFile signedLetter,
            @RequestParam(value = "criminalRecord", required = false) MultipartFile criminalRecord,
            @RequestParam(value = "eduCertificate", required = false) MultipartFile eduCertificate,
            @RequestParam(value = "recommendationLetter", required = false) MultipartFile recommendationLetter,
            @RequestParam(value = "nonRefundFees", required = false) MultipartFile nonRefundFees,
            @RequestParam(value = "cv", required = false) MultipartFile cv,
            @RequestParam(value = "taxClearanceCert", required = false) MultipartFile taxClearanceCert,
            @RequestParam(value = "businessRegCert", required = false) MultipartFile businessRegCert) {

        Map<DocumentType, MultipartFile> documents = new HashMap<>();

        if (signedLetter != null && !signedLetter.isEmpty()) {
            documents.put(DocumentType.SIGNEDLETTER, signedLetter);
        }
        if (criminalRecord != null && !criminalRecord.isEmpty()) {
            documents.put(DocumentType.CRIMINALRECORD, criminalRecord);
        }
        if (eduCertificate != null && !eduCertificate.isEmpty()) {
            documents.put(DocumentType.EDUCERTIFICATE, eduCertificate);
        }
        if (recommendationLetter != null && !recommendationLetter.isEmpty()) {
            documents.put(DocumentType.RECOMMENDATIONLETTER, recommendationLetter);
        }
        if (nonRefundFees != null && !nonRefundFees.isEmpty()) {
            documents.put(DocumentType.NONREFUNDFEES, nonRefundFees);
        }
        if (cv != null && !cv.isEmpty()) {
            documents.put(DocumentType.CV, cv);
        }
        if (taxClearanceCert != null && !taxClearanceCert.isEmpty()) {
            documents.put(DocumentType.TAXCLEARANCECERTIFICATE, taxClearanceCert);
        }
        if (businessRegCert != null && !businessRegCert.isEmpty()) {
            documents.put(DocumentType.BUSINESSREGISTRATIONCERT, businessRegCert);
        }

        if (documents.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("No documents provided"));
        }

        ApiResponse<List<DocumentResponse>> response = documentService.uploadMultipleDocuments(tpin, documents);
        return ResponseEntity.ok(response);
    }

    // ==================== READ ====================
    /**
     * 3. Get All Documents by TPIN GET /api/documents/tpin/{tpin}
     */
    @GetMapping("/tpin/{tpin}")
    @PreAuthorize("hasAnyRole('TAXPROFESSIONAL', 'ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getDocumentsByTpin(
            @PathVariable String tpin) {
        ApiResponse<List<DocumentResponse>> response = documentService.getDocumentsByTpin(tpin);
        return ResponseEntity.ok(response);
    }

    /**
     * Alternative endpoint: Get All Documents by TPIN GET
     * /api/documents/taxprofessional/{tpin}
     */
    @GetMapping("/taxprofessional/{tpin}")
    @PreAuthorize("hasAnyRole('TAXPROFESSIONAL', 'ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getDocumentsByTpinAlternative(
            @PathVariable String tpin) {
        ApiResponse<List<DocumentResponse>> response = documentService.getDocumentsByTpin(tpin);
        return ResponseEntity.ok(response);
    }

    /**
     * 4. Get Single Document by ID GET /api/documents/{docId}
     */
    @GetMapping("/{docId}")
    @PreAuthorize("hasAnyRole('TAXPROFESSIONAL', 'ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<DocumentResponse>> getDocumentById(
            @PathVariable Long docId) {
        ApiResponse<DocumentResponse> response = documentService.getDocumentById(docId);
        return ResponseEntity.ok(response);
    }

    /**
     * 5. Get Document by TPIN and Document Type GET
     * /api/documents/tpin/{tpin}/type/{documentType}
     */
    @GetMapping("/tpin/{tpin}/type/{documentType}")
    @PreAuthorize("hasAnyRole('TAXPROFESSIONAL', 'ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<DocumentResponse>> getDocumentByTypeAndTpin(
            @PathVariable String tpin,
            @PathVariable DocumentType documentType) {
        ApiResponse<DocumentResponse> response = documentService.getDocumentByTypeAndTpin(tpin, documentType);
        return ResponseEntity.ok(response);
    }

    /**
     * 6. Download Document File GET /api/documents/download/{docId}
     */
    @GetMapping("/download/{docId}")
    @PreAuthorize("hasAnyRole('TAXPROFESSIONAL', 'ADMIN', 'OFFICER')")
    public ResponseEntity<?> downloadDocument(@PathVariable Long docId) {
        try {
            // Get the document resource from service
            ApiResponse<Resource> response = documentService.downloadDocument(docId);

            // Validate that document was found and resource exists
            if (response == null || response.getData() == null) {
                throw new ResourceNotFoundException("Document file not found for ID: " + docId);
            }

            Resource resource = response.getData();

            // Validate resource is readable
            if (!resource.exists() || !resource.isReadable()) {
                throw new FileStorageException("Document file is not accessible for ID: " + docId);
            }

            // Get filename - use default if not available
            String filename = resource.getFilename();
            if (filename == null || filename.isEmpty()) {
                filename = "document_" + docId;
            }

            // All validations passed - return file with proper headers
            // CORS headers are handled by the global configuration
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(404)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error(e.getMessage()));

        } catch (FileStorageException e) {
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error(e.getMessage()));

        } catch (Exception e) {
            System.err.println("[Download Error] Unexpected error for document " + docId + ": " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(ApiResponse.error("Failed to download document: " + e.getMessage()));
        }
    }

    /**
     * 7. Get Verified Documents by TPIN GET /api/documents/tpin/{tpin}/verified
     */
    @GetMapping("/tpin/{tpin}/verified")
    @PreAuthorize("hasAnyRole('TAXPROFESSIONAL', 'ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getVerifiedDocuments(
            @PathVariable String tpin) {
        ApiResponse<List<DocumentResponse>> response
                = documentService.getDocumentsByTpinAndVerificationStatus(tpin, true);
        return ResponseEntity.ok(response);
    }

    /**
     * 8. Get Unverified Documents by TPIN GET
     * /api/documents/tpin/{tpin}/unverified
     */
    @GetMapping("/tpin/{tpin}/unverified")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getUnverifiedDocuments(
            @PathVariable String tpin) {
        ApiResponse<List<DocumentResponse>> response
                = documentService.getDocumentsByTpinAndVerificationStatus(tpin, false);
        return ResponseEntity.ok(response);
    }

    /**
     * 9. Get All Documents (Admin) GET /api/documents/all
     */
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getAllDocuments() {
        ApiResponse<List<DocumentResponse>> response = documentService.getAllDocuments();
        return ResponseEntity.ok(response);
    }

    /**
     * 10. Get Document Count by TPIN GET /api/documents/tpin/{tpin}/count
     */
    @GetMapping("/tpin/{tpin}/count")
    @PreAuthorize("hasAnyRole('TAXPROFESSIONAL', 'ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<Long>> getDocumentCount(@PathVariable String tpin) {
        ApiResponse<Long> response = documentService.getDocumentCountByTpin(tpin);
        return ResponseEntity.ok(response);
    }

    // ==================== UPDATE ====================
    /**
     * 11. Verify Document PUT /api/documents/verify/{docId}
     */
    @PutMapping("/verify/{docId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<String>> verifyDocument(@PathVariable Long docId) {
        ApiResponse<String> response = documentService.verifyDocument(docId);
        return ResponseEntity.ok(response);
    }

    /**
     * 12. Unverify Document PUT /api/documents/unverify/{docId}
     */
    @PutMapping("/unverify/{docId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<String>> unverifyDocument(@PathVariable Long docId) {
        ApiResponse<String> response = documentService.unverifyDocument(docId);
        return ResponseEntity.ok(response);
    }

    /**
     * 13. Update/Replace Document File PUT /api/documents/update/{docId}
     */
    @PutMapping("/update/{docId}")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<DocumentResponse>> updateDocument(
            @PathVariable Long docId,
            @RequestParam("file") MultipartFile file) {
        ApiResponse<DocumentResponse> response = documentService.updateDocument(docId, file);
        return ResponseEntity.ok(response);
    }

    /**
     * 14. Update/Replace Rejected Document File PUT /api/documents/update-rejected/{docId}
     * Updates the document file, removes the DocumentRejection record, and changes status to PENDING
     */
    @PutMapping("/update-rejected/{docId}")
    @PreAuthorize("hasRole('TAXPROFESSIONAL')")
    public ResponseEntity<ApiResponse<DocumentResponse>> updateRejectedDocument(
            @PathVariable Long docId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") DocumentType documentType,
            @RequestParam(value = "certificateType", required = false) String certificateType,
            @RequestParam(value = "bachelorDegree", required = false) BachelorDegree bachelorDegree,
            @RequestParam(value = "professionalQualification", required = false) ProfessionalQualification professionalQualification,
            @RequestParam(value = "otherProfessionalQualification", required = false) String otherProfessionalQualification,
            @RequestParam(value = "mastersDegreeName", required = false) String mastersDegreeName) {
        ApiResponse<DocumentResponse> response = documentService.updateRejectedDocument(
                docId, file, documentType, certificateType, bachelorDegree, 
                professionalQualification, otherProfessionalQualification, mastersDegreeName);
        return ResponseEntity.ok(response);
    }

    // ==================== DELETE ====================
    /**
     * 14. Delete Single Document DELETE /api/documents/{docId}
     */
    @DeleteMapping("/{docId}")
    @PreAuthorize("hasAnyRole('TAXPROFESSIONAL', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteDocument(@PathVariable Long docId) {
        ApiResponse<String> response = documentService.deleteDocument(docId);
        return ResponseEntity.ok(response);
    }

    /**
     * 15. Delete All Documents by TPIN DELETE /api/documents/tpin/{tpin}
     */
    @DeleteMapping("/tpin/{tpin}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteAllDocumentsByTpin(
            @PathVariable String tpin) {
        ApiResponse<String> response = documentService.deleteAllDocumentsByTpin(tpin);
        return ResponseEntity.ok(response);
    }

    /**
     * 16. Delete Document by Type and TPIN DELETE
     * /api/documents/tpin/{tpin}/type/{documentType}
     */
    @DeleteMapping("/tpin/{tpin}/type/{documentType}")
    @PreAuthorize("hasAnyRole('TAXPROFESSIONAL', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteDocumentByTypeAndTpin(
            @PathVariable String tpin,
            @PathVariable DocumentType documentType) {
        ApiResponse<String> response = documentService.deleteDocumentByTypeAndTpin(tpin, documentType);
        return ResponseEntity.ok(response);
    }
}
