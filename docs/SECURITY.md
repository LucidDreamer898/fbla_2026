# Security Documentation

This document explains the security model and design decisions for the Reclaim application, particularly focusing on data access control and photo storage.

## Overview

The Reclaim application uses a multi-layered security approach:
1. **Authentication**: Clerk handles user authentication
2. **Authorization**: Supabase Row Level Security (RLS) enforces data access
3. **Storage Security**: Private bucket with signed URL access
4. **Role-Based Access Control**: Students vs Admins have different permissions

## Database Security (Row Level Security)

### School Isolation

All data is isolated by `school_id`. Users can only access data from their own school, enforced through RLS policies that:
- Verify school membership via the `profiles` table
- Check `clerk_user_id` against the current user
- Restrict all queries to the user's `school_id`

### Role-Based Permissions

**Students can:**
- Read approved items (status = 'approved')
- Read their own items (regardless of status)
- Create new items (status = 'pending')
- Create claims for items
- Read their own claims

**Admins can:**
- Read all items in their school
- Update items (approve/archive)
- Read all claims in their school
- Update claims (approve/deny)

### Implementation

RLS policies use helper functions:
- `get_user_school_id(clerk_user_id)`: Returns the user's school_id
- `get_user_role(clerk_user_id, school_id)`: Returns the user's role

The application must set `app.current_user_id` in each database session to enable RLS checks.

## Storage Security: Private Bucket with Signed URLs

### Why the Bucket is Private

The `item-photos` storage bucket is configured as **PRIVATE** for the following security reasons:

1. **Prevent Unauthorized Access**
   - Private buckets cannot be accessed via direct URLs
   - Prevents users from guessing or accessing photos they shouldn't see
   - Prevents hotlinking and unauthorized sharing

2. **Access Control**
   - Only approved items should have their photos viewable
   - Pending items should not be publicly accessible
   - Users should only see photos for items in their school

3. **Audit and Tracking**
   - Signed URLs can be logged and tracked
   - Server-side generation allows access control checks
   - Can revoke access by not generating new signed URLs

4. **Compliance and Privacy**
   - Protects potentially sensitive information in photos
   - Allows for compliance with privacy regulations
   - Enables content moderation before photos are accessible

### Why Signed URLs are Used

Signed URLs provide time-limited, secure access to private storage objects:

1. **Time-Limited Access**
   - URLs expire after a set time (default: 1 hour)
   - Prevents long-term unauthorized access
   - Forces re-validation of access permissions

2. **Server-Side Control**
   - URLs are generated server-side using the service role key
   - Server can verify user permissions before generating URL
   - Can check if item is approved before allowing photo access

3. **No Direct Access**
   - Users cannot construct URLs to access arbitrary photos
   - Must go through the application's authorization checks
   - Prevents enumeration attacks

4. **Revocable Access**
   - If an item is archived or deleted, new signed URLs won't be generated
   - Old URLs expire naturally
   - Can invalidate access without deleting files

### Storage Policy Structure

Photos are stored with the following path structure:
```
item-photos/
  items/
    {clerk_user_id}/
      {filename}
```

**Example:**
```
item-photos/items/user_2abc123def/photo-1234567890.jpg
```

This structure:
- Organizes photos by user
- Makes it easy to manage user-specific uploads
- Allows for user-specific access policies
- Simplifies cleanup if a user is removed

### Storage Policies

The migration file (`001_init.sql`) includes storage policies that:

1. **Allow Uploads**: Authenticated users can upload to `items/{their_clerk_user_id}/...`
   - Users can only upload to their own directory
   - Prevents users from uploading to other users' directories

2. **Deny Direct Reads**: All direct SELECT operations are denied
   - Forces use of signed URLs
   - Prevents bypassing authorization checks

### Implementation

Signed URLs are generated in `src/lib/photos.ts`:

```typescript
// Server-side only
const url = await getItemPhotoUrl('items/user_123/photo.jpg');
// Returns: https://xxxxx.supabase.co/storage/v1/object/sign/item-photos/items/user_123/photo.jpg?token=...
```

The function:
- Uses the service role key (server-side only)
- Validates the photo path format
- Generates a time-limited signed URL
- Handles errors gracefully

### Usage Pattern

1. **When displaying approved items:**
   ```typescript
   // Server Component or API Route
   const photoUrl = await getItemPhotoUrlSafe(item.photo_path);
   // Pass URL to client component for display
   ```

2. **When uploading photos:**
   ```typescript
   // API Route
   const path = await uploadItemPhoto(file, clerkUserId);
   // Store path in database
   ```

