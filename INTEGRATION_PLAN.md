# Repository Scan Report & Clerk + Supabase Integration Plan

## 1. Next.js App Router Structure

### Root Layout (`src/app/layout.tsx`)
- **Type**: Root layout with navigation
- **Features**:
  - Metadata configuration (SEO, OpenGraph, Twitter)
  - Global navigation bar with:
    - Logo (Reclaim)
    - Navigation links (Home, Browse, Report, Admin)
    - Auth buttons (Log In, Sign Up) - **Currently static, no functionality**
  - No authentication wrapper currently

### Routes:
```
src/app/
├── layout.tsx          # Root layout with nav
├── page.tsx            # Homepage (landing)
├── items/
│   ├── page.tsx        # Browse items (list view)
│   └── [id]/
│       └── page.tsx     # Item detail page
├── report/
│   └── page.tsx        # Report found item form
├── admin/
│   └── page.tsx        # Admin panel (pending items + claims)
└── api/
    └── log/
        └── route.ts    # Server-side logging endpoint
```

### Key Observations:
- **No route groups** - All routes are at root level
- **No middleware** - No auth protection currently
- **Client components** - Most pages use `'use client'`
- **API routes** - Only `/api/log` exists for terminal logging

---

## 2. Existing Pages & Mock Data Services

### A. Homepage (`src/app/page.tsx`)
- **Type**: Server component
- **Features**: Hero section, CTA buttons
- **No data fetching** - Static content only

### B. Browse Items (`src/app/items/page.tsx`)
- **Type**: Client component (`'use client'`)
- **Data**: Uses hardcoded `mockItems` array (5 items)
- **Features**:
  - Filtering (category, colors, date range)
  - Sorting (newest/oldest)
  - Item cards grid
- **No database calls** - All mock data

### C. Item Detail (`src/app/items/[id]/page.tsx`)
- **Type**: Client component
- **Data**: `getMockItem(id)` function with hardcoded items
- **Features**:
  - Image gallery with thumbnails
  - Claim item modal (name, email, phone)
  - Database logging via `/api/log`
- **Database integration**: TODO comments indicate readiness

### D. Report Item (`src/app/report/page.tsx`)
- **Type**: Server component (wrapper)
- **Form**: `ReportItemForm` component
- **Data submission**: 
  - Calls `submitItem()` from `itemsService.ts`
  - Currently logs to console/terminal
  - Returns mock ID: `'mock-item-id-' + Date.now()`
- **Auth note**: `reportedBy: 'anonymous'` - TODO: Get from auth context

### E. Admin Panel (`src/app/admin/page.tsx`)
- **Type**: Client component
- **Features**:
  - Two tabs: "Pending Items" and "Claim Requests"
  - Admin stats cards (Pending Review, Approved Today, Total Items, Claim Requests)
  - Approve/Reject buttons for items and claims
- **Data**: 
  - `mockPendingItems` array
  - `mockClaimRequests` array
- **Database functions** (all mock):
  - `adminApproveItem()`
  - `adminRejectItem()`
  - `adminApproveClaim()`
  - `adminRejectClaim()`
  - All log to `/api/log` endpoint

### Mock Data Service (`src/lib/itemsService.ts`)
**Functions:**
1. `convertFirestoreItemToDisplayItem()` - Converts DB format to display format
2. `convertFormDataToFirestoreItem()` - Converts form data to DB format
3. `fetchApprovedItems()` - **Returns empty array**, logs operation
4. `submitItem()` - **Returns mock ID**, logs operation

**All functions have TODO comments** indicating database integration points.

---

## 3. Environment Files & Config

### Current State:
- **No `.env` files found** in repository
- **No `.env.example` file** exists
- **No environment variable usage** in codebase
- **No `process.env` references** found

### Config Files:
- `next.config.ts` - Image domains, ESLint config
- `tailwind.config.ts` - Tailwind configuration
- `tsconfig.json` - TypeScript config

---

## 4. Existing Auth Code

### Current State:
- **No authentication implementation**
- **No auth libraries** in `package.json`
- **Static auth buttons** in `layout.tsx` (lines 108-113):
  ```tsx
  <Button variant="ghost" size="sm">Log In</Button>
  <Button variant="solid" size="sm">Sign Up</Button>
  ```
- **Auth placeholder** in `ReportItemForm.tsx` (line 105):
  ```tsx
  reportedBy: 'anonymous', // TODO: Get from auth context
  ```

### Auth Requirements Identified:
1. **User identification** for item submissions (`reportedBy`)
2. **Admin access control** for `/admin` page
3. **User sessions** for claim submissions
4. **Protected routes** (admin should require auth)

---

## 5. Data Types & Schema

### Item Types (`src/types/item.ts`):
```typescript
interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  foundLocation: string;
  foundDate: string;
  tags: string[];
  imageUrl: string;
  status: 'Approved' | 'Claimed' | 'Pending';
  hasPhoto: boolean;
}

interface FirestoreItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  dateFound: Date | { toDate: () => Date };
  status: 'pending' | 'approved' | 'claimed' | 'expired';
  photos: string[];
  reportedBy: string;
  claimedBy?: string;
  adminNotes?: string;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
  tags?: string[];
  imageUrl?: string;
}
```

