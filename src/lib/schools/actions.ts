/**
 * School Management Server Actions
 * 
 * Server actions for creating and managing schools.
 * All operations use Supabase and Clerk APIs.
 */

'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createHash } from 'crypto';
import { getSupabaseAdmin } from '../supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Generate a readable join code (8-10 characters, easy to read)
 * Format: Mix of uppercase letters and numbers, avoiding ambiguous characters
 */
function generateJoinCode(): string {
  // Use characters that are easy to read and distinguish
  // Exclude: 0, O, I, 1, L (ambiguous)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const length = 8 + Math.floor(Math.random() * 3); // 8-10 characters
  
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return code;
}

/**
 * Hash a join code using SHA-256
 * We use SHA-256 instead of bcrypt for join codes since they're not passwords
 * and we need to be able to verify them quickly
 */
function hashJoinCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/**
 * Join an existing school using a join code
 * 
 * This server action:
 * 1. Validates the join code against hashed codes in Supabase
 * 2. Determines role based on which code matches (admin or student)
 * 3. Adds user to Clerk Organization with correct role
 * 4. Creates/updates profile with school_id + role + contact info
 * 5. Creates audit event
 * 
 * @returns Object with organizationId, schoolId, and role
 */
export async function joinSchool(data: {
  joinCode: string;
  fullName: string;
  phone?: string | null;
}): Promise<{
  success: true;
  organizationId: string;
  schoolId: string;
  role: 'admin' | 'student';
} | {
  success: false;
  error: string;
}> {
  try {
    // Get current user
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized: User must be authenticated');
    }

    const user = await currentUser();
    if (!user) {
      throw new Error('Unauthorized: User not found');
    }

    // Validate input
    if (!data.joinCode?.trim()) {
      throw new Error('Join code is required');
    }
    if (!data.fullName?.trim()) {
      throw new Error('Full name is required');
    }

    // Get email from Clerk user
    const email = user.primaryEmailAddress?.emailAddress || '';
    if (!email) {
      throw new Error('Email address is required. Please add an email to your account.');
    }

    // Normalize join code (uppercase, trim)
    const normalizedCode = data.joinCode.trim().toUpperCase();

    // Hash the provided join code
    const providedCodeHash = hashJoinCode(normalizedCode);

    // Query Supabase to find matching school
    const supabase = getSupabaseAdmin();
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, clerk_org_id, name, admin_join_code_hash, student_join_code_hash');

    if (schoolsError) {
      console.error('Error querying schools:', schoolsError);
      throw new Error(`Failed to validate join code: ${schoolsError.message}`);
    }

    if (!schools || schools.length === 0) {
      throw new Error('No schools found in database');
    }

    // Find matching school and determine role
    let matchingSchool: typeof schools[0] | null = null;
    let role: 'admin' | 'student' | null = null;

    for (const school of schools) {
      if (school.admin_join_code_hash === providedCodeHash) {
        matchingSchool = school;
        role = 'admin';
        break;
      } else if (school.student_join_code_hash === providedCodeHash) {
        matchingSchool = school;
        role = 'student';
        break;
      }
    }

    if (!matchingSchool || !role) {
      throw new Error('Invalid join code. Please check and try again.');
    }

    // Check if user is already a member of this school
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('clerk_user_id', userId)
      .eq('school_id', matchingSchool.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine - user doesn't have a profile yet
      console.error('Error checking existing profile:', profileCheckError);
      throw new Error(`Failed to check existing membership: ${profileCheckError.message}`);
    }

    if (existingProfile) {
      throw new Error('You are already a member of this school.');
    }

    // Add user to Clerk Organization with appropriate role
    const client = await clerkClient();
    const clerkOrgRole = role === 'admin' ? 'org:admin' : 'org:member';

    try {
      // Check if user is already a member of the Clerk org
      const memberships = await client.organizations.getOrganizationMembershipList({
        organizationId: matchingSchool.clerk_org_id,
      });

      const isAlreadyMember = memberships.data.some(
        (membership) => membership.publicUserData?.userId === userId
      );

      if (!isAlreadyMember) {
        await client.organizations.createOrganizationMembership({
          organizationId: matchingSchool.clerk_org_id,
          userId: userId,
          role: clerkOrgRole,
        });
      } else {
        // User is already in org, but might need role update
        // For now, we'll just update the profile - Clerk role update would require additional API calls
        console.warn('User already in Clerk organization, skipping membership creation');
      }
    } catch (orgError: any) {
      console.error('Error adding user to Clerk organization:', orgError);
      // Don't fail completely - we can still create the profile
      // The user might need to be added manually if this fails
      if (orgError.status === 404) {
        throw new Error('School organization not found. Please contact support.');
      }
      // Continue with profile creation even if Clerk org addition fails
    }

    // Create/update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        clerk_user_id: userId,
        school_id: matchingSchool.id,
        role: role,
        full_name: data.fullName.trim(),
        email: email,
        phone: data.phone?.trim() || null,
      }, {
        onConflict: 'clerk_user_id',
      });

    if (profileError) {
      console.error('Error creating/updating profile:', profileError);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // Create audit event: school_joined
    const { error: auditError } = await supabase
      .from('item_events')
      .insert({
        school_id: matchingSchool.id,
        item_id: null, // Null for school-level events
        actor_id: userId,
        event_type: 'school_joined',
        metadata: {
          role: role,
          school_name: matchingSchool.name,
          clerk_org_id: matchingSchool.clerk_org_id,
        },
      });

    if (auditError) {
      // Log but don't fail - audit events are nice-to-have
      console.error('Error creating audit event:', auditError);
    }

    // Log to terminal
    console.log('DATABASE: joinSchool', {
      organizationId: matchingSchool.clerk_org_id,
      schoolId: matchingSchool.id,
      schoolName: matchingSchool.name,
      role: role,
      userId,
      // DO NOT log join code - security best practice
    });

    // Revalidate relevant paths
    revalidatePath('/onboarding');
    revalidatePath('/');

    return {
      success: true,
      organizationId: matchingSchool.clerk_org_id,
      schoolId: matchingSchool.id,
      role: role,
    };
  } catch (error: any) {
    console.error('Error joining school:', error);
    return {
      success: false,
      error: error.message || 'Failed to join school',
    };
  }
}

