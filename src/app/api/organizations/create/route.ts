import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * API Route: Create Organization
 * 
 * Creates a Clerk organization with school metadata and generates a join code.
 * This is called from the onboarding page when a user creates a school.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { schoolName, schoolAddress, adminFullName, adminEmail, adminPhone } = body;

    // Validate required fields
    if (!schoolName || !schoolAddress) {
      return NextResponse.json(
        { error: 'School name and address are required' },
        { status: 400 }
      );
    }

    // Create organization using Clerk API
    const client = await clerkClient();
    
    // Generate two join codes: one for admins, one for students
    const adminJoinCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    const studentJoinCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Create organization - this requires Organizations to be enabled in Clerk Dashboard
    let org;
    try {
      org = await client.organizations.createOrganization({
      name: schoolName,
      slug: schoolName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      createdBy: userId,
      // Store school metadata in publicMetadata
      publicMetadata: {
        schoolName,
        schoolAddress,
        adminFullName,
        adminEmail,
        adminPhone,
        type: 'school',
        adminJoinCode, // Join code for admins
        studentJoinCode, // Join code for students
      },
      });
    } catch (orgError: any) {
      // Provide more helpful error message for 403 errors
      if (orgError?.status === 403) {
        console.error('Clerk Organizations not enabled or insufficient permissions:', {
          error: orgError.message,
          status: orgError.status,
          clerkTraceId: orgError.clerkTraceId,
        });
        return NextResponse.json(
          { 
            error: 'Organizations feature is not enabled in your Clerk Dashboard. Please enable Organizations in Clerk Dashboard → Organizations → Settings.',
            details: 'This error typically means Organizations are disabled or your Clerk plan doesn\'t support them.',
          },
          { status: 403 }
        );
      }
      throw orgError; // Re-throw if it's a different error
    }

    // Add the creator as admin
    await client.organizations.createOrganizationMembership({
      organizationId: org.id,
      userId: userId,
      role: 'org:admin',
    });

    // Log to database
    console.log('DATABASE: createSchool', {
      organizationId: org.id,
      schoolName,
      schoolAddress,
      adminFullName,
      adminEmail,
      adminPhone,
      adminJoinCode,
      studentJoinCode,
      userId,
    });

    // Send to log API
    fetch(`${request.nextUrl.origin}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'createSchool',
        data: {
          organizationId: org.id,
          schoolName,
          schoolAddress,
          adminFullName,
          adminEmail,
          adminPhone,
          adminJoinCode,
          studentJoinCode,
          userId,
        },
      }),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      organizationId: org.id,
      adminJoinCode,
      studentJoinCode,
    });
  } catch (error: any) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create organization' },
      { status: 500 }
    );
  }
}
