'use client';

import React, { useState, useMemo } from 'react';
import ItemCard from '@/components/items/ItemCard';
import ItemFilters from '@/components/items/ItemFilters';

// Mock data for demonstration
const mockItems = [
  {
    id: '1',
    title: 'Black North Face Jacket',
    description: 'Black waterproof jacket with zipper pockets',
    category: 'Clothing',
    foundLocation: 'Library - 2nd Floor',
    foundDate: '2024-01-15',
    tags: ['jacket', 'black', 'north face'],
    imageUrl: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=center',
    status: 'Approved' as const,
  },
  {
    id: '2',
    title: 'MacBook Pro Charger',
    description: 'White MagSafe charger for MacBook Pro',
    category: 'Electronics',
    foundLocation: 'Cafeteria',
    foundDate: '2024-01-14',
    tags: ['charger', 'macbook', 'white'],
    imageUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop&crop=center',
    status: 'Approved' as const,
  },
  {
    id: '3',
    title: 'Blue Backpack',
    description: 'Navy blue backpack with laptop compartment',
    category: 'Accessories',
    foundLocation: 'Gym Locker Room',
    foundDate: '2024-01-13',
    tags: ['backpack', 'blue', 'laptop'],
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&crop=center',
    status: 'Claimed' as const,
  },
  {
    id: '4',
    title: 'Calculus Textbook',
    description: 'Stewart Calculus 8th Edition',
    category: 'Books',
    foundLocation: 'Math Building - Room 201',
    foundDate: '2024-01-12',
    tags: ['textbook', 'calculus', 'math'],
    status: 'Approved' as const,
  },
  {
    id: '5',
    title: 'AirPods Case',
    description: 'White AirPods charging case',
    category: 'Electronics',
    foundLocation: 'Student Center',
    foundDate: '2024-01-11',
    tags: ['airpods', 'case', 'white'],
    imageUrl: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop&crop=center',
    status: 'Approved' as const,
  },
  {
    id: '6',
    title: 'Red Water Bottle',
    description: 'Stainless steel water bottle with logo',
    category: 'Other',
    foundLocation: 'Track Field',
    foundDate: '2024-01-10',
    tags: ['water bottle', 'red', 'stainless'],
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop&crop=center',
    status: 'Approved' as const,
  },
  {
    id: '7',
    title: 'iPhone 13',
    description: 'Black iPhone 13 with clear case',
    category: 'Electronics',
    foundLocation: 'Computer Lab',
    foundDate: '2024-01-09',
    tags: ['iphone', 'phone', 'black'],
    imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=400&fit=crop&crop=center',
    status: 'Pending' as const,
  },
  {
    id: '8',
    title: 'Nike Running Shoes',
    description: 'White Nike Air Max running shoes, size 10',
    category: 'Clothing',
    foundLocation: 'Athletic Center',
    foundDate: '2024-01-08',
    tags: ['shoes', 'nike', 'running'],
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&crop=center',
    status: 'Approved' as const,
  },
];

export default function BrowseItemsPage() {
  const [filters, setFilters] = useState({
    search: '',
    categories: [] as string[],
    dateFrom: '',
    dateTo: '',
    colors: [] as string[],
    hasPhoto: false,
  });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const filteredAndSortedItems = useMemo(() => {
    const filtered = mockItems.filter((item) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom && item.foundDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && item.foundDate > filters.dateTo) {
        return false;
      }

      // Color filter
      if (filters.colors.length > 0) {
        const hasMatchingColor = filters.colors.some(color => {
          // Handle "No Photo" filter
          if (color.toLowerCase() === 'no photo') {
            return !item.imageUrl;
          }
          
          // Handle regular color filters
          const itemColors = item.tags.filter(tag => 
            ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange', 'gray', 'brown', 'silver']
              .includes(tag.toLowerCase())
          );
          return itemColors.some(itemColor => itemColor.toLowerCase() === color.toLowerCase());
        });
        
        if (!hasMatchingColor) return false;
      }

      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.foundDate).getTime() - new Date(a.foundDate).getTime();
      } else {
        return new Date(a.foundDate).getTime() - new Date(b.foundDate).getTime();
      }
    });

    return filtered;
  }, [filters, sortBy]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 py-16">
        {/* Header */}
        <div className="mb-16 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl -z-10"></div>
          <div className="relative">
            <h1 className="text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
                Browse Lost Items
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Browse through items found around campus and reconnect with your lost belongings
            </p>
          </div>
        </div>

        <div className="flex justify-start">
          <div className="w-full max-w-7xl flex flex-col lg:flex-row" style={{ gap: '80px', paddingLeft: '2rem' }}>
            {/* Filters Sidebar */}
            <div className="lg:w-80 flex-shrink-0" style={{ marginTop: '0.5rem' }}>
              <ItemFilters
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>

            {/* Content Area */}
            <div className="flex-1">
            {/* Sort Controls */}
            <div className="w-full flex justify-between items-center mb-8">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-lg">
                    {filteredAndSortedItems.length} item{filteredAndSortedItems.length !== 1 ? 's' : ''} found
                  </span>
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="sort" className="text-gray-400">Sort by:</label>
                <div className="relative">
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                    className="bg-zinc-800 border border-zinc-600 text-white rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 hover:border-zinc-500 appearance-none cursor-pointer min-w-[120px]"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

              {/* Items Grid */}
              {filteredAndSortedItems.length > 0 ? (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredAndSortedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ItemCard item={item} />
                  </div>
                ))}
              </div>
              ) : (
                <div className="w-full flex items-center justify-center py-40">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10 backdrop-blur-sm">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-8">No items found</h3>
                  <p className="text-gray-400 mb-16 text-lg">Try adjusting your filters or search terms to see more results.</p>
                  <button
                    onClick={() => {
                      setFilters({
                        search: '',
                        categories: [],
                        dateFrom: '',
                        dateTo: '',
                        colors: [],
                        hasPhoto: false,
                      });
                    }}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 font-medium border border-white/10 hover:border-white/20 backdrop-blur-sm"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