### Claim Request Type (in `admin/page.tsx`):
```typescript
interface ClaimRequest {
  id: string;
  itemId: string;
  itemTitle: string;
  itemCategory: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  submittedAt: Date | { toDate: () => Date };
  status: 'pending' | 'approved' | 'rejected';
}
```

---

## 6. Integration Points Identified

### Database Operations Needed:
1. **Items**:
   - `fetchApprovedItems()` - Browse page
   - `getItemById(id)` - Item detail page
   - `submitItem(data)` - Report page
   - `listPendingItems()` - Admin page
   - `adminApproveItem(id, notes)` - Admin page
   - `adminRejectItem(id, notes)` - Admin page

2. **Claims**:
   - `submitClaim(itemId, name, email, phone)` - Item detail page
   - `listClaimRequests()` - Admin page
   - `adminApproveClaim(claimId, notes)` - Admin page
   - `adminRejectClaim(claimId, notes)` - Admin page

### Auth Operations Needed:
1. **User Session**:
   - Get current user ID for `reportedBy` field
   - Get user email/name for claim submissions
   - Check if user is admin

2. **Route Protection**:
   - Protect `/admin` route (admin-only)
   - Optional: Protect `/report` (require login)

3. **UI Updates**:
   - Replace static auth buttons with Clerk components
   - Show user profile when logged in
   - Show login prompt when not authenticated

---

## 7. Proposed Minimal File Changes

### Phase 1: Setup & Configuration

#### A. Install Dependencies
```bash
npm install @clerk/nextjs @supabase/supabase-js
```

#### B. Create Environment Files
- `.env.local` (gitignored)
- `.env.example` (template)

#### C. Create Supabase Client
- `src/lib/supabase/client.ts` - Client-side Supabase client
- `src/lib/supabase/server.ts` - Server-side Supabase client

#### D. Create Database Service
- `src/lib/database/items.ts` - Replace `itemsService.ts` functions
- `src/lib/database/claims.ts` - Claim operations

### Phase 2: Clerk Integration

#### A. Update Root Layout
- `src/app/layout.tsx`:
  - Wrap with `<ClerkProvider>`
  - Replace static auth buttons with `<UserButton />` and `<SignInButton />`

#### B. Create Middleware
- `src/middleware.ts`:
  - Protect `/admin` route
  - Optional: Protect `/report` route

#### C. Update Components
- `src/components/forms/ReportItemForm.tsx`:
  - Get user from `useUser()` hook
  - Set `reportedBy: user.id`

### Phase 3: Supabase Integration

#### A. Update Data Services
- `src/lib/itemsService.ts`:
  - Replace mock functions with Supabase queries
  - Keep conversion functions

#### B. Update Pages
- `src/app/items/page.tsx`:
  - Replace `mockItems` with `fetchApprovedItems()`
  
- `src/app/items/[id]/page.tsx`:
  - Replace `getMockItem()` with `getItemById()`
  - Update claim submission to use Supabase

- `src/app/admin/page.tsx`:
  - Replace mock data with Supabase queries
  - Update approve/reject functions

- `src/app/report/page.tsx`:
  - Already uses `submitItem()`, will work after service update

### Phase 4: Database Schema

#### Supabase Tables Needed:
1. **items** table
2. **claim_requests** table
3. **users** table (or use Clerk user metadata)

---

## 8. Files to Create/Modify

### New Files (8):
1. `.env.example`
2. `src/lib/supabase/client.ts`
3. `src/lib/supabase/server.ts`
4. `src/lib/database/items.ts`
5. `src/lib/database/claims.ts`
6. `src/middleware.ts`
7. `src/lib/supabase/types.ts` (optional, for type safety)

### Modified Files (6):
1. `package.json` - Add dependencies
2. `src/app/layout.tsx` - Add ClerkProvider, update auth buttons
3. `src/components/forms/ReportItemForm.tsx` - Get user from Clerk
4. `src/lib/itemsService.ts` - Replace mock functions (or create new service)
5. `src/app/items/page.tsx` - Fetch from Supabase
6. `src/app/items/[id]/page.tsx` - Fetch from Supabase
7. `src/app/admin/page.tsx` - Fetch from Supabase, use real functions
8. `src/app/report/page.tsx` - Already compatible, no changes needed

### Total Impact:
- **8 new files**
- **8 modified files**
- **UI remains unchanged** - Only data layer changes
- **No breaking changes** to existing components

---

## 9. Migration Strategy

### Step 1: Setup (Non-breaking)
- Install packages
- Add environment variables
- Create Supabase client files
- Add ClerkProvider (UI stays same)

### Step 2: Database Layer (Non-breaking)
- Create database service files
- Keep existing `itemsService.ts` as fallback
- Add feature flag to switch between mock/real

### Step 3: Page Updates (Gradual)
- Update one page at a time
- Test each page independently
- Keep mock data as fallback

### Step 4: Remove Mocks
- Once all pages work with Supabase
- Remove mock data
- Remove fallback code

---

## 10. Risk Assessment

### Low Risk:
- ✅ Adding ClerkProvider (non-breaking)
- ✅ Creating new service files
- ✅ Environment variable setup

### Medium Risk:
- ⚠️ Replacing mock data with real queries (could break if schema differs)
- ⚠️ Auth middleware (could block access if misconfigured)

### Mitigation:
- Keep mock data as fallback during development
- Test each page independently
- Use feature flags for gradual rollout
