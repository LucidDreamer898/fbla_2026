'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { listItems } from '@/lib/items/queries';

/**
 * Image Carousel Component
 * 
 * Displays a horizontal scrolling carousel of item images
 * that continuously scrolls from right to left.
 */
export default function ImageCarousel() {
  const { user, isLoaded } = useUser();
  const [images, setImages] = useState<Array<{ id: string; url: string; title: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      // Only fetch if user is loaded (may be null for public view)
      if (!isLoaded) return;

      try {
        // Fetch approved items with photos
        const result = await listItems({}, false);
        let itemsWithPhotos: Array<{ id: string; url: string; title: string }> = [];
        
        if (result.success) {
          // Filter items that have photos and take up to 20
          itemsWithPhotos = result.items
            .filter(item => item.photo_url)
            .slice(0, 20)
            .map(item => ({
              id: item.id,
              url: item.photo_url!,
              title: item.title,
            }));
        }

        // Add filler images if we don't have enough real images
        const fillerImages = [
          { id: 'filler-1', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', title: 'Lost Item' },
          { id: 'filler-2', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', title: 'Found Item' },
          { id: 'filler-3', url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop', title: 'Lost Item' },
          { id: 'filler-4', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', title: 'Found Item' },
          { id: 'filler-5', url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop', title: 'Lost Item' },
          { id: 'filler-6', url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop', title: 'Found Item' },
          { id: 'filler-7', url: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=400&fit=crop', title: 'Lost Item' },
          { id: 'filler-8', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', title: 'Found Item' },
        ];

        // Combine real images with filler images, ensuring we have at least 10 images
        const allImages = [...itemsWithPhotos];
        while (allImages.length < 10) {
          allImages.push(...fillerImages);
        }
        
        // Take first 20 images and duplicate for seamless loop
        const finalImages = allImages.slice(0, 20);
        if (finalImages.length > 0) {
          setImages([...finalImages, ...finalImages]);
        }
      } catch (error) {
        console.error('Error fetching images for carousel:', error);
        // Use filler images as fallback
        const fillerImages = [
          { id: 'filler-1', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', title: 'Lost Item' },
          { id: 'filler-2', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', title: 'Found Item' },
          { id: 'filler-3', url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop', title: 'Lost Item' },
          { id: 'filler-4', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', title: 'Found Item' },
          { id: 'filler-5', url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop', title: 'Lost Item' },
          { id: 'filler-6', url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop', title: 'Found Item' },
          { id: 'filler-7', url: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=400&h=400&fit=crop', title: 'Lost Item' },
          { id: 'filler-8', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', title: 'Found Item' },
        ];
        const finalImages = [...fillerImages, ...fillerImages].slice(0, 20);
        setImages([...finalImages, ...finalImages]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [isLoaded]);

  // Don't show carousel if loading, no images, or user not loaded
  if (loading || images.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden py-4">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black via-black/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black via-black/80 to-transparent z-10 pointer-events-none" />
      
      {/* Scrolling container */}
      <div className="flex animate-scroll">
        {images.map((image, index) => (
          <div
            key={`${image.id}-${index}`}
            className="flex-shrink-0 mx-2 group"
          >
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden border border-zinc-700/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
              <Image
                src={image.url}
                alt={image.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 768px) 128px, 160px"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-white text-xs font-medium truncate">{image.title}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 60s linear infinite;
          display: flex;
          width: fit-content;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
