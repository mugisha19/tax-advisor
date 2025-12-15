# ✅ Separate Reset Password URLs for Applicants & Officers

## Changes Implemented

I've updated the system so that **TaxProfessionals (Applicants)** and **Officers** now have **different reset password URLs**.

---

## 🔗 URL Structure

### Officers (Admin Staff)
**URL Pattern:** `/set-password?token=XXX&employeeId=YYY&reset=true`

**Full URL:** `http://localhost:5000/set-password?token=abc-123&employeeId=EMP001&reset=true`

**Used for:**
- Officer invitation emails
- Officer password reset emails

---

### Applicants (TaxProfessionals)
**URL Pattern:** `/applicant/reset-password?token=XXX&email=YYY`

**Full URL:** `http://localhost:5000/applicant/reset-password?token=abc-123&email=user@example.com`

**Used for:**
- Welcome email "Set New Password" link (after registration)
- Applicant forgot password reset emails

---

## 📧 Email Types & URLs

### 1. Officer Invitation Email
- **Recipient:** New officers
- **URL:** `/set-password?token=XXX&employeeId=YYY`
- **Method:** `sendInvitationEmail()`
- **Status:** ✅ Uses officer URL

### 2. Officer Password Reset Email
- **Recipient:** Existing officers (forgot password)
- **URL:** `/set-password?token=XXX&employeeId=YYY&reset=true`
- **Method:** `sendPasswordResetEmail()`
- **Status:** ✅ Uses officer URL

### 3. Applicant Welcome Email
- **Recipient:** Newly registered TaxProfessionals
- **URL:** `/applicant/reset-password?token=XXX&email=YYY`
- **Method:** `sendWelcomePasswordEmail()`
- **Status:** ✅ Uses applicant URL

### 4. Applicant Password Reset Email
- **Recipient:** Existing TaxProfessionals (forgot password)
- **URL:** `/applicant/reset-password?token=XXX&email=YYY`
- **Method:** `sendApplicantPasswordResetEmail()` ← **NEW METHOD**
- **Status:** ✅ Uses applicant URL

---

## 🆕 New Method Added

### EmailService Interface
```java
/**
 * Send password reset email to tax professional (applicant)
 * Uses applicant-specific reset password page
 */
void sendApplicantPasswordResetEmail(String toEmail, String tpin, String fullName, String resetToken);
```

**Implemented in:**
- ✅ `EmailServiceImpl` - Real SMTP implementation
- ✅ `MockEmailServiceImpl` - Mock for testing
- ✅ `AsyncEmailServiceImpl` - Async wrapper

---

## 🔄 Modified Files

### 1. EmailService.java
- Added `sendApplicantPasswordResetEmail()` method signature

### 2. EmailServiceImpl.java
- Implemented `sendApplicantPasswordResetEmail()` with applicant-specific URL
- Added `buildApplicantPasswordResetEmailTemplate()` method
- Updated `sendWelcomePasswordEmail()` to use applicant URL

### 3. MockEmailServiceImpl.java
- Added mock implementation of `sendApplicantPasswordResetEmail()`
- Updated `sendWelcomePasswordEmail()` to use applicant URL

### 4. AsyncEmailServiceImpl.java
- Added async wrapper for `sendApplicantPasswordResetEmail()`

### 5. OfficerServiceImpl.java
- Updated `forgotPassword()` to call `sendApplicantPasswordResetEmail()` for TaxProfessionals
- Officers still use the original `sendPasswordResetEmail()`

---

## 🎨 Frontend Routes Needed

You need to create **two separate pages** in your frontend:

### 1. Officer Reset Password Page
**Route:** `/set-password`

**Query Parameters:**
- `token` - Reset/invitation token
- `employeeId` - Officer's employee ID
- `reset` - Boolean (true for reset, absent for invitation)

**Features:**
- Label: "Employee ID" or "Officer ID"
- Branding: Officer/admin specific
- Redirects to officer dashboard after success

---

### 2. Applicant Reset Password Page
**Route:** `/applicant/reset-password`

**Query Parameters:**
- `token` - Reset token
- `email` - Applicant's email address

**Features:**
- Label: "Email Address" or "TPIN"
- Branding: Public-facing/applicant specific
- Redirects to login page after success
- User-friendly instructions for applicants

---

## 📝 Frontend Implementation Example

