'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useOrganization } from '@clerk/nextjs';
import {
  listPendingItems,
  listArchivedItems,
  listPendingClaims,
  approveItem,
  archiveItem,
  approveClaim,
  denyClaim,
  markItemReturned,
  getItemAuditTimeline,
  getSchoolInfo,
  getSchoolAuditLog,
  getAdminStats,
} from '@/lib/admin/actions';
import { cn } from '@/lib/utils';

type AdminActionVariant = 'success' | 'danger' | 'amber';

const adminActionStyles: Record<AdminActionVariant, string> = {
  success:
    'bg-emerald-800/50 text-emerald-100 hover:bg-emerald-700/55 focus-visible:ring-emerald-500/60',
  danger:
    'bg-red-800/45 text-red-100 hover:bg-red-700/50 focus-visible:ring-red-500/60',
  amber:
    'bg-amber-800/40 text-amber-100 hover:bg-amber-700/45 focus-visible:ring-amber-500/60',
};

function AdminActionButton({
  variant,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: AdminActionVariant;
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4',
        'text-sm font-medium',
        'border border-white/[0.06]',
        'shadow-sm',
        'transition-all duration-150 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0c]',
        'disabled:pointer-events-none disabled:opacity-50',
        adminActionStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Pending Item type
interface PendingItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  color: string | null;
  location_found: string;
  date_found: string;
  photo_url: string | null;
  created_by: string;
  created_at: string;
}

// Claim Request type
interface ClaimRequest {
  id: string;
  item_id: string;
  item_title: string;
  item_category: string;
  claimant_id: string;
  message: string | null;
  proof_answers: Record<string, any>;
  created_at: string;
}

// Audit Event type
interface AuditEvent {
  id: string;
  event_type: string;
  actor_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

export default function AdminPage() {
  const { organization } = useOrganization();
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<PendingItem[]>([]);
  const [claimRequests, setClaimRequests] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [archivedError, setArchivedError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'archived' | 'claims' | 'settings'>('items');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [auditTimeline, setAuditTimeline] = useState<AuditEvent[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [processingItem, setProcessingItem] = useState<string | null>(null);
  const [processingClaim, setProcessingClaim] = useState<string | null>(null);
  
  // School Settings state
  const [schoolInfo, setSchoolInfo] = useState<{
    id: string;
    name: string;
    address: string | null;
    logo_path: string | null;
    logo_url: string | null;
    created_at: string;
  } | null>(null);
  const [auditLog, setAuditLog] = useState<Array<{
    id: string;
    event_type: string;
    actor_id: string;
    item_id: string | null;
    metadata: Record<string, any>;
    created_at: string;
    item_title: string | null;
  }>>([]);
  const [loadingSchoolInfo, setLoadingSchoolInfo] = useState(false);
  const [loadingAuditLog, setLoadingAuditLog] = useState(false);
  const [adminStats, setAdminStats] = useState({
    approvedToday: 0,
    totalItems: 0,
    archivedCount: 0,
  });
  
  // Get join codes from organization metadata
  const metadata = organization?.publicMetadata as {
    adminJoinCode?: string;
    studentJoinCode?: string;
  } | undefined;
  const adminJoinCode = metadata?.adminJoinCode;
  const studentJoinCode = metadata?.studentJoinCode;

  // Fetch pending items, claims, and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      let shouldAutoSeed = false;

      try {
        const [itemsResult, claimsResult, statsResult] = await Promise.all([
          listPendingItems(),
          listPendingClaims(),
          getAdminStats(),
        ]);

        if (itemsResult.success) {
          setPendingItems(itemsResult.items);
        } else {
          setError(itemsResult.error);
        }

        if (claimsResult.success) {
          setClaimRequests(claimsResult.claims);
        } else if (!itemsResult.success) {
          // Only set error if items also failed
          setError(claimsResult.error);
        }

        if (statsResult.success) {
          setAdminStats(statsResult.stats);
          shouldAutoSeed = statsResult.stats.totalItems === 0;
        }
      } catch (err: any) {
        console.error('Error fetching admin data:', err);
        setError(err.message || 'Failed to load admin data.');
      } finally {
        setLoading(false);
      }

      // Don’t block first paint: seed + refresh runs after the admin UI is interactive
      if (shouldAutoSeed) {
        void (async () => {
          try {
            const seedResponse = await fetch('/api/seed-filler-items');
            const seedData = await seedResponse.json();
            if (seedData.success && seedData.totalSeeded > 0) {
              const [refreshItemsResult, refreshStatsResult] = await Promise.all([
                listPendingItems(),
                getAdminStats(),
              ]);
              if (refreshItemsResult.success) {
                setPendingItems(refreshItemsResult.items);
              }
              if (refreshStatsResult.success) {
                setAdminStats(refreshStatsResult.stats);
              }
            }
          } catch (seedError) {
            console.error('[AdminPage] Error auto-seeding items:', seedError);
          }
        })();
      }
    };

    fetchData();
  }, []);

  // Fetch audit timeline when item is selected
  useEffect(() => {
    if (!selectedItemId) {
      setAuditTimeline([]);
      return;
    }

    const fetchAudit = async () => {
      setLoadingAudit(true);
      try {
        const result = await getItemAuditTimeline(selectedItemId);
        if (result.success) {
          setAuditTimeline(result.events);
        }
      } catch (err) {
        console.error('Error fetching audit timeline:', err);
      } finally {
        setLoadingAudit(false);
      }
    };

    fetchAudit();
  }, [selectedItemId]);

  // Fetch school info and audit log when settings tab is active
  useEffect(() => {
    if (activeTab !== 'settings') return;

    const fetchSchoolData = async () => {
      setLoadingSchoolInfo(true);
      setLoadingAuditLog(true);

      try {
        const [schoolResult, auditResult] = await Promise.all([
          getSchoolInfo(),
          getSchoolAuditLog(100),
        ]);

        if (schoolResult.success) {
          setSchoolInfo(schoolResult.school);
        }

        if (auditResult.success) {
          setAuditLog(auditResult.events);
        }
      } catch (err) {
        console.error('Error fetching school data:', err);
      } finally {
        setLoadingSchoolInfo(false);
        setLoadingAuditLog(false);
      }
    };

    fetchSchoolData();
  }, [activeTab]);

  const handleApprove = async (itemId: string) => {
    setProcessingItem(itemId);
    try {
      const result = await approveItem(itemId);
      if (result.success) {
      setPendingItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error approving item:', error);
      alert(`Error: ${error.message || 'Failed to approve item'}`);
    } finally {
      setProcessingItem(null);
    }
  };

  const handleArchive = async (itemId: string) => {
    setProcessingItem(itemId);
    try {
      const result = await archiveItem(itemId);
      if (result.success) {
      setPendingItems(prev => prev.filter(item => item.id !== itemId));
      setAdminStats((prev) => ({ ...prev, archivedCount: prev.archivedCount + 1 }));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error archiving item:', error);
      alert(`Error: ${error.message || 'Failed to archive item'}`);
    } finally {
      setProcessingItem(null);
    }
  };

  const handleMarkReturned = async (itemId: string, archive: boolean) => {
    setProcessingItem(itemId);
    try {
      const result = await markItemReturned(itemId, archive);
      if (result.success) {
        setPendingItems(prev => prev.filter(item => item.id !== itemId));
        if (archive) {
          setAdminStats((prev) => ({ ...prev, archivedCount: prev.archivedCount + 1 }));
        }
        alert(`✅ Item marked as returned${archive ? ' and archived' : ''}.`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error marking item as returned:', error);
      alert(`Error: ${error.message || 'Failed to mark item as returned'}`);
    } finally {
      setProcessingItem(null);
    }
  };

  const handleApproveClaim = async (claimId: string) => {
    setProcessingClaim(claimId);
    try {
      const result = await approveClaim(claimId);
      if (result.success) {
      setClaimRequests(prev => prev.filter(claim => claim.id !== claimId));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error approving claim:', error);
      alert(`Error: ${error.message || 'Failed to approve claim'}`);
    } finally {
      setProcessingClaim(null);
    }
  };

  const handleDenyClaim = async (claimId: string) => {
    setProcessingClaim(claimId);
    try {
      const result = await denyClaim(claimId);
      if (result.success) {
      setClaimRequests(prev => prev.filter(claim => claim.id !== claimId));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error denying claim:', error);
      alert(`Error: ${error.message || 'Failed to deny claim'}`);
    } finally {
      setProcessingClaim(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="px-6 py-16">
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              <div className="text-center py-20">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl -z-10"></div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Loading Admin Panel</h3>
                    <p className="text-gray-400">Fetching pending items...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 py-16">
          <div className="flex justify-center">
            <div className="w-full max-w-7xl">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-red-300 mb-2">Error Loading Admin Panel</h3>
                <p className="text-red-200">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-300 text-sm font-medium transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-4 sm:px-6 py-8 sm:py-16">
        {/* Enhanced Header */}
        <div className="mb-8 sm:mb-16 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl -z-10"></div>
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
                Admin Panel
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-4">
              Monitor and approve lost item reports before they go live on the platform
            </p>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Pending Items</h3>
                </div>
                <div className="text-3xl font-bold text-white">{pendingItems.length}</div>
                <div className="text-sm text-gray-400">Items awaiting approval</div>
              </div>
              
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Claim Requests</h3>
                </div>
                <div className="text-3xl font-bold text-white">{claimRequests.length}</div>
                <div className="text-sm text-gray-400">Awaiting review</div>
              </div>
              
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Approved Today</h3>
                </div>
                <div className="text-3xl font-bold text-white">{adminStats.approvedToday}</div>
                <div className="text-sm text-gray-400">Items approved</div>
              </div>

              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-.01M5 8a2 2 0 110-.01M12 8v9m-4-4h8m-8 0a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v5a2 2 0 01-2 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Archived</h3>
                </div>
                <div className="text-3xl font-bold text-white">{adminStats.archivedCount}</div>
                <div className="text-sm text-gray-400">Removed from active list</div>
              </div>
              
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Total Items</h3>
                </div>
                <div className="text-3xl font-bold text-white">{adminStats.totalItems}</div>
                <div className="text-sm text-gray-400">In system</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="w-full max-w-7xl">
            <div className="flex flex-wrap gap-2 sm:gap-4 border-b border-zinc-700/30 overflow-x-auto">
              <button
                onClick={() => setActiveTab('items')}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all whitespace-nowrap ${
                  activeTab === 'items'
                    ? 'text-white border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Pending Items ({pendingItems.length})
              </button>
              <button
                onClick={() => setActiveTab('archived')}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all whitespace-nowrap ${
                  activeTab === 'archived'
                    ? 'text-white border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Archived ({adminStats.archivedCount})
              </button>
              <button
                onClick={() => setActiveTab('claims')}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all whitespace-nowrap ${
                  activeTab === 'claims'
                    ? 'text-white border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Claim Requests ({claimRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition-all whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'text-white border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                School Settings
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex justify-center">
          <div className="w-full max-w-7xl">
            {activeTab === 'items' ? (
              pendingItems.length === 0 ? (
              <div className="text-center py-20">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 blur-3xl -z-10"></div>
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">All Caught Up!</h3>
                    <p className="text-xl text-gray-400 max-w-md mx-auto leading-relaxed">
                      No pending items to review. Great job keeping the system up to date!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Pending Reviews</h2>
                    <p className="text-gray-400">Items awaiting your approval</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4 sm:p-6 backdrop-blur-md shadow-2xl">
                      <Link
                        href={`/items/${item.id}?from=admin`}
                        className={cn(
                          'group/item-detail block rounded-xl p-2 -m-2 mb-4',
                          'transition-colors duration-200',
                          'hover:bg-zinc-700/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full border border-orange-500/30">
                            {item.category}
                          </span>
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                            Pending
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover/item-detail:text-purple-100 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-gray-300 mb-4 leading-relaxed">{item.description || 'No description'}</p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <svg className="w-4 h-4 shrink-0 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{item.location_found}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <svg className="w-4 h-4 shrink-0 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{new Date(item.date_found).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {item.color && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            <span className="px-3 py-1 bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 text-gray-300 text-xs font-medium rounded-md border border-zinc-600/30">
                              Color: {item.color}
                            </span>
                          </div>
                        )}

                        {item.photo_url && (
                          <div>
                            <img src={item.photo_url} alt={item.title} className="w-full h-48 object-cover rounded-lg" />
                          </div>
                        )}
                      </Link>

                      {/* Audit Timeline Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                        className="mb-4 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {selectedItemId === item.id ? 'Hide' : 'Show'} Audit Timeline
                      </button>

                      {/* Audit Timeline */}
                      {selectedItemId === item.id && (
                        <div className="mb-4 bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/30">
                          {loadingAudit ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                              Loading timeline...
                            </div>
                          ) : auditTimeline.length > 0 ? (
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-white mb-2">Audit Timeline</h4>
                              {auditTimeline.map((event) => (
                                <div key={event.id} className="text-xs text-gray-400 border-l-2 border-purple-500/30 pl-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-purple-400">{event.event_type}</span>
                                    <span className="text-gray-500">
                                      {new Date(event.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  {Object.keys(event.metadata).length > 0 && (
                                    <div className="text-gray-500 mt-1">
                                      {JSON.stringify(event.metadata, null, 2)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">No events found</p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t border-zinc-700/30">
                        <AdminActionButton
                          variant="success"
                          className="flex-1 min-w-0"
                          onClick={() => handleApprove(item.id)}
                          disabled={processingItem === item.id}
                        >
                          {processingItem === item.id ? (
                            <div className="h-4 w-4 shrink-0 rounded-full border-2 border-emerald-200/90 border-t-transparent animate-spin" />
                          ) : (
                            <>
                              <svg className="h-4 w-4 shrink-0 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </>
                          )}
                        </AdminActionButton>
                        <AdminActionButton
                          variant="amber"
                          className="flex-1 min-w-0"
                          onClick={() => {
                            if (confirm('Mark as returned and archive this item?')) {
                              handleMarkReturned(item.id, true);
                            }
                          }}
                          disabled={processingItem === item.id}
                        >
                          {processingItem === item.id ? (
                            <div className="h-4 w-4 shrink-0 rounded-full border-2 border-amber-200/90 border-t-transparent animate-spin" />
                          ) : (
                            <>
                              <svg className="h-4 w-4 shrink-0 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                              Archived
                            </>
                          )}
                        </AdminActionButton>
                        <AdminActionButton
                          variant="danger"
                          className="flex-1 min-w-0"
                          onClick={() => handleArchive(item.id)}
                          disabled={processingItem === item.id}
                        >
                          {processingItem === item.id ? (
                            <div className="h-4 w-4 shrink-0 rounded-full border-2 border-red-200/90 border-t-transparent animate-spin" />
                          ) : (
                            <>
                              <svg className="h-4 w-4 shrink-0 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Rejected
                            </>
                          )}
                        </AdminActionButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
            ) : activeTab === 'archived' ? (
              loadingArchived ? (
                <div className="text-center py-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 blur-3xl -z-10"></div>
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/25">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-4">Loading archived items…</h3>
                    </div>
                  </div>
                </div>
              ) : archivedError ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-red-300 mb-2">Could not load archived items</h3>
                  <p className="text-red-200">{archivedError}</p>
                  <button
                    type="button"
                    onClick={async () => {
                      setLoadingArchived(true);
                      setArchivedError(null);
                      try {
                        const result = await listArchivedItems();
                        if (result.success) {
                          setArchivedItems(result.items);
                        } else {
                          setArchivedError(result.error);
                        }
                      } catch (err: any) {
                        setArchivedError(err.message || 'Failed to load archived items.');
                      } finally {
                        setLoadingArchived(false);
                      }
                    }}
                    className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-red-300 text-sm font-medium transition-all"
                  >
                    Retry
                  </button>
                </div>
              ) : archivedItems.length === 0 ? (
                <div className="text-center py-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 blur-3xl -z-10"></div>
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/25">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-.01M5 8a2 2 0 110-.01M12 8v9m-4-4h8m-8 0a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v5a2 2 0 01-2 2" />
                        </svg>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">No archived items</h3>
                      <p className="text-xl text-gray-400 max-w-md mx-auto leading-relaxed">
                        Items you archive from pending reviews will appear here.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-.01M5 8a2 2 0 110-.01M12 8v9m-4-4h8m-8 0a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v5a2 2 0 01-2 2" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Archived items</h2>
                      <p className="text-gray-400">No longer shown in the public browse list</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {archivedItems.map((item) => (
                      <div key={item.id} className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4 sm:p-6 backdrop-blur-md shadow-2xl">
                        <Link
                          href={`/items/${item.id}?from=admin`}
                          className={cn(
                            'group/item-detail block rounded-xl p-2 -m-2 mb-4',
                            'transition-colors duration-200',
                            'hover:bg-zinc-700/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full border border-orange-500/30">
                              {item.category}
                            </span>
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-medium rounded-full border border-amber-500/30">
                              Archived
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2 group-hover/item-detail:text-purple-100 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-gray-300 mb-4 leading-relaxed">{item.description || 'No description'}</p>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <svg className="w-4 h-4 shrink-0 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">{item.location_found}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <svg className="w-4 h-4 shrink-0 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{new Date(item.date_found).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {item.color && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="px-3 py-1 bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 text-gray-300 text-xs font-medium rounded-md border border-zinc-600/30">
                                Color: {item.color}
                              </span>
                            </div>
                          )}

                          {item.photo_url && (
                            <div>
                              <img src={item.photo_url} alt={item.title} className="w-full h-48 object-cover rounded-lg" />
                            </div>
                          )}
                        </Link>

                        <button
                          type="button"
                          onClick={() => setSelectedItemId(selectedItemId === item.id ? null : item.id)}
                          className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {selectedItemId === item.id ? 'Hide' : 'Show'} Audit Timeline
                        </button>

                        {selectedItemId === item.id && (
                          <div className="mt-4 bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/30">
                            {loadingAudit ? (
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                Loading timeline...
                              </div>
                            ) : auditTimeline.length > 0 ? (
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-white mb-2">Audit Timeline</h4>
                                {auditTimeline.map((event) => (
                                  <div key={event.id} className="text-xs text-gray-400 border-l-2 border-purple-500/30 pl-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-purple-400">{event.event_type}</span>
                                      <span className="text-gray-500">
                                        {new Date(event.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                    {Object.keys(event.metadata).length > 0 && (
                                      <div className="text-gray-500 mt-1">
                                        {JSON.stringify(event.metadata, null, 2)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">No events found</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : activeTab === 'claims' ? (
              claimRequests.length === 0 ? (
                <div className="text-center py-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 blur-3xl -z-10"></div>
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">No Claim Requests</h3>
                      <p className="text-xl text-gray-400 max-w-md mx-auto leading-relaxed">
                        All claim requests have been reviewed. Great job!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Claim Requests</h2>
                      <p className="text-gray-400">Review and approve item claims</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {claimRequests.map((claim) => (
                      <div key={claim.id} className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-4 sm:p-6 backdrop-blur-md shadow-2xl">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                                {claim.item_category}
                              </span>
                              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                                Pending Review
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">{claim.item_title}</h3>
                            
                            <div className="space-y-3 mb-4">
                              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-700/30">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span className="text-sm font-medium text-gray-300">Claimant Information</span>
                                </div>
                                <div className="space-y-1 text-sm text-gray-400">
                                  {claim.proof_answers.name && (
                                    <p><span className="text-gray-300">Name:</span> {claim.proof_answers.name}</p>
                                  )}
                                  {claim.proof_answers.email && (
                                    <p><span className="text-gray-300">Email:</span> {claim.proof_answers.email}</p>
                                  )}
                                  {claim.proof_answers.phone && (
                                    <p><span className="text-gray-300">Phone:</span> {claim.proof_answers.phone}</p>
                                  )}
                                </div>
                              </div>

                              {claim.message && (
                                <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-700/30">
                                  <div className="text-sm font-medium text-gray-300 mb-1">Message:</div>
                                  <p className="text-sm text-gray-400">{claim.message}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Submitted {new Date(claim.created_at).toLocaleDateString()} at {new Date(claim.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2.5 pt-4 border-t border-zinc-700/30">
                          <AdminActionButton
                            variant="success"
                            className="flex-1 min-w-0"
                            onClick={() => handleApproveClaim(claim.id)}
                            disabled={processingClaim === claim.id}
                          >
                            {processingClaim === claim.id ? (
                              <div className="h-4 w-4 shrink-0 rounded-full border-2 border-emerald-200/90 border-t-transparent animate-spin" />
                            ) : (
                              <>
                                <svg className="h-4 w-4 shrink-0 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve Claim
                              </>
                            )}
                          </AdminActionButton>
                          <AdminActionButton
                            variant="danger"
                            className="flex-1 min-w-0"
                            onClick={() => handleDenyClaim(claim.id)}
                            disabled={processingClaim === claim.id}
                          >
                            {processingClaim === claim.id ? (
                              <div className="h-4 w-4 shrink-0 rounded-full border-2 border-red-200/90 border-t-transparent animate-spin" />
                            ) : (
                              <>
                                <svg className="h-4 w-4 shrink-0 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Deny Claim
                              </>
                            )}
                          </AdminActionButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : activeTab === 'settings' ? (
              // School Settings Tab
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">School Settings</h2>
                    <p className="text-gray-400">View and manage your school information</p>
                  </div>
                </div>

                {/* Join Codes Section */}
                {(adminJoinCode || studentJoinCode) && (
                  <div className="mb-6 sm:mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {adminJoinCode && (
                        <div className="bg-zinc-900/50 border border-zinc-700/30 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
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
                          <p className="text-lg sm:text-xl font-bold font-mono mb-2 tracking-wider text-center" style={{ color: '#c084fc' }}>
                            {adminJoinCode ? String(adminJoinCode) : 'Not available'}
                          </p>
                          <p className="text-xs text-gray-400 text-center">Share this code to add other administrators</p>
                        </div>
                      )}
                      
                      {studentJoinCode && (
                        <div className="bg-zinc-900/50 border border-zinc-700/30 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
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
                          <p className="text-lg sm:text-xl font-bold font-mono mb-2 tracking-wider text-center" style={{ color: '#93c5fd' }}>
                            {studentJoinCode ? String(studentJoinCode) : 'Not available'}
                          </p>
                          <p className="text-xs text-gray-400 text-center">Share this code to add students</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* School Information */}
                <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md">
                  <h3 className="text-xl font-semibold text-white mb-6">School Information</h3>
                  
                  {loadingSchoolInfo ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : schoolInfo ? (
                    <div className="space-y-6">
                      {/* Logo */}
                      {schoolInfo.logo_url && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
                          <div className="w-32 h-32 bg-zinc-900/50 rounded-lg border border-zinc-700/30 overflow-hidden">
                            <img 
                              src={schoolInfo.logo_url} 
                              alt={`${schoolInfo.name} logo`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* School Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">School Name</label>
                        <div className="bg-zinc-900/50 border border-zinc-700/30 rounded-lg px-4 py-3 text-white">
                          {schoolInfo.name}
                        </div>
                      </div>

                      {/* Address */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                        <div className="bg-zinc-900/50 border border-zinc-700/30 rounded-lg px-4 py-3 text-white">
                          {schoolInfo.address || <span className="text-gray-500 italic">No address provided</span>}
                        </div>
                      </div>

                      {/* Created Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Created</label>
                        <div className="bg-zinc-900/50 border border-zinc-700/30 rounded-lg px-4 py-3 text-white">
                          {new Date(schoolInfo.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      Failed to load school information
                    </div>
                  )}
                </div>

                {/* Audit Log */}
                <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">Audit Log</h3>
                    <span className="text-sm text-gray-400">{auditLog.length} events</span>
                  </div>
                  
                  {loadingAuditLog ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : auditLog.length > 0 ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {auditLog.map((event) => (
                        <div 
                          key={event.id} 
                          className="bg-zinc-900/50 border border-zinc-700/30 rounded-lg p-4 hover:bg-zinc-900/70 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  event.event_type === 'approved' || event.event_type === 'claim_approved'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : event.event_type === 'archived' || event.event_type === 'claim_denied'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : event.event_type === 'returned'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : event.event_type === 'item_reported' || event.event_type === 'claim_submitted'
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                }`}>
                                  {event.event_type.replace(/_/g, ' ').toUpperCase()}
                                </span>
                                {event.item_title && (
                                  <span className="text-sm text-gray-300 font-medium">
                                    Item: {event.item_title}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400 mb-2">
                                <span className="text-gray-300">Actor:</span> {event.actor_id.substring(0, 8)}...
                              </div>
                              {Object.keys(event.metadata).length > 0 && (
                                <div className="text-xs text-gray-500 bg-zinc-800/50 rounded p-2 mt-2 font-mono">
                                  {JSON.stringify(event.metadata, null, 2)}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 whitespace-nowrap">
                              {new Date(event.created_at).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No audit events found
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
