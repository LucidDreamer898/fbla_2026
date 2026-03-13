# Demo Script: Admin Approvals & Claims (60 Seconds)

## Quick Demo Flow

### Setup (Before Demo)
1. Have two browser windows/tabs ready:
   - **Tab 1**: Admin account (logged in as admin)
   - **Tab 2**: Student account (logged in as student)

2. Ensure you have:
   - At least one pending item (reported by student)
   - At least one pending claim (submitted by student)

### Demo Steps (60 Seconds)

#### Step 1: Show Admin Panel (10 seconds)
**Say**: "As an admin, I can see the admin panel with pending items and claims."

**Action**:
- Navigate to `/admin` in Tab 1
- Point out:
  - "Pending Items" count
  - "Claim Requests" count
  - Tabs: "Pending Items", "Claim Requests", "School Settings"

#### Step 2: Approve an Item (15 seconds)
**Say**: "Let me approve a pending item. This makes it visible to all students."

**Action**:
- Click "Pending Items" tab
- Click on a pending item card
- Point out: Item details, photo, location, category
- Click "Approve" button
- **Show**: Item disappears from pending list
- **Switch to Tab 2** (student view)
- Navigate to `/items` (browse page)
- **Show**: Approved item now appears in the list

#### Step 3: Review and Approve a Claim (20 seconds)
**Say**: "Now let me review a claim request. Students submit claims when they find their lost item."

**Action**:
- **Switch back to Tab 1** (admin)
- Click "Claim Requests" tab
- Click on a pending claim
- Point out:
  - Claimant information (name, email, phone)
  - Message from claimant
  - Item being claimed
- Click "Approve Claim" button
- **Show**: Claim disappears from pending list
- **Switch to Tab 2** (student view)
- Navigate to `/items` (browse page)
- **Show**: Item with approved claim is **no longer visible** (disappeared)

#### Step 4: Show Audit Trail (15 seconds)
**Say**: "All actions are logged in the audit trail for accountability."

**Action**:
- **Switch back to Tab 1** (admin)
- Click "School Settings" tab
- Scroll to "Audit Log" section
- Point out:
  - Recent events (item_reported, approved, claim_submitted, claim_approved)
  - Timestamps
  - Event metadata
  - Color-coded event types

## Key Points to Emphasize

1. **Real-Time Updates**: Items appear/disappear immediately after approval
2. **Security**: Admin actions are server-side only (show in network tab if time permits)
3. **Audit Trail**: Every action is logged with timestamp and metadata
4. **Multi-Tenant**: Each school's data is completely isolated
5. **Role-Based**: Students can't access admin panel (try navigating to `/admin` as student)

## Troubleshooting

### If items don't appear after approval:
- Check browser console for errors
- Verify item status is 'approved' in database
- Check that item doesn't have an approved claim (claimed items are hidden)

### If claims don't work:
- Verify claim status is 'approved' in database
- Check that item exists and is approved
- Ensure user is in the same school

## Extended Demo (If Time Permits)

### Show Item Detail Page
- Navigate to an item detail page
- Show claim button (if item is approved and not claimed)
- Show claim status if claim exists

### Show Mark as Returned
- In admin panel, show "Mark as Returned" button
- Explain this logs an event and optionally archives the item

### Show Join Codes
- In "School Settings" tab
- Show admin and student join codes
- Explain how they're used for onboarding

## Technical Highlights for Judges

1. **Server Actions**: All admin operations use Next.js server actions
2. **Service Role Key**: Admin writes use Supabase service role key (server-only)
3. **RLS Bypass**: Admin client bypasses RLS but filters by school_id explicitly
4. **Signed URLs**: Photos use time-limited signed URLs from private bucket
5. **Audit Logging**: All actions logged to `item_events` table with metadata
