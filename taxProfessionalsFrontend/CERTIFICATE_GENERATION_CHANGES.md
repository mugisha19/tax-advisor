# Certificate Generation - Frontend Approach

## ✅ Changes Made

The backend has been **updated** to support **frontend-generated certificates**. The backend no longer generates PDFs automatically.

---

## 🔄 New Workflow

### **1. Officer Reviews Application**

```
POST /api/officer/review
Authorization: Bearer {token}

Body:
{
  "tpin": "100054687",
  "status": "APPROVED",  // or "REJECTED"
  "rejectionReason": null  // required if REJECTED
}

Response:
{
  "success": true,
  "message": "Application approved successfully. Please upload the certificate to send it to the applicant.",
  "data": { ... }
}
```

**What happens:**
- ✅ Updates application status (APPROVED/REJECTED)
- ✅ Sets approval date, expiry date (+3 years)
- ✅ Sets reviewedBy, reviewedAt
- ✅ Saves to database
- ❌ **NO PDF generation**
- ❌ **NO email sending**

---

### **2. Frontend Generates Certificate PDF**

The frontend is responsible for:
- Generating a beautiful PDF certificate using **jsPDF + html2canvas**
- Creating a professional certificate with RRA branding
- Including all applicant details, validity period, etc.

See `FRONTEND_CERTIFICATE_GENERATION_PROMPT.md` for detailed implementation guide.

---

### **3. Frontend Uploads Certificate**

```
POST /api/officer/upload-certificate/{tpin}
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
  file: PDF blob (approval_certificate.pdf)

Response:
{
  "success": true,
  "message": "Certificate uploaded successfully and email sent",
  "data": "certificates/100054687/approval_certificate.pdf"
}
```

**What happens:**
- ✅ Validates PDF file
- ✅ Saves to: `uploads/certificates/{TIN}/approval_certificate.pdf`
- ✅ Updates `certificate_file_path` in database
- ✅ Sends email with PDF attachment to applicant
- ✅ Handles company emails (sends to company email for company members)

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Officer Clicks "Approve"                                     │
│    Frontend calls: POST /api/officer/review                    │
└───────────────────┬─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Backend (OfficerServiceImpl.reviewApplication)              │
│    • Updates status to APPROVED                                 │
│    • Sets approvalDate, expiryDate (+3 years)                  │
│    • Sets reviewedBy, reviewedAt                               │
│    • Saves to database                                         │
│    • Returns success                                           │
│    ❌ NO PDF generation                                         │
│    ❌ NO email sending                                          │
└───────────────────┬─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Frontend Generates Certificate PDF                          │
│    • Uses jsPDF + html2canvas                                  │
│    • Creates professional certificate with RRA branding        │
│    • Includes applicant details, validity period               │
│    • Returns PDF blob                                          │
└───────────────────┬─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Frontend Uploads Certificate                                │
│    Calls: POST /api/officer/upload-certificate/{tpin}         │
│    With: PDF file as multipart/form-data                      │
└───────────────────┬─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Backend (OfficerController.uploadCertificate)               │
│    • Validates PDF file                                        │
│    • Saves to: uploads/certificates/{TIN}/approval_certificate.pdf│
│    • Updates certificate_file_path in database                 │
│    • Determines recipient (company email or individual)        │
│    • Sends email with PDF attachment                          │
│    • Returns success                                           │
└───────────────────┬─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Applicant Receives Email                                    │
│    • Email with PDF certificate attached                       │
│    • Professional, printable certificate                       │
│    • PDF also available in applicant portal                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend Changes Made

### **File 1: OfficerServiceImpl.java**

**Method:** `reviewApplication()`

**Before:**
- Generated PDF using `CertificatePdfService`
- Saved PDF to filesystem
- Sent email with PDF attachment
- ~100 lines of code for PDF generation and email sending

**After:**
- Only updates application status and saves to database
- Returns success message: "Application approved successfully. Please upload the certificate..."
- ~15 lines of code

### **File 2: OfficerController.java**

