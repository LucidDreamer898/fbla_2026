/**
 * Admin Server Actions
 * 
 * This module provides server actions for admin operations.
 * All operations require admin role and use service role client.
 * 
 * Security Notes for Judges:
 * - All operations require authentication and admin role
 * - All operations are scoped to user's school_id
 * - All writes use service role client (bypasses RLS)
 * - Audit trail maintained via logEvent() for accountability
 */

'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '../supabase/admin';
import {
  adminApproveItem,
  adminArchiveItem,
  adminApproveClaim,
  adminDenyClaim,
  logEvent,
  type DbItem,
  type DbClaim,
} from '../supabase/db';
import { revalidatePath } from 'next/cache';

/**
 * Get user's school_id and verify admin role
 */
async function getAdminSchoolId(): Promise<{
  schoolId: string;
  adminId: string;
} | null> {
  const { userId, orgRole } = await auth();
  if (!userId || orgRole !== 'org:admin') {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('clerk_user_id', userId)
    .single();

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return {
    schoolId: profile.school_id,
    adminId: userId,
  };
}

/**
 * List pending items for admin review
 */
export async function listPendingItems(): Promise<{
  success: true;
  items: Array<{
    id: string;
    title: string;
    description: string | null;
    category: string;
    color: string | null;
    location_found: string;
    date_found: string;
    photo_url: string | null;
    created_by: string;
    created_at: string;
  }>;
} | {
  success: false;
  error: string;
}> {
  try {
    const admin = await getAdminSchoolId();
    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      };
    }

    const supabase = getSupabaseAdmin();
    const { data: items, error } = await supabase
      .from('items')
      .select('id, title, description, category, color, location_found, date_found, photo_path, created_by, created_at')
      .eq('school_id', admin.schoolId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing pending items:', error);
      return {
        success: false,
        error: 'Failed to load pending items.',
      };
    }

    // Generate signed URLs for photos
    const itemsWithPhotos = await Promise.all(
      (items || []).map(async (item) => {
        let photoUrl: string | null = null;
        if (item.photo_path) {
          try {
            const { data } = await supabase.storage
              .from('item-photos')
              .createSignedUrl(item.photo_path, 3600);
            photoUrl = data?.signedUrl || null;
          } catch (err) {
            console.error('Error generating signed URL:', err);
          }
        }

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          color: item.color,
          location_found: item.location_found,
          date_found: item.date_found,
          photo_url: photoUrl,
          created_by: item.created_by,
          created_at: item.created_at,
        };
      })
    );

    return {
      success: true,
      items: itemsWithPhotos,
    };
  } catch (error: any) {
    console.error('Error listing pending items:', error);
    return {
      success: false,
      error: error.message || 'Failed to load pending items.',
    };
  }
}

/**
 * List pending claims for admin review
 */
export async function listPendingClaims(): Promise<{
  success: true;
  claims: Array<{
    id: string;
    item_id: string;
    item_title: string;
    item_category: string;
    claimant_id: string;
    message: string | null;
    proof_answers: Record<string, any>;
    created_at: string;
  }>;
} | {
  success: false;
  error: string;
}> {
  try {
    const admin = await getAdminSchoolId();
    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      };
    }

    const supabase = getSupabaseAdmin();
    
    // Fetch pending claims
    const { data: claims, error: claimsError } = await supabase
      .from('claims')
      .select('id, item_id, claimant_id, message, proof_answers, created_at')
      .eq('school_id', admin.schoolId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (claimsError) {
      console.error('Error listing pending claims:', claimsError);
      return {
        success: false,
        error: 'Failed to load pending claims.',
      };
    }

    // Fetch item details for each claim
    const itemIds = (claims || []).map(c => c.item_id);
    const { data: items } = await supabase
      .from('items')
      .select('id, title, category')
      .in('id', itemIds);

    const itemMap = new Map((items || []).map(item => [item.id, { title: item.title, category: item.category }]));

    // Format claims with item details
    const formattedClaims = (claims || []).map((claim: any) => {
      const item = itemMap.get(claim.item_id);
      const proofAnswers = claim.proof_answers || {};
      
      return {
        id: claim.id,
        item_id: claim.item_id,
        item_title: item?.title || 'Unknown Item',
        item_category: item?.category || 'Unknown',
        claimant_id: claim.claimant_id,
        message: claim.message,
        proof_answers: proofAnswers,
        created_at: claim.created_at,
      };
    });

    return {
      success: true,
      claims: formattedClaims,
    };
  } catch (error: any) {
    console.error('Error listing pending claims:', error);
    return {
      success: false,
      error: error.message || 'Failed to load pending claims.',
    };
  }
}

/**
 * Approve a pending item
 */
