# Onboarding Flow

## Overview

The onboarding process allows users to either **create a new school** or **join an existing school** using join codes. This ensures all users are associated with a school organization before they can use the application.

## User Roles

### Admin
- Can approve/archive items
- Can approve/deny claims
- Can view all items (including pending)
- Can view all claims
- Can access admin panel
- Can view join codes (for sharing)
- Can view audit log

### Student
- Can report found items (status='pending')
- Can view approved items only
- Can view their own items (regardless of status)
- Can submit claims for items
- Can view their own claims
- Cannot access admin panel

## Create School Flow

### Step 1: User Signs Up
- User creates account via Clerk (email/password or social login)
- User is redirected to `/onboarding` page

### Step 2: Fill Create School Form
User provides:
- **School Name** (required)
- **School Address** (optional)
- **School Logo** (optional, file upload)

### Step 3: Server Action Processing
The `createSchool` server action performs:

1. **Create Clerk Organization**
   - Organization name = school name
   - Links school to Clerk for user management

2. **Generate Join Codes**
   - Admin code: 8-10 characters (e.g., "EXCH72W9")
   - Student code: 8-10 characters (e.g., "GST35STTJ")
   - Uses readable characters (excludes 0, O, I, 1, L)

3. **Hash Join Codes**
   - Uses SHA-256 hashing
   - Stores hashes in database (never plaintext)
   - Plaintext codes stored in Clerk org metadata (for admin retrieval)

4. **Create School Record**
   - Insert into `schools` table with:
     - `clerk_org_id`
     - `name`, `address`
     - `admin_join_code_hash`, `student_join_code_hash`
     - `logo_path` (after upload, if provided)

5. **Create User Profile**
   - Insert/update `profiles` table with:
     - `clerk_user_id`
     - `school_id`
     - `role='admin'`
     - `full_name`, `email`, `phone`

6. **Add User to Clerk Org**
   - Add user to organization with org role `'org:admin'`
   - Clerk automatically adds creator, so we check first

7. **Store Plaintext Codes**
   - Store in Clerk organization `publicMetadata`
   - Allows admin to retrieve codes later
   - Never stored in database

8. **Log Audit Event**
   - Insert into `item_events`:
     - `event_type='school_created'`
     - `school_id`, `actor_id`
     - `metadata` with school name

### Step 4: Display Join Codes
- Show both codes in a modal/page
- Display with Copy buttons
- Codes shown **once** - user must save them
- Codes never displayed again (retrieved from Clerk metadata if needed)

### Step 5: Redirect
- User redirected to home page
- Middleware ensures user has organization

## Join School Flow

### Step 1: User Signs Up
- User creates account via Clerk
- User is redirected to `/onboarding` page

### Step 2: Fill Join School Form
User provides:
- **Join Code** (required, case-insensitive)
- **Full Name** (required, pre-filled from Clerk)
- **Phone** (optional, pre-filled if available)

Email is automatically retrieved from Clerk user.

### Step 3: Server Action Processing
The `joinSchool` server action performs:

1. **Validate Input**
   - Check join code is provided
   - Check full name is provided
   - Get email from Clerk user

2. **Hash Join Code**
   - Normalize code (uppercase, trim)
   - Hash using SHA-256

3. **Find Matching School**
   - Query `schools` table
   - Compare hash against `admin_join_code_hash` and `student_join_code_hash`
   - Determine role based on which hash matches

4. **Add User to Clerk Org**
   - Add user to organization with correct org role:
     - Admin code → `'org:admin'`
     - Student code → `'org:member'`

5. **Create/Update Profile**
   - Insert/update `profiles` table with:
     - `clerk_user_id`
     - `school_id`
     - `role` ('admin' or 'student')
     - `full_name`, `email`, `phone`

6. **Log Audit Event**
   - Insert into `item_events`:
     - `event_type='school_joined'`
     - `school_id`, `actor_id`
     - `metadata` with role

### Step 4: Redirect
- Set organization as active in Clerk
- Redirect to home page
- Middleware ensures user has organization

## Join Code Security

### Generation
- 8-10 characters long
- Uses readable characters (A-Z, 2-9, excludes ambiguous: 0, O, I, 1, L)
- Randomly generated for each school

### Storage
- **Hashed** in database (SHA-256)
- **Plaintext** stored in Clerk org metadata (for admin retrieval)
- Never stored in plaintext in database

### Validation
- Codes are case-insensitive (normalized to uppercase)
- Hashed before comparison
- One-time use (not revoked after use, but can be regenerated)

## Error Handling

### Invalid Join Code
- Error message: "Invalid join code. Please try again."
- User can retry with correct code

### Missing Information
- Form validation shows inline errors
- Required fields: school name (create), join code (join), full name (join)

### Network Errors
- Error messages displayed to user
- User can retry the operation

## UI Components

### Onboarding Page (`/onboarding`)
- Two tabs: "Create School" and "Join School"
- Form validation with inline error messages
- Success states with join code display (create) or redirect (join)
- Pre-filled user information from Clerk

### Success Modal (Create School)
- Displays both join codes
- Copy buttons for each code
- Instructions for sharing codes
- One-time display (user must save codes)

## Middleware Protection

The middleware ensures:
- Users without an organization are redirected to `/onboarding`
- Users with an organization can access the app
- Admin routes require `org:admin` role

## Future Enhancements

- Regenerate join codes (admin only)
- Revoke join codes
- View join code history
- Bulk user import