### Officer Reset Password Page
```typescript
// /set-password
import { useSearchParams } from 'react-router-dom';

function OfficerSetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const employeeId = searchParams.get('employeeId');
  const isReset = searchParams.get('reset') === 'true';
  
  return (
    <div className="officer-reset-password">
      <h1>{isReset ? 'Reset Password' : 'Set Password'}</h1>
      <p>Employee ID: {employeeId}</p>
      {/* Password form */}
    </div>
  );
}
```

### Applicant Reset Password Page
```typescript
// /applicant/reset-password
import { useSearchParams } from 'react-router-dom';

function ApplicantResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  return (
    <div className="applicant-reset-password">
      <h1>Set Your New Password</h1>
      <p>Email: {email}</p>
      {/* Password form */}
    </div>
  );
}
```

---

## 🔌 Backend API (Same for Both)

Both pages call the **same backend endpoint** but with different tokens:

```typescript
POST http://localhost:8080/api/auth/set-password
Content-Type: application/json

{
  "token": "reset-token-from-url",
  "password": "NewPassword123"
}
```

The backend automatically detects:
- If token belongs to an Officer → Updates Officer password
- If token belongs to a TaxProfessional → Updates TaxProfessional password

---

## ✨ User Experience

### Applicant Registration Flow
```
1. User registers → Account created
2. Welcome email sent with:
   - Login credentials
   - "Set New Password" button
   - Link: /applicant/reset-password?token=XXX
3. User clicks link → Applicant-specific page
4. User sets password → Redirected to login
```

### Applicant Forgot Password Flow
```
1. User clicks "Forgot Password" on login
2. Enters email → Reset email sent
3. Email contains:
   - Reset password button
   - Link: /applicant/reset-password?token=XXX
4. User clicks link → Applicant-specific page
5. User resets password → Redirected to login
```

### Officer Invitation Flow
```
1. Admin invites officer → Invitation email sent
2. Email contains:
   - Set password button
   - Link: /set-password?token=XXX&employeeId=EMP001
3. Officer clicks link → Officer-specific page
4. Officer sets password → Account activated
```

### Officer Forgot Password Flow
```
1. Officer clicks "Forgot Password"
2. Enters email → Reset email sent
3. Email contains:
   - Reset password button
   - Link: /set-password?token=XXX&employeeId=EMP001&reset=true
4. Officer clicks link → Officer-specific page
5. Officer resets password → Redirected to officer login
```

---

## 🧪 Testing

### Test 1: Applicant Welcome Email
```bash
# Register an applicant
POST /api/taxprofessionals/register

# Send welcome email
POST /api/email/send-password
{
  "email": "applicant@example.com",
  "password": "Test123",
  "fullName": "Test Applicant",
  "accountType": "INDIVIDUAL",
  "includeResetLink": true
}

# Check email - Link should be:
# http://localhost:5000/applicant/reset-password?token=XXX&email=applicant@example.com
```

### Test 2: Applicant Forgot Password
```bash
# Request reset
POST /api/auth/forgot-password
{
  "email": "applicant@example.com"
}

# Check email - Link should be:
# http://localhost:5000/applicant/reset-password?token=XXX&email=applicant@example.com
```

### Test 3: Officer Forgot Password
```bash
# Request reset
POST /api/auth/forgot-password
{
  "email": "officer@example.com"
}

# Check email - Link should be:
# http://localhost:5000/set-password?token=XXX&employeeId=EMP001&reset=true
```

---

## 📊 Summary

| User Type | Email Type | URL Pattern | Page |
|-----------|------------|-------------|------|
| Officer | Invitation | `/set-password?token=XXX&employeeId=YYY` | Officer page |
| Officer | Reset Password | `/set-password?token=XXX&employeeId=YYY&reset=true` | Officer page |
| Applicant | Welcome Email | `/applicant/reset-password?token=XXX&email=YYY` | Applicant page |
| Applicant | Reset Password | `/applicant/reset-password?token=XXX&email=YYY` | Applicant page |

---

## 🚀 Next Steps

1. **Restart your Spring Boot application** to apply changes
2. **Create the frontend route:** `/applicant/reset-password`
3. **Test the flow:**
   - Register a new applicant
   - Check email for "Set New Password" link
   - Verify link goes to `/applicant/reset-password`
4. **Test forgot password** for both user types
5. **Verify different pages** are shown for officers vs applicants

---

## 🎉 Done!

Applicants and Officers now have **completely separate reset password experiences** with different URLs, pages, and user flows!

