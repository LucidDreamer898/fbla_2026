'use client';

import React, { useState, useEffect } from 'react';
import { FirestoreItem } from '@/types/item';

// TODO: Implement with your database solution
const adminApproveItem = async (itemId: string, adminNotes?: string) => {
  // TODO: Replace with actual database call
  console.log('Approve item:', itemId, adminNotes);
  throw new Error('Database integration not implemented');
};

const adminRejectItem = async (itemId: string, adminNotes?: string) => {
  // TODO: Replace with actual database call
  console.log('Reject item:', itemId, adminNotes);
  throw new Error('Database integration not implemented');
};

export default function AdminPage() {
  const [pendingItems, setPendingItems] = useState<FirestoreItem[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Simulate loading
    const mockItems: FirestoreItem[] = [
      {
        id: '1',
        title: 'Test Item 1',
        description: 'This is a test item submitted from the form',
        category: 'Electronics',
        location: 'Test Location',
        dateFound: { toDate: () => new Date() } as { toDate: () => Date },
        status: 'pending',
        photos: [],
        reportedBy: 'anonymous',
        createdAt: { toDate: () => new Date() } as { toDate: () => Date },
        updatedAt: { toDate: () => new Date() } as { toDate: () => Date },
        tags: ['test', 'demo'],
      },
    ];
    setTimeout(() => {
      setPendingItems(mockItems);
      setLoading(false);
    }, 1000);
  }, []);

  const handleApprove = async (itemId: string) => {
    try {
      await adminApproveItem(itemId, 'Approved for demo');
      setPendingItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error approving item:', error);
    }
  };

  const handleReject = async (itemId: string) => {
    try {
      await adminRejectItem(itemId, 'Rejected for demo');
      setPendingItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error rejecting item:', error);
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 py-16">
        {/* Enhanced Header */}
        <div className="mb-16 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl -z-10"></div>
          <div className="relative">
            <h1 className="text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
                Admin Panel
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Monitor and approve lost item reports before they go live on the platform
            </p>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Pending Review</h3>
                </div>
                <div className="text-3xl font-bold text-white">{pendingItems.length}</div>
                <div className="text-sm text-gray-400">Items awaiting approval</div>
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
                <div className="text-3xl font-bold text-white">12</div>
                <div className="text-sm text-gray-400">Items approved</div>
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
                <div className="text-3xl font-bold text-white">247</div>
                <div className="text-sm text-gray-400">In system</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex justify-center">
          <div className="w-full max-w-7xl">
            {pendingItems.length === 0 ? (
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
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="bg-zinc-800/40 border border-zinc-700/30 rounded-lg p-6 backdrop-blur-md shadow-2xl">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full border border-orange-500/30">
                              {item.category}
                            </span>
                            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                              Pending
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                          <p className="text-gray-300 mb-4 leading-relaxed">{item.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="truncate">{item.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{item.dateFound.toDate().toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                              {item.tags.map((tag, index) => (
                                <span key={index} className="px-3 py-1 bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 text-gray-300 text-xs font-medium rounded-md border border-zinc-600/30">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-4 border-t border-zinc-700/30">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="flex-1 relative inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 text-sm"
                          style={{ 
                            background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                            padding: '1px',
                          }}
                        >
                          <span 
                            className="w-full h-full flex items-center justify-center gap-2"
                            style={{ 
                              backgroundColor: '#0b0b0c',
                              borderRadius: '7px',
                            }}
                          >
                            <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </span>
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="flex-1 relative inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 text-sm"
                          style={{ 
                            background: 'linear-gradient(135deg, #f87171, #ef4444)',
                            padding: '1px',
                          }}
                        >
                          <span 
                            className="w-full h-full flex items-center justify-center gap-2"
                            style={{ 
                              backgroundColor: '#0b0b0c',
                              borderRadius: '7px',
                            }}
                          >
                            <svg className="w-4 h-4 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
