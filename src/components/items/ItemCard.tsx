'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Stock photos when an item has no uploaded photo (Unsplash — next.config remotePatterns).
 * Rules run in order: first phrase match in title + description + tags wins, then category, then stable hash.
 */
const Q = 'w=800&q=80&auto=format&fit=crop';

const PLACEHOLDER_RULES: { phrases: string[]; url: string }[] = [
  { phrases: ['water bottle', 'hydro flask', 'nalgene', 'thermos', 'hydroflask'], url: `https://images.unsplash.com/photo-1602143407151-7111542de6e8?${Q}` },
  { phrases: ['sunglasses', 'aviator', 'ray-ban', 'shades'], url: `https://images.unsplash.com/photo-1572635196237-14b3f281503f?${Q}` },
  { phrases: ['flash drive', 'usb drive', 'thumb drive', 'usb stick'], url: `https://images.unsplash.com/photo-1625948519849-30cbe806e241?${Q}` },
  { phrases: ['laptop charger', 'macbook charger', 'phone charger', 'charging cable', 'power adapter'], url: `https://images.unsplash.com/photo-1587825140708-1f8d7dc09e34?${Q}` },
  { phrases: ['headphones', 'earbuds', 'airpods', 'headset', 'noise-cancelling'], url: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?${Q}` },
  { phrases: ['laptop', 'macbook', 'chromebook'], url: `https://images.unsplash.com/photo-1496181133206-80ce9b88a853?${Q}` },
  { phrases: ['iphone', 'smartphone', 'cell phone', 'android phone', 'galaxy phone'], url: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?${Q}` },
  { phrases: ['textbook', 'calculus', 'algebra', 'history book'], url: `https://images.unsplash.com/photo-1544947950-fa07a98d237f?${Q}` },
  { phrases: ['lab notebook', 'spiral notebook', 'composition notebook'], url: `https://images.unsplash.com/photo-1517842645767-c956b84007cb?${Q}` },
  { phrases: ['notebook'], url: `https://images.unsplash.com/photo-1517842645767-c956b84007cb?${Q}` },
  { phrases: ['wallet', 'credit cards', 'leather wallet'], url: `https://images.unsplash.com/photo-1622483767028-733908873879?${Q}` },
  { phrases: ['key fob', 'keychain', 'set of keys', 'house key', 'car key'], url: `https://images.unsplash.com/photo-1621961458348-f013d219b50c?${Q}` },
  { phrases: ['keys'], url: `https://images.unsplash.com/photo-1621961458348-f013d219b50c?${Q}` },
  {
    phrases: ['apple watch', 'wristwatch', 'fitness tracker', 'smartwatch', 'watch'],
    url: `https://images.unsplash.com/photo-1523170335258-f5ed11844a49?${Q}`,
  },
  { phrases: ['hoodie', 'sweatshirt', 'pullover'], url: `https://images.unsplash.com/photo-1556821840-3a63f95609a7?${Q}` },
  { phrases: ['jacket', 'coat', 'windbreaker', 'north face'], url: `https://images.unsplash.com/photo-1591047139829-dce9718333d0?${Q}` },
  { phrases: ['backpack', 'jansport', 'knapsack', 'book bag'], url: `https://images.unsplash.com/photo-1553062407-98eeb64c6a62?${Q}` },
  { phrases: ['t-shirt', 'tshirt', 'polo shirt', 'dress shirt'], url: `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?${Q}` },
  { phrases: ['shoes', 'sneakers', 'boots', 'running shoes'], url: `https://images.unsplash.com/photo-1542291026-7eec264c27ff?${Q}` },
  { phrases: ['hat', 'cap', 'beanie', 'baseball cap'], url: `https://images.unsplash.com/photo-1588850561407-ed78c282e89b?${Q}` },
  { phrases: ['umbrella'], url: `https://images.unsplash.com/photo-1528164344705-47542687000d?${Q}` },
  { phrases: ['calculator'], url: `https://images.unsplash.com/photo-1587145820266-a5951ee6f620?${Q}` },
  { phrases: ['pencil', 'pen ', 'stationery'], url: `https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?${Q}` },
];

const CATEGORY_PLACEHOLDER_IMAGES: Record<string, string> = {
  Electronics: `https://images.unsplash.com/photo-1518770660439-4636190af475?${Q}`,
  Clothing: `https://images.unsplash.com/photo-1523381210438-271e8be1f52b?${Q}`,
  Accessories: `https://images.unsplash.com/photo-1611923134239-b9be5816e23c?${Q}`,
  Books: `https://images.unsplash.com/photo-1544947950-fa07a98d237f?${Q}`,
  Other: `https://images.unsplash.com/photo-1503602642458-232111445657?${Q}`,
};

const FALLBACK_PLACEHOLDER_URLS = [
  `https://images.unsplash.com/photo-1553062407-98eeb64c6a62?${Q}`,
  `https://images.unsplash.com/photo-1503602642458-232111445657?${Q}`,
  `https://images.unsplash.com/photo-1627123424574-724758594e93?${Q}`,
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function buildHaystack(item: Item): string {
  return `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase();
}

function matchPlaceholderFromItem(item: Item): string | null {
  const haystack = buildHaystack(item);

  for (const rule of PLACEHOLDER_RULES) {
    for (const phrase of rule.phrases) {
      if (phrase === 'notebook' && haystack.includes('macbook')) continue;
      if (phrase === 'keys' && haystack.includes('donkeys')) continue;
      if (haystack.includes(phrase)) return rule.url;
    }
  }
  return null;
}

/**
 * Stock URL for items without an upload, or null for a clean “no image” tile.
 * Keyword-matched items always get an illustration; ~⅓ of the rest intentionally have no image.
 */
function getPlaceholderImageUrl(item: Item): string | null {
  const fromText = matchPlaceholderFromItem(item);
  if (fromText) return fromText;

  if (hashId(item.id) % 3 === 0) return null;

  const cat = CATEGORY_PLACEHOLDER_IMAGES[item.category.trim()];
  if (cat) return cat;

  return FALLBACK_PLACEHOLDER_URLS[hashId(item.id) % FALLBACK_PLACEHOLDER_URLS.length];
}

function NoImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-900/90">
      <svg className="h-14 w-14 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
}

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
  const hasUpload = Boolean(item.imageUrl?.trim());
  const placeholderUrl = !hasUpload ? getPlaceholderImageUrl(item) : null;
  const imageSrc = hasUpload ? item.imageUrl!.trim() : placeholderUrl;

  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [item.id, item.imageUrl, placeholderUrl]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const showRaster = Boolean(imageSrc) && !imageFailed;

  return (
    <Link href={`/items/${item.id}`} className="block group h-full">
      <div className="group bg-zinc-800/40 border border-zinc-700/30 rounded-lg overflow-hidden hover:border-purple-500/30 hover:bg-zinc-700/60 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-500 backdrop-blur-md h-full flex flex-col">
      {/* Image */}
        <div className="aspect-square relative overflow-hidden group-hover:shadow-inner">
        {showRaster ? (
          <Image
            src={imageSrc!}
            alt={hasUpload ? item.title : ''}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${hasUpload ? '' : 'opacity-90'}`}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <NoImagePlaceholder />
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