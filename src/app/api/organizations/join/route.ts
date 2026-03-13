import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

/**
 * API Route: Join Organization
 * 
 * Allows users to join an organization using either an admin or student join code.
 * The role assigned depends on which code is used.
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
    const { joinCode } = body;

    if (!joinCode || !joinCode.trim()) {
      return NextResponse.json(
        { error: 'Join code is required' },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    const normalizedCode = joinCode.trim().toUpperCase();

    // Get all organizations and search for matching join code
    // Note: In production, you'd query a database for better performance
    const orgs = await client.organizations.getOrganizationList();
    
    let targetOrg = null;
    let role: 'org:admin' | 'org:member' | null = null;

    // Search through organizations to find matching code
    for (const org of orgs.data) {
      const metadata = org.publicMetadata as {
        adminJoinCode?: string;
        studentJoinCode?: string;
      };

      if (metadata.adminJoinCode === normalizedCode) {
        targetOrg = org;
        role = 'org:admin';
        break;
      } else if (metadata.studentJoinCode === normalizedCode) {
        targetOrg = org;
        role = 'org:member';
        break;
      }
    }

    if (!targetOrg || !role) {
      return NextResponse.json(
        { error: 'Invalid join code. Please check and try again.' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const memberships = await client.organizations.getOrganizationMembershipList({
      organizationId: targetOrg.id,
    });

    const isAlreadyMember = memberships.data.some(
      (membership) => membership.publicUserData?.userId === userId
    );

    if (isAlreadyMember) {
      return NextResponse.json(
        { error: 'You are already a member of this organization.' },
        { status: 400 }
      );
    }

    // Add user to organization with appropriate role
    await client.organizations.createOrganizationMembership({
      organizationId: targetOrg.id,
      userId: userId,
      role: role, // 'org:admin' for admin code, 'org:member' for student code
    });

    // Verify the role was set correctly
    const membership = await client.organizations.getOrganizationMembershipList({
      organizationId: targetOrg.id,
    });
    
    const userMembership = membership.data.find(
      (m) => m.publicUserData?.userId === userId
    );

    if (!userMembership || userMembership.role !== role) {
      console.error('Role assignment verification failed', {
        expected: role,
        actual: userMembership?.role,
      });
    }

    // Log to database
    console.log('DATABASE: joinSchool', {
      organizationId: targetOrg.id,
      joinCode: normalizedCode,
      role,
      userId,
    });

    // Send to log API
    fetch(`${request.nextUrl.origin}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'joinSchool',
        data: {
          organizationId: targetOrg.id,
          organizationName: targetOrg.name,
          joinCode: normalizedCode,
          role,
          userId,
        },
      }),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      organizationId: targetOrg.id,
      organizationName: targetOrg.name,
      role,
    });
  } catch (error: any) {
    console.error('Error joining organization:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to join organization' },
      { status: 500 }
    );
  }
}
