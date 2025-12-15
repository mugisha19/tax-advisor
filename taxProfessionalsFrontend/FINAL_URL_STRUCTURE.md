# ✅ Final URL Structure - Single Page with Type Parameter

## 🎯 URL Format

All password reset/set operations now use a **single frontend route** with a `type` parameter to distinguish between user types:

```
http://localhost:5173/reset-password?token=XXX&type=USER_TYPE
```

---

## 🔗 URL Patterns

### TaxProfessionals (Applicants)
```
http://localhost:5173/reset-password?token=ABC123&type=taxprofessional
```

### Officers (Admin Staff)
```
http://localhost:5173/reset-password?token=XYZ789&type=officer
```

---

## 📧 Email Links by Scenario

### 1. TaxProfessional Welcome Email (After Registration)
**When:** User registers a new account  
**Email:** Welcome email with password  
**Link:** `http://localhost:5173/reset-password?token=ABC123&type=taxprofessional`  
**Button Text:** "Set New Password"

### 2. TaxProfessional Forgot Password
**When:** User clicks "Forgot Password" on login  
**Email:** Password reset email  
**Link:** `http://localhost:5173/reset-password?token=ABC123&type=taxprofessional`  
**Button Text:** "Reset Your Password"

### 3. Officer Invitation
**When:** Admin invites a new officer  
**Email:** Invitation email  
**Link:** `http://localhost:5173/reset-password?token=XYZ789&type=officer`  
**Button Text:** "Set Your Password"

### 4. Officer Forgot Password
**When:** Officer clicks "Forgot Password"  
**Email:** Password reset email  
**Link:** `http://localhost:5173/reset-password?token=XYZ789&type=officer`  
**Button Text:** "Reset Your Password"

---

## 🎨 Frontend Implementation

You only need **ONE page** at `/reset-password` that handles both user types:

```typescript
// /reset-password
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const type = searchParams.get('type'); // 'taxprofessional' or 'officer'
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      if (response.ok) {
        alert('Password set successfully!');
        // Redirect based on user type
        if (type === 'officer') {
          navigate('/officer/login');
        } else {
          navigate('/login');
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to set password');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    }
  };
  
  return (
    <div className="reset-password-page">
      <h1>
        {type === 'officer' ? 'Officer ' : ''}
        Set New Password
      </h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        
        <div>
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        
        <button type="submit">Set Password</button>
      </form>
      
      {type === 'officer' && (
        <p className="note">This is an officer account</p>
      )}
    </div>
  );
}

export default ResetPasswordPage;
```

---

## 🔌 Backend API (Unchanged)

Both user types use the **same API endpoint**:

```bash
POST http://localhost:8080/api/auth/set-password
Content-Type: application/json

{
  "token": "ABC123",
  "password": "NewPassword123"
}
```

The backend automatically detects the user type from the token.

---

## 🎭 Conditional UI Rendering

You can customize the UI based on the `type` parameter:

```typescript
// Different branding
const brandColor = type === 'officer' ? '#0056b3' : '#28a745';

// Different titles
const title = type === 'officer' 
  ? 'Officer Password Reset'
  : 'Set Your Password';

// Different redirect after success
const redirectPath = type === 'officer'
  ? '/officer/dashboard'
  : '/login';

// Different help text
const helpText = type === 'officer'
  ? 'Contact your administrator if you need assistance'
  : 'Contact support at taxprofessionals@rra.gov.rw';
```

---

## ✅ Benefits of This Approach

1. **Single Page:** Easier to maintain
2. **Clear Distinction:** Type parameter makes user type explicit
3. **Flexible UI:** Can show different branding per user type
4. **Simple Routing:** No nested routes needed
5. **Backend Agnostic:** Backend doesn't need to know frontend structure

---

## 📊 Complete Flow Diagram

```
TAXPROFESSIONAL REGISTRATION
├─ User registers → Account created
├─ Email sent with: /reset-password?token=XXX&type=taxprofessional
├─ User clicks link → Frontend checks type=taxprofessional
├─ Shows applicant-friendly UI
└─ After success → Redirect to /login

TAXPROFESSIONAL FORGOT PASSWORD
├─ User clicks "Forgot Password"
├─ Email sent with: /reset-password?token=XXX&type=taxprofessional
├─ User clicks link → Frontend checks type=taxprofessional
├─ Shows applicant-friendly UI
└─ After success → Redirect to /login

OFFICER INVITATION
├─ Admin invites officer
├─ Email sent with: /reset-password?token=XXX&type=officer
├─ Officer clicks link → Frontend checks type=officer
├─ Shows officer-specific UI
└─ After success → Redirect to /officer/dashboard

OFFICER FORGOT PASSWORD
├─ Officer clicks "Forgot Password"
├─ Email sent with: /reset-password?token=XXX&type=officer
├─ Officer clicks link → Frontend checks type=officer
├─ Shows officer-specific UI
└─ After success → Redirect to /officer/login
```

---

## 🧪 Testing

### Test URLs

Copy these URLs to test in your browser:

**TaxProfessional:**
```
http://localhost:5173/reset-password?token=test-taxpro-token&type=taxprofessional
```

**Officer:**
```
http://localhost:5173/reset-password?token=test-officer-token&type=officer
```

### Backend Response

When you call the API, the backend will:
1. Look up the token
2. Determine if it belongs to Officer or TaxProfessional
3. Update the appropriate user's password
4. Clear the token (single-use)

---

## 🚀 Deployment Checklist

- [x] Backend updated to use new URL format
- [x] All email templates updated
- [x] Mock email service updated
- [ ] Frontend `/reset-password` page created
- [ ] Frontend handles `type` parameter
- [ ] Frontend shows different UI for officer vs taxprofessional
- [ ] Frontend redirects correctly based on user type
- [ ] Test all 4 email scenarios

---

## 🎉 Ready!

Your URLs are now clean and consistent:
- ✅ Single page: `/reset-password`
- ✅ Type parameter: `?type=taxprofessional` or `?type=officer`
- ✅ Same API for both user types
- ✅ Flexible UI customization

**Restart your Spring Boot application** and the new URL structure will be active! 🚀

