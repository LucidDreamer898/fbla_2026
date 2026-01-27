export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  foundLocation: string;
  foundDate: string;
  tags: string[];
  imageUrl: string;
  status: 'Approved' | 'Claimed' | 'Pending';
  hasPhoto: boolean;
}

// Database Item interface
export interface FirestoreItem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  dateFound: Date | { toDate: () => Date };
  status: 'pending' | 'approved' | 'claimed' | 'expired';
  photos: string[];
  reportedBy: string;
  claimedBy?: string;
  adminNotes?: string;
  createdAt: Date | { toDate: () => Date };
  updatedAt: Date | { toDate: () => Date };
  tags?: string[];
  imageUrl?: string;
}
