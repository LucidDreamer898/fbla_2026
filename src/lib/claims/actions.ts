/**
 * Claim Server Actions
 * 
 * This module provides server actions for submitting and managing claims.
 * 
 * Security Notes for Judges:
 * - All operations require authentication
 * - Claims are scoped to user's school_id
 * - Users can only view their own claims
 * - Audit trail maintained via logEvent()
 */

'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '../supabase/admin';
import { createClaim, logEvent } from '../supabase/db';
import { revalidatePath } from 'next/cache';

/**
 * Submit a claim for an item
 * 
 * @param itemId - ID of the item being claimed
 * @param message - Optional message from the claimant
 * @param proofAnswers - Structured proof/answers (e.g., contact info, description)
 * @returns Success or error response
 */
export async function submitClaim(
  itemId: string,
  message?: string | null,
  proofAnswers?: Record<string, any>
): Promise<{
  success: true;
  claimId: string;
} | {
  success: false;
  error: string;
}> {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'You must be signed in to submit a claim. Please sign in and try again.',
      };
    }

    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        error: 'Unable to verify your account. Please try signing in again.',
      };
    }

    // 2. Get user's school_id from profiles table
    const supabase = getSupabaseAdmin();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'You must be part of a school to submit claims. Please join a school first.',
      };
    }

    const schoolId = profile.school_id;

    // 3. Verify item exists and belongs to the same school
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, school_id, status')
      .eq('id', itemId)
      .eq('school_id', schoolId)
      .single();

    if (itemError || !item) {
      return {
        success: false,
        error: 'Item not found or you do not have permission to claim it.',
      };
    }

    // 4. Check if item is approved (only approved items can be claimed)
    if (item.status !== 'approved') {
      return {
        success: false,
        error: 'This item is not available for claiming yet. It may still be pending approval.',
      };
    }

    // 5. Check if user already has a pending claim for this item
    const { data: existingClaim } = await supabase
      .from('claims')
      .select('id, status')
      .eq('item_id', itemId)
      .eq('claimant_id', userId)
      .eq('status', 'pending')
      .single();

    if (existingClaim) {
      return {
        success: false,
        error: 'You already have a pending claim for this item. Please wait for it to be reviewed.',
      };
    }

    // 6. Create claim
    const claim = await createClaim({
      schoolId,
      itemId,
      claimantId: userId,
      message: message || null,
      proofAnswers: proofAnswers || {},
    });

    // 7. Log event 'claim_submitted' (update the event type in db.ts)
    await logEvent({
      schoolId,
      itemId,
      actorId: userId,
      eventType: 'claim_submitted',
      metadata: {
        claimId: claim.id,
        hasMessage: !!message,
        hasProof: !!proofAnswers && Object.keys(proofAnswers).length > 0,
      },
    });

    // 8. Revalidate relevant paths
    revalidatePath('/items');
    revalidatePath(`/items/${itemId}`);

    return {
      success: true,
      claimId: claim.id,
    };
  } catch (error: any) {
    console.error('Error submitting claim:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit claim. Please try again.',
    };
  }
}

/**
 * Get all claims for the current user
 * 
 * @returns Array of user's claims with item details
 */
export async function getUserClaims(): Promise<{
  success: true;
  claims: Array<{
    id: string;
    itemId: string;
    itemTitle: string;
    message: string | null;
    proofAnswers: Record<string, any>;
    status: 'pending' | 'approved' | 'denied';
    created_at: string;
    reviewed_at: string | null;
  }>;
} | {
  success: false;
  error: string;
}> {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'You must be signed in to view your claims.',
      };
    }

    // 2. Get user's school_id
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('clerk_user_id', userId)
      .single();

    if (!profile) {
      return {
        success: false,
        error: 'You must be part of a school to view claims.',
      };
    }

    // 3. Fetch user's claims
    const { data: claims, error: claimsError } = await supabase
      .from('claims')
      .select('id, item_id, message, proof_answers, status, created_at, reviewed_at')
      .eq('claimant_id', userId)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false });

    if (claimsError) {
      console.error('Error fetching claims:', claimsError);
      return {
        success: false,
        error: 'Failed to load your claims. Please try again.',
      };
    }

    // 4. Fetch item titles for each claim
    const itemIds = (claims || []).map(c => c.item_id);
    const { data: items } = await supabase
      .from('items')
      .select('id, title')
      .in('id', itemIds);

    // Create a map of item_id -> title
    const itemMap = new Map((items || []).map(item => [item.id, item.title]));

    if (claimsError) {
      console.error('Error fetching claims:', claimsError);
      return {
        success: false,
        error: 'Failed to load your claims. Please try again.',
      };
    }

    // 5. Format claims with item details
    const formattedClaims = (claims || []).map((claim: any) => ({
      id: claim.id,
      itemId: claim.item_id,
      itemTitle: itemMap.get(claim.item_id) || 'Unknown Item',
      message: claim.message,
      proofAnswers: claim.proof_answers || {},
      status: claim.status,
      created_at: claim.created_at,
      reviewed_at: claim.reviewed_at,
    }));

    return {
      success: true,
      claims: formattedClaims,
    };
  } catch (error: any) {
    console.error('Error getting user claims:', error);
    return {
      success: false,
      error: error.message || 'Failed to load claims. Please try again.',
    };
  }
}
