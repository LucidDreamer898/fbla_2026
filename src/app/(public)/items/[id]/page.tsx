'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { FirestoreItem } from '@/types/item';
// TODO: Import your database function when implemented
// import { getItemById } from '@/lib/your-database-service';

/**
 * Database Integration Notes:
 * 
 * When implementing the database:
 * 1. Import your database function: import { getItemById } from '@/lib/your-database-service';
 * 2. Replace the mock data in fetchItem() with: const itemData = await getItemById(itemId);
 * 3. Remove the getMockItem() function and mock data
 * 4. Ensure your FirestoreItem type matches the database schema
 * 5. The component is already set up to handle:
 *    - Date objects or objects with .toDate() method
 *    - Missing/null fields with fallbacks
 *    - Broken image URLs with error handling
 *    - Empty or malformed photo arrays
 *    - Null/undefined/empty string images (shows "No image available")
 *    - Various item statuses (approved, pending, claimed)
 * 
 * Image Handling:
 * - If photos array is empty/null/undefined → shows "No image available"
 * - If imageUrl is empty/null/undefined → shows "No image available"
 * - If photos array has valid URLs → shows gallery with thumbnails
 * - If only imageUrl exists → shows single image
 * - Broken image URLs are hidden gracefully with onError handlers
 */