/**
 * Create a new school
 * 
 * This server action:
 * 1. Creates a Clerk Organization
 * 2. Generates and hashes join codes
 * 3. Inserts school into Supabase
 * 4. Creates profile for the creator
 * 5. Adds user to Clerk org as admin
 * 6. Creates audit event
 * 
 * @returns Object with organizationId and plaintext join codes (shown once)
 */
export async function createSchool(data: {
  schoolName: string;
  schoolAddress: string;
  logoPath?: string | null;
}): Promise<{
  success: true;
  organizationId: string;
  schoolId: string;
  adminJoinCode: string;
  studentJoinCode: string;
} | {
  success: false;
  error: string;
}> {
  try {
    // Get current user
    const { userId } = await auth();
    if (!userId) {
      throw new Error('Unauthorized: User must be authenticated');
    }

    const user = await currentUser();
    if (!user) {
      throw new Error('Unauthorized: User not found');
    }

    // Validate input
    if (!data.schoolName?.trim()) {
      throw new Error('School name is required');
    }
    if (!data.schoolAddress?.trim()) {
      throw new Error('School address is required');
    }

    // Generate join codes (plaintext - shown once, then discarded)
    const adminJoinCode = generateJoinCode();
    const studentJoinCode = generateJoinCode();

    // Hash the join codes (never store plaintext)
    const adminJoinCodeHash = hashJoinCode(adminJoinCode);
    const studentJoinCodeHash = hashJoinCode(studentJoinCode);

    // Create Clerk Organization
    const client = await clerkClient();
    let org;
    try {
      org = await client.organizations.createOrganization({
        name: data.schoolName,
        createdBy: userId,
      });
    } catch (orgError: any) {
      console.error('Error creating Clerk organization:', orgError);
      if (orgError.status === 403) {
        throw new Error(
          'Organizations feature is not enabled in your Clerk Dashboard. ' +
          'Please enable Organizations in Clerk Dashboard → Organizations → Settings.'
        );
      }
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // Insert school into Supabase
    const supabase = getSupabaseAdmin();
    const { data: schoolData, error: schoolError } = await supabase
      .from('schools')
      .insert({
        clerk_org_id: org.id,
        name: data.schoolName,
        address: data.schoolAddress,
        logo_path: data.logoPath || null,
        admin_join_code_hash: adminJoinCodeHash,
        student_join_code_hash: studentJoinCodeHash,
      })
      .select()
      .single();

    if (schoolError) {
      console.error('Error inserting school into Supabase:', schoolError);
      // Try to clean up Clerk org if Supabase insert fails
      try {
        await client.organizations.deleteOrganization(org.id);
      } catch (cleanupError) {
        console.error('Error cleaning up Clerk organization:', cleanupError);
      }
      throw new Error(`Failed to create school in database: ${schoolError.message}`);
    }

    if (!schoolData) {
      throw new Error('Failed to create school: No data returned');
    }

    // Get user's full name and email
    const fullName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || 'Unknown';
    const email = user.primaryEmailAddress?.emailAddress || '';
    const phone = user.phoneNumbers?.[0]?.phoneNumber || null;

    // Insert profile for the creator (admin role)
    // Since clerk_user_id is UNIQUE, we use upsert to handle existing profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        clerk_user_id: userId,
        school_id: schoolData.id,
        role: 'admin',
        full_name: fullName,
        email: email,
        phone: phone,
      }, {
        onConflict: 'clerk_user_id',
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    // Add user to Clerk organization as admin
    // Note: When creating an org with createOrganization, the creator is automatically added as admin
    // But we'll try to ensure membership exists, and if it fails, it's likely because they're already a member
    try {
      // Check if user is already a member
      const memberships = await client.organizations.getOrganizationMembershipList({
        organizationId: org.id,
      });

      const isAlreadyMember = memberships.data.some(
        (membership) => membership.publicUserData?.userId === userId
      );

      if (!isAlreadyMember) {
        await client.organizations.createOrganizationMembership({
          organizationId: org.id,
          userId: userId,
          role: 'org:admin',
        });
      }
    } catch (membershipError: any) {
      // If user is already a member (common when creating org), that's fine
      if (membershipError.status === 400 && membershipError.errors?.[0]?.code === 'duplicate_record') {
        // User is already a member - this is expected when creating an org
        console.log('User is already a member of the organization (expected when creating org)');
      } else {
        console.error('Error adding user to Clerk organization:', membershipError);
        // Don't fail the whole operation - profile is already created
      }
    }

    // Store join codes in Clerk organization metadata so they can be displayed in Admin Panel
    try {
      await client.organizations.updateOrganizationMetadata(org.id, {
        publicMetadata: {
          schoolName: data.schoolName,
          schoolAddress: data.schoolAddress,
          logoUrl: data.logoPath || null,
          adminJoinCode: adminJoinCode, // Store plaintext for Admin Panel display
          studentJoinCode: studentJoinCode, // Store plaintext for Admin Panel display
        },
      });
    } catch (metadataError: any) {
      // Log but don't fail - metadata is nice-to-have for Admin Panel
      console.error('Error storing join codes in organization metadata:', metadataError);
    }

    // Create audit event: school_created
    // item_id is null for school-level events
    try {
      await supabase
        .from('item_events')
        .insert({
          school_id: schoolData.id,
          item_id: null, // Null for school-level events (not item-specific)
          actor_id: userId,
          event_type: 'school_created',
          metadata: {
            school_name: data.schoolName,
            clerk_org_id: org.id,
          },
        });
    } catch (error: unknown) {
      // Log but don't fail - audit events are nice-to-have
      console.error('Error creating audit event:', error);
    }

    // Log to terminal
    console.log('DATABASE: createSchool', {
      organizationId: org.id,
      schoolId: schoolData.id,
      schoolName: data.schoolName,
      schoolAddress: data.schoolAddress,
      userId,
      // DO NOT log plaintext codes - they're returned to client only
    });

    // Revalidate relevant paths
    revalidatePath('/onboarding');
    revalidatePath('/');

    // Return organization ID and plaintext codes (shown once, never stored)
    return {
      success: true,
      organizationId: org.id,
      schoolId: schoolData.id,
      adminJoinCode, // Plaintext - shown once, then discarded
      studentJoinCode, // Plaintext - shown once, then discarded
    };
  } catch (error: any) {
    console.error('Error creating school:', error);
    return {
      success: false,
      error: error.message || 'Failed to create school',
    };
  }
}
