import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * API Route: Setup Organization Metadata
 * 
 * After an organization is created client-side, this route
 * saves school metadata and join codes to the organization's publicMetadata.
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
    const {
      organizationId,
      schoolName,
      schoolAddress,
      adminFullName,
      adminEmail,
      adminPhone,
      adminJoinCode,
      studentJoinCode,
      logoUrl,
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    // Update the organization's metadata with school info, join codes, and logo
    await client.organizations.updateOrganizationMetadata(organizationId, {
      publicMetadata: {
        schoolName,
        schoolAddress,
        adminFullName,
        adminEmail,
        adminPhone,
        type: 'school',
        adminJoinCode,
        studentJoinCode,
        logoUrl: logoUrl || null,
      },
    });

    // Log to terminal
    console.log('DATABASE: setupSchoolMetadata', {
      organizationId,
      schoolName,
      schoolAddress,
      adminJoinCode,
      studentJoinCode,
      logoUrl,
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error setting up organization metadata:', error);
    // Return success false but don't block the flow
    // The org was already created, metadata is nice-to-have
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save metadata' },
      { status: 200 } // Return 200 so it doesn't break the client flow
    );
  }
}
