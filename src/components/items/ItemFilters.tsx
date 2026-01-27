'use client';

import React, { useState } from 'react';

interface Filters {
  search: string;
  categories: string[];
  dateFrom: string;
  dateTo: string;
  colors: string[];
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

const colors = [
  'Black',
  'White',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Purple',
  'Pink',
  'Orange',
  'Gray',
  'Brown',
  'Silver',
  'No Photo'
];

export default function ItemFilters({ filters, onFiltersChange }: ItemFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    date: false,
    colors: false,
  });

  const toggleSection = (section: 'category' | 'date' | 'colors') => {
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

  const handleColorChange = (color: string, checked: boolean) => {
    if (checked) {
      onFiltersChange({ ...filters, colors: [...filters.colors, color] });
    } else {
      onFiltersChange({ ...filters, colors: filters.colors.filter(c => c !== color) });
    }
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      categories: [],
      dateFrom: '',
      dateTo: '',
      colors: [],
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
        backgroundColor: '#0b0b0c',
        borderColor: '#1a1a1a',
        padding: '28px'
      }}
    >
      {/* Filter Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '40px' }}>
        <h2 className="text-lg font-semibold" style={{ background: 'linear-gradient(135deg, #8e4ec6, #ff0080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Filter</h2>
        <button
          onClick={clearFilters}
          className="inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background text-foreground hover:bg-primary/10 h-8 px-6 text-sm min-w-24 relative"
          style={{ 
            background: 'linear-gradient(135deg, #8e4ec6, #ff0080)',
            padding: '2px',
          }}
        >
          <span 
            className="w-full h-full rounded-md flex items-center justify-center"
            style={{ 
              backgroundColor: '#0b0b0c',
            }}
          >
            Clear All
          </span>
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
          <div className="relative">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#8e4ec6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          <input
            type="text"
            placeholder="Search items..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full border text-white text-sm placeholder-gray-400 rounded-md transition-all"
            style={{ 
              backgroundColor: '#1a1a1a',
              borderColor: '#2a2a2a',
              paddingTop: '10px', 
              paddingBottom: '10px',
              paddingLeft: '44px',
              paddingRight: '20px',
              '--tw-ring-color': '#a855f7',
              '--tw-border-opacity': '1'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#8e4ec6';
              e.target.style.boxShadow = '0 0 0 2px rgba(142, 78, 198, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#2a2a2a';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: '2px' }}>
        <div 
          style={{ 
            backgroundColor: '#1a1a1a',
            borderRadius: '8px 8px 2px 2px',
            marginTop: '8px'
          }}
        >
          <button
            onClick={() => toggleSection('category')}
            className="w-full flex items-center justify-between text-white font-medium text-sm transition-colors"
            style={{ 
              padding: '16px 20px',
              marginBottom: expandedSections.category ? '20px' : '0'
            }}
            onMouseEnter={(e) => e.target.style.color = '#8e4ec6'}
            onMouseLeave={(e) => e.target.style.color = '#ffffff'}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" style={{ color: '#8e4ec6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Category</span>
            </div>
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
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              padding: '0 20px 20px 20px'
            }}>
              {categories.map((category) => (
                <label 
                  key={category} 
                  className="flex items-center justify-between cursor-pointer group"
                  style={{ padding: '4px 0' }}
                >
                  <div className="flex items-center" style={{ gap: '12px' }}>
                    <div className="relative flex items-center justify-center" style={{ width: '16px', height: '16px' }}>
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={(e) => handleCategoryChange(category, e.target.checked)}
                        className="w-4 h-4 rounded border focus:ring-offset-0 appearance-none transition-all duration-200"
                        style={{ 
                          margin: 0,
                          backgroundColor: filters.categories.includes(category) ? '#8e4ec6' : '#2a2a2a',
                          borderColor: filters.categories.includes(category) ? '#8e4ec6' : '#404040',
                          borderWidth: '1px'
                        }}
                      />
                      {filters.categories.includes(category) && (
                        <svg className="absolute w-3 h-3 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      {category}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400 font-medium">{getCategoryCount(category)}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <div style={{ marginBottom: '2px' }}>
        <div 
          style={{ 
            backgroundColor: '#1a1a1a',
            borderRadius: '2px 2px 2px 2px',
            marginTop: '0px'
          }}
        >
          <button
            onClick={() => toggleSection('date')}
            className="w-full flex items-center justify-between text-white font-medium text-sm transition-colors"
            style={{ 
              padding: '12px 16px',
              marginBottom: expandedSections.date ? '16px' : '0'
            }}
            onMouseEnter={(e) => e.target.style.color = '#8e4ec6'}
            onMouseLeave={(e) => e.target.style.color = '#ffffff'}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" style={{ color: '#ff0080' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Date Found</span>
            </div>
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
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              padding: '0 16px 16px 16px'
            }}>
              <input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="w-full border text-white text-sm rounded-md px-3 py-2 transition-all"
                style={{
                  backgroundColor: '#2a2a2a',
                  borderColor: '#2a2a2a'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8e4ec6';
                  e.target.style.boxShadow = '0 0 0 2px rgba(142, 78, 198, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#2a2a2a';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="w-full border text-white text-sm rounded-md px-3 py-2 transition-all"
                style={{
                  backgroundColor: '#2a2a2a',
                  borderColor: '#2a2a2a'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#8e4ec6';
                  e.target.style.boxShadow = '0 0 0 2px rgba(142, 78, 198, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#2a2a2a';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          )}
        </div>
      </div>

       {/* Colors Filter */}
      <div>
        <div 
          style={{ 
            backgroundColor: '#1a1a1a',
            borderRadius: '2px 2px 8px 8px',
            marginTop: '0px'
          }}
        >
            <button
              onClick={() => toggleSection('colors')}
              className="w-full flex items-center justify-between text-white font-medium text-sm transition-colors"
              style={{ 
                padding: '12px 16px',
                marginBottom: expandedSections.colors ? '16px' : '0'
              }}
            onMouseEnter={(e) => e.target.style.color = '#8e4ec6'}
            onMouseLeave={(e) => e.target.style.color = '#ffffff'}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" style={{ color: '#8e4ec6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
              <span>Colors</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-200 text-gray-400 ${expandedSections.colors ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {expandedSections.colors && (
            <div style={{ padding: '0 16px 16px 16px' }}>
              <div className="grid grid-cols-2 gap-2">
                {colors.map((color) => (
                  <label 
                    key={color} 
                    className="flex items-center cursor-pointer group"
                    style={{ padding: '4px 0', gap: '8px' }}
                  >
                    <div className="relative flex items-center justify-center" style={{ width: '16px', height: '16px' }}>
                      <input
                        type="checkbox"
                        checked={filters.colors.includes(color)}
                        onChange={(e) => handleColorChange(color, e.target.checked)}
                        className="w-4 h-4 rounded border focus:ring-offset-0 appearance-none transition-all duration-200"
                        style={{ 
                          margin: 0,
                          backgroundColor: filters.colors.includes(color) ? '#8e4ec6' : '#2a2a2a',
                          borderColor: filters.colors.includes(color) ? '#8e4ec6' : '#404040',
                          borderWidth: '1px'
                        }}
                      />
                      {filters.colors.includes(color) && (
                        <svg className="absolute w-3 h-3 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{color}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}