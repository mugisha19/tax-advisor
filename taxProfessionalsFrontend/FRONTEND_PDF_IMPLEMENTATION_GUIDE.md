# Frontend PDF Certificate Implementation Guide

## 📋 Overview
Implement a frontend PDF certificate generation feature for the Officer Dashboard that allows officers to download professional Tax Professional certificates for APPROVED applicants.

---

## 🎯 What You Need to Build

### 1. **Install Dependencies**
Navigate to your Officer app directory and install required packages:

```bash
cd C:\Users\int0000188\Downloads\RRA\taxProfessionalFrontEnd\Officer_app
npm install jspdf html2canvas
```

---

## 🏗️ Architecture

### Components to Create/Modify:
1. **TaxProfessionalCertificate.jsx** (NEW) - Certificate template component
2. **OfficerDashboard.jsx** (MODIFY) - Add PDF download button and logic
3. **OfficerServices.js** (MODIFY) - Add API call for certificate download

---

## 📦 Step 1: Create Certificate Component

**File**: `src/Officer/TaxProfessionalCertificate.jsx`

### Purpose
A React component that renders a professional certificate matching RRA branding (similar to Travel Clearance Report format).

### Component Structure

```jsx
import React, { forwardRef } from 'react';

const TaxProfessionalCertificate = forwardRef(({ applicant }, ref) => {
  // Component renders a printable certificate
});

export default TaxProfessionalCertificate;
```

### Required Sections

#### A. **Header Section**
- RRA Logo (from `/Assets/bg_rra_logo.png`)
- "RWANDA REVENUE AUTHORITY" title
- "TAXES FOR GROWTH AND DEVELOPMENT" subtitle
- "CONFIDENTIAL" badge (red, bold, bordered box)

#### B. **Top Border**
Gradient colored line using RRA brand colors:
- Blue: `#0070C0` (33%)
- Orange: `#ED7D31` (33%)
- Green: `#70AD47` (34%)

#### C. **Date Section** (Right-aligned)
```
Date: [Approval Date - format: DD/MM/YYYY]
```

#### D. **Recipient Details** (Left-aligned)
```
[Applicant Full Name]
[Email Address]
[Phone Number]
[Work Address - Province, District, Sector, Cell, Village]
```

#### E. **Title** (Center-aligned, Bold, Large)
```
TAX ADVISORY LICENSE CERTIFICATE
```

#### F. **Body Content**
- Reference to Commissioner General Directive
- Approval message
- License validity period (3 years from approval date)
- Applicant qualifications (Bachelor, Masters, Professional)

#### G. **Signature Section**
```
Sincerely,

[Reviewer Name if available, otherwise "Commissioner General"]
Commissioner General
Rwanda Revenue Authority
```

#### H. **Footer Section**
- RRA motto: "HERE FOR YOU" / "TO SERVE" (styled with gradient colors)
- Contact information:
  - Address: Kicukiro-Sonatube-Silverback Mall, P.O.Box 3987 Kigali, Rwanda
  - Call: 3004
  - Website: www.rra.gov.rw
  - X (Twitter): @rrainfo

#### I. **Watermark**
Transparent RRA logo in the background (opacity: 0.1)

---

### Styling Guidelines

#### RRA Brand Colors
```javascript
const RRA_COLORS = {
  blue: '#0070C0',      // RGB(0, 112, 192)
  green: '#70AD47',     // RGB(112, 173, 71)
  orange: '#ED7D31',    // RGB(237, 125, 49)
  red: '#C00000'        // RGB(192, 0, 0)
};
```

#### Tailwind Classes to Use
- Container: `bg-white`, `min-h-screen`, `p-8`
- Text sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-2xl`
- Font weights: `font-semibold`, `font-bold`
- Spacing: `mb-2`, `mb-4`, `mb-6`, `mt-2`, `mt-4`
- Colors: Use inline styles for RRA brand colors

---

## 🔧 Step 2: Add PDF Download Service

**File**: `src/services/OfficerServices.js`

Add a new function to download certificates:

```javascript
// Add this import at the top
import axios from 'axios';

