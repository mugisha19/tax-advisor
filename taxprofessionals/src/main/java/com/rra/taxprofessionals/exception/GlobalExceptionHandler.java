package com.rra.taxprofessionals.exception;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.rra.taxprofessionals.dto.ApiResponse;

import jakarta.servlet.http.HttpServletResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<Object>> handleDuplicateResourceException(DuplicateResourceException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidRequestException(InvalidRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(SystemLockedException.class)
    public ResponseEntity<ApiResponse<Object>> handleSystemLockedException(SystemLockedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Object>> handleUnauthorizedException(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentialsException(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid username or password"));
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleUsernameNotFoundException(UsernameNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<ApiResponse<Object>> handleFileStorageException(FileStorageException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Object>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.error("File size exceeds maximum limit of 20MB. Please upload a smaller file."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        // Log validation errors for debugging
        System.err.println("=== VALIDATION ERRORS ===");
        errors.forEach((field, message) -> 
            System.err.println("  " + field + ": " + message)
        );
        System.err.println("========================");
        
        // Build user-friendly error message
        String errorMessage = "Validation failed: " + String.join(", ", errors.values());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(false, errorMessage, errors));
    }

    /**
     * Handle client abort exceptions during file downloads These occur when the
     * client (browser) cancels the download
     *
     * IMPORTANT: Cannot write response if already committed (file download
     * started)
     */
    @ExceptionHandler(AsyncRequestNotUsableException.class)
    public void handleAsyncRequestNotUsableException(
            AsyncRequestNotUsableException ex,
            HttpServletResponse response) {
        handleDownloadException(ex, response, "Download cancelled by client");
    }

    /**
     * Handle IOException during file downloads This catches various IO errors
     * including client disconnections
     */
    @ExceptionHandler(IOException.class)
    public void handleIOException(
            IOException ex,
            HttpServletResponse response) {
        // Check if this is a client abort exception
        if (ex.getClass().getSimpleName().contains("ClientAbort")
                || ex.getMessage() != null && ex.getMessage().contains("Broken pipe")) {
            handleDownloadException(ex, response, "Download interrupted");
        } else {
            // For other IO exceptions, try to write error response if possible
            handleDownloadException(ex, response, "IO error during download: " + ex.getMessage());
        }
    }

    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidTokenException(InvalidTokenException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(EmailSendException.class)
    public ResponseEntity<ApiResponse<Object>> handleEmailSendException(EmailSendException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to send email: " + ex.getMessage()));
    }

    @ExceptionHandler(MailAuthenticationException.class)
    public ResponseEntity<ApiResponse<Object>> handleMailAuthenticationException(
            MailAuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(
                        "Email authentication failed. Please check email configuration. "
                        + "Contact administrator if problem persists."
                ));
    }

    private void handleDownloadException(Exception ex, HttpServletResponse response, String message) {
        // Log the exception
        System.err.println("[Download Exception] " + message + ": " + ex.getMessage());

        // If response is already committed (download started), we can't modify it
        if (response.isCommitted()) {
            System.err.println("[Download Exception] Response already committed, cannot write error response");
            return;
        }

        // Try to write error response if response not committed
        try {
            response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Access-Control-Allow-Origin", "*");

            String jsonError = String.format(
                    "{\"success\":false,\"message\":\"%s\",\"data\":null,\"timestamp\":\"%s\"}",
                    message.replace("\"", "\\\""),
                    java.time.LocalDateTime.now().toString()
            );

            response.getWriter().write(jsonError);
            response.getWriter().flush();
        } catch (IOException e) {
            // If we can't write the response, just log it
            System.err.println("[Download Exception] Could not write error response: " + e.getMessage());
        }
    }

    /**
     * Global exception handler for all other exceptions
     *
     * IMPORTANT: This handler checks if response is committed before writing to
     * avoid HttpMessageNotWritableException during file downloads
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(
            Exception ex,
            HttpServletResponse response) {
        // Log the exception
        ex.printStackTrace();

        // Check if response is already committed (e.g., during file download)
        if (response.isCommitted()) {
            System.err.println("[Global Exception] Response already committed, cannot return error response");
            // Return null - Spring will handle it gracefully
            return null;
        }

        // Return standard error response
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred: " + ex.getMessage()));
    }
}
