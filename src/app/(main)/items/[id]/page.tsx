'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FirestoreItem } from '@/types/item';
import { getItem } from '@/lib/items/queries';
import { submitClaim, getUserClaims } from '@/lib/claims/actions';


export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const itemId = params.id as string;
  const [item, setItem] = useState<FirestoreItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimStatus, setClaimStatus] = useState<{
    status: 'pending' | 'approved' | 'denied';
    created_at: string;
    reviewed_at: string | null;
  } | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Helper to convert database item to FirestoreItem format
  const convertDbItemToFirestoreItem = (dbItem: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    color: string | null;
    location_found: string;
    date_found: string;
    photo_url: string | null;
    status: 'pending' | 'approved' | 'archived';
    created_at: string;
    created_by: string;
  }): FirestoreItem => {
    const dateFound = new Date(dbItem.date_found);
    const createdAt = new Date(dbItem.created_at);
    
    return {
      id: dbItem.id,
      title: dbItem.title,
      description: dbItem.description || '',
      category: dbItem.category,
      location: dbItem.location_found,
      dateFound: dateFound,
      status: dbItem.status === 'approved' ? 'approved' : 
              dbItem.status === 'pending' ? 'pending' : 
              'approved',
      photos: dbItem.photo_url ? [dbItem.photo_url] : [],
      reportedBy: dbItem.created_by,
      createdAt: createdAt,
      updatedAt: createdAt,
      tags: dbItem.color ? [dbItem.color] : [],
      imageUrl: dbItem.photo_url || undefined,
    };
  };

  useEffect(() => {
    const fetchItem = async () => {
      if (!itemId) {
        setError('Item ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const result = await getItem(itemId);
        
        if (result.success) {
          const firestoreItem = convertDbItemToFirestoreItem(result.item);
          setItem(firestoreItem);
        } else {
          setError(result.error);
        }
      } catch (err: any) {
        console.error('Error fetching item:', err);
        setError(err.message || 'Failed to load item details');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  // Fetch user's claim status for this item
  useEffect(() => {
    const fetchClaimStatus = async () => {
      if (!user || !itemId) return;

      try {
        const result = await getUserClaims();
        if (result.success) {
          const itemClaim = result.claims.find(c => c.itemId === itemId);
          if (itemClaim) {
            setClaimStatus({
              status: itemClaim.status,
              created_at: itemClaim.created_at,
              reviewed_at: itemClaim.reviewed_at,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching claim status:', err);
        // Don't show error to user, just silently fail
      }
    };

    fetchClaimStatus();
  }, [user, itemId]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    try {
      // Handle Firestore Timestamp
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      // Handle JavaScript Date or timestamp string
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };

  // Helper function to get photos array (handles both photos and imageUrl)
  const getPhotos = (item: FirestoreItem | null) => {
    if (!item) return [];
    
    // If photos array exists and has valid items, use it
    if (item.photos && Array.isArray(item.photos) && item.photos.length > 0) {
      // Filter out any null, undefined, or empty string photos
      const validPhotos = item.photos.filter(photo => 
        photo && typeof photo === 'string' && photo.trim() !== ''
      );
      return validPhotos;
    }
    
    // Fallback to imageUrl if no photos array, but only if it's valid
    if (item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim() !== '') {
      return [item.imageUrl];
    }
    
    // Return empty array if no valid images found
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg text-gray-300">Loading item details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Item Not Found</h1>
            <p className="text-gray-400 mb-6">The item you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link 
              href="/items" 
              className="inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 h-10 px-10 text-sm min-w-40 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
            >
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-4 sm:px-6 py-8 sm:py-16">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl -z-10"></div>
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
                Item Details
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-4">
              View detailed information and photos of this found item
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex justify-center">
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
              
              {/* Image Section */}
              <div className="lg:col-span-3 flex flex-col">
                {/* Main Image */}
                <div className="relative group mb-4">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl rounded-2xl -z-10 group-hover:blur-2xl transition-all duration-500"></div>
                  <div className="relative bg-zinc-800/40 border border-zinc-700/30 rounded-xl overflow-hidden backdrop-blur-md">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      {(() => {
                        const photos = getPhotos(item);
                        return photos.length > 0 ? (
                          <img
                            src={photos[selectedImageIndex] || photos[0]}
                            alt={`${item?.title || 'Item'} - Photo ${selectedImageIndex + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              // Handle broken image URLs
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-700/50 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <p className="text-gray-400">No image available</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Thumbnail Photos - Grid Layout */}
                {(() => {
                  const photos = getPhotos(item);
                  return photos.length > 0 && (
                    <div className="grid grid-cols-4 gap-3">
                      {photos.map((photo, index) => (
                        <div 
                          key={index} 
                          className={`relative group cursor-pointer transition-all duration-200 ${
                            selectedImageIndex === index ? 'ring-2 ring-purple-500/50' : ''
                          }`}
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <div className={`absolute -inset-1 blur-lg rounded-xl -z-10 transition-all duration-300 ${
                            selectedImageIndex === index 
                              ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30' 
                              : 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 group-hover:from-purple-500/20 group-hover:to-pink-500/20'
                          }`}></div>
                          <div className={`relative rounded-xl overflow-hidden backdrop-blur-md transition-all duration-200 ${
                            selectedImageIndex === index 
                              ? 'bg-zinc-800/60 border border-purple-500/50' 
                              : 'bg-zinc-800/40 border border-zinc-700/30'
                          }`}>
                            <div className="aspect-square">
                              <img
                                src={photo}
                                alt={`${item?.title || 'Item'} - Photo ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  // Handle broken image URLs
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Details Section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status and Category Badges */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold border-2 shadow-xl backdrop-blur-lg ${
                    item.status === 'approved' 
                      ? 'bg-emerald-500/90 text-white border-emerald-400/60'
                      : item.status === 'pending'
                      ? 'bg-purple-500/90 text-white border-purple-400/60'
                      : item.status === 'claimed'
                      ? 'bg-blue-500/90 text-white border-blue-400/60'
                      : 'bg-orange-500/90 text-white border-orange-400/60'
                  }`}>
                    {item.status === 'approved' ? 'Approved' : 
                     item.status === 'pending' ? 'Pending' : 
                     item.status === 'claimed' ? 'Claimed' : 'Under Review'}
                  </div>
                  <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-zinc-800/90 backdrop-blur-md text-xs sm:text-sm font-bold text-white rounded-full border-2 border-zinc-600/60 shadow-xl">
                    {item.category || 'Uncategorized'}
                  </div>
                </div>

                {/* Title */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 leading-tight">{item.title || 'Untitled Item'}</h2>
                  <div className="h-1 bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-purple-500/40 rounded-full mb-2"></div>
                  <div className="h-0.5 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 rounded-full"></div>
                </div>

                {/* Description */}
                <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-4 sm:p-6 backdrop-blur-md mb-6 sm:mb-8">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white">Description</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{item.description || 'No description available.'}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
                  {/* Location */}
                  <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-4 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20 rounded-lg">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Found at</p>
                        <p className="font-medium text-white">{item.location || 'Location not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Date Found */}
                  <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-4 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20 rounded-lg">
                        <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Date found</p>
                        <p className="font-medium text-white">{formatDate(item.dateFound)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                  <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-6 backdrop-blur-md mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white">Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.filter(tag => tag && typeof tag === 'string').map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-zinc-700/50 to-zinc-600/50 text-white text-sm rounded-md border border-zinc-600/30 hover:from-zinc-600/60 hover:to-zinc-500/60 transition-all duration-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Claim Status */}
                {claimStatus && (
                  <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-6 backdrop-blur-md mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white">Your Claim Status</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                          claimStatus.status === 'approved'
                            ? 'bg-emerald-500/90 text-white'
                            : claimStatus.status === 'denied'
                            ? 'bg-red-500/90 text-white'
                            : 'bg-purple-500/90 text-white'
                        }`}>
                          {claimStatus.status === 'approved' ? 'Approved' : 
                           claimStatus.status === 'denied' ? 'Denied' : 
                           'Pending Review'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Submitted: {new Date(claimStatus.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {claimStatus.reviewed_at && (
                        <p className="text-sm text-gray-400">
                          Reviewed: {new Date(claimStatus.reviewed_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Link 
                    href="/items" 
                    className="inline-flex items-center justify-center flex-1 bg-zinc-700/50 hover:bg-zinc-600/50 border border-zinc-600/50 text-white font-medium h-12 rounded-lg transition-all duration-200"
                  >
                    Back to Browse
                  </Link>
                  {!claimStatus || claimStatus.status === 'denied' ? (
                    <Button 
                      onClick={() => setIsClaimModalOpen(true)}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium h-12 rounded-lg transition-all duration-200"
                    >
                      {claimStatus?.status === 'denied' ? 'Submit New Claim' : 'Claim This Item'}
                    </Button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                      {claimStatus.status === 'approved' 
                        ? '✅ Your claim has been approved!' 
                        : '⏳ Your claim is pending review'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Item Modal */}
      {isClaimModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsClaimModalOpen(false);
            }
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-6 backdrop-blur-md shadow-2xl">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Claim This Item</h2>
              <p className="text-gray-400 text-sm">
                Please provide your contact information to claim this item.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                setClaimError(null);
                
                if (!itemId) {
                  setClaimError('Item ID is required');
                  setIsSubmitting(false);
                  return;
                }

                try {
                  // Store contact info in proof_answers
                  const proofAnswers = {
                    name: claimForm.name,
                    email: claimForm.email,
                    phone: claimForm.phone,
                  };

                  const result = await submitClaim(
                    itemId,
                    claimForm.message || null,
                    proofAnswers
                  );

                  if (result.success) {
                    // Success - close modal and refresh
                    setIsClaimModalOpen(false);
                    setClaimForm({ name: '', email: '', phone: '', message: '' });
                    // Refresh the page to show updated claim status
                    router.refresh();
                    // Show success message
                    alert('✅ Your claim request has been submitted! We will review it and contact you soon.');
                  } else {
                    setClaimError(result.error);
                  }
                } catch (err: any) {
                  console.error('Error submitting claim:', err);
                  setClaimError(err.message || 'Failed to submit claim. Please try again.');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              {/* Error message */}
              {claimError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{claimError}</p>
                </div>
              )}
              <Input
                label="Full Name"
                type="text"
                value={claimForm.name}
                onChange={(e) => setClaimForm({ ...claimForm, name: e.target.value })}
                placeholder="Enter your full name"
                required
                className="bg-zinc-900/50 border-zinc-700 text-white"
              />
              
              <Input
                label="Email Address"
                type="email"
                value={claimForm.email}
                onChange={(e) => setClaimForm({ ...claimForm, email: e.target.value })}
                placeholder="Enter your email"
                required
                className="bg-zinc-900/50 border-zinc-700 text-white"
              />
              
              <Input
                label="Phone Number"
                type="tel"
                value={claimForm.phone}
                onChange={(e) => setClaimForm({ ...claimForm, phone: e.target.value })}
                placeholder="Enter your phone number"
                required
                className="bg-zinc-900/50 border-zinc-700 text-white"
              />

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Message (Optional)
                </label>
                <textarea
                  id="message"
                  value={claimForm.message}
                  onChange={(e) => setClaimForm({ ...claimForm, message: e.target.value })}
                  placeholder="Provide any additional information that might help verify your claim..."
                  rows={4}
                  className="w-full bg-zinc-900/50 border border-zinc-700 text-white rounded-lg px-4 py-2 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setIsClaimModalOpen(false);
                    setClaimForm({ name: '', email: '', phone: '', message: '' });
                  }}
                  className="flex-1 bg-zinc-700/50 hover:bg-zinc-600/50 border border-zinc-600/50 text-white font-medium h-12 rounded-lg transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !claimForm.name || !claimForm.email || !claimForm.phone}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium h-12 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    'Submit Claim'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