// Add this function
export const downloadCertificate = async (tpin) => {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/officer/certificate/${tpin}`,
      {
        responseType: 'blob', // Important for PDF download
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );
    
    return response;
  } catch (error) {
    console.error('Error downloading certificate:', error);
    throw error;
  }
};
```

---

## 🎨 Step 3: Modify Officer Dashboard

**File**: `src/Officer/OfficerDashboard.jsx`

### A. Add Imports (at the top of file)
```javascript
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import TaxProfessionalCertificate from './TaxProfessionalCertificate';
import { Download, FileDown } from 'lucide-react'; // Add new icon
import { downloadCertificate } from '../services/OfficerServices'; // Add service
```

### B. Add State Variables (inside component)
```javascript
const [showCertificate, setShowCertificate] = useState(false);
const [certificateApplicant, setCertificateApplicant] = useState(null);
const certificateRef = React.useRef(null);
```

### C. Add PDF Generation Function
```javascript
const handleDownloadCertificatePDF = async (applicant) => {
  try {
    setLoading(true);
    
    // Method 1: Download from backend (already generated PDF)
    const response = await downloadCertificate(applicant.tpin);
    
    // Create blob from response
    const blob = new Blob([response.data], { type: 'application/pdf' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tax_Professional_Certificate_${applicant.tpin}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    setMessage('Certificate downloaded successfully!');
    setTimeout(() => setMessage(''), 3000);
    
  } catch (err) {
    console.error('PDF download error:', err);
    
    // Method 2: Fallback to frontend generation if backend fails
    try {
      setMessage('Generating certificate from template...');
      setCertificateApplicant(applicant);
      setShowCertificate(true);
      
      // Wait for component to render
      setTimeout(async () => {
        const element = certificateRef.current;
        
        if (!element) {
          throw new Error('Certificate template not found');
        }
        
        // Generate canvas from HTML
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Tax_Professional_Certificate_${applicant.tpin}_${new Date().toISOString().split('T')[0]}.pdf`);
        
        setShowCertificate(false);
        setCertificateApplicant(null);
        setMessage('Certificate generated successfully!');
        setTimeout(() => setMessage(''), 3000);
        
      }, 500);
      
    } catch (fallbackErr) {
      console.error('Fallback PDF generation error:', fallbackErr);
      setError('Failed to generate certificate. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
    
  } finally {
    setLoading(false);
  }
};
```

### D. Add Download Button in Detail View

**Location**: In the applicant detail view header (around line 748), add the button next to the status badge:

```jsx
{/* Existing header content */}
<div className="flex items-center gap-3">
  {/* Existing badges (Required Attention, Reapplication, etc.) */}
  
  {/* NEW: Download Certificate Button - Only for APPROVED applications */}
  {selectedApplicant.status === 'APPROVED' && (
    <button
      onClick={() => handleDownloadCertificatePDF(selectedApplicant)}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white border-2 border-white/20 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Download Certificate"
    >
      <Download className="w-4 h-4 mr-2" />
      Download Certificate
    </button>
  )}
  
  {/* Existing status badge */}
  <span className={...}>
    {selectedApplicant.status}
  </span>
</div>
```

### E. Add Hidden Certificate Component

Add this at the end of the component (before the closing `</>` tag):

```jsx
{/* Hidden certificate template for PDF generation */}
{showCertificate && certificateApplicant && (
  <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
    <TaxProfessionalCertificate 
      ref={certificateRef}
      applicant={certificateApplicant}
    />
  </div>
)}
```

---

## 📊 Step 4: Certificate Data Mapping

Map the applicant data to certificate fields:

### Data Field Mapping
```javascript
{
  fullName: applicant.fullName,                    // Recipient name
  tpin: applicant.tpin || applicant.tinCompany,    // TIN
  nid: applicant.nid,                              // National ID
  email: applicant.email,                          // Email
  phoneNumber: applicant.phoneNumber,              // Phone
  workAddress: applicant.workAddress?.name,        // Full address
  approvalDate: applicant.approvalDate,            // License start date
  expiryDate: applicant.expiryDate,                // License end date
  bachelorDegree: applicant.bachelorDegree,        // Education
  mastersDegree: applicant.mastersDegree,          // Education
  professionalQualification: applicant.professionalQualification, // Qualification
  reviewedBy: applicant.reviewedBy,                // Officer ID
  businessStatus: applicant.businessStatus         // Individual/Company
}
```

### Date Formatting
```javascript
const formatDateLong = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