export default function ItemDetailPage() {
  const params = useParams();
  const itemId = params.id as string;
  const [item, setItem] = useState<FirestoreItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Mock items data for demo - simulating different items based on ID
  const getMockItem = (id: string): FirestoreItem => {
    const items: { [key: string]: FirestoreItem } = {
      '1': {
        id: '1',
        title: 'Black North Face Jacket',
        description: 'Found a black waterproof jacket with zipper pockets in the library. The jacket appears to be in excellent condition with no visible damage. It was left on a chair near the study area.',
        category: 'Clothing',
        location: 'Library - 2nd Floor',
        dateFound: { toDate: () => new Date('2024-01-15') } as any,
        status: 'approved',
        photos: [
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=500&fit=crop'
        ],
        reportedBy: 'library_staff',
        createdAt: { toDate: () => new Date('2024-01-15') } as any,
        updatedAt: { toDate: () => new Date('2024-01-15') } as any,
        tags: ['jacket', 'black', 'north face', 'waterproof', 'zipper'],
        imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop'
      },
      '2': {
        id: '2',
        title: 'MacBook Pro Charger',
        description: 'Found a white MagSafe charger for MacBook Pro in the cafeteria. The charger appears to be in good working condition with no visible damage to the cable or connector.',
        category: 'Electronics',
        location: 'Cafeteria',
        dateFound: { toDate: () => new Date('2024-01-14') } as any,
        status: 'approved',
        photos: [
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop'
        ],
        reportedBy: 'cafeteria_staff',
        createdAt: { toDate: () => new Date('2024-01-14') } as any,
        updatedAt: { toDate: () => new Date('2024-01-14') } as any,
        tags: ['charger', 'macbook', 'white', 'magsafe', 'electronics'],
        imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop'
      },
      '3': {
        id: '3',
        title: 'Blue Backpack',
        description: 'Found a navy blue backpack with laptop compartment in the gym locker room. The backpack appears to be in good condition with multiple compartments and zippers working properly.',
        category: 'Accessories',
        location: 'Gym Locker Room',
        dateFound: { toDate: () => new Date('2024-01-13') } as any,
        status: 'claimed',
        photos: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
          'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=500&h=500&fit=crop'
        ],
        reportedBy: 'gym_staff',
        createdAt: { toDate: () => new Date('2024-01-13') } as any,
        updatedAt: { toDate: () => new Date('2024-01-13') } as any,
        tags: ['backpack', 'blue', 'laptop', 'navy', 'gym'],
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop'
      },
      '4': {
        id: '4',
        title: 'Calculus Textbook',
        description: 'Found a Stewart Calculus 8th Edition textbook in the math building. The book appears to be in good condition with some highlighting and notes in the margins.',
        category: 'Books',
        location: 'Math Building - Room 201',
        dateFound: { toDate: () => new Date('2024-01-12') } as any,
        status: 'approved',
        photos: [],
        reportedBy: 'professor_smith',
        createdAt: { toDate: () => new Date('2024-01-12') } as any,
        updatedAt: { toDate: () => new Date('2024-01-12') } as any,
        tags: ['textbook', 'calculus', 'math', 'stewart', 'education']
      },
      '5': {
        id: '5',
        title: 'AirPods Case',
        description: 'Found a white AirPods charging case in the student center. The case appears to be in good condition and was left on a table near the food court.',
        category: 'Electronics',
        location: 'Student Center',
        dateFound: { toDate: () => new Date('2024-01-11') } as any,
        status: 'approved',
        photos: [
          'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500&h=500&fit=crop'
        ],
        reportedBy: 'cafeteria_staff',
        createdAt: { toDate: () => new Date('2024-01-11') } as any,
        updatedAt: { toDate: () => new Date('2024-01-11') } as any,
        tags: ['airpods', 'case', 'white', 'electronics', 'charging'],
        imageUrl: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&h=600&fit=crop'
      },
      '6': {
        id: '6',
        title: 'Red Water Bottle',
        description: 'Found a stainless steel water bottle with logo at the track field. The bottle appears to be in good condition with no dents or scratches.',
        category: 'Other',
        location: 'Track Field',
        dateFound: { toDate: () => new Date('2024-01-10') } as any,
        status: 'approved',
        photos: [
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop'
        ],
        reportedBy: 'track_coach',
        createdAt: { toDate: () => new Date('2024-01-10') } as any,
        updatedAt: { toDate: () => new Date('2024-01-10') } as any,
        tags: ['water bottle', 'red', 'stainless', 'track', 'sports'],
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=600&fit=crop'
      },
      '7': {
        id: '7',
        title: 'iPhone 13',
        description: 'Found a black iPhone 13 with clear case in the computer lab. The phone appears to be in excellent condition with no visible damage.',
        category: 'Electronics',
        location: 'Computer Lab',
        dateFound: { toDate: () => new Date('2024-01-09') } as any,
        status: 'pending',
        photos: [
          'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500&h=500&fit=crop'
        ],
        reportedBy: 'lab_assistant',
        createdAt: { toDate: () => new Date('2024-01-09') } as any,
        updatedAt: { toDate: () => new Date('2024-01-09') } as any,
        tags: ['iphone', 'phone', 'black', 'electronics', 'clear case'],
        imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=600&fit=crop'
      },
      '8': {
        id: '8',
        title: 'Nike Running Shoes',
        description: 'Found a pair of Nike running shoes at the basketball court. The shoes appear to be in good condition with minimal wear.',
        category: 'Clothing',
        location: 'Basketball Court',
        dateFound: { toDate: () => new Date('2024-01-08') } as any,
        status: 'approved',
        photos: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'
        ],
        reportedBy: 'court_supervisor',
        createdAt: { toDate: () => new Date('2024-01-08') } as any,
        updatedAt: { toDate: () => new Date('2024-01-08') } as any,
        tags: ['shoes', 'nike', 'running', 'basketball', 'sports'],
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop'
      }
    };
    
    return items[id] || items['1']; // Default to first item if ID not found
  };

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // TODO: Replace with real database call when implemented
        // const itemData = await getItemById(itemId);
        // setItem(itemData);
        
        // Mock data for now
        setTimeout(() => {
          setItem(getMockItem(itemId));
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        console.error('Error fetching item:', err);
        setError('Failed to load item details');
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

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
            <p className="text-gray-400 mb-6">The item you're looking for doesn't exist or has been removed.</p>
            <Button href="/items" className="bg-gradient-to-r from-purple-500 to-pink-500">
              Back to Browse
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 py-16">
        {/* Header */}
        <div className="mb-12 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl -z-10"></div>
          <div className="relative">
            <h1 className="text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
                Item Details
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              View detailed information and photos of this found item
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex justify-center">
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
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
                <div className="flex items-center gap-4 mb-6">
                  <div className={`px-5 py-2.5 rounded-full text-sm font-bold border-2 shadow-xl backdrop-blur-lg ${
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
                  <div className="px-5 py-2.5 bg-zinc-800/90 backdrop-blur-md text-sm font-bold text-white rounded-full border-2 border-zinc-600/60 shadow-xl">
                    {item.category || 'Uncategorized'}
                  </div>
                </div>

                {/* Title */}
                <div className="mb-8">
                  <h2 className="text-4xl font-bold text-white mb-6 leading-tight">{item.title || 'Untitled Item'}</h2>
                  <div className="h-1 bg-gradient-to-r from-purple-500/40 via-pink-500/40 to-purple-500/40 rounded-full mb-2"></div>
                  <div className="h-0.5 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 rounded-full"></div>
                </div>

                {/* Description */}
                <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-6 backdrop-blur-md mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Description</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{item.description || 'No description available.'}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 gap-4 mb-8">
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

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button href="/items" className="flex-1 bg-zinc-700/50 hover:bg-zinc-600/50 border border-zinc-600/50 text-white font-medium py-3 rounded-lg transition-all duration-200">
                    Back to Browse
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg transition-all duration-200">
                    Claim This Item
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
