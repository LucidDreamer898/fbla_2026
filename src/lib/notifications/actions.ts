/**
 * Notifications Server Actions
 * 
 * This module provides server actions for managing in-app notifications.
 * 
 * Security Notes:
 * - All operations require authentication
 * - Users can only access their own notifications
 * - Notifications are created server-side when claims are approved/denied
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getSupabaseAdmin } from '../supabase/admin';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Notification {
  id: string;
  recipient_user_id: string;
  title: string;
  body: string;
  type: 'claim_approved' | 'claim_denied';
  item_id: string | null;
  claim_id: string | null;
  read_at: string | null;
  created_at: string;
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Get unread notification count for the current user
 */
export async function getUnreadNotificationCount(): Promise<{
  success: true;
  count: number;
} | {
  success: false;
  error: string;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_user_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Error fetching unread notification count:', error);
      return {
        success: false,
        error: 'Failed to fetch notification count',
      };
    }

    return {
      success: true,
      count: count || 0,
    };
  } catch (error: any) {
    console.error('Error getting unread notification count:', error);
    return {
      success: false,
      error: error.message || 'Failed to get notification count',
    };
  }
}

/**
 * Get recent notifications for the current user (latest first)
 * 
 * @param limit - Maximum number of notifications to return (default: 50)
 */
export async function getNotifications(limit: number = 50): Promise<{
  success: true;
  notifications: Notification[];
} | {
  success: false;
  error: string;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        error: 'Failed to fetch notifications',
      };
    }

    return {
      success: true,
      notifications: (data || []) as Notification[],
    };
  } catch (error: any) {
    console.error('Error getting notifications:', error);
    return {
      success: false,
      error: error.message || 'Failed to get notifications',
    };
  }
}

/**
 * Mark a notification as read
 * 
 * @param notificationId - ID of the notification to mark as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<{
  success: true;
} | {
  success: false;
  error: string;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('recipient_user_id', userId)
      .is('read_at', null); // Only update if not already read

    if (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: 'Failed to mark notification as read',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark notification as read',
    };
  }
}

/**
 * Mark all visible notifications as read
 * 
 * This is called when the notification modal is opened.
 * 
 * @param notificationIds - Array of notification IDs to mark as read
 */
export async function markNotificationsAsRead(notificationIds: string[]): Promise<{
  success: true;
  count: number;
} | {
  success: false;
  error: string;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    if (notificationIds.length === 0) {
      return {
        success: true,
        count: 0,
      };
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_user_id', userId)
      .is('read_at', null)
      .in('id', notificationIds)
      .select('id');

    if (error) {
      console.error('Error marking notifications as read:', error);
      return {
        success: false,
        error: 'Failed to mark notifications as read',
      };
    }

    return {
      success: true,
      count: data?.length || 0,
    };
  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark notifications as read',
    };
  }
}
