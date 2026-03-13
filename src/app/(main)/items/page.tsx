'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useUser, useOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import ItemCard from '@/components/items/ItemCard';
import ItemFilters from '@/components/items/ItemFilters';
import { listItems } from '@/lib/items/queries';

interface DbItem {
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
}

export default function BrowseItemsPage() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const router = useRouter();
  const isAdmin = organization?.role === 'org:admin';
  
  const [items, setItems] = useState<DbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includePending, setIncludePending] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    categories: [] as string[],
    dateFrom: '',
    dateTo: '',
    colors: [] as string[],
    hasPhoto: false,
  });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Fetch items from Supabase
  const fetchItems = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await listItems(
        {
          search: filters.search || undefined,
          category: filters.categories.length === 1 ? filters.categories[0] : undefined,
          color: filters.colors.length === 1 ? filters.colors[0] : undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
        includePending
      );

      if (result.success) {
        setItems(result.items);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      console.error('Error fetching items:', err);
      setError(err.message || 'Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, filters, includePending]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Refresh data when page becomes visible (e.g., user returns from admin panel)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchItems();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchItems]);

  // Also refresh on window focus (when user switches back to the tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchItems();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchItems]);

  // Convert database items to ItemCard format and apply client-side filters
  const filteredAndSortedItems = useMemo(() => {
    // Convert DB items to ItemCard format
    const convertedItems = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description || '',
      category: item.category,
      foundLocation: item.location_found,
      foundDate: item.date_found,
      tags: item.color ? [item.color] : [], // Use color as tag for now
      imageUrl: item.photo_url || '',
      status: (item.status === 'approved' ? 'Approved' : 
               item.status === 'pending' ? 'Pending' : 
               'Approved') as 'Approved' | 'Claimed' | 'Pending',
    }));

    // Apply client-side filters (category multi-select, color multi-select, hasPhoto)
    let filtered = convertedItems;

    // Category filter (multi-select)
    if (filters.categories.length > 0) {
      filtered = filtered.filter(item => filters.categories.includes(item.category));
    }

    // Color filter (multi-select)
    if (filters.colors.length > 0) {
      filtered = filtered.filter(item => {
        return filters.colors.some(color => {
          if (color.toLowerCase() === 'no photo') {
            return !item.imageUrl;
          }
          return item.tags.some(tag => tag.toLowerCase() === color.toLowerCase());
        });
      });
    }

    // Has photo filter
    if (filters.hasPhoto) {
      filtered = filtered.filter(item => !!item.imageUrl);
    }

    // Sort items
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.foundDate).getTime() - new Date(a.foundDate).getTime();
      } else {
        return new Date(a.foundDate).getTime() - new Date(b.foundDate).getTime();
      }
    });

    return filtered;
  }, [items, filters, sortBy]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-4 sm:px-6 py-8 sm:py-16">
        {/* Header */}
        <div className="mb-8 sm:mb-16 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl -z-10"></div>
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
                Browse Lost Items
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed px-4">
              Browse through items found around campus and reconnect with your lost belongings
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 lg:gap-12">
            {/* Filters Sidebar */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <ItemFilters
                filters={filters}
                onFiltersChange={setFilters}
                items={items.map(item => ({ category: item.category }))}
              />
            </div>

            {/* Content Area */}
            <div className="flex-1">
            {/* Sort Controls */}
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-base sm:text-lg">
                    {loading ? 'Loading...' : `${filteredAndSortedItems.length} item${filteredAndSortedItems.length !== 1 ? 's' : ''} found`}
                  </span>
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                </div>
                {/* Admin: Toggle pending items */}
                {isAdmin && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePending}
                      onChange={(e) => setIncludePending(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500/50"
                    />
                    <span className="text-xs sm:text-sm text-gray-400">Show pending items</span>
                  </label>
                )}
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => fetchItems()}
                  disabled={loading}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded-lg text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Refresh items"
                >
                  <svg 
                    className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
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

            {/* Error message */}
            {error && (
              <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-lg text-gray-300">Loading items...</span>
                </div>
              </div>
            )}

              {/* Items Grid */}
              {!loading && filteredAndSortedItems.length > 0 ? (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
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
