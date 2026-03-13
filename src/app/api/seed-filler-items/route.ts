/**
 * One-time API route to seed filler items for all existing schools
 * 
 * This route can be called once to add filler items to all schools that don't have items yet.
 * It's idempotent - it won't add duplicate items.
 * 
 * Usage: GET /api/seed-filler-items
 * 
 * Note: This should be called once after deployment to seed existing schools.
 * New schools automatically get filler items when created.
 */

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { seedFillerItemsForSchool } from '@/lib/admin/seedFillerItems';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Get all schools
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id');

    if (schoolsError) {
      console.error('Error fetching schools:', schoolsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch schools' },
        { status: 500 }
      );
    }

    if (!schools || schools.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No schools found',
        seeded: 0,
      });
    }

    // For each school, get the first admin user to use as creator
    const results = [];
    let totalSeeded = 0;

    for (const school of schools) {
      // Get first admin user for this school
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('clerk_user_id')
        .eq('school_id', school.id)
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (!adminProfile) {
        console.warn(`No admin found for school ${school.id}, skipping`);
        results.push({
          schoolId: school.id,
          success: false,
          error: 'No admin user found',
        });
        continue;
      }

      // Seed items for this school
      const seedResult = await seedFillerItemsForSchool(
        school.id,
        adminProfile.clerk_user_id
      );

      if (seedResult.success) {
        totalSeeded += seedResult.count;
        results.push({
          schoolId: school.id,
          success: true,
          count: seedResult.count,
        });
      } else {
        results.push({
          schoolId: school.id,
          success: false,
          error: seedResult.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded filler items for ${schools.length} schools`,
      totalSeeded,
      results,
    });
  } catch (error: any) {
    console.error('Error seeding filler items:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed filler items' },
      { status: 500 }
    );
  }
}
