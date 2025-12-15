# API Documentation

## Base URL

```
http://localhost:8080/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All endpoints return responses in the following format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-01-15T12:00:00"
}
```

---

## Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [Location Endpoints](#location-endpoints)
3. [Tax Professional Endpoints](#tax-professional-endpoints)
4. [Officer Endpoints](#officer-endpoints)
5. [Admin Endpoints](#admin-endpoints)
6. [Document Endpoints](#document-endpoints)

---

## Authentication Endpoints

### Login

**POST** `/api/auth/login`

**Description:** Authenticate user and receive JWT token.

**Access:** Public (No authentication required)

**Request Body:**

```json
{
  "username": "string (employeeId, email, or tpin)",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-string",
    "username": "user-identifier",
    "role": "ROLE_ADMIN | ROLE_OFFICER | ROLE_TAXPROFESSIONAL"
  },
  "timestamp": "2025-01-15T12:00:00"
}
```

---

## Location Endpoints

### Get All Provinces

**GET** `/api/locations/provinces`

**Description:** Retrieve all provinces.

**Access:** Public (No authentication required)

**Response:**

```json
{
  "success": true,
  "message": "Provinces retrieved successfully",
  "data": [
    {
      "locationId": 1,
      "name": "Kigali",
      "code": "01",
      "type": "PROVINCE",
      "parentId": null
    }
  ],
  "timestamp": "2025-01-15T12:00:00"
}
```

### Get Districts by Province

**GET** `/api/locations/districts/{provinceId}`

**Description:** Retrieve all districts for a specific province.

**Access:** Public (No authentication required)

**Path Parameters:**

- `provinceId` (Long) - Province location ID

**Response:**

```json
{
  "success": true,
  "message": "Districts retrieved successfully",
  "data": [ ... ]
}
```

### Get Sectors by District

**GET** `/api/locations/sectors/{districtId}`

**Description:** Retrieve all sectors for a specific district.

**Access:** Public (No authentication required)

**Path Parameters:**

- `districtId` (Long) - District location ID

**Response:**

```json
{
  "success": true,
  "message": "Sectors retrieved successfully",
  "data": [ ... ]
}
```

### Get Cells by Sector

**GET** `/api/locations/cells/{sectorId}`

**Description:** Retrieve all cells for a specific sector.

**Access:** Public (No authentication required)

**Path Parameters:**

- `sectorId` (Long) - Sector location ID

**Response:**

```json
{
  "success": true,
  "message": "Cells retrieved successfully",
  "data": [ ... ]
}
```

### Get Villages by Cell

**GET** `/api/locations/villages/{cellId}`

**Description:** Retrieve all villages for a specific cell.

**Access:** Public (No authentication required)

**Path Parameters:**

- `cellId` (Long) - Cell location ID

**Response:**

```json
{
  "success": true,
  "message": "Villages retrieved successfully",
  "data": [ ... ]
}
```

### Get Location by ID

**GET** `/api/locations/{locationId}`

**Description:** Retrieve a specific location by its ID.

**Access:** Public (No authentication required)

**Path Parameters:**

- `locationId` (Long) - Location ID

**Response:**

```json
{
  "success": true,
  "message": "Location retrieved successfully",
  "data": { ... }
}
```

### Create Location (Admin)

**POST** `/api/locations`

**Description:** Create a new location (province, district, sector, cell, or village).

**Access:** ADMIN only

**Request Body:**

```json
{
  "name": "string",
  "code": "string",
  "type": "PROVINCE | DISTRICT | SECTOR | CELL | VILLAGE",
  "parentId": 123
}
```

**Response:**

```json
{
  "success": true,
  "message": "Location created successfully",
  "data": { ... }
}
```

### Update Location (Admin)

**PUT** `/api/locations/{locationId}`

**Description:** Update an existing location.

**Access:** ADMIN only

**Path Parameters:**

- `locationId` (Long) - Location ID to update

**Request Body:** Same as Create Location

**Response:**

```json
{
  "success": true,
  "message": "Location updated successfully",
  "data": { ... }
}
```

### Delete Location (Admin)

**DELETE** `/api/locations/{locationId}`

**Description:** Delete a location.

**Access:** ADMIN only

**Path Parameters:**

- `locationId` (Long) - Location ID to delete

**Response:**

```json
{
  "success": true,
  "message": "Location deleted successfully",
  "data": "Location ID: {locationId}"
}
```

### Get All Locations (Admin)

**GET** `/api/locations/all`

**Description:** Retrieve all locations in the system.

**Access:** ADMIN only

**Response:**

```json
{
  "success": true,
  "message": "All locations retrieved successfully",
  "data": [ ... ]
}
```

---

## Tax Professional Endpoints

### Register Individual

**POST** `/api/taxprofessionals/register`

**Description:** Register a new individual tax professional.

**Access:** Public (No authentication required)

**Request Body:**

```json
{
  "tin": "123456789",
  "nid": "1234567890123456",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+250788123456",
  "password": "SecurePass123!",
  "provinceId": 1,
  "districtId": 2,
  "sectorId": 3,
  "cellId": 4,
  "villageId": 5
}
```

**Validation Rules:**

- `tin`: Must be exactly 9 digits
- `nid`: Must be exactly 16 digits
- `fullName`: 3-100 characters
- `email`: Valid email format
- `phoneNumber`: Format +250XXXXXXXXX
- `password`: Minimum 8 characters, must contain digit, lowercase, uppercase, and special character
- Location IDs: All required

**Response:**

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "tpin": "100234567",
    "nid": "1234567890123456",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+250788123456",
    "workAddress": {
      "name": "Kigali, Nyarugenge, Nyamirambo, Gitega, Kimisagara"
    },
    "businessStatus": "INDIVIDUAL",
    "applicationDate": "2025-01-15T10:30:00",
    "status": "PENDING"
  }
}
```

### Register Company

**POST** `/api/taxprofessionals/register-company`

**Description:** Register a company with multiple tax professionals.

**Access:** Public (No authentication required)

**Request Body:**

```json
{
  "tinCompany": "987654321",
  "employees": [
    {
      "nid": "1234567890123456",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+250788123456",
      "password": "SecurePass123!",
      "provinceId": 1,
      "districtId": 2,
      "sectorId": 3,
      "cellId": 4,
      "villageId": 5
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Company registration successful",
  "data": [
    {
      "tpin": "100234567",
      "tinCompany": "987654321",
      ...
    }
  ]
}
```

### Get Application by TPIN

**GET** `/api/taxprofessionals/application/tpin/{tpin}`

**Description:** Retrieve application details by TPIN.

**Access:** TAXPROFESSIONAL, ADMIN, OFFICER

**Path Parameters:**

- `tpin` (String) - Tax Professional Identification Number

**Response:**

```json
{
  "success": true,
  "message": "Application retrieved successfully",
  "data": {
    "tpin": "100234567",
    "nid": "1234567890123456",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+250788123456",
    "workAddress": {
      "name": "Kigali, Nyarugenge, Nyamirambo, Gitega, Kimisagara"
    },
    "businessStatus": "INDIVIDUAL",
    "bachelorDegree": "BACHELORS",
    "mastersDegree": null,
    "professionalQualification": "CPA",
    "applicationDate": "2025-01-15T10:30:00",
    "status": "PENDING",
    "reviewedBy": null,
    "reviewedAt": null
  }
}
```

### Get Application by TIN

**GET** `/api/taxprofessionals/application/tin/{tin}`

**Description:** Retrieve application details by TIN (for companies).

**Access:** TAXPROFESSIONAL, ADMIN, OFFICER

**Path Parameters:**

- `tin` (String) - Tax Identification Number

**Response:** Same as Get Application by TPIN

### Get All Applications

**GET** `/api/taxprofessionals/applications`

**Description:** Retrieve all tax professional applications.

**Access:** ADMIN, OFFICER

**Response:**

```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": [ ... ]
}
```

### Get Applications by Status

**GET** `/api/taxprofessionals/applications/status/{status}`

**Description:** Retrieve applications filtered by status.

**Access:** ADMIN, OFFICER

**Path Parameters:**

- `status` (ApplicationStatus) - PENDING, APPROVED, or REJECTED

**Response:** Same as Get All Applications

### Update Professional Qualifications

**PUT** `/api/taxprofessionals/qualifications/{tpin}`

**Description:** Update professional qualifications for a tax professional.

**Access:** TAXPROFESSIONAL

**Path Parameters:**

- `tpin` (String) - Tax Professional Identification Number

**Request Body:**

```json
{
  "bachelorDegree": "BACHELORS",
  "mastersDegree": "MASTERS",
  "professionalQualification": "CPA",
  "otherProfessionalDetails": "Additional details"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Qualifications updated successfully",
  "data": { ... }
}
```

### Upload Other Professional Document

**POST** `/api/taxprofessionals/upload-other-professional/{tpin}`

**Description:** Upload additional professional qualification document.

**Access:** TAXPROFESSIONAL

**Path Parameters:**

- `tpin` (String) - Tax Professional Identification Number

**Request Parameters:**

- `file` (MultipartFile) - Document file to upload

**Response:**

```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": "File path"
}
```

### Review Application

**POST** `/api/taxprofessionals/review`

**Description:** Review and approve/reject an application (alternative endpoint).

**Access:** ADMIN, OFFICER

**Request Body:**

```json
{
  "tpin": "100234567",
  "status": "APPROVED | REJECTED",
  "comments": "Optional review comments"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Application reviewed successfully",
  "data": { ... }
}
```

---

## Officer Endpoints

### Review Application

**POST** `/api/officer/review`

**Description:** Review and approve/reject an application. The reviewing officer is automatically determined from the JWT token.

**Access:** ADMIN, OFFICER

**Request Body:**

```json
{
  "tpin": "100234567",
  "status": "APPROVED | REJECTED",
  "comments": "Optional review comments"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Application reviewed successfully",
  "data": {
    "tpin": "100234567",
    "status": "APPROVED",
    "reviewedBy": "EMP001",
    "reviewedAt": "2025-01-15T14:30:00",
    ...
  }
}
```

### Review Application (PUT)

**PUT** `/api/officer/review`

**Description:** Same as POST review endpoint, supports PUT method for frontend compatibility.

**Access:** ADMIN, OFFICER

**Request Body:** Same as POST review

**Response:** Same as POST review

### Get My Reviews

**GET** `/api/officer/my-reviews`

**Description:** Get all applications reviewed by the currently authenticated officer.

**Access:** ADMIN, OFFICER

**Response:**

```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": [ ... ]
}
```

### Get My Reviews by Status

**GET** `/api/officer/my-reviews/status/{status}`

**Description:** Get applications reviewed by the current officer, filtered by status.

**Access:** ADMIN, OFFICER

**Path Parameters:**

- `status` (ApplicationStatus) - PENDING, APPROVED, or REJECTED

**Response:** Same as Get My Reviews

### Get Officer Profile

**GET** `/api/officer/profile`

**Description:** Get profile information of the currently authenticated officer.

**Access:** ADMIN, OFFICER

**Response:**

```json
{
  "success": true,
  "message": "Officer retrieved successfully",
  "data": {
    "officerId": 1,
    "employeeId": "EMP001",
    "names": "John Officer",
    "department": "Tax Administration",
    "officerType": "REVIEWER"
  }
}
```

### Get All Applications

**GET** `/api/officer/applications`

**Description:** Get all tax professional applications (same as admin endpoint).

**Access:** ADMIN, OFFICER

**Response:**

```json
{
  "success": true,
  "message": "All applications retrieved successfully",
  "data": [ ... ]
}
```

### Get All Applications (Alternative)

**GET** `/api/officer/taxprofessionals/applications`

**Description:** Alternative endpoint for getting all applications (backward compatibility).

**Access:** ADMIN, OFFICER

**Response:** Same as Get All Applications

---

## Admin Endpoints

### Create Officer

**POST** `/api/admin/officers`

**Description:** Create a new officer account.

**Access:** ADMIN only

**Request Body:**

```json
{
  "employeeId": "EMP001",
  "names": "John Officer",
  "department": "Tax Administration",
  "password": "SecurePass123!",
  "officerType": "REVIEWER | ADMIN"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Officer created successfully",
  "data": {
    "officerId": 1,
    "employeeId": "EMP001",
    "names": "John Officer",
    "department": "Tax Administration",
    "officerType": "REVIEWER"
  }
}
```

### Update Officer

**PUT** `/api/admin/officers/{officerId}`

**Description:** Update an existing officer's information.

**Access:** ADMIN only

**Path Parameters:**

- `officerId` (Long) - Officer ID

**Request Body:**

```json
{
  "names": "Updated Name",
  "department": "Updated Department",
  "password": "NewPassword123!",
  "officerType": "REVIEWER"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Officer updated successfully",
  "data": { ... }
}
```

### Get All Officers

**GET** `/api/admin/officers`

**Description:** Retrieve all officers in the system.

**Access:** ADMIN only

**Response:**

```json
{
  "success": true,
  "message": "Officers retrieved successfully",
  "data": [ ... ]
}
```

### Get Officer by Employee ID

**GET** `/api/admin/officers/{employeeId}`

**Description:** Retrieve a specific officer by employee ID.

**Access:** ADMIN only

**Path Parameters:**

- `employeeId` (String) - Employee ID

**Response:**

```json
{
  "success": true,
  "message": "Officer retrieved successfully",
  "data": { ... }
}
```

### Delete Officer

**DELETE** `/api/admin/officers/{officerId}`

**Description:** Delete an officer account.

**Access:** ADMIN only

**Path Parameters:**

- `officerId` (Long) - Officer ID to delete

**Response:**

```json
{
  "success": true,
  "message": "Officer deleted successfully",
  "data": "Officer ID: {officerId}"
}
```

### Get All Applications (Admin)

**GET** `/api/admin/applications`

**Description:** Retrieve all tax professional applications.

**Access:** ADMIN only

**Response:**

```json
{
  "success": true,
  "message": "All applications retrieved successfully",
  "data": [ ... ]
}
```

### Get Applications by Officer

**GET** `/api/admin/applications/officer/{employeeId}`

**Description:** Retrieve all applications reviewed by a specific officer.

**Access:** ADMIN only

**Path Parameters:**

- `employeeId` (String) - Officer's employee ID

**Response:**

```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": [ ... ]
}
```

### Get Applications by Status (Admin)

**GET** `/api/admin/applications/status/{status}`

**Description:** Retrieve applications filtered by status.

**Access:** ADMIN only

**Path Parameters:**

- `status` (ApplicationStatus) - PENDING, APPROVED, or REJECTED

**Response:**

```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": [ ... ]
}
```

### Get Applications by Status and Officer

**GET** `/api/admin/applications/officer/{employeeId}/status/{status}`

**Description:** Retrieve applications filtered by both officer and status.

**Access:** ADMIN only

**Path Parameters:**

- `employeeId` (String) - Officer's employee ID
- `status` (ApplicationStatus) - PENDING, APPROVED, or REJECTED

**Response:**

```json
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": [ ... ]
}
```

---

## Document Endpoints

### Upload Single Document

**POST** `/api/documents/upload`

**Description:** Upload a single document for a tax professional.

**Access:** TAXPROFESSIONAL

**Request Parameters:**

- `tpin` (String) - Tax Professional Identification Number
- `documentType` (DocumentType) - Type of document (see DocumentType enum)
- `file` (MultipartFile) - Document file to upload

**Document Types:**

- `SIGNEDLETTER`
- `CRIMINALRECORD`
- `EDUCERTIFICATE`
- `RECOMMENDATIONLETTER`
- `NONREFUNDFEES`
- `CV`
- `TAXCLEARANCECERTIFICATE`
- `BUSINESSREGISTRATIONCERT`

**Response:**

```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "docId": 1,
    "tpin": "100234567",
    "documentType": "SIGNEDLETTER",
    "filePath": "/uploads/100234567/signed_letter.pdf",
    "uploadedAt": "2025-01-15T10:35:00",
    "isVerified": false
  }
}
```

### Upload Multiple Documents

**POST** `/api/documents/upload/bulk`

**Description:** Upload multiple documents at once for a tax professional.

**Access:** TAXPROFESSIONAL

**Request Parameters:**

- `tpin` (String) - Tax Professional Identification Number
- `signedLetter` (MultipartFile, optional) - Signed letter document
- `criminalRecord` (MultipartFile, optional) - Criminal record document
- `eduCertificate` (MultipartFile, optional) - Education certificate
- `recommendationLetter` (MultipartFile, optional) - Recommendation letter
- `nonRefundFees` (MultipartFile, optional) - Non-refundable fees receipt
- `cv` (MultipartFile, optional) - Curriculum Vitae
- `taxClearanceCert` (MultipartFile, optional) - Tax clearance certificate
- `businessRegCert` (MultipartFile, optional) - Business registration certificate

**Response:**

```json
{
  "success": true,
  "message": "3 documents uploaded successfully",
  "data": [
    {
      "docId": 1,
      "tpin": "100234567",
      "documentType": "SIGNEDLETTER",
      ...
    }
  ]
}
```

### Get Documents by TPIN

**GET** `/api/documents/tpin/{tpin}`

**Description:** Retrieve all documents for a specific tax professional.

**Access:** TAXPROFESSIONAL, ADMIN, OFFICER

**Path Parameters:**

- `tpin` (String) - Tax Professional Identification Number

**Response:**

```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "data": [
    {
      "docId": 1,
      "tpin": "100234567",
      "documentType": "SIGNEDLETTER",
      "filePath": "/uploads/100234567/signed_letter.pdf",
      "uploadedAt": "2025-01-15T10:35:00",
      "isVerified": false
    }
  ]
}
```

### Get Documents by TPIN (Alternative)

**GET** `/api/documents/taxprofessional/{tpin}`

**Description:** Alternative endpoint for getting documents by TPIN (frontend compatibility).

**Access:** TAXPROFESSIONAL, ADMIN, OFFICER

**Path Parameters:**

- `tpin` (String) - Tax Professional Identification Number

**Response:** Same as Get Documents by TPIN

### Get Document by ID

**GET** `/api/documents/{docId}`

**Description:** Retrieve a specific document by its ID.

**Access:** TAXPROFESSIONAL, ADMIN, OFFICER

**Path Parameters:**

- `docId` (Long) - Document ID

**Response:**

```json
{
  "success": true,
  "message": "Document retrieved successfully",
  "data": {
    "docId": 1,
    "tpin": "100234567",
    "documentType": "SIGNEDLETTER",
    "filePath": "/uploads/100234567/signed_letter.pdf",
    "uploadedAt": "2025-01-15T10:35:00",
    "isVerified": false
  }
}
```

### Get Document by Type and TPIN

**GET** `/api/documents/tpin/{tpin}/type/{documentType}`

**Description:** Retrieve a specific document type for a tax professional.

**Access:** TAXPROFESSIONAL, ADMIN, OFFICER

**Path Parameters:**

- `tpin` (String) - Tax Professional Identification Number
- `documentType` (DocumentType) - Type of document

**Response:** Same as Get Document by ID

### Download Document

**GET** `/api/documents/download/{docId}`

**Description:** Download a document file. Returns the file as a binary stream with appropriate headers.

**Access:** TAXPROFESSIONAL, ADMIN, OFFICER

**Path Parameters:**

- `docId` (Long) - Document ID

**Response:** Binary file stream with headers:

- `Content-Type: application/octet-stream`
- `Content-Disposition: attachment; filename="document.pdf"`
- `Access-Control-Allow-Origin: *`
- `Access-Control-Expose-Headers: Content-Disposition`

**Note:** This endpoint includes CORS headers for cross-origin file downloads.

### Get Verified Documents

**GET** `/api/documents/tpin/{tpin}/verified`

**Description:** Retrieve all verified documents for a tax professional.

**Access:** TAXPROFESSIONAL, ADMIN, OFFICER

**Path Parameters:**

- `tpin` (String) - Tax Professional Identification Number

**Response:**

```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "data": [ ... ]
}
```

### Get Unverified Documents

**GET** `/api/documents/tpin/{tpin}/unverified`

**Description:** Retrieve all unverified documents for a tax professional.

**Access:** ADMIN, OFFICER

**Path Parameters:**

- `tpin` (String) - Tax Professional Identification Number

**Response:** Same as Get Verified Documents

### Get All Documents (Admin/Officer)

**GET** `/api/documents/all`

**Description:** Retrieve all documents in the system.

**Access:** ADMIN, OFFICER

**Response:**

```json
{
  "success": true,
  "message": "All documents retrieved successfully",
  "data": [ ... ]
}
```

### Get Document Count by TPIN

**GET** `/api/documents/tpin/{tpin}/count`

**Description:** Get the total number of documents uploaded by a tax professional.

**Access:** TAXPROFESSIONAL, ADMIN, OFFICER

**Path Parameters:**

- `tpin` (String) - Tax Professional Identification Number

**Response:**

```json
{
  "success": true,
  "message": "Document count retrieved successfully",
  "data": 5
}
```

### Verify Document

**PUT** `/api/documents/verify/{docId}`

**Description:** Mark a document as verified.

**Access:** ADMIN, OFFICER

**Path Parameters:**

- `docId` (Long) - Document ID to verify

**Response:**

```json
{
  "success": true,
  "message": "Document verified successfully",
  "data": "Document ID: 1"
}
```

### Unverify Document

**PUT** `/api/documents/unverify/{docId}`

**Description:** Mark a document as unverified.

**Access:** ADMIN, OFFICER

**Path Parameters:**

- `docId` (Long) - Document ID to unverify

**Response:**

```json
{
  "success": true,
  "message": "Document unverified successfully",
  "data": "Document ID: 1"
}
```

### Update Document

**PUT** `/api/documents/update/{docId}`

**Description:** Replace/update an existing document file.

**Access:** TAXPROFESSIONAL

**Path Parameters:**

- `docId` (Long) - Document ID to update

**Request Parameters:**

- `file` (MultipartFile) - New document file

**Response:**

```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "docId": 1,
    "tpin": "100234567",
    "documentType": "SIGNEDLETTER",
    "filePath": "/uploads/100234567/signed_letter_updated.pdf",
    "uploadedAt": "2025-01-15T15:00:00",
    "isVerified": false
  }
}
```

### Delete Document

**DELETE** `/api/documents/{docId}`

**Description:** Delete a specific document.

**Access:** TAXPROFESSIONAL, ADMIN

**Path Parameters:**

- `docId` (Long) - Document ID to delete

**Response:**

```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": "Document ID: 1"
}
```

### Delete All Documents by TPIN

**DELETE** `/api/documents/tpin/{tpin}`

**Description:** Delete all documents for a specific tax professional.

**Access:** ADMIN only

**Path Parameters:**

- `tpin` (String) - Tax Professional Identification Number

**Response:**

```json
{
  "success": true,
  "message": "All documents deleted successfully",
  "data": "TPIN: 100234567"
}
```

### Delete Document by Type and TPIN

**DELETE** `/api/documents/tpin/{tpin}/type/{documentType}`

**Description:** Delete a specific document type for a tax professional.

**Access:** TAXPROFESSIONAL, ADMIN

**Path Parameters:**

- `tpin` (String) - Tax Professional Identification Number
- `documentType` (DocumentType) - Type of document to delete

**Response:**

```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": "Document type: SIGNEDLETTER"
}
```

---

## Enumerations

### ApplicationStatus

- `PENDING` - Application is pending review
- `APPROVED` - Application has been approved
- `REJECTED` - Application has been rejected

### DocumentType

- `SIGNEDLETTER` - Signed letter
- `CRIMINALRECORD` - Criminal record certificate
- `EDUCERTIFICATE` - Education certificate
- `RECOMMENDATIONLETTER` - Recommendation letter
- `NONREFUNDFEES` - Non-refundable fees receipt
- `CV` - Curriculum Vitae
- `TAXCLEARANCECERTIFICATE` - Tax clearance certificate
- `BUSINESSREGISTRATIONCERT` - Business registration certificate

### LocationType

- `PROVINCE` - Province level
- `DISTRICT` - District level
- `SECTOR` - Sector level
- `CELL` - Cell level
- `VILLAGE` - Village level

### OfficerType

- `ADMIN` - Administrator
- `REVIEWER` - Review officer

### BusinessStatus

- `INDIVIDUAL` - Individual tax professional
- `COMPANY` - Company/Organization

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "data": null,
  "timestamp": "2025-01-15T12:00:00"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request data or validation failure
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User doesn't have required role/permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource (e.g., duplicate email, TIN)
- `500 Internal Server Error` - Server error

---

## Notes

1. **CORS:** All endpoints support CORS with `Access-Control-Allow-Origin: *`
2. **File Uploads:** Maximum file size is 10MB per file
3. **Authentication:** JWT tokens expire after 24 hours (86400000 milliseconds)
4. **TPIN Format:** TPIN is a 9-digit number assigned automatically during registration
5. **Date Format:** All dates are in ISO 8601 format (e.g., `2025-01-15T10:30:00`)
6. **Password Requirements:** Must be at least 8 characters with digit, lowercase, uppercase, and special character
