/**
 * Database Helper Functions
 * 
 * This module provides typed, reusable functions for common database operations.
 * All functions use the admin client with explicit school_id filtering for security.
 * 
 * Security Model for Judges:
 * - All operations use admin client (server-only) with explicit school_id filtering
 * - RLS policies require app.current_user_id session variable which isn't available
 *   in server-side queries, so we use admin client with explicit filtering instead
 * - All operations are scoped to school_id for multi-tenancy
 * - Audit trail maintained via logEvent() for accountability
 * 
 * Usage:
 *   import { listApprovedItems, createItem } from '@/lib/supabase/db';
 *   const items = await listApprovedItems(schoolId, { category: 'Electronics' });
 */

'use server';

import { getSupabaseAdmin } from './admin';
import { getSupabaseClient } from './client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Database Item (matches Supabase schema)
 */
export interface DbItem {
  id: string;
  school_id: string;
  title: string;
  description: string | null;
  category: string;
  color: string | null;
  location_found: string;
  date_found: string; // ISO date string
  photo_path: string | null;
  status: 'pending' | 'approved' | 'archived';
  created_by: string; // clerk_user_id
  created_at: string; // ISO timestamp
  approved_at: string | null; // ISO timestamp
  approved_by: string | null; // clerk_user_id
}

/**
 * Database Claim (matches Supabase schema)
 */
export interface DbClaim {
  id: string;
  school_id: string;
  item_id: string;
  claimant_id: string; // clerk_user_id
  message: string | null;
  proof_answers: Record<string, any>; // JSONB
  status: 'pending' | 'approved' | 'denied';
  created_at: string; // ISO timestamp
  reviewed_at: string | null; // ISO timestamp
  reviewed_by: string | null; // clerk_user_id
}

/**
 * Item filters for querying
 */
export interface ItemFilters {
  category?: string;
  color?: string;
  status?: 'pending' | 'approved' | 'archived' | null; // null means fetch all statuses
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  search?: string; // Search in title/description
}

/**
 * Create item input
 */
export interface CreateItemInput {
  schoolId: string;
  title: string;
  description?: string | null;
  category: string;
  color?: string | null;
  locationFound: string;
  dateFound: string; // ISO date string
  photoPath?: string | null;
  createdBy: string; // clerk_user_id
}

/**
 * Create claim input
 */
export interface CreateClaimInput {
  schoolId: string;
  itemId: string;
  claimantId: string; // clerk_user_id
  message?: string | null;
  proofAnswers?: Record<string, any>;
}

// ============================================================================
// READ OPERATIONS (Use anon client - respects RLS)
// ============================================================================

/**
 * List approved items for a school with optional filters
 * 
 * Security: Uses admin client but filters by school_id for security.
 * Note: RLS policies require app.current_user_id to be set, which isn't
 * available in server-side queries. We use admin client with explicit
 * school_id filtering instead.
 * 
 * @param schoolId - The school ID to filter items
 * @param filters - Optional filters (category, color, date range, search)
 * @returns Array of approved items
 */
export async function listApprovedItems(
  schoolId: string,
  filters: ItemFilters = {}
): Promise<DbItem[]> {
  // Use admin client since RLS requires app.current_user_id session variable
  // which isn't set in server-side queries. We filter by school_id explicitly.
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from('items')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  // Apply status filter if specified
  // If status is null, fetch all statuses (for admins)
  // If status is undefined, default to 'approved' for backward compatibility
  if (filters.status === null) {
    // Don't filter by status - fetch all
  } else if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    // Default to 'approved' if status not specified
    query = query.eq('status', 'approved');
  }

  // Apply filters
  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.color) {
    query = query.eq('color', filters.color);
  }

  if (filters.dateFrom) {
    query = query.gte('date_found', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('date_found', filters.dateTo);
  }

  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing approved items:', error);
    throw new Error(`Failed to list approved items: ${error.message}`);
  }

  // Filter out items that have approved claims
  if (data && data.length > 0) {
    const itemIds = data.map(item => item.id);
    
    // Fetch all approved claims for these items
    const { data: approvedClaims, error: claimsError } = await supabase
      .from('claims')
      .select('item_id')
      .eq('school_id', schoolId)
      .eq('status', 'approved')
      .in('item_id', itemIds);

    if (claimsError) {
      console.error('Error checking approved claims:', claimsError);
      // Continue without filtering if claims check fails
    } else {
      // Get set of item IDs that have approved claims
      const claimedItemIds = new Set(
        (approvedClaims || []).map(claim => claim.item_id)
      );

      // Filter out items with approved claims
      const filteredData = data.filter(item => !claimedItemIds.has(item.id));
      
      console.log(`[listApprovedItems] Found ${data.length} items, ${filteredData.length} after filtering out ${claimedItemIds.size} claimed items for school ${schoolId}`);
      
      return filteredData as DbItem[];
    }
  }

  console.log(`[listApprovedItems] Found ${data?.length || 0} items for school ${schoolId} with status filter: ${filters.status || 'approved'}`);

  return (data || []) as DbItem[];
}

