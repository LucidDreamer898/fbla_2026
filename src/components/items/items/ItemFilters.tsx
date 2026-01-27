'use client';

import React, { useState } from 'react';

interface Filters {
  search: string;
  categories: string[];
  dateFrom: string;
  dateTo: string;
  hasPhoto: boolean;
}

interface ItemFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const categories = [
  'Electronics',
  'Clothing', 
  'Accessories',
  'Books',
  'Other'
];

export default function ItemFilters({ filters, onFiltersChange }: ItemFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    date: false,
    photo: false,
  });

  const toggleSection = (section: 'category' | 'date' | 'photo') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handleDateFromChange = (value: string) => {
    onFiltersChange({ ...filters, dateFrom: value });
  };

  const handleDateToChange = (value: string) => {
    onFiltersChange({ ...filters, dateTo: value });
  };

  const handleHasPhotoChange = (checked: boolean) => {
    onFiltersChange({ ...filters, hasPhoto: checked });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      categories: [],
      dateFrom: '',
      dateTo: '',
      hasPhoto: false,
    });
  };

  const getCategoryCount = (category: string) => {
    const counts: Record<string, number> = {
      'Electronics': 12,
      'Clothing': 8,
      'Accessories': 15,
      'Books': 5,
      'Other': 10,
    };
    return counts[category] || 0;
  };

  return (
    <div 
      className="w-full rounded-lg border"
      style={{ 
        backgroundColor: '#fafafa',
        borderColor: '#e5e5e5',
        padding: '24px'
      }}
    >
      {/* Filter Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '32px' }}>
        <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors underline"
        >
          Advanced
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '40px' }}>
        <div className="relative">
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search items..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full border text-gray-900 text-sm placeholder-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            style={{ 
              backgroundColor: '#f0f0f0',
              borderColor: '#d0d0d0',
              paddingTop: '16px', 
              paddingBottom: '16px',
              paddingLeft: '44px',
              paddingRight: '20px'
            }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: '24px' }}>
        <div 
          style={{ 
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '8px'
          }}
        >
          <button
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between text-gray-900 font-medium text-sm hover:text-gray-700 transition-colors"
            style={{ marginBottom: '16px' }}
          >
            <span>Category</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 text-gray-400 ${expandedSections.category ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.category && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categories.map((category) => (
                <label 
                  key={category} 
                  className="flex items-center justify-between cursor-pointer group"
                  style={{ padding: '4px 0' }}
                >
                  <div className="flex items-center" style={{ gap: '12px' }}>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={(e) => handleCategoryChange(category, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-white"
                      />
                      {filters.categories.includes(category) && (
                        <svg className="absolute left-0 top-0 w-4 h-4 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                      {category}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">{getCategoryCount(category)}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <div style={{ marginBottom: '24px' }}>
        <div 
          style={{ 
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '8px'
          }}
        >
          <button
            onClick={() => toggleSection('date')}
            className="w-full flex items-center justify-between text-gray-900 font-medium text-sm hover:text-gray-700 transition-colors"
            style={{ marginBottom: '16px' }}
          >
            <span>Date Found</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 text-gray-400 ${expandedSections.date ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.date && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="w-full border text-gray-900 text-sm rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{
                  backgroundColor: '#f0f0f0',
                  borderColor: '#d0d0d0'
                }}
              />
              <input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="w-full border text-gray-900 text-sm rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                style={{
                  backgroundColor: '#f0f0f0',
                  borderColor: '#d0d0d0'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Has Photo Filter */}
      <div style={{ paddingBottom: '8px' }}>
        <div 
          style={{ 
            backgroundColor: '#ffffff',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '8px'
          }}
        >
          <button
            onClick={() => toggleSection('photo')}
            className="w-full flex items-center justify-between text-gray-900 font-medium text-sm hover:text-gray-700 transition-colors"
            style={{ marginBottom: '16px' }}
          >
            <span>Photo</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 text-gray-400 ${expandedSections.photo ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.photo && (
            <label 
              className="flex items-center cursor-pointer group"
              style={{ padding: '4px 0', gap: '12px' }}
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.hasPhoto}
                  onChange={(e) => handleHasPhotoChange(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-white"
                />
                {filters.hasPhoto && (
                  <svg className="absolute left-0 top-0 w-4 h-4 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                Has Photo
              </span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
