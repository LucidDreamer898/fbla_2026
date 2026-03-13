# Minimal File Changes for Clerk + Supabase Integration

## Summary

**Current State:**
- ✅ Next.js 15.5.7 App Router
- ✅ No authentication (static buttons)
- ✅ Mock data in components
- ✅ Database logging via `/api/log`
- ✅ Ready for integration (TODO comments in place)

**Integration Goal:**
- Add Clerk for authentication
- Add Supabase for database
- **Keep UI unchanged**
- **Minimal code changes**

---

## Files to Create (8 new files)

### 1. Environment Template
**File:** `.env.example`
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2. Supabase Client (Client-side)
**File:** `src/lib/supabase/client.ts`
- Browser-safe Supabase client
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Supabase Client (Server-side)
**File:** `src/lib/supabase/server.ts`
- Server-safe Supabase client
- Uses service role key for admin operations

### 4. Database Service - Items
**File:** `src/lib/database/items.ts`
- Replace functions from `itemsService.ts`:
  - `fetchApprovedItems()`
  - `getItemById(id)`
  - `submitItem(data)`
  - `listPendingItems()`
  - `adminApproveItem(id, notes)`
  - `adminRejectItem(id, notes)`

### 5. Database Service - Claims
**File:** `src/lib/database/claims.ts`
- New functions:
  - `submitClaim(itemId, userData)`
  - `listClaimRequests()`
  - `adminApproveClaim(claimId, notes)`
  - `adminRejectClaim(claimId, notes)`

### 6. Middleware
**File:** `src/middleware.ts`
- Protect `/admin` route (admin-only)
- Optional: Protect `/report` route

### 7. Type Definitions (Optional)
**File:** `src/lib/supabase/types.ts`
- TypeScript types for Supabase tables

### 8. Database Schema Migration
**File:** `supabase/migrations/001_initial_schema.sql` (optional, for reference)
- SQL schema for items and claims tables

---

## Files to Modify (8 files)

### 1. `package.json`
**Change:** Add dependencies
```json
{
  "dependencies": {
    "@clerk/nextjs": "^5.x.x",
    "@supabase/supabase-js": "^2.x.x"
  }
}
```

### 2. `src/app/layout.tsx`
**Changes:**
- Import `ClerkProvider` from `@clerk/nextjs`
- Wrap `<body>` content with `<ClerkProvider>`
- Replace static auth buttons (lines 108-113) with:
  ```tsx
  import { UserButton, SignInButton, SignUpButton, useUser } from '@clerk/nextjs'
  
  // In nav section:
  {isSignedIn ? (
    <UserButton afterSignOutUrl="/" />
  ) : (
    <>
      <SignInButton mode="modal">
        <Button variant="ghost" size="sm">Log In</Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button variant="solid" size="sm">Sign Up</Button>
      </SignUpButton>
    </>
  )}
  ```

### 3. `src/components/forms/ReportItemForm.tsx`
**Change:** Line 105
```tsx
// Before:
reportedBy: 'anonymous', // TODO: Get from auth context

// After:
import { useUser } from '@clerk/nextjs';
const { user } = useUser();
reportedBy: user?.id || 'anonymous',
```

### 4. `src/lib/itemsService.ts`
**Changes:**
- Keep conversion functions (`convertFirestoreItemToDisplayItem`, `convertFormDataToFirestoreItem`)
- Replace `fetchApprovedItems()` with Supabase query
- Replace `submitItem()` with Supabase insert
- Or: Create new service file and import from there

### 5. `src/app/items/page.tsx`
**Changes:**
- Remove `mockItems` array (lines 8-50)
- Add `useEffect` to fetch from Supabase:
  ```tsx
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetchApprovedItems().then(setItems);
  }, []);
  ```
- Update `filteredAndSortedItems` to use `items` instead of `mockItems`

### 6. `src/app/items/[id]/page.tsx`
**Changes:**
- Remove `getMockItem()` function (lines 52-200+)
- Replace `fetchItem()` with:
  ```tsx
  const fetchItem = async () => {
    const itemData = await getItemById(itemId);
    setItem(itemData);
  };
  ```
- Update claim submission to use Supabase `submitClaim()`

### 7. `src/app/admin/page.tsx`
**Changes:**
- Remove `mockPendingItems` and `mockClaimRequests` (lines 96-136)
- Replace with Supabase queries:
  ```tsx
  useEffect(() => {
    listPendingItems().then(setPendingItems);
    listClaimRequests().then(setClaimRequests);
    setLoading(false);
  }, []);
  ```
- Update `adminApproveItem`, `adminRejectItem`, etc. to use real functions from `database/items.ts` and `database/claims.ts`

### 8. `src/app/report/page.tsx`
**Change:** None needed (already uses `submitItem()` from service)

---

## Database Schema (Supabase)

### Table: `items`
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  date_found DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'claimed', 'expired'
  photos TEXT[], -- Array of image URLs
  reported_by TEXT NOT NULL, -- Clerk user ID
  claimed_by TEXT, -- Clerk user ID
  admin_notes TEXT,
  tags TEXT[],
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `claim_requests`
```sql
CREATE TABLE claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id),
  claimant_name TEXT NOT NULL,
  claimant_email TEXT NOT NULL,
  claimant_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  submitted_at TIMESTAMP DEFAULT NOW(),
  admin_notes TEXT
);
```

### Row Level Security (RLS):
- `items`: Public read for `status = 'approved'`, insert for authenticated users
- `claim_requests`: Insert for authenticated users, read/update for admins only

---

## Implementation Order

### Phase 1: Setup (No UI Changes)
1. Install packages
2. Create `.env.example`
3. Create Supabase client files
4. Add ClerkProvider to layout (keep static buttons for now)

### Phase 2: Database Layer
5. Create database service files
6. Create Supabase tables
7. Test database functions independently

### Phase 3: Page Integration
8. Update items browse page
9. Update item detail page
10. Update admin page
11. Update report form (auth integration)

### Phase 4: Auth UI
12. Replace static buttons with Clerk components
13. Add middleware for route protection
14. Test admin access control

### Phase 5: Cleanup
15. Remove mock data
16. Remove TODO comments
17. Update error handling

---

## Testing Checklist

- [ ] Clerk authentication works (sign in/up)
- [ ] User ID is captured in `reportedBy` field
- [ ] Browse page shows items from Supabase
- [ ] Item detail page loads from Supabase
- [ ] Report form submits to Supabase
- [ ] Admin page shows pending items from Supabase
- [ ] Admin can approve/reject items
- [ ] Claim requests work end-to-end
- [ ] Admin route is protected
- [ ] UI looks identical to before

---

## Rollback Plan

If issues arise:
1. Keep mock data as fallback
2. Use feature flag: `NEXT_PUBLIC_USE_DATABASE=false`
3. Revert to mock functions in `itemsService.ts`
4. Remove ClerkProvider wrapper (keep static buttons)

---

## Estimated Impact

- **New Files:** 8
- **Modified Files:** 8
- **Lines Changed:** ~300-400
- **UI Changes:** Minimal (auth buttons only)
- **Breaking Changes:** None (if done incrementally)
- **Time Estimate:** 4-6 hours for full integration
