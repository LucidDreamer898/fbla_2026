'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Tag } from '@/components/ui/Tag';
import { Card } from '@/components/ui/Card';
import { submitItem } from '@/lib/itemsService';
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
  const [tagList, setTagList] = useState<string[]>([]);

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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Convert FileList to File array
      const photos = formData.photos ? Array.from(formData.photos) : [];
      
      // Submit to Firestore
      await submitItem({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        foundLocation: formData.foundLocation,
        foundDate: formData.foundDate,
        tags: formData.tags,
        photos: photos,
        reportedBy: 'anonymous', // TODO: Get from auth context
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting item:', error);
      // TODO: Show error message to user
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
        <p className="text-zinc-300 text-lg mb-10 leading-relaxed">
          A staff member will review your submission and publish it shortly.
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
          <label className="text-foreground text-sm font-medium">
            Tags
          </label>
          <Input
            placeholder="Separate tags with commas (e.g., red, backpack, laptop)"
            value={formData.tags}
            onChange={(e) => handleTagsChange(e.target.value)}
            error={errors.tags}
          />
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
