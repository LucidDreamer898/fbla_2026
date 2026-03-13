'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useOrganizationList } from '@clerk/nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';

/**
 * School Selection Component
 * 
 * Shown after sign-up to let users either:
 * 1. Create a new school organization
 * 2. Join an existing school with a code
 */
export function SchoolSelection() {
  const { user } = useUser();
  const { setActive } = useOrganizationList();
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
  });

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
      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: createForm.schoolName,
          schoolAddress: createForm.schoolAddress,
          adminFullName: user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user?.firstName || user?.lastName || '',
          adminEmail: user?.primaryEmailAddress?.emailAddress || '',
          adminPhone: user?.phoneNumbers?.[0]?.phoneNumber || '',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create school');
      }

      const result = await response.json();
      const { organizationId, adminJoinCode: adminCode, studentJoinCode: studentCode } = result;

      // Set the created organization as active
      if (setActive && organizationId) {
        await setActive({ organization: organizationId });
      }

      setAdminJoinCode(adminCode);
      setStudentJoinCode(studentCode);
      setSuccess(true);
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

    if (!joinForm.joinCode.trim()) {
      setErrors({ joinCode: 'Join code is required' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/organizations/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinCode: joinForm.joinCode.trim().toUpperCase(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join school');
      }

      const result = await response.json();
      const { organizationId, role } = result;

      // Set the joined organization as active
      if (setActive && organizationId) {
        await setActive({ organization: organizationId });
      }

      // Log the role assignment for verification
      console.log('DATABASE: User joined organization', {
        organizationId,
        role,
        userId: user?.id,
      });

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

  if (success && adminJoinCode && studentJoinCode) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">School Created!</h2>
            <p className="text-gray-400 mb-6">Your school has been created successfully.</p>
            
            <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Admin</span>
                <span className="text-sm text-gray-400 font-medium">Join Code</span>
              </div>
              <p className="text-2xl font-bold text-purple-400 font-mono mb-2">{adminJoinCode}</p>
              <p className="text-xs text-gray-500">Use this code to add other administrators to your school</p>
            </div>

            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Student</span>
                <span className="text-sm text-gray-400 font-medium">Join Code</span>
              </div>
              <p className="text-2xl font-bold text-blue-400 font-mono mb-2">{studentJoinCode}</p>
              <p className="text-xs text-gray-500">Use this code to add students to your school</p>
            </div>
            
            <p className="text-xs text-gray-500 mb-6">Save these codes - you&apos;ll need them to invite others</p>
            
            <Button
              variant="solid"
              size="lg"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Continue to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
      <div className="mx-auto max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
              Complete Your Setup
            </span>
          </h1>
          <p className="text-xl text-gray-400">
            Create or join a school organization to get started
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
                <Input
                  label="Join Code *"
                  value={joinForm.joinCode}
                  onChange={(e) => setJoinForm({ joinCode: e.target.value.toUpperCase() })}
                  error={errors.joinCode}
                  placeholder="Enter school join code"
                  required
                />
                <p className="text-sm text-gray-400">
                  Ask your school administrator for the join code to join an existing school organization.
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
  );
}