// Calculate expiry date (3 years from approval)
const calculateExpiryDate = (approvalDate) => {
  if (!approvalDate) return null;
  const date = new Date(approvalDate);
  date.setFullYear(date.getFullYear() + 3);
  return date;
};
```

---

## 🎯 Backend API Endpoint

### Endpoint Details
```
GET /api/officer/certificate/{tpin}
```

**Authorization**: Bearer Token (Officer/Admin role required)

**Response**: PDF file (application/pdf)

**Filename**: `Tax_Professional_Certificate_{TIN}.pdf`

**HTTP Status Codes**:
- `200 OK`: Certificate downloaded successfully
- `403 Forbidden`: Not authorized (not an officer/admin)
- `404 Not Found`: Certificate not found or applicant not approved
- `500 Internal Server Error`: Server error

---

## ✅ Testing Checklist

1. **Visual Testing**
   - [ ] Certificate displays RRA logo correctly
   - [ ] All brand colors match (blue, orange, green, red)
   - [ ] Gradient border displays correctly
   - [ ] Confidential badge is prominent
   - [ ] Footer displays all contact information
   - [ ] Watermark is transparent and centered

2. **Functionality Testing**
   - [ ] Download button only appears for APPROVED applications
   - [ ] PDF downloads successfully (backend method)
   - [ ] Frontend generation works as fallback
   - [ ] Filename includes TIN and date
   - [ ] PDF opens correctly in PDF reader
   - [ ] Certificate is readable and professional

3. **Data Testing**
   - [ ] All applicant data displays correctly
   - [ ] Dates are formatted properly (DD/MM/YYYY)
   - [ ] License validity is 3 years from approval
   - [ ] Individual vs Company data handled correctly
   - [ ] Missing fields show "—" or appropriate placeholder

4. **Error Handling**
   - [ ] Error message shown if download fails
   - [ ] Fallback to frontend generation if backend fails
   - [ ] Loading state prevents duplicate clicks
   - [ ] Success message confirms download

5. **Browser Compatibility**
   - [ ] Test in Chrome
   - [ ] Test in Firefox
   - [ ] Test in Edge
   - [ ] Mobile responsive (if applicable)

---

## 🎨 Example Certificate Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [RRA LOGO]   RWANDA REVENUE AUTHORITY          CONFIDENTIAL│
│               TAXES FOR GROWTH AND DEVELOPMENT              │
├─ Blue ─────── Orange ────── Green ───────────────────────────┤
│                                                Date: DD/MM/YY│
│                                                              │
│  [Applicant Name]                                           │
│  [Email]                                                    │
│  [Phone]                                                    │
│  [Address]                                                  │
│                                                              │
│              TAX ADVISORY LICENSE CERTIFICATE               │
│                                                              │
│  Reference is made to the article 4 of the Directive of    │
│  the Commissioner General No 001/RRA/25 of 03/10/2025...   │
│                                                              │
│  Following the review of your submitted application and     │
│  accompanying documents, the Rwanda Revenue Authority has   │
│  approved your license.                                     │
│                                                              │
│  This license is valid for period of three (3) years       │
│  starting from DD/MM/YYYY to DD/MM/YYYY.                   │
│                                                              │
│  Qualifications:                                            │
│  • Bachelor's Degree: [Degree Name]                        │
│  • Master's Degree: [Degree Name]                          │
│  • Professional Qualification: [Qualification]             │
│                                                              │
│  Sincerely,                                                 │
│                                                              │
│  Commissioner General                                       │
│  Rwanda Revenue Authority                                   │
│                                                              │
├─────────────── HERE FOR YOU / TO SERVE ─────────────────────┤
│  Kicukiro-Sonatube-Silverback Mall, P.O.Box 3987          │
│  ☎ 3004  🌐 www.rra.gov.rw  𝕏 @rrainfo                     │
└─────────────────────────────────────────────────────────────┘
     [Watermark: Transparent RRA Logo in center]
```

---

## 🚀 Implementation Order

1. **Phase 1**: Install dependencies
2. **Phase 2**: Create `TaxProfessionalCertificate.jsx` component
3. **Phase 3**: Add download service in `OfficerServices.js`
4. **Phase 4**: Modify `OfficerDashboard.jsx` (imports, state, functions)
5. **Phase 5**: Add download button in detail view
6. **Phase 6**: Test with approved applicant
7. **Phase 7**: Style adjustments and refinements

---

## 💡 Tips & Best Practices

1. **Performance**: The certificate component should be hidden (`position: absolute, left: -9999px`) during PDF generation to avoid UI flicker.

2. **Image Loading**: Use `useCORS: true` in html2canvas options if loading external images.

3. **PDF Quality**: Use `scale: 2` in html2canvas for better quality (higher DPI).

4. **Error Recovery**: Always have fallback to frontend generation if backend fails.

5. **User Feedback**: Show loading state and success/error messages clearly.

6. **Naming Convention**: Include TIN and date in filename for easy identification.

7. **Mobile**: Consider responsive design if officers use tablets/phones.

---

## 📝 Summary

**What's Being Built**:
A professional PDF certificate generator that:
- Downloads backend-generated certificates (primary method)
- Falls back to frontend generation if needed (backup method)
- Matches RRA branding exactly
- Works for both individual and company applicants
- Only appears for APPROVED applications

**User Experience**:
1. Officer views APPROVED applicant details
2. Clicks "Download Certificate" button
3. PDF downloads automatically
4. PDF contains professional certificate with RRA branding
5. Certificate can be shared with tax professional

---

## 🆘 Troubleshooting

**Issue**: PDF is blank
- **Solution**: Check that certificateRef is pointing to the correct component
- **Solution**: Verify component has rendered before calling html2canvas

**Issue**: Images not showing in PDF
- **Solution**: Ensure `useCORS: true` is set in html2canvas options
- **Solution**: Check image paths are correct

**Issue**: PDF quality is poor
- **Solution**: Increase `scale` option in html2canvas (try 2 or 3)

**Issue**: Backend download fails
- **Solution**: Check that officer has valid JWT token
- **Solution**: Verify backend is running and endpoint is accessible
- **Solution**: Frontend fallback should activate automatically

**Issue**: Button not showing
- **Solution**: Verify applicant status is exactly "APPROVED" (case-sensitive)
- **Solution**: Check selectedApplicant object has all required data

---

## 📞 Support

Backend changes are complete. The endpoint `/api/officer/certificate/{tpin}` is ready and accessible to officers/admins.

For any issues during implementation, check:
1. Console logs for errors
2. Network tab for API calls
3. React DevTools for component state
4. Browser PDF viewer compatibility

---

**Good luck with implementation! 🎉**