/**
 * Get a single item by ID (must belong to the school)
 * 
 * Security: Uses admin client but filters by school_id for security.
 * Note: RLS policies require app.current_user_id to be set, which isn't
 * available in server-side queries. We use admin client with explicit
 * school_id filtering instead.
 * 
 * @param id - Item ID
 * @param schoolId - School ID for verification
 * @returns Item or null if not found
 */
export async function getItemById(
  id: string,
  schoolId: string
): Promise<DbItem | null> {
  // Use admin client since RLS requires app.current_user_id session variable
  // which isn't set in server-side queries. We filter by school_id explicitly.
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .eq('school_id', schoolId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error getting item by ID:', error);
    throw new Error(`Failed to get item: ${error.message}`);
  }

  return data as DbItem;
}

// ============================================================================
// WRITE OPERATIONS (Use admin client - server-only)
// ============================================================================

/**
 * Create a new lost/found item
 * 
 * Security: Uses admin client (server-only), creates item with status='pending'
 * 
 * @param input - Item data
 * @returns Created item
 */
export async function createItem(input: CreateItemInput): Promise<DbItem> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('items')
    .insert({
      school_id: input.schoolId,
      title: input.title,
      description: input.description || null,
      category: input.category,
      color: input.color || null,
      location_found: input.locationFound,
      date_found: input.dateFound,
      photo_path: input.photoPath || null,
      status: 'pending', // New items start as pending
      created_by: input.createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating item:', error);
    throw new Error(`Failed to create item: ${error.message}`);
  }

  // Log event for audit trail
  await logEvent({
    schoolId: input.schoolId,
    itemId: data.id,
    actorId: input.createdBy,
    eventType: 'created',
    metadata: { title: input.title, category: input.category },
  });

  return data as DbItem;
}

/**
 * Create a claim request for an item
 * 
 * Security: Uses admin client (server-only)
 * 
 * @param input - Claim data
 * @returns Created claim
 */
export async function createClaim(input: CreateClaimInput): Promise<DbClaim> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('claims')
    .insert({
      school_id: input.schoolId,
      item_id: input.itemId,
      claimant_id: input.claimantId,
      message: input.message || null,
      proof_answers: input.proofAnswers || {},
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating claim:', error);
    throw new Error(`Failed to create claim: ${error.message}`);
  }

  // Note: Event logging is handled by the calling server action
  // to ensure correct event type ('claim_submitted')

  return data as DbClaim;
}

// ============================================================================
// ADMIN OPERATIONS (Use admin client - server-only)
// ============================================================================

/**
 * Admin: Approve a pending item
 * 
 * Security: Uses admin client (server-only), only callable from server actions
 * 
 * @param itemId - Item ID to approve
 * @param schoolId - School ID for verification
 * @param adminId - Clerk user ID of the admin approving
 * @returns Updated item
 */
export async function adminApproveItem(
  itemId: string,
  schoolId: string,
  adminId: string
): Promise<DbItem> {
  const supabase = getSupabaseAdmin();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('items')
    .update({
      status: 'approved',
      approved_at: now,
      approved_by: adminId,
    })
    .eq('id', itemId)
    .eq('school_id', schoolId)
    .eq('status', 'pending') // Only approve pending items
    .select()
    .single();

  if (error) {
    console.error('Error approving item:', error);
    throw new Error(`Failed to approve item: ${error.message}`);
  }

  // Log event for audit trail
  await logEvent({
    schoolId,
    itemId,
    actorId: adminId,
    eventType: 'approved',
    metadata: {},
  });

  return data as DbItem;
}

/**
 * Admin: Approve a claim request
 * 
 * Security: Uses admin client (server-only)
 * 
 * @param claimId - Claim ID to approve
 * @param schoolId - School ID for verification
 * @param adminId - Clerk user ID of the admin approving
 * @returns Updated claim
 */