3. **Access Control:**
   - Only generate signed URLs for approved items
   - Check user's school_id matches item's school_id
   - Verify user has permission to view the item

## Security Best Practices

### Environment Variables

- **Never commit** `.env.local` to version control
- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` to the client
- Use `NEXT_PUBLIC_*` prefix only for client-safe variables
- Validate all environment variables at startup (see `src/lib/env.ts`)

### Database Access

- Always use RLS policies (never disable for convenience)
- Use service role key only in server-side code
- Set `app.current_user_id` in every database session
- Verify school membership before any data access

### Storage Access

- Always use signed URLs (never direct bucket URLs)
- Generate URLs server-side only
- Validate photo paths before generating URLs
- Check item approval status before generating URLs
- Set appropriate expiration times (1 hour default)

### Code Organization

- Keep server-only code in API routes or Server Components
- Use `typeof window !== 'undefined'` checks for client-side detection
- Separate client-safe and server-only utilities
- Document security implications in code comments

## Threat Mitigation

### Unauthorized Access
- **Mitigation**: RLS policies + school isolation + signed URLs
- **Result**: Users can only access data from their school via authorized paths

### Data Enumeration
- **Mitigation**: Private bucket + signed URLs + path validation
- **Result**: Users cannot guess or enumerate photo paths

### Privilege Escalation
- **Mitigation**: Role checks in RLS policies + server-side validation
- **Result**: Students cannot perform admin actions

### Hotlinking/Unauthorized Sharing
- **Mitigation**: Private bucket + time-limited signed URLs
- **Result**: URLs expire and cannot be shared long-term

### Storage Abuse
- **Mitigation**: User-specific directories + file size limits + MIME type restrictions
- **Result**: Users can only upload to their own space with valid file types

## Admin Server Actions

All admin operations are performed through **server actions** that use the service role key for security:

### Why Server Actions?

1. **Server-Side Only**: Server actions run exclusively on the server
   - Never exposed to client bundles
   - Cannot be called directly from browser console
   - Service role key never sent to client

2. **Role Verification**: Every admin action verifies:
   - User is authenticated (via Clerk)
   - User has `org:admin` role in Clerk organization
   - User's profile has `role='admin'` in database
   - User belongs to the school they're acting on

3. **Explicit School Filtering**: All queries filter by `school_id`
   - Even with service role key, we filter by school
   - Prevents cross-school data access
   - Enforces multi-tenant isolation

### Admin Actions

All admin operations are in `src/lib/admin/actions.ts`:

- **`listPendingItems()`**: Fetches pending items with signed photo URLs
- **`listPendingClaims()`**: Fetches pending claims with item details
- **`approveItem()`**: Approves a pending item (updates status, logs event)
- **`archiveItem()`**: Archives a pending item (rejects/removes)
- **`approveClaim()`**: Approves a pending claim
- **`denyClaim()`**: Denies a pending claim
- **`markItemReturned()`**: Logs 'returned' event and optionally archives item
- **`getItemAuditTimeline()`**: Fetches audit timeline for an item
- **`getSchoolInfo()`**: Fetches school information
- **`getSchoolAuditLog()`**: Fetches all audit events for the school

### Security Pattern

Every admin action follows this pattern:

```typescript
export async function adminAction(...) {
  // 1. Verify admin access
  const admin = await getAdminSchoolId();
  if (!admin) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Use admin client (service role key)
  const supabase = getSupabaseAdmin();

  // 3. Filter by school_id explicitly
  const { data } = await supabase
    .from('table')
    .select('*')
    .eq('school_id', admin.schoolId) // Explicit filtering
    .eq('id', itemId);

  // 4. Perform action
  // 5. Log audit event
  // 6. Return result
}
```

### Service Role Key Protection

The service role key is protected by:
- **`server-only` package**: Prevents accidental client-side imports
- **Runtime checks**: Throws error if accessed on client
- **Environment variable**: Never exposed via `NEXT_PUBLIC_*`
- **TypeScript types**: Server-only modules are clearly marked

## For Judges

This security model ensures:
1. **Data Isolation**: Each school's data is completely isolated
2. **Access Control**: Users can only access data they're authorized to see
3. **Audit Trail**: All actions are logged in `item_events` table
4. **Privacy Protection**: Photos are private and only accessible via time-limited signed URLs
5. **Role-Based Permissions**: Clear separation between student and admin capabilities
6. **Server-Side Admin Operations**: All admin writes use server actions with service role key

All security measures are enforced at the database level (RLS) and storage level (private bucket + signed URLs), ensuring that even if application code has bugs, unauthorized access is prevented.
