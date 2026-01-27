import { FirestoreItem } from '@/types/item';

// Helper to convert date-like objects to Date
function toDate(date: Date | { toDate: () => Date }): Date {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  return new Date(date as any);
}

// Convert database item to display item
export function convertFirestoreItemToDisplayItem(firestoreItem: FirestoreItem) {
  const dateFound = toDate(firestoreItem.dateFound);
  
  return {
    id: firestoreItem.id,
    title: firestoreItem.title,
    description: firestoreItem.description,
    category: firestoreItem.category,
    foundLocation: firestoreItem.location,
    foundDate: dateFound.toISOString().split('T')[0], // Convert to YYYY-MM-DD
    tags: firestoreItem.tags || [],
    imageUrl: firestoreItem.photos && firestoreItem.photos.length > 0 
      ? firestoreItem.photos[0] 
      : firestoreItem.imageUrl || '',
    status: firestoreItem.status === 'approved' ? 'Approved' : 
            firestoreItem.status === 'claimed' ? 'Claimed' : 'Pending',
    hasPhoto: (firestoreItem.photos && firestoreItem.photos.length > 0) || !!firestoreItem.imageUrl,
  };
}

// Convert form data to database item format
export function convertFormDataToFirestoreItem(formData: {
  title: string;
  description: string;
  category: string;
  foundLocation: string;
  foundDate: string;
  tags: string;
  photos: File[];
  reportedBy: string;
}) {
  return {
    title: formData.title,
    description: formData.description,
    category: formData.category,
    location: formData.foundLocation,
    dateFound: new Date(formData.foundDate),
    photos: [], // Will be populated after upload
    reportedBy: formData.reportedBy,
    tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
  };
}

// Fetch approved items from database
// TODO: Implement with your database solution
export async function fetchApprovedItems() {
  try {
    // TODO: Replace with actual database call
    // const items = await yourDatabaseService.listApprovedItems();
    // return items.map(convertFirestoreItemToDisplayItem);
    return [];
  } catch (error) {
    console.error('Error fetching items:', error);
    throw new Error('Failed to fetch items');
  }
}

// Submit new item to database
// TODO: Implement with your database solution
export async function submitItem(formData: {
  title: string;
  description: string;
  category: string;
  foundLocation: string;
  foundDate: string;
  tags: string;
  photos: File[];
  reportedBy: string;
}) {
  try {
    // TODO: Replace with actual database call
    // const firestoreItemData = convertFormDataToFirestoreItem(formData);
    // const itemId = await yourDatabaseService.createItem(firestoreItemData);
    // return itemId;
    throw new Error('Database integration not implemented');
  } catch (error) {
    console.error('Error submitting item:', error);
    throw new Error('Failed to submit item');
  }
}