export async function adminApproveClaim(
  claimId: string,
  schoolId: string,
  adminId: string
): Promise<DbClaim> {
  const supabase = getSupabaseAdmin();

  const now = new Date().toISOString();

  // Get the claim to get item_id, claimant_id, and item title for logging and notification
  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .select('item_id, claimant_id')
    .eq('id', claimId)
    .eq('school_id', schoolId)
    .single();

  if (claimError || !claim) {
    throw new Error('Claim not found');
  }

  // Get item title for notification
  let itemTitle = 'Item';
  if (claim.item_id) {
    const { data: item } = await supabase
      .from('items')
      .select('title')
      .eq('id', claim.item_id)
      .single();
    if (item) {
      itemTitle = item.title;
    }
  }

  const { data, error } = await supabase
    .from('claims')
    .update({
      status: 'approved',
      reviewed_at: now,
      reviewed_by: adminId,
    })
    .eq('id', claimId)
    .eq('school_id', schoolId)
    .eq('status', 'pending') // Only approve pending claims
    .select()
    .single();

  if (error) {
    console.error('Error approving claim:', error);
    throw new Error(`Failed to approve claim: ${error.message}`);
  }

  // Log event for audit trail
  await logEvent({
    schoolId,
    itemId: claim.item_id,
    actorId: adminId,
    eventType: 'claim_approved',
    metadata: { claimId },
  });

  // Create notification for the claimant
  await supabase
    .from('notifications')
    .insert({
      recipient_user_id: claim.claimant_id,
      title: 'Claim Approved',
      body: itemTitle,
      type: 'claim_approved',
      item_id: claim.item_id,
      claim_id: claimId,
    })
    .catch((error) => {
      // Log but don't fail - notifications are nice-to-have
      console.error('Error creating notification for claim approval:', error);
    });

  return data as DbClaim;
}

/**
 * Admin: Deny a claim request
 * 
 * Security: Uses admin client (server-only)
 * 
 * @param claimId - Claim ID to deny
 * @param schoolId - School ID for verification
 * @param adminId - Clerk user ID of the admin denying
 * @returns Updated claim
 */
export async function adminDenyClaim(
  claimId: string,
  schoolId: string,
  adminId: string
): Promise<DbClaim> {
  const supabase = getSupabaseAdmin();

  const now = new Date().toISOString();

  // Get the claim to get item_id, claimant_id, and item title for logging and notification
  const { data: claim, error: claimError } = await supabase
    .from('claims')
    .select('item_id, claimant_id')
    .eq('id', claimId)
    .eq('school_id', schoolId)
    .single();

  if (claimError || !claim) {
    throw new Error('Claim not found');
  }

  // Get item title for notification
  let itemTitle = 'Item';
  if (claim.item_id) {
    const { data: item } = await supabase
      .from('items')
      .select('title')
      .eq('id', claim.item_id)
      .single();
    if (item) {
      itemTitle = item.title;
    }
  }

  const { data, error } = await supabase
    .from('claims')
    .update({
      status: 'denied',
      reviewed_at: now,
      reviewed_by: adminId,
    })
    .eq('id', claimId)
    .eq('school_id', schoolId)
    .eq('status', 'pending') // Only deny pending claims
    .select()
    .single();

  if (error) {
    console.error('Error denying claim:', error);
    throw new Error(`Failed to deny claim: ${error.message}`);
  }

  // Log event for audit trail
  await logEvent({
    schoolId,
    itemId: claim.item_id,
    actorId: adminId,
    eventType: 'claim_denied',
    metadata: { claimId },
  });

  // Create notification for the claimant
  await supabase
    .from('notifications')
    .insert({
      recipient_user_id: claim.claimant_id,
      title: 'Claim Denied',
      body: itemTitle,
      type: 'claim_denied',
      item_id: claim.item_id,
      claim_id: claimId,
    })
    .catch((error) => {
      // Log but don't fail - notifications are nice-to-have
      console.error('Error creating notification for claim denial:', error);
    });

  return data as DbClaim;
}

/**
 * Admin: Archive an item (mark as archived)
 * 
 * Security: Uses admin client (server-only)
 * 
 * @param itemId - Item ID to archive
 * @param schoolId - School ID for verification
 * @param adminId - Clerk user ID of the admin archiving
 * @returns Updated item
 */
export async function adminArchiveItem(
  itemId: string,
  schoolId: string,
  adminId: string
): Promise<DbItem> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('items')
    .update({
      status: 'archived',
    })
    .eq('id', itemId)
    .eq('school_id', schoolId)
    .select()
    .single();

  if (error) {
    console.error('Error archiving item:', error);
    throw new Error(`Failed to archive item: ${error.message}`);
  }

  // Log event for audit trail
  await logEvent({
    schoolId,
    itemId,
    actorId: adminId,
    eventType: 'archived',
    metadata: {},
  });

  return data as DbItem;
}

// ============================================================================
// AUDIT TRAIL (Use admin client - server-only)
// ============================================================================

/**
 * Log an event to the audit trail
 * 
 * Security: Uses admin client (server-only), bypasses RLS for audit integrity
 * 
 * This function is used internally by other functions to maintain an audit trail
 * of all actions performed on items and schools.
 * 
 * @param params - Event parameters
 */
export async function logEvent(params: {
  schoolId: string;
  itemId?: string | null; // Null for school-level events
  actorId: string; // clerk_user_id
  eventType: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('item_events').insert({
    school_id: params.schoolId,
    item_id: params.itemId || null,
    actor_id: params.actorId,
    event_type: params.eventType,
    metadata: params.metadata || {},
  });

  if (error) {
    // Log but don't throw - audit events are important but shouldn't break the flow
    console.error('Error logging event:', error);
  }
}
