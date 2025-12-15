# Rejection Limit Implementation

## Overview
This document describes the implementation of the rejection limit feature for the Tax Professional Management System.

## Business Rules

### Individual Accounts
- **First Rejection** (rejectionCount = 1): Applicant can resubmit documents ONE time
- **Second Rejection** (rejectionCount = 2): Applicant is BLOCKED from further resubmissions
- Must contact RRA for guidance on new application

### Company Member Accounts
- Same rules as individual accounts
- Rejection limit applies PER MEMBER (not per company)
- If Member A is rejected twice, only Member A is blocked
- Other members of the same company can still apply/resubmit

## Implementation Details

### 1. TaxProfessional Entity (`TaxProfessional.java`)

**Field:**
- `rejectionCount` (Integer): Tracks total number of rejections (starts at 0)

**Method Updated:**
```java
public boolean canReapply() {
    // Must be in REJECTED status
    if (this.status != ApplicationStatus.REJECTED) {
        return false;
    }
    
    // Allow resubmission only if rejectionCount < 2
    // rejectionCount = 1: First rejection, allow ONE resubmission
    // rejectionCount = 2: Second rejection, block further resubmissions
    return this.rejectionCount < 2;
}
```

### 2. OfficerServiceImpl (`OfficerServiceImpl.java`)

**When Officer Rejects Application:**
```java
if (request.getStatus() == ApplicationStatus.REJECTED) {
    taxProfessional.setRejectionReason(request.getRejectionReason());
    
    // Increment rejection count
    taxProfessional.incrementRejectionCount();
    
    // Reset reapplication flag
    taxProfessional.setIsReapplication(false);
}
```

### 3. DocumentServiceImpl (`DocumentServiceImpl.java`)

**When Applicant Uploads Document (Resubmission):**
```java
if (taxProfessional.getStatus() == ApplicationStatus.REJECTED) {
    // Check if applicant can reapply
    if (!taxProfessional.canReapply()) {
        String accountType = taxProfessional.getCompanyId() != null 
            ? "company member" 
            : "individual";
        throw new InvalidRequestException(
            "Application Rejected - Resubmission Not Available. " +
            "Your application has been rejected for the second time. " +
            "You have already used your one-time resubmission opportunity after the first rejection. " +
            "Unfortunately, no further resubmissions are allowed for this " + accountType + " application. " +
            "Please contact the Rwanda Revenue Authority for guidance on how to proceed with a new application."
        );
    }
    
    // Process reapplication
    taxProfessional.processReapplication();
}
```

**When Applicant Updates Rejected Document:**
- Same validation as above
- Prevents updating individual documents after 2nd rejection

## Flow Diagram

```
NEW APPLICATION
└─> rejectionCount = 0
    └─> Status: REGISTERED → PENDING (on first document upload)
        
FIRST REJECTION
└─> rejectionCount = 1
    └─> Status: PENDING → REJECTED
        └─> Applicant CAN resubmit (canReapply() = true)
            └─> On document upload: Status → PENDING
                
SECOND REJECTION
└─> rejectionCount = 2
    └─> Status: PENDING → REJECTED
        └─> Applicant CANNOT resubmit (canReapply() = false)
            └─> Document upload throws InvalidRequestException
            └─> Must contact RRA for new application
```

## Error Messages

### For Individual Accounts:
```
Application Rejected - Resubmission Not Available. 
Your application has been rejected for the second time. 
You have already used your one-time resubmission opportunity after the first rejection. 
Unfortunately, no further resubmissions are allowed for this individual application. 
Please contact the Rwanda Revenue Authority for guidance on how to proceed with a new application.
```

### For Company Member Accounts:
```
Application Rejected - Resubmission Not Available. 
Your application has been rejected for the second time. 
You have already used your one-time resubmission opportunity after the first rejection. 
Unfortunately, no further resubmissions are allowed for this company member application. 
Please contact the Rwanda Revenue Authority for guidance on how to proceed with a new application.
```

## Testing Scenarios

### Test Case 1: Individual - First Rejection
1. Create individual account
2. Upload documents → Status: PENDING
3. Officer rejects → rejectionCount = 1, Status: REJECTED
4. Upload new documents → Should succeed, Status: PENDING
5. ✅ Expected: Resubmission allowed

### Test Case 2: Individual - Second Rejection
1. Continue from Test Case 1
2. Officer rejects again → rejectionCount = 2, Status: REJECTED
3. Try to upload documents → Should fail with error message
4. ✅ Expected: Resubmission blocked

### Test Case 3: Company Member - Individual Blocking
1. Create company with 2 members (Member A, Member B)
2. Member A: Upload documents → Status: PENDING
3. Officer rejects Member A twice → rejectionCount = 2
4. Member A tries to upload → Should fail
5. Member B uploads documents → Should succeed
6. ✅ Expected: Only Member A is blocked, Member B can still apply

## Database Schema

No schema changes required. Existing fields are used:
- `rejection_count` (INTEGER, NOT NULL, DEFAULT 0)
- `status` (VARCHAR, NOT NULL)
- `company_id` (VARCHAR, NULLABLE)

## Files Modified

1. `src/main/java/com/rra/taxprofessionals/model/TaxProfessional.java`
   - Updated `canReapply()` method

2. `src/main/java/com/rra/taxprofessionals/service/imp/DocumentServiceImpl.java`
   - Added validation in `uploadDocument()` method
   - Added validation in `updateRejectedDocument()` method

3. `src/main/java/com/rra/taxprofessionals/service/imp/OfficerServiceImpl.java`
   - Already had `incrementRejectionCount()` call (no changes needed)

## Notes

- The rejection count is incremented BEFORE saving, so it's immediately reflected
- Company members are tracked individually by their TPIN
- The system distinguishes between individual and company member accounts in error messages
- Frontend should check `rejectionCount` and `status` to show appropriate UI
