'use client';

import { useUser, useOrganization, useOrganizationList } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { createSchool, joinSchool } from '@/lib/schools/actions';

/**
 * Onboarding Page
 * 
 * This page is shown to users who have signed in but are not yet part of an organization.
 * Users must create or join a school organization to continue using the application.
 * 
 * Features:
 * - Two tabs: "Create School" and "Join School"
 * - Form validation with inline error messages
 * - Success states with redirect
 * - Pre-filled user information from Clerk
 */
export default function OnboardingPage() {
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { setActive, createOrganization, isLoaded: orgListLoaded } = useOrganizationList();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [adminJoinCode, setAdminJoinCode] = useState<string | null>(null);
  const [studentJoinCode, setStudentJoinCode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Create School Form
  const [createForm, setCreateForm] = useState({
    schoolName: '',
    schoolAddress: '',
    schoolLogo: null as File | null,
  });

  // Join School Form
  const [joinForm, setJoinForm] = useState({
    joinCode: '',
    fullName: '',
    phone: '',
  });

  // Prefill form when user data loads
  useEffect(() => {
    if (user) {
      setJoinForm(prev => ({
        ...prev,
        fullName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.lastName || prev.fullName,
        phone: user.phoneNumbers?.[0]?.phoneNumber || prev.phone,
      }));
    }
  }, [user]);

  // Redirect if user is not signed in
  useEffect(() => {
    if (userLoaded && !user) {
      router.push('/sign-in');
    }
  }, [user, userLoaded, router]);

  // Redirect if user is already in an organization
  // BUT: Don't redirect if we just created an org and are showing success page
  useEffect(() => {
    if (userLoaded && orgLoaded && organization && !success) {
      router.push('/');
    }
  }, [organization, userLoaded, orgLoaded, router, success]);

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    if (!createForm.schoolName.trim()) {
      setErrors({ schoolName: 'School name is required' });
      return;
    }
    if (!createForm.schoolAddress.trim()) {
      setErrors({ schoolAddress: 'School address is required' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload logo first if provided
      let logoPath: string | null = null;
      if (createForm.schoolLogo) {
        try {
          const logoFormData = new FormData();
          logoFormData.append('logo', createForm.schoolLogo);

          const uploadResponse = await fetch('/api/upload/logo', {
            method: 'POST',
            body: logoFormData,
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            // Extract path from URL (e.g., /uploads/logos/file.jpg -> uploads/logos/file.jpg)
            logoPath = uploadResult.url.startsWith('/') 
              ? uploadResult.url.substring(1) 
              : uploadResult.url;
          } else {
            const error = await uploadResponse.json();
            console.warn('Logo upload failed:', error);
            // Continue without logo - don't block organization creation
          }
        } catch (uploadError) {
          console.warn('Error uploading logo:', uploadError);
          // Continue without logo - don't block organization creation
        }
      }

      // Call server action to create school
      const result = await createSchool({
        schoolName: createForm.schoolName.trim(),
        schoolAddress: createForm.schoolAddress.trim(),
        logoPath: logoPath,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create school');
      }

      // Store join codes and set success FIRST to prevent redirect
      // These are the plaintext codes returned from the server action
      // They are shown once and never stored
      console.log('Join codes received:', { 
        adminJoinCode: result.adminJoinCode, 
        studentJoinCode: result.studentJoinCode 
      });
      setAdminJoinCode(result.adminJoinCode || null);
      setStudentJoinCode(result.studentJoinCode || null);
      setSuccess(true);

      // Set the new organization as active
      if (setActive && result.organizationId) {
        await setActive({ organization: result.organizationId });
      }

      // Give user time to see and copy the join codes before redirecting
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 5000);
    } catch (error: any) {
      console.error('Error creating school:', error);
      setErrors({ submit: error.message || 'Failed to create school. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    if (!joinForm.joinCode.trim()) {
      setErrors({ joinCode: 'Join code is required' });
      return;
    }
    if (!joinForm.fullName.trim()) {
      setErrors({ fullName: 'Full name is required' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call server action to join school
      // Email is automatically retrieved from Clerk user in the server action
      const result = await joinSchool({
        joinCode: joinForm.joinCode.trim().toUpperCase(),
        fullName: joinForm.fullName.trim(),
        phone: joinForm.phone.trim() || null,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to join school');
      }

      // Set the joined organization as active
      if (setActive && result.organizationId) {
        await setActive({ organization: result.organizationId });
      }

      // Small delay to ensure organization context is updated
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to home (middleware will handle role-based access)
      router.push('/');
      router.refresh(); // Force refresh to update organization context
    } catch (error: any) {
      console.error('Error joining school:', error);
      setErrors({ submit: error.message || 'Invalid join code. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userLoaded || !orgLoaded || !orgListLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (success && adminJoinCode && studentJoinCode) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full mx-4">
          {/* Prominent Success Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 blur-3xl -z-10"></div>
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              School Created Successfully!
            </h2>
            <p className="text-lg text-gray-300 mb-2">You&apos;ve been automatically added as an administrator.</p>
            <p className="text-sm text-gray-500 mb-8">You don&apos;t need a join code - you&apos;re already in!</p>
          </div>

          {/* Important Notice */}
          <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border-2 border-yellow-500/50 rounded-xl p-6 mb-8 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-yellow-200 mb-2">⚠️ Save These Join Codes Now!</h3>
                <p className="text-yellow-100/90 leading-relaxed mb-2">
                  These codes are <strong>only shown once</strong>. Copy them now or find them later in the <strong className="text-yellow-200">Admin Panel</strong>.
                </p>
                <p className="text-sm text-yellow-200/80">
                  📍 <strong>Where to find them later:</strong> Go to <strong>Admin Panel</strong> → Look for the &quot;School Join Codes&quot; section at the top
                </p>
                <p className="text-xs text-yellow-200/70 mt-3 pt-3 border-t border-yellow-500/30">
                  💡 <strong>Tip:</strong> These codes are always available in the Admin Panel at any time
                </p>
              </div>
            </div>
          </div>

          {/* Join Codes - Matching Admin Panel Style */}
          <div className="flex justify-center mb-8">
            <div className="w-full max-w-7xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-3 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center rounded-md bg-purple-400/20 px-2 py-0.5 text-xs font-bold text-purple-300 ring-1 ring-inset ring-purple-400/30">
                  ADMIN JOIN CODE
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(adminJoinCode);
                    alert('✅ Admin join code copied to clipboard!');
                  }}
                  className="px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded text-purple-300 text-xs font-medium transition-all"
                  title="Copy to clipboard"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-xl font-bold font-mono mb-1 tracking-wider text-center" style={{ color: '#c084fc' }}>
                {adminJoinCode ? String(adminJoinCode) : 'Not available'}
              </p>
              <p className="text-xs text-gray-400 text-center">Share this code to add other administrators</p>
            </div>

            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-3 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center rounded-md bg-blue-400/20 px-2 py-0.5 text-xs font-bold text-blue-300 ring-1 ring-inset ring-blue-400/30">
                  STUDENT JOIN CODE
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(studentJoinCode);
                    alert('✅ Student join code copied to clipboard!');
                  }}
                  className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded text-blue-300 text-xs font-medium transition-all"
                  title="Copy to clipboard"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-xl font-bold font-mono mb-1 tracking-wider text-center" style={{ color: '#93c5fd' }}>
                {studentJoinCode ? String(studentJoinCode) : 'Not available'}
              </p>
              <p className="text-xs text-gray-400 text-center">Share this code to add students</p>
            </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-6">
              ⏱️ Redirecting to home in <strong className="text-white">5 seconds</strong>...
            </p>
            <Button
              variant="solid"
              size="lg"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
              className="w-full"
            >
              Continue to Home Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
                Welcome to Reclaim
              </span>
            </h1>
            <p className="text-xl text-gray-400">
              Get started by creating or joining a school organization
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setActiveTab('create');
                setErrors({});
              }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'create'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Create School
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('join');
                setErrors({});
              }}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'join'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Join School
            </button>
          </div>

          {/* Create School Form */}
          {activeTab === 'create' && (
            <Card>
              <form onSubmit={handleCreateSchool} className="p-8 space-y-6">
                <div className="space-y-4">
                  <Input
                    label="School Name *"
                    value={createForm.schoolName}
                    onChange={(e) => setCreateForm({ ...createForm, schoolName: e.target.value })}
                    error={errors.schoolName}
                    placeholder="Enter school name"
                    required
                  />

                  <Textarea
                    label="School Address *"
                    value={createForm.schoolAddress}
                    onChange={(e) => setCreateForm({ ...createForm, schoolAddress: e.target.value })}
                    error={errors.schoolAddress}
                    placeholder="Enter full school address (e.g., 123 Main St, City, State 12345)"
                    required
                    rows={3}
                  />

                  <div className="space-y-2">
                    <label className="text-foreground text-sm font-medium">
                      School Logo (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCreateForm({ ...createForm, schoolLogo: e.target.files?.[0] || null })}
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-500 file:text-white hover:file:bg-purple-600 cursor-pointer"
                    />
                  </div>
                </div>

                {errors.submit && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-500">{errors.submit}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="solid"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating School...' : 'Create School'}
                </Button>
              </form>
            </Card>
          )}

          {/* Join School Form */}
          {activeTab === 'join' && (
            <Card>
              <form onSubmit={handleJoinSchool} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-foreground text-sm font-medium mb-2 block">
                      Join Code *
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Enter either the <span className="text-purple-400 font-medium">Admin Join Code</span> or <span className="text-blue-400 font-medium">Student Join Code</span> provided by your school administrator.
                    </p>
                    <Input
                      value={joinForm.joinCode}
                      onChange={(e) => setJoinForm({ ...joinForm, joinCode: e.target.value.toUpperCase() })}
                      error={errors.joinCode}
                      placeholder="Enter admin or student join code"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      <span className="text-purple-400">Admin code</span> grants administrator access. <span className="text-blue-400">Student code</span> grants student access.
                    </p>
                  </div>

                  <Input
                    label="Full Name *"
                    value={joinForm.fullName}
                    onChange={(e) => setJoinForm({ ...joinForm, fullName: e.target.value })}
                    error={errors.fullName}
                    placeholder={user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.firstName || user?.lastName || 'Enter your full name'}
                    required
                  />

                  <Input
                    label="Phone (Optional)"
                    value={joinForm.phone}
                    onChange={(e) => setJoinForm({ ...joinForm, phone: e.target.value })}
                    error={errors.phone}
                    placeholder={user?.phoneNumbers?.[0]?.phoneNumber || 'Enter your phone number'}
                    type="tel"
                  />

                  <p className="text-xs text-gray-500">
                    Email: <span className="text-gray-400">{user?.primaryEmailAddress?.emailAddress || 'Not available'}</span>
                    <br />
                    <span className="text-gray-600">Your email is automatically retrieved from your account.</span>
                  </p>
                </div>

                {errors.submit && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-500">{errors.submit}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="solid"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Joining School...' : 'Join School'}
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
