# Frontend Certificate Generation - Implementation Guide

## 🎯 Overview
Implement beautiful PDF certificate generation in the Officer Dashboard. When an officer approves an application, the frontend will:
1. Generate a professional certificate PDF (matching Travel Clearance style)
2. Upload the PDF to the backend
3. Backend stores the PDF and sends it via email to the applicant
4. PDF becomes available in the applicant portal

---

## 📦 Step 1: Install Dependencies

```bash
cd C:\Users\int0000188\Downloads\RRA\taxProfessionalFrontEnd\Officer_app
npm install jspdf html2canvas
```

---

## 🏗️ Step 2: Create Certificate Component

**NEW FILE**: `src/Officer/TaxProfessionalCertificate.jsx`

Create a React component that renders a professional certificate with:

### Required Design Elements:

1. **Header Section**
   - RRA logo (from `/Assets/bg_rra_logo.png`)
   - "RWANDA REVENUE AUTHORITY" title
   - "TAXES FOR GROWTH AND DEVELOPMENT" subtitle  
   - "CONFIDENTIAL" badge (red, bordered)
   - Gradient border line (Blue #0070C0 → Orange #ED7D31 → Green #70AD47)

2. **Date Section** (right-aligned)
   - Format: `Date: DD/MM/YYYY`
   - Use approval date or reviewed date

3. **Recipient Details** (left-aligned)
   - Applicant full name
   - Email address
   - Phone number
   - Work address (Province, District, Sector, Cell, Village)

4. **Certificate Title** (centered, bold, large)
   - "TAX ADVISORY LICENSE CERTIFICATE"

5. **Body Content**
   - Reference to Commissioner General Directive No 001/RRA/25
   - Approval message
   - Qualifications section (if bachelor/masters/professional available)
   - **Validity period in RED BOLD**: "This license is valid for a period of three (3) years starting from [date] to [date]."

6. **Signature Section**
   - "Sincerely,"
   - "Commissioner General"
   - "Rwanda Revenue Authority"

7. **Footer**
   - Gradient line (same as header)
   - Motto: "HERE FOR YOU" (Blue-Orange) / "TO SERVE" (Green)
   - Contact info: Address, Phone (3004), Website, Twitter (@rrainfo)

8. **Watermark**
   - Transparent RRA logo (opacity: 0.1) centered in background

### Component Requirements:
- Use `forwardRef` for ref access
- Size: A4 (210mm x 297mm)
- Use Tailwind CSS for styling
- Props: `{ applicant }` (contains all applicant data)
- Calculate expiry date as +3 years from approval date

---

## 🔧 Step 3: Add Upload Service

**FILE**: `src/services/OfficerServices.js`

Add this function:

```javascript
export const uploadCertificate = async (tpin, pdfBlob) => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
  
  const formData = new FormData();
  formData.append('file', pdfBlob, `certificate_${tpin}.pdf`);
  
  const response = await axios.post(
    `${API_BASE_URL}/api/officer/upload-certificate/${tpin}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }
  );
  
  return response;
};
```

---

## 🎨 Step 4: Modify Officer Dashboard

**FILE**: `src/Officer/OfficerDashboard.jsx`

### A. Add Imports (at top of file)

```javascript
import React, { useRef } from 'react'; // Add useRef if not present
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import TaxProfessionalCertificate from './TaxProfessionalCertificate';
import { uploadCertificate } from '../services/OfficerServices';
```

### B. Add State Variables (inside component)

```javascript
const [showCertificate, setShowCertificate] = useState(false);
const [certificateApplicant, setCertificateApplicant] = useState(null);
const certificateRef = useRef(null);
```

### C. Add PDF Generation Helper Function

```javascript
const generateCertificatePDF = async (applicant) => {
  return new Promise((resolve, reject) => {
    try {
      setCertificateApplicant(applicant);
      setShowCertificate(true);
      
      setTimeout(async () => {
        try {
          const element = certificateRef.current;
          
          if (!element) {
            throw new Error('Certificate template not found');
          }
          
          // Generate high-quality canvas
          const canvas = await html2canvas(element, {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
          });
          
          // Create PDF
          const imgData = canvas.toDataURL('image/png', 1.0);
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
          });
          
          const pdfWidth = 210;
          const imgWidth = pdfWidth;
          const imgHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          
          // Get PDF as Blob
          const pdfBlob = pdf.output('blob');
          
          // Cleanup
          setShowCertificate(false);
          setCertificateApplicant(null);
          
          resolve(pdfBlob);
          
        } catch (error) {
          setShowCertificate(false);
          setCertificateApplicant(null);
          reject(error);
        }
      }, 1000); // Wait for component to render
      
    } catch (error) {
      reject(error);
    }
  });
};
```

### D. Modify `submitReview` Function

**IMPORTANT**: After the backend approval succeeds, generate and upload PDF:

```javascript
const submitReview = async (tpin, action, comment = null, problematicDocIds = null) => {
  setLoading(true);
  try {
    // Step 1: Submit review to backend
    const { data } = await reviewApplication(tpin, action, comment, problematicDocIds);
    if (!data.success) throw new Error(data.message);

    // Step 2: If APPROVED, generate and upload certificate PDF
    if (action === 'APPROVED') {
      try {
        setMessage('✅ Application approved! Generating certificate...');
        
        // Find applicant data
        const approvedApplicant = applicants.find(a => a.tpin === tpin) || selectedApplicant;
        
        if (!approvedApplicant) {
          throw new Error('Applicant data not found');
        }
        
        // Generate PDF
        const pdfBlob = await generateCertificatePDF(approvedApplicant);
        
        setMessage('📤 Uploading certificate...');
        
        // Upload to backend
        await uploadCertificate(tpin, pdfBlob);
        
        setMessage('✅ Application approved! Certificate sent via email.');
        
      } catch (pdfError) {
        console.error('Certificate generation error:', pdfError);
        setError('Application approved, but certificate generation failed.');
        setTimeout(() => setError(''), 5000);
      }
    } else {
      setMessage('Application rejected. Email notification sent.');
    }

    setTimeout(() => setMessage(''), 5000);
    setSelectedApplicant(null);
    setShowRejectionModal(false);
    setRejectionReason('');
    setPendingRejectionTpin(null);
    setProblematicDocumentIds([]);
    fetchApplicants();
    
  } catch (err) {
    setError(err.message || 'Review failed');
    setTimeout(() => setError(''), 5000);
  } finally {
    setLoading(false);
  }
};
```

### E. Add Hidden Certificate Component (at end of JSX, before closing tag)

```jsx
{/* Hidden certificate template for PDF generation */}
{showCertificate && certificateApplicant && (
  <div style={{ 
    position: 'absolute', 
    left: '-9999px',
    top: 0,
    width: '210mm',
    backgroundColor: 'white'
  }}>
    <TaxProfessionalCertificate 
      ref={certificateRef}
      applicant={certificateApplicant}
    />
  </div>
)}
```

---

## 🔄 Complete Workflow

```
1. Officer clicks "Approve Application"
   ↓