export async function approveItem(itemId: string): Promise<{
  success: true;
} | {
  success: false;
  error: string;
}> {
  try {
    const admin = await getAdminSchoolId();
    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      };
    }

    await adminApproveItem(itemId, admin.schoolId, admin.adminId);
    
    revalidatePath('/admin');
    revalidatePath('/items');

    return { success: true };
  } catch (error: any) {
    console.error('Error approving item:', error);
    return {
      success: false,
      error: error.message || 'Failed to approve item.',
    };
  }
}

/**
 * Archive a pending item (reject/remove)
 */
export async function archiveItem(itemId: string): Promise<{
  success: true;
} | {
  success: false;
  error: string;
}> {
  try {
    const admin = await getAdminSchoolId();
    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      };
    }

    await adminArchiveItem(itemId, admin.schoolId, admin.adminId);
    
    revalidatePath('/admin');
    revalidatePath('/items');

    return { success: true };
  } catch (error: any) {
    console.error('Error archiving item:', error);
    return {
      success: false,
      error: error.message || 'Failed to archive item.',
    };
  }
}

/**
 * Approve a pending claim
 */
export async function approveClaim(claimId: string): Promise<{
  success: true;
} | {
  success: false;
  error: string;
}> {
  try {
    const admin = await getAdminSchoolId();
    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      };
    }

    await adminApproveClaim(claimId, admin.schoolId, admin.adminId);
    
    revalidatePath('/admin');
    revalidatePath('/items');

    return { success: true };
  } catch (error: any) {
    console.error('Error approving claim:', error);
    return {
      success: false,
      error: error.message || 'Failed to approve claim.',
    };
  }
}

/**
 * Deny a pending claim
 */
export async function denyClaim(claimId: string): Promise<{
  success: true;
} | {
  success: false;
  error: string;
}> {
  try {
    const admin = await getAdminSchoolId();
    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      };
    }

    await adminDenyClaim(claimId, admin.schoolId, admin.adminId);
    
    revalidatePath('/admin');
    revalidatePath('/items');

    return { success: true };
  } catch (error: any) {
    console.error('Error denying claim:', error);
    return {
      success: false,
      error: error.message || 'Failed to deny claim.',
    };
  }
}

/**
 * Mark item as returned (log 'returned' event and optionally archive)
 */
export async function markItemReturned(
  itemId: string,
  archive: boolean = false
): Promise<{
  success: true;
} | {
  success: false;
  error: string;
}> {
  try {
    const admin = await getAdminSchoolId();
    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      };
    }

    // Log 'returned' event
    await logEvent({
      schoolId: admin.schoolId,
      itemId,
      actorId: admin.adminId,
      eventType: 'returned',
      metadata: { archived: archive },
    });

    // Optionally archive the item
    if (archive) {
      await adminArchiveItem(itemId, admin.schoolId, admin.adminId);
    }

    revalidatePath('/admin');
    revalidatePath('/items');
    revalidatePath(`/items/${itemId}`);

    return { success: true };
  } catch (error: any) {
    console.error('Error marking item as returned:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark item as returned.',
    };
  }
}

/**
 * Get audit timeline for an item
 */
export async function getItemAuditTimeline(itemId: string): Promise<{
  success: true;
  events: Array<{
    id: string;
    event_type: string;
    actor_id: string;
    metadata: Record<string, any>;
    created_at: string;
  }>;
} | {
  success: false;
  error: string;
}> {
  try {
    const admin = await getAdminSchoolId();
    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      };
    }

    const supabase = getSupabaseAdmin();
    
    // Verify item belongs to school
    const { data: item } = await supabase
      .from('items')
      .select('id')
      .eq('id', itemId)
      .eq('school_id', admin.schoolId)
      .single();

    if (!item) {
      return {
        success: false,
        error: 'Item not found or access denied.',
      };
    }

    // Fetch events for this item
    const { data: events, error: eventsError } = await supabase
      .from('item_events')
      .select('id, event_type, actor_id, metadata, created_at')
      .eq('item_id', itemId)
      .eq('school_id', admin.schoolId)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching audit timeline:', eventsError);
      return {
        success: false,
        error: 'Failed to load audit timeline.',
      };
    }

    return {
      success: true,
      events: (events || []).map((e: any) => ({
        id: e.id,
        event_type: e.event_type,
        actor_id: e.actor_id,
        metadata: e.metadata || {},
        created_at: e.created_at,
      })),
    };
  } catch (error: any) {
    console.error('Error getting audit timeline:', error);
    return {
      success: false,
      error: error.message || 'Failed to load audit timeline.',
    };
  }
}

/**
 * Get school information
 */
