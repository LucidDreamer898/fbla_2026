'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Tag } from '@/components/ui/Tag';
import { Card } from '@/components/ui/Card';
import { submitItem } from '@/lib/items/actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface FormData {
  title: string;
  description: string;
  category: string;
  foundLocation: string;
  foundDate: string;
  tags: string;
  photos: FileList | null;
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  foundLocation?: string;
  foundDate?: string;
  tags?: string;
  photos?: string;
}

const categories = [
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Accessories', label: 'Accessories' },
  { value: 'Books', label: 'Books' },
  { value: 'Other', label: 'Other' },
];

/** Simulated AI delay before applying demo tags (ms). */
const AI_SUGGEST_DELAY_MS = 950;

/** Suggested tags for the Lafayette Lancers demo shirt (report form helper). */
const DEMO_SHIRT_TAGS: readonly string[] = [
  'Lafayette High School',
  'Lancers',
  'Wildwood MO',
  'spirit wear',
  'graphic tee',
  't-shirt',
  'cream',
  'off-white',
  'yellow',
  'black',
  'school mascot',
  'established 1960',
  '1960',
  'athletic apparel',
  'Missouri',
];

export default function ReportItemForm() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    foundLocation: '',
    foundDate: '',
    tags: '',
    photos: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tagList, setTagList] = useState<string[]>([]);
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const tagListRef = useRef<string[]>([]);
  const aiSuggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  tagListRef.current = tagList;

  useEffect(() => {
    return () => {
      if (aiSuggestTimerRef.current !== null) {
        clearTimeout(aiSuggestTimerRef.current);
      }
    };
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.foundLocation.trim()) {
      newErrors.foundLocation = 'Found location is required';
    }

    if (!formData.foundDate) {
      newErrors.foundDate = 'Found date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setSubmitError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get first photo (we only support one photo for now)
      const photo = formData.photos && formData.photos.length > 0 
        ? formData.photos[0] 
        : null;

      // Submit to Supabase
      const result = await submitItem({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        foundLocation: formData.foundLocation,
        foundDate: formData.foundDate,
        tags: formData.tags,
        photo: photo,
      });
      
      if (result.success) {
        setIsSubmitted(true);
        // Redirect after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setSubmitError(result.error || 'Failed to submit item. Please try again.');
      }
    } catch (error: any) {
      console.error('Error submitting item:', error);
      setSubmitError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | FileList | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTagsChange = (value: string) => {
    setFormData(prev => ({ ...prev, tags: value }));
    
    // Convert comma-separated string to array
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setTagList(tags);
  };

  const removeTag = (indexToRemove: number) => {
    const newTags = tagList.filter((_, index) => index !== indexToRemove);
    setTagList(newTags);
    setFormData(prev => ({ ...prev, tags: newTags.join(', ') }));
  };

  const applyDemoShirtTags = () => {
    if (aiSuggestLoading) return;
    setAiSuggestLoading(true);
    aiSuggestTimerRef.current = setTimeout(() => {
      const current = tagListRef.current;
      const seen = new Set(current.map((t) => t.toLowerCase()));
      const merged = [...current];
      for (const tag of DEMO_SHIRT_TAGS) {
        const lower = tag.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          merged.push(tag);
        }
      }
      handleTagsChange(merged.join(', '));
      setAiSuggestLoading(false);
      aiSuggestTimerRef.current = null;
    }, AI_SUGGEST_DELAY_MS);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setFormData(prev => ({ ...prev, photos: files }));
  };

  if (isSubmitted) {
    return (
      <Card className="text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-500/25 animate-checkmark">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Thanks!
        </h2>
        <p className="text-zinc-300 text-lg mb-6 leading-relaxed">
          A staff member will review your submission and publish it shortly.
        </p>
        <p className="text-zinc-400 text-sm mb-10">
          Redirecting to home page in a few seconds...
        </p>
        <Link href="/">
          <button
            className="w-full relative inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-12 px-10 text-sm min-w-40"
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
              Back to Home
            </span>
          </button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white mb-1">Item Details</h2>
            <p className="text-gray-400 text-sm">
              Fill out the form below with information about the found item
            </p>
          </div>
        </div>
        
        <div className="space-y-1 mb-6">
          <div className="h-0.5 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 rounded-full"></div>
          <div className="h-0.5 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 rounded-full"></div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Title"
          placeholder="Brief description of the item"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          error={errors.title}
          required
        />

        <Textarea
          label="Description"
          placeholder="Detailed description of the item, including any identifying features..."
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          error={errors.description}
          rows={4}
          required
        />

        <Select
          label="Category"
          options={categories}
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          error={errors.category}
          required
        />

        <Input
          label="Found Location"
          placeholder="Where did you find this item?"
          value={formData.foundLocation}
          onChange={(e) => handleInputChange('foundLocation', e.target.value)}
          error={errors.foundLocation}
          required
        />

        <Input
          label="Found Date"
          type="date"
          value={formData.foundDate}
          onChange={(e) => handleInputChange('foundDate', e.target.value)}
          error={errors.foundDate}
          required
        />

        <div className="space-y-2">
          <label className="text-foreground text-sm font-medium" htmlFor="report-item-tags">
            Tags
          </label>
          <div className="flex gap-2 items-start">
            <div className="flex-1 min-w-0">
              <Input
                id="report-item-tags"
                placeholder="Separate tags with commas (e.g., red, backpack, laptop)"
                value={formData.tags}
                onChange={(e) => handleTagsChange(e.target.value)}
                error={errors.tags}
              />
            </div>
            <div
              className={cn(
                'ai-tag-suggest-wrap relative isolate h-12 w-12 shrink-0',
                aiSuggestLoading && 'ai-tag-suggest-wrap--loading'
              )}
            >
              <span
                className="ai-tag-suggest-halo pointer-events-none absolute -inset-3 rounded-xl -z-10"
                aria-hidden
              />
              <button
                type="button"
                disabled={aiSuggestLoading}
                aria-busy={aiSuggestLoading}
                aria-label={
                  aiSuggestLoading
                    ? 'Generating tag suggestions'
                    : 'Add all suggested tags from the example shirt'
                }
                onClick={applyDemoShirtTags}
                className={cn(
                  'group relative z-10 h-12 w-12 overflow-hidden rounded-lg p-0',
                  'shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_0_28px_-4px_rgba(167,139,250,0.65),0_0_40px_-10px_rgba(236,72,153,0.45),0_6px_16px_-6px_rgba(0,0,0,0.55)]',
                  'transition-shadow duration-200 ease-out',
                  'hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18)_inset,0_0_36px_-2px_rgba(167,139,250,0.85),0_0_48px_-8px_rgba(236,72,153,0.55),0_8px_20px_-6px_rgba(0,0,0,0.45)]',
                  'active:scale-[0.96]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0c]',
                  'disabled:pointer-events-none disabled:opacity-90'
                )}
              >
                <span
                  className="ai-tag-suggest-border-spin pointer-events-none"
                  aria-hidden
                />
                <span
                  className={cn(
                    'absolute inset-[2px] z-[1] flex items-center justify-center rounded-[6px]',
                    'bg-gradient-to-br from-violet-950/95 via-[#1a1025] to-cyan-950/90',
                    'transition-all duration-200',
                    'group-hover:from-violet-900/95 group-hover:via-[#221030] group-hover:to-cyan-900/90',
                    'group-disabled:from-violet-950/95 group-disabled:via-[#1a1025] group-disabled:to-cyan-950/90'
                  )}
                >
                  {aiSuggestLoading ? (
                    <span
                      className="h-5 w-5 rounded-full border-2 border-white/15 border-t-purple-300 border-r-cyan-400/60 animate-spin"
                      aria-hidden
                    />
                  ) : (
                    <svg
                      className="h-5 w-5 text-white transition-all duration-200 drop-shadow-[0_0_14px_rgba(216,180,254,0.9)] group-hover:drop-shadow-[0_0_18px_rgba(244,194,255,1),0_0_28px_rgba(34,211,238,0.35)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 0 0-3.09 3.09zM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456zM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423z" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </div>
          {aiSuggestLoading && (
            <p
              className="mt-1.5 flex items-center gap-2 text-xs text-purple-300/90"
              role="status"
              aria-live="polite"
            >
              <span
                className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.8)] animate-pulse"
                aria-hidden
              />
              Generating tag suggestions…
            </p>
          )}
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tagList.map((tag, index) => (
                <Tag key={index} onRemove={() => removeTag(index)}>
                  {tag}
                </Tag>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-foreground text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Photos
          </label>
          <div className="border-2 border-dashed border-zinc-600/50 rounded-xl p-8 text-center hover:border-purple-500/50 hover:bg-zinc-800/30 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer block relative z-10"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-gray-300 mb-2">
                {formData.photos && formData.photos.length > 0 ? (
                  <p className="font-medium text-white">{formData.photos.length} file(s) selected</p>
                ) : (
                  <p>Drag and drop photos here, or click to browse</p>
                )}
              </div>
              <p className="text-sm text-gray-500">Images only • Max 10MB each</p>
            </label>
          </div>
          {formData.photos && formData.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {Array.from(formData.photos).slice(0, 4).map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-zinc-700 group-hover:border-zinc-600 transition-colors duration-200"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        // Remove file logic would go here
                        console.log('Remove file', index);
                      }}
                      className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error message */}
        {submitError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-300 font-medium mb-1">Submission Failed</p>
                <p className="text-red-200 text-sm">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full relative inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-12 px-10 text-sm min-w-40"
          style={{ 
            background: 'linear-gradient(135deg, #8e4ec6, #ff0080)',
            padding: '2px',
          }}
          disabled={isSubmitting}
        >
          <span 
            className="w-full h-full rounded-md flex items-center justify-center"
            style={{ 
              backgroundColor: '#0b0b0c',
            }}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </div>
          ) : (
            'Submit Item'
          )}
          </span>
        </button>
      </form>
      </div>
    </Card>
  );
}
