# Backend Overview

## Why Supabase?

We chose **Supabase** as our backend solution for several key reasons:

### 1. **Row Level Security (RLS)**
- Built-in PostgreSQL RLS policies enforce data access at the database level
- Ensures users can only access data from their own school
- Prevents unauthorized access even if application code has bugs
- Reduces security vulnerabilities through defense in depth

### 2. **PostgreSQL Database**
- Robust relational database with ACID compliance
- Supports complex queries and relationships
- Excellent performance for multi-tenant applications
- Strong data integrity through foreign keys and constraints

### 3. **Storage Integration**
- Private bucket support for secure file storage
- Signed URL generation for temporary access
- Integrated with database for seamless photo management

### 4. **Serverless Architecture**
- No server management required
- Auto-scaling based on demand
- Cost-effective for small to medium applications
- Fast global CDN for static assets

### 5. **Developer Experience**
- TypeScript support with generated types
- Real-time subscriptions (if needed in future)
- RESTful API and SQL access
- Excellent documentation and community support

## Database Schema

### Core Tables

#### `schools`
Stores school/organization information. Each school corresponds to a Clerk organization.

```sql
- id: UUID (primary key)
- clerk_org_id: TEXT (unique, links to Clerk organization)
- name: TEXT
- address: TEXT (nullable)
- logo_path: TEXT (nullable, path to storage bucket)
- admin_join_code_hash: TEXT (hashed admin join code)
- student_join_code_hash: TEXT (hashed student join code)
- created_at: TIMESTAMPTZ
```

#### `profiles`
Central authorization table linking Clerk users to schools with roles.

```sql
- id: UUID (primary key)
- clerk_user_id: TEXT (unique, links to Clerk user)
- school_id: UUID (foreign key to schools)
- role: TEXT ('admin' | 'student')
- full_name: TEXT
- email: TEXT
- phone: TEXT (nullable)
- created_at: TIMESTAMPTZ
```

#### `items`
Stores lost/found items with status tracking.

```sql
- id: UUID (primary key)
- school_id: UUID (foreign key to schools)
- title: TEXT
- description: TEXT (nullable)
- category: TEXT
- color: TEXT (nullable)
- location_found: TEXT
- date_found: DATE
- photo_path: TEXT (nullable, path to storage bucket)
- status: TEXT ('pending' | 'approved' | 'archived')
- created_by: TEXT (clerk_user_id)
- created_at: TIMESTAMPTZ
- approved_at: TIMESTAMPTZ (nullable)
- approved_by: TEXT (nullable, clerk_user_id)
```

#### `claims`
Stores item claim requests from users.

```sql
- id: UUID (primary key)
- school_id: UUID (foreign key to schools)
- item_id: UUID (foreign key to items)
- claimant_id: TEXT (clerk_user_id)
- message: TEXT (nullable)
- proof_answers: JSONB (structured proof/answers)
- status: TEXT ('pending' | 'approved' | 'denied')
- created_at: TIMESTAMPTZ
- reviewed_at: TIMESTAMPTZ (nullable)
- reviewed_by: TEXT (nullable, clerk_user_id)
```

#### `item_events`
Audit trail for all item lifecycle events and school-level events.

```sql
- id: UUID (primary key)
- school_id: UUID (foreign key to schools)
- item_id: UUID (nullable, foreign key to items)
- actor_id: TEXT (clerk_user_id)
- event_type: TEXT (e.g., 'item_reported', 'approved', 'claim_submitted')
- metadata: JSONB (additional event data)
- created_at: TIMESTAMPTZ
```

## Key Workflows

### 1. School Creation Flow

```
User Signs Up → Create School Form
    ↓
1. Create Clerk Organization (name = school name)
2. Generate two join codes (admin + student, 8-10 chars)
3. Hash both codes (SHA-256)
4. Insert into Supabase schools table
5. Create profile for creator (role='admin')
6. Add user to Clerk org as admin
7. Store plaintext codes in Clerk org metadata (for admin retrieval)
8. Show codes once in modal (never store plaintext in DB)
9. Log audit event: 'school_created'
```

### 2. School Joining Flow

```
User Signs Up → Join School Form
    ↓
1. User enters join code + full_name + phone
2. Hash provided code (SHA-256)
3. Query Supabase schools table for matching hash
4. Determine role: admin code → 'admin', student code → 'student'
5. Add user to Clerk Organization with correct org role
6. Create/update profile with school_id + role + contact info
7. Log audit event: 'school_joined'
8. Redirect to dashboard
```

### 3. Item Reporting Flow

```
User Reports Item → Report Item Form
    ↓
1. Validate authentication and school membership
2. Validate form data (title, category, location, date, photo)
3. Create item in database (status='pending')
4. Upload photo to Supabase Storage (private bucket)
5. Update item with photo_path
6. Log audit event: 'item_reported'
7. Show success message
```

### 4. Item Approval Flow

```
Admin Reviews Item → Admin Panel
    ↓
1. Admin clicks "Approve" on pending item
2. Update item status: 'pending' → 'approved'
3. Set approved_at and approved_by fields
4. Log audit event: 'approved'
5. Item now visible to all students in school
6. Item disappears if claim is later approved
```

### 5. Claim Submission Flow

```
User Claims Item → Item Detail Page
    ↓
1. User fills claim form (name, email, phone, message)
2. Validate item exists and is approved
3. Check for existing pending/approved claims
4. Create claim (status='pending')
5. Store proof_answers as JSONB
6. Log audit event: 'claim_submitted'
7. Show claim status to user
```

### 6. Claim Approval/Denial Flow

```
Admin Reviews Claim → Admin Panel
    ↓
1. Admin views claim details (message, proof_answers)
2. Admin clicks "Approve" or "Deny"
3. Update claim status and set reviewed_at/reviewed_by
4. Log audit event: 'claim_approved' or 'claim_denied'
5. If approved: Item disappears from browse page
6. If denied: User can submit new claim
```

## Data Access Patterns

### Client-Side Reads
- Uses **anon client** (public key) with RLS policies
- All queries automatically filtered by school_id via RLS
- Students see only approved items
- Admins can see all items (with toggle for pending)

### Server-Side Writes
- Uses **admin client** (service role key) for writes
- Bypasses RLS but enforces security through:
  - Explicit school_id filtering
  - Server-side validation
  - Role checks via Clerk
- All writes logged to audit trail

### Photo Storage
- Photos stored in **private bucket** (`item-photos`)
- Path format: `items/{clerk_user_id}/{itemId}.jpg`
- Signed URLs generated server-side (1 hour expiry)
- Never expose direct storage URLs to clients

## Security Model

1. **Authentication**: Clerk handles user authentication
2. **Authorization**: RLS policies enforce school-level isolation
3. **Role-Based Access**: Students vs Admins have different permissions
4. **Audit Trail**: All actions logged to `item_events` table
5. **Secure Storage**: Private bucket with signed URL access

See [SECURITY.md](./SECURITY.md) for detailed security documentation.
