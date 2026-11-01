import { CustomerReview } from '../types';

/**
 * Real customer reviews storage.
 * Initial state is empty so no fake or simulated reviews appear to visitors.
 * Only verified reviews submitted through the official review form or Supabase are displayed.
 */
export const INITIAL_CUSTOMER_REVIEWS: CustomerReview[] = [];

export const REVIEWS_STORAGE_KEY = 'lumir_service_reviews_v3';

/** Get all reviews from local storage, falling back to empty list */
export function getStoredReviews(): CustomerReview[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return INITIAL_CUSTOMER_REVIEWS;
}

/** Save updated reviews list to local storage */
export function saveStoredReviews(reviews: CustomerReview[]): void {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.warn('Could not save reviews to localStorage:', err);
  }
}
