package com.rra.taxprofessionals.exception;

/**
 * Exception thrown when attempting to perform an operation while the system is locked.
 * This prevents new registrations, applications, and member additions when the system is closed.
 */
public class SystemLockedException extends RuntimeException {

    public SystemLockedException(String message) {
        super(message);
    }
}
