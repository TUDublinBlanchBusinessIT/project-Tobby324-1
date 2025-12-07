import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';

// Types
export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  pricePerDay: number;
  isFree: boolean;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BorrowRequest {
  id: string;
  itemId: string;
  itemName: string;
  borrowerId: string;
  borrowerName: string;
  lenderId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Items CRUD Operations

export async function createItem(itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'items'), {
      ...itemData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
}

export async function getItem(itemId: string): Promise<Item | null> {
  try {
    const docRef = doc(db, 'items', itemId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Item;
    }
    return null;
  } catch (error) {
    console.error('Error getting item:', error);
    throw error;
  }
}

export async function getAllItems(): Promise<Item[]> {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'items'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Item[];
  } catch (error) {
    console.error('Error getting items:', error);
    throw error;
  }
}

export async function getAvailableItems(category?: string): Promise<Item[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('available', '==', true)
    ];

    if (category && category !== 'All') {
      constraints.push(where('category', '==', category));
    }

    const q = query(collection(db, 'items'), ...constraints);
    const querySnapshot = await getDocs(q);

    // Sort in memory instead of using orderBy to avoid index requirement
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Item[];

    return items.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error getting available items:', error);
    throw error;
  }
}

export async function searchItems(searchQuery: string): Promise<Item[]> {
  try {
    const allItems = await getAllItems();

    if (!searchQuery.trim()) {
      return allItems.filter(item => item.available);
    }

    const lowerQuery = searchQuery.toLowerCase();
    return allItems.filter(item =>
      item.available && (
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery)
      )
    );
  } catch (error) {
    console.error('Error searching items:', error);
    throw error;
  }
}

export async function updateItem(itemId: string, updates: Partial<Item>): Promise<void> {
  try {
    const docRef = doc(db, 'items', itemId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

export async function deleteItem(itemId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'items', itemId));
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
}

// Request CRUD Operations

export async function createRequest(requestData: Omit<BorrowRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'requests'), {
      ...requestData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
}

export async function getRequest(requestId: string): Promise<BorrowRequest | null> {
  try {
    const docRef = doc(db, 'requests', requestId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as BorrowRequest;
    }
    return null;
  } catch (error) {
    console.error('Error getting request:', error);
    throw error;
  }
}

export async function getUserRequests(userId: string): Promise<BorrowRequest[]> {
  try {
    const q = query(
      collection(db, 'requests'),
      where('borrowerId', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    // Sort in memory instead of using orderBy to avoid index requirement
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BorrowRequest[];

    return requests.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error getting user requests:', error);
    throw error;
  }
}

export async function getLenderRequests(userId: string): Promise<BorrowRequest[]> {
  try {
    const q = query(
      collection(db, 'requests'),
      where('lenderId', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    // Sort in memory instead of using orderBy to avoid index requirement
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BorrowRequest[];

    return requests.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error getting lender requests:', error);
    throw error;
  }
}

export async function updateRequestStatus(
  requestId: string,
  status: BorrowRequest['status']
): Promise<void> {
  try {
    const docRef = doc(db, 'requests', requestId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
}

// Real-time listeners

export function subscribeToUserRequests(
  userId: string,
  callback: (requests: BorrowRequest[]) => void
): () => void {
  const q = query(
    collection(db, 'requests'),
    where('borrowerId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BorrowRequest[];

    // Sort in memory
    requests.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    callback(requests);
  });
}

export function subscribeToAvailableItems(
  callback: (items: Item[]) => void,
  category?: string
): () => void {
  const constraints: QueryConstraint[] = [
    where('available', '==', true)
  ];

  if (category && category !== 'All') {
    constraints.push(where('category', '==', category));
  }

  const q = query(collection(db, 'items'), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Item[];

    // Sort in memory
    items.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    callback(items);
  });
}

// Image upload helper

export async function uploadItemImage(uri: string, itemId: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, `items/${itemId}/${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob);

    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