2. Frontend: POST /api/officer/review
   Backend updates status to APPROVED
   Backend responds with success
   ↓
3. Frontend generates beautiful PDF certificate
   (Uses TaxProfessionalCertificate component)
   ↓
4. Frontend: POST /api/officer/upload-certificate/{tpin}
   Uploads PDF as multipart/form-data
   ↓
5. Backend:
   - Saves PDF to: uploads/certificates/{TIN}/approval_certificate.pdf
   - Updates certificate_file_path in database
   - Sends email with PDF attached
   ↓
6. Applicant receives email with certificate
7. PDF available in applicant portal for download
```

---

## 📊 Data Mapping

Map applicant data to certificate fields:

```javascript
{
  fullName: applicant.fullName,           // Recipient name
  email: applicant.email,                  // Email
  phoneNumber: applicant.phoneNumber,      // Phone
  workAddress: applicant.workAddress?.name, // Full address string
  approvalDate: applicant.approvalDate || applicant.reviewedAt,
  bachelorDegree: applicant.bachelorDegree,
  mastersDegree: applicant.mastersDegree,
  professionalQualification: applicant.professionalQualification,
  tpin: applicant.tpin || applicant.tinCompany
}
```

### Date Formatting

```javascript
// Format as DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Calculate expiry (3 years from approval)
const calculateExpiry = (approvalDate) => {
  if (!approvalDate) return '—';
  const date = new Date(approvalDate);
  date.setFullYear(date.getFullYear() + 3);
  return formatDate(date);
};
```

---

## 🎨 RRA Brand Colors

```javascript
const RRA_COLORS = {
  blue: '#0070C0',      // RGB(0, 112, 192)
  green: '#70AD47',     // RGB(112, 173, 71)
  orange: '#ED7D31',    // RGB(237, 125, 49)
  red: '#C00000'        // RGB(192, 0, 0)
};
```

---

## ✅ Backend API (Already Implemented)

### Upload Certificate Endpoint

```
POST /api/officer/upload-certificate/{tpin}
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
  file: PDF blob