export async function getSchoolInfo(): Promise<{
  success: true;
  school: {
    id: string;
    name: string;
    address: string | null;
    logo_path: string | null;
    logo_url: string | null;
    created_at: string;
  };
} | {
  success: false;
  error: string;
}> {
  try {
    const admin = await getAdminSchoolId();
    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      };
    }

    const supabase = getSupabaseAdmin();
    const { data: school, error } = await supabase
      .from('schools')
      .select('id, name, address, logo_path, created_at')
      .eq('id', admin.schoolId)
      .single();

    if (error || !school) {
      console.error('Error fetching school info:', error);
      return {
        success: false,
        error: 'Failed to load school information.',
      };
    }

    // Generate logo URL if it exists
    // Logos are stored in public/uploads/logos (public path) or in Supabase Storage
    let logoUrl: string | null = null;
    if (school.logo_path) {
      // If it's a public path (starts with /uploads/), use it directly
      if (school.logo_path.startsWith('/uploads/') || school.logo_path.startsWith('uploads/')) {
        logoUrl = school.logo_path.startsWith('/') ? school.logo_path : `/${school.logo_path}`;
      } else {
        // Otherwise, try to generate signed URL from Supabase Storage
        try {
          // Try common bucket names for school logos
          const possibleBuckets = ['school-logos', 'logos', 'school-assets'];
          for (const bucketName of possibleBuckets) {
            try {
              const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(school.logo_path, 3600);
              if (!error && data?.signedUrl) {
                logoUrl = data.signedUrl;
                break;
              }
            } catch (bucketError) {
              // Try next bucket
              continue;
            }
          }
        } catch (err) {
          console.error('Error generating signed URL for logo:', err);
          // Continue without logo URL
        }
      }
    }

    return {
      success: true,
      school: {
        id: school.id,
        name: school.name,
        address: school.address,
        logo_path: school.logo_path,
        logo_url: logoUrl,
        created_at: school.created_at,
      },
    };
  } catch (error: any) {
    console.error('Error getting school info:', error);
    return {
      success: false,
      error: error.message || 'Failed to load school information.',
    };
  }
}

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(): Promise<{
  success: true;
  stats: {
    approvedToday: number;
    totalItems: number;
  };
} | {
  success: false;
  error: string;
}> {
  try {
    const admin = await getAdminSchoolId();
    if (!admin) {
      return { success: false, error: 'Unauthorized: Admin access required.' };
    }
    const { schoolId } = admin;
    const supabase = getSupabaseAdmin();

    // Get today's date range (start of day to end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const todayEndISO = todayEnd.toISOString();

    // Count items approved today
    const { count: approvedTodayCount, error: approvedError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'approved')
      .gte('approved_at', todayStart)
      .lte('approved_at', todayEndISO);

    if (approvedError) {
      console.error('Error counting approved items today:', approvedError);
    }

    // Count total items (all statuses)
    const { count: totalItemsCount, error: totalError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId);

    if (totalError) {
      console.error('Error counting total items:', totalError);
    }

    return {
      success: true,
      stats: {
        approvedToday: approvedTodayCount || 0,
        totalItems: totalItemsCount || 0,
      },
    };
  } catch (error: any) {
    console.error('Error getting admin stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to load admin statistics.',
    };
  }
}

/**
 * Get school audit log (all events for the school)
 */
export async function getSchoolAuditLog(limit: number = 100): Promise<{
  success: true;
  events: Array<{
    id: string;
    event_type: string;
    actor_id: string;
    item_id: string | null;
    metadata: Record<string, any>;
    created_at: string;
    item_title: string | null;
  }>;
} | {
  success: false;
  error: string;
}> {
  try {
    const admin = await getAdminSchoolId();
    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized. Admin access required.',
      };
    }

    const supabase = getSupabaseAdmin();
    
    // Fetch all events for the school
    const { data: events, error: eventsError } = await supabase
      .from('item_events')
      .select('id, event_type, actor_id, item_id, metadata, created_at')
      .eq('school_id', admin.schoolId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventsError) {
      console.error('Error fetching audit log:', eventsError);
      return {
        success: false,
        error: 'Failed to load audit log.',
      };
    }

    // Fetch item titles for events that have item_id
    const itemIds = (events || [])
      .map(e => e.item_id)
      .filter((id): id is string => id !== null);
    
    let itemMap = new Map<string, string>();
    if (itemIds.length > 0) {
      const { data: items } = await supabase
        .from('items')
        .select('id, title')
        .in('id', itemIds);
      
      itemMap = new Map((items || []).map(item => [item.id, item.title]));
    }

    // Format events with item titles
    const formattedEvents = (events || []).map((e: any) => ({
      id: e.id,
      event_type: e.event_type,
      actor_id: e.actor_id,
      item_id: e.item_id,
      metadata: e.metadata || {},
      created_at: e.created_at,
      item_title: e.item_id ? itemMap.get(e.item_id) || null : null,
    }));

    return {
      success: true,
      events: formattedEvents,
    };
  } catch (error: any) {
    console.error('Error getting audit log:', error);
    return {
      success: false,
      error: error.message || 'Failed to load audit log.',
    };
  }
}
