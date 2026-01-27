import { z } from 'zod';

// Item validation schemas
export const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  category: z.string().min(1, 'Category is required').max(50, 'Category must be less than 50 characters'),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be less than 100 characters'),
  dateFound: z.date(),
  photos: z.array(z.string().url()).max(5, 'Maximum 5 photos allowed').optional().default([]),
  reportedBy: z.string().min(1, 'Reporter ID is required'),
});

export const updateItemSchema = createItemSchema.partial().extend({
  id: z.string().min(1, 'Item ID is required'),
  status: z.enum(['pending', 'approved', 'claimed', 'expired']).optional(),
  adminNotes: z.string().max(500, 'Admin notes must be less than 500 characters').optional(),
});

// Claim validation schemas
export const createClaimSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  claimedBy: z.string().min(1, 'Claimant ID is required'),
  claimDescription: z.string().min(1, 'Claim description is required').max(500, 'Description must be less than 500 characters'),
  contactInfo: z.string().min(1, 'Contact information is required').max(200, 'Contact info must be less than 200 characters'),
});

export const updateClaimSchema = createClaimSchema.partial().extend({
  id: z.string().min(1, 'Claim ID is required'),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  adminNotes: z.string().max(500, 'Admin notes must be less than 500 characters').optional(),
});

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name must be less than 50 characters'),
  role: z.enum(['admin', 'staff', 'viewer']).default('viewer'),
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().min(1, 'User ID is required'),
});

// Search and filter schemas
export const searchItemsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['pending', 'approved', 'claimed', 'expired']).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(5 * 1024 * 1024), // 5MB default
  allowedTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/webp']),
});

// Contact form validation
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject must be less than 100 characters'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters'),
});

// Type exports
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type UpdateClaimInput = z.infer<typeof updateClaimSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SearchItemsInput = z.infer<typeof searchItemsSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