Response:
{
  "success": true,
  "message": "Certificate uploaded successfully and email sent",
  "data": "certificates/100054687/approval_certificate.pdf"
}
```

**What Backend Does:**
1. ✅ Receives PDF file
2. ✅ Validates file (must be PDF)
3. ✅ Saves to: `uploads/certificates/{TIN}/approval_certificate.pdf`
4. ✅ Updates `certificate_file_path` in database
5. ✅ Sends email with PDF attached to applicant
6. ✅ Makes PDF available for applicant portal download

---

## 🧪 Testing Checklist

### Visual Testing
- [ ] Certificate displays RRA logo
- [ ] All brand colors correct (blue, orange, green, red)
- [ ] Gradient borders display properly
- [ ] "CONFIDENTIAL" badge prominent
- [ ] Footer shows all contact info
- [ ] Watermark is transparent and centered
- [ ] Text is readable and properly formatted

### Functionality Testing
- [ ] Certificate generates after approval
- [ ] PDF uploads successfully to backend
- [ ] Progress messages show correctly:
  - "Application approved! Generating certificate..."
  - "Uploading certificate..."
  - "Application approved! Certificate sent via email."
- [ ] Error handling works if generation fails
- [ ] Applicant receives email with PDF attached
- [ ] PDF available in applicant portal
- [ ] Officer can also download from dashboard

### Data Testing
- [ ] All applicant data displays correctly
- [ ] Dates formatted as DD/MM/YYYY
- [ ] Expiry date is exactly 3 years from approval
- [ ] Qualifications show if available
- [ ] Missing fields show "—"
- [ ] Individual vs Company data handled correctly

---

## 🐛 Debugging Tips

### If certificate doesn't generate:
1. Check console for errors
2. Verify `certificateRef.current` exists
3. Check that component has time to render (1000ms timeout)
4. Verify RRA logo path is correct

### If upload fails:
1. Check network tab for API errors
2. Verify JWT token is valid
3. Check file size (should be reasonable)
4. Verify backend is running

### If email not received:
1. Backend will log if email sending fails
2. Check spam folder
3. Verify email service is configured in backend
4. Check backend logs for email errors

---

## 📝 Success Criteria

When complete, the system should:

✅ Officer approves application → Frontend generates beautiful PDF
✅ PDF uploads to backend automatically
✅ Backend saves PDF to storage
✅ Backend sends email with PDF to applicant
✅ Applicant receives professional certificate in email
✅ Same PDF available in applicant portal
✅ Officers can download the same PDF from dashboard
✅ All PDFs have consistent, professional RRA branding

---

## ⏱️ Estimated Time

- Certificate component creation: 3-4 hours
- Service integration: 1 hour
- Dashboard modification: 1-2 hours
- Testing & refinement: 1-2 hours
- **Total**: 6-9 hours

---

## 🆘 Support

Backend changes are complete. The upload endpoint is ready at:
`POST /api/officer/upload-certificate/{tpin}`

For any issues:
1. Check console logs
2. Check network tab
3. Verify backend is running on port 8080
4. Check that JWT token is valid

---

**Good luck! Create a beautiful certificate that makes RRA proud! 🎉**

