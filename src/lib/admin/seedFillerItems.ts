/**
 * Seed Filler Items (Helper Function)
 * 
 * This module provides a helper function to automatically seed the database with sample/filler items
 * for testing and demonstration purposes. Items are automatically added when a school is created.
 */

'use server';

import { getSupabaseAdmin } from '../supabase/admin';
import { createItem, logEvent } from '../supabase/db';

/**
 * Filler item templates
 */
const FILLER_ITEMS = [
  // Electronics
  {
    title: 'Black Wireless Headphones',
    description: 'Found in the library. Sony brand, noise-cancelling feature.',
    category: 'Electronics',
    color: 'Black',
    locationFound: 'Library - Study Area',
    dateFound: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
    status: 'approved' as const,
  },
  {
    title: 'Silver Laptop Charger',
    description: 'MacBook charger found in computer lab.',
    category: 'Electronics',
    color: 'Silver',
    locationFound: 'Computer Lab - Room 201',
    dateFound: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
    status: 'approved' as const,
  },
  {
    title: 'Blue USB Flash Drive',
    description: '32GB USB drive found in hallway.',
    category: 'Electronics',
    color: 'Blue',
    locationFound: 'Main Hallway - Near Cafeteria',
    dateFound: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
    status: 'pending' as const,
  },
  // Clothing
  {
    title: 'Red Hoodie',
    description: 'Nike hoodie, size M, found in gym.',
    category: 'Clothing',
    color: 'Red',
    locationFound: 'Gymnasium - Locker Room',
    dateFound: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
    status: 'approved' as const,
  },
  {
    title: 'Blue Backpack',
    description: 'Jansport backpack with school logo.',
    category: 'Clothing',
    color: 'Blue',
    locationFound: 'Cafeteria - Table 12',
    dateFound: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    status: 'approved' as const,
  },
  {
    title: 'Black Winter Jacket',
    description: 'North Face jacket, size L, found in hallway.',
    category: 'Clothing',
    color: 'Black',
    locationFound: 'Main Entrance - Coat Rack',
    dateFound: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days ago
    status: 'pending' as const,
  },
  // Accessories
  {
    title: 'Silver Watch',
    description: 'Apple Watch Series 7, found in restroom.',
    category: 'Accessories',
    color: 'Silver',
    locationFound: 'Restroom - First Floor',
    dateFound: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 days ago
    status: 'approved' as const,
  },
  {
    title: 'Brown Leather Wallet',
    description: 'Contains ID and credit cards. Found in parking lot.',
    category: 'Accessories',
    color: 'Brown',
    locationFound: 'Parking Lot - Section B',
    dateFound: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 8 days ago
    status: 'approved' as const,
  },
  {
    title: 'Black Sunglasses',
    description: 'Ray-Ban aviator sunglasses in case.',
    category: 'Accessories',
    color: 'Black',
    locationFound: 'Library - Reading Area',
    dateFound: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
    status: 'pending' as const,
  },
  // Books
  {
    title: 'Calculus Textbook',
    description: 'Calculus: Early Transcendentals, 8th Edition. Found in math classroom.',
    category: 'Books',
    color: null,
    locationFound: 'Math Classroom - Room 305',
    dateFound: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 9 days ago
    status: 'approved' as const,
  },
  {
    title: 'Chemistry Lab Notebook',
    description: 'Spiral notebook with lab notes. Name on cover: "Sarah M."',
    category: 'Books',
    color: null,
    locationFound: 'Science Lab - Room 210',
    dateFound: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
    status: 'approved' as const,
  },
  // Other
  {
    title: 'Set of Keys',
    description: 'Keychain with 5 keys and a car key fob.',
    category: 'Other',
    color: 'Silver',
    locationFound: 'Main Office - Front Desk',
    dateFound: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
    status: 'approved' as const,
  },
  {
    title: 'Water Bottle',
    description: 'Hydro Flask, 32oz, blue color. Found in gym.',
    category: 'Other',
    color: 'Blue',
    locationFound: 'Gymnasium - Bleachers',
    dateFound: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
    status: 'pending' as const,
  },
];

/**
 * Seed filler items into the database for a specific school
 * 
 * This function:
 * 1. Checks if items already exist (to avoid duplicates)
 * 2. Creates filler items with various statuses
 * 3. Logs events for audit trail
 * 
 * @param schoolId - The school ID to seed items for
 * @param createdByUserId - The user ID to use as creator (usually the school creator)
 * @returns Success result with count of items created or error message
 */
export async function seedFillerItemsForSchool(
  schoolId: string,
  createdByUserId: string
): Promise<{
  success: true;
  count: number;
} | {
  success: false;
  error: string;
}> {
  try {
    const supabase = getSupabaseAdmin();

    // Check if items already exist for this school (avoid duplicates)
    const { count: existingCount } = await supabase
      .from('items')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId);

    // If items already exist, skip seeding (idempotent)
    if (existingCount && existingCount > 0) {
      console.log(`[seedFillerItemsForSchool] School ${schoolId} already has ${existingCount} items, skipping seed.`);
      return {
        success: true,
        count: 0,
      };
    }

    // Create filler items
    let createdCount = 0;
    const errors: string[] = [];

    for (const itemTemplate of FILLER_ITEMS) {
      try {
        // Create item with status from template
        const item = await createItem({
          schoolId,
          title: itemTemplate.title,
          description: itemTemplate.description,
          category: itemTemplate.category,
          color: itemTemplate.color || null,
          locationFound: itemTemplate.locationFound,
          dateFound: itemTemplate.dateFound,
          photoPath: null, // No photos for filler items
          createdBy: createdByUserId,
        });

        // If item should be approved, update it
        if (itemTemplate.status === 'approved') {
          const { error: updateError } = await supabase
            .from('items')
            .update({
              status: 'approved',
              approved_at: new Date().toISOString(),
              approved_by: createdByUserId,
            })
            .eq('id', item.id)
            .eq('school_id', schoolId);

          if (updateError) {
            console.error(`Error approving item ${item.id}:`, updateError);
            errors.push(`Failed to approve item: ${itemTemplate.title}`);
          } else {
            // Log approval event
            await logEvent({
              schoolId,
              itemId: item.id,
              actorId: createdByUserId,
              eventType: 'approved',
              metadata: { title: itemTemplate.title, category: itemTemplate.category },
            });
          }
        }

        createdCount++;
      } catch (itemError: any) {
        console.error(`Error creating filler item "${itemTemplate.title}":`, itemError);
        errors.push(`Failed to create item: ${itemTemplate.title}`);
      }
    }

    if (errors.length > 0) {
      console.warn(`[seedFillerItemsForSchool] Created ${createdCount} items but encountered ${errors.length} errors`);
    }

    console.log(`[seedFillerItemsForSchool] Successfully seeded ${createdCount} filler items for school ${schoolId}`);

    return {
      success: true,
      count: createdCount,
    };
  } catch (error: any) {
    console.error('Error seeding filler items:', error);
    return {
      success: false,
      error: error.message || 'Failed to seed filler items. Please try again.',
    };
  }
}
