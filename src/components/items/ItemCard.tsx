'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  foundLocation: string;
  foundDate: string;
  tags: string[];
  imageUrl?: string;
  status: 'Approved' | 'Claimed' | 'Pending';
}

interface ItemCardProps {
  item: Item;
}

export default function ItemCard({ item }: ItemCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Link href={`/items/${item.id}`} className="block group h-full">
      <div className="group bg-zinc-800/40 border border-zinc-700/30 rounded-lg overflow-hidden hover:border-purple-500/30 hover:bg-zinc-700/60 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-500 backdrop-blur-md h-full flex flex-col">
        {/* Image */}
        <div className="aspect-square relative overflow-hidden group-hover:shadow-inner">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-gray-500 font-medium">No Image</p>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md shadow-xl border-2 ${
              item.status === 'Approved' 
                ? 'bg-emerald-500/90 text-white border-emerald-400/60' 
                : item.status === 'Claimed' 
                ? 'bg-purple-500/90 text-white border-purple-400/60'
                : 'bg-orange-500/90 text-white border-orange-400/60'
            }`}>
              {item.status}
            </span>
          </div>

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1.5 bg-zinc-800/90 backdrop-blur-md text-xs font-bold text-white rounded-full border-2 border-zinc-600/60 shadow-xl">
              {item.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-semibold text-lg text-white mb-4 group-hover:text-gray-100 transition-colors duration-300 leading-tight">
            {item.title}
          </h3>

          {/* Location and Date */}
          <div className="space-y-3 mb-5 flex-1">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="truncate font-medium">{item.foundLocation}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <div className="w-5 h-5 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-medium">{formatDate(item.foundDate)}</span>
            </div>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="relative overflow-hidden rounded-lg" style={{
              maskImage: 'linear-gradient(to right, black 0%, black 70%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 0%, black 70%, transparent 100%)'
            }}>
              <div className="flex gap-2 overflow-x-auto" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                {item.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1.5 bg-gradient-to-r from-zinc-800/50 to-zinc-700/50 text-gray-300 text-xs font-medium rounded-md border border-zinc-600/30 hover:from-purple-500/20 hover:to-pink-500/20 hover:border-purple-500/40 hover:text-white transition-all duration-300 backdrop-blur-sm whitespace-nowrap flex-shrink-0">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}