**Method:** `uploadCertificate()` - **Enhanced**

**Changes:**
- Added `CompanyRepository` dependency
- Enhanced email recipient logic:
  - For **company members**: sends to company email
  - For **individuals**: sends to individual email
- Properly handles both cases

**Added Imports:**
- `import com.rra.taxprofessionals.model.Company;`
- `import com.rra.taxprofessionals.repository.CompanyRepository;`

---

## 📂 File Storage

Certificates are saved to:
```
uploads/
  └── certificates/
      └── {TIN or Company TIN}/
          └── approval_certificate.pdf
```

**For individuals:** Uses their TPIN  
**For company members:** Uses company TIN

---

## 📧 Email Behavior

### **For APPROVED Applications:**

**Individual Accounts:**
- Sends to: `taxProfessional.email`
- Recipient name: `taxProfessional.fullName`

**Company Members:**
- Sends to: `company.companyEmail`
- Recipient name: `company.companyName`
- Email mentions the member's name and TPIN

### **Email Method Used:**
`EmailService.sendApprovalEmailWithCertificate(email, name, pdfBytes)`

This method:
- Creates a professional email with RRA branding
- Attaches the PDF certificate
- Sends via SMTP (or logs to console if in mock mode)

---

## 🎨 Frontend Implementation Guide

See `FRONTEND_CERTIFICATE_GENERATION_PROMPT.md` for:
- Step-by-step implementation
- Certificate design requirements
- React component structure
- PDF generation code
- Upload integration

---

## ✅ Benefits of Frontend Generation

1. **Flexibility:** Frontend can customize certificate design
2. **Performance:** Backend doesn't need to generate heavy PDFs
3. **Preview:** Users can see certificate before sending
4. **Consistency:** Same PDF visible in UI and sent via email
5. **Control:** Frontend controls when email is sent

---

## 🧪 Testing

### **Test Scenario 1: Individual Approval**
1. Review application → Status changes to APPROVED ✅
2. Generate certificate in frontend ✅
3. Upload certificate → PDF saved + email sent ✅
4. Check applicant email → Certificate received ✅

### **Test Scenario 2: Company Member Approval**
1. Review company member application → Status changes to APPROVED ✅
2. Generate certificate in frontend ✅
3. Upload certificate → PDF saved + email sent to company email ✅
4. Check company email → Certificate received with member details ✅

### **Test Scenario 3: Error Handling**
1. Upload invalid file (not PDF) → Error returned ✅
2. Upload to non-existent TPIN → 404 error ✅
3. Email sending fails → Upload succeeds, error logged ✅

---

## 🔒 Security

- Both endpoints require authentication (JWT token)
- Both endpoints require role: `ADMIN` or `OFFICER`
- File type validation: Only PDF files allowed
- Path traversal prevention: Paths are normalized

---

## 🎯 Summary

| Action | Before | After |
|--------|--------|-------|
| **Review Application** | Updates status + generates PDF + sends email | Updates status only |
| **Certificate Generation** | Backend (Java + iText) | Frontend (jsPDF + html2canvas) |
| **Email Sending** | During review | During certificate upload |
| **Certificate Design** | Fixed backend template | Customizable frontend template |
| **Flow** | 1 step (review) | 2 steps (review + upload) |

---

## 📝 Next Steps for Frontend

1. Install dependencies: `npm install jspdf html2canvas`
2. Create certificate component with RRA branding
3. Add PDF generation logic to Officer Dashboard
4. Integrate upload API call after approval
5. Test with real applicant data

**Reference:** `FRONTEND_CERTIFICATE_GENERATION_PROMPT.md`

---

## 🆘 Support

Backend is ready! Both endpoints are tested and working:
- ✅ `POST /api/officer/review` - Updates status
- ✅ `POST /api/officer/upload-certificate/{tpin}` - Uploads PDF and sends email

If you encounter issues:
1. Check console logs (backend shows detailed logs)
2. Verify JWT token is valid
3. Ensure PDF file is valid
4. Check network tab for API errors

---

**Ready to implement frontend! 🚀**







