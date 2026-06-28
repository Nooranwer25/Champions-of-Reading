import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { BADGES } from '../constants/badges';

export const checkAndAwardBadges = async (userId: string, context?: { impactScore?: number, isReview?: boolean, isSubmission?: boolean }) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return;
    
    const userData = userSnap.data();
    const currentBadges = userData.badges || [];
    const newBadges: string[] = [];

    // Query approved submissions to count approved books and total pages
    const submissionsRef = collection(db, 'submissions');
    const q = query(
      submissionsRef,
      where('userId', '==', userId),
      where('status', '==', 'approved')
    );
    const submissionsSnap = await getDocs(q);
    const approvedSubmissions = submissionsSnap.docs.map(d => d.data());
    
    const approvedBooksCount = approvedSubmissions.length;
    const totalPagesRead = approvedSubmissions.reduce((sum, docData) => {
      return sum + (Number(docData.pagesRead) || 0);
    }, 0);

    // Milestone: First Submission
    if (!currentBadges.includes('first_submission')) {
      if (userData.totalPoints > 0 || userData.tomesConquered > 0 || context?.isSubmission || approvedBooksCount > 0) {
          newBadges.push('first_submission');
      }
    }

    // Milestone: First 5 Books (Grade 2 Scholar)
    if (!currentBadges.includes('books_5') && (approvedBooksCount >= 5 || userData.tomesConquered >= 5)) {
      newBadges.push('books_5');
    }

    // Milestone: 1000 Pages Read (Sage of the Archive)
    if (!currentBadges.includes('pages_1000') && totalPagesRead >= 1000) {
      newBadges.push('pages_1000');
    }

    // Milestone: 1000 Points
    if (!currentBadges.includes('points_1000') && userData.totalPoints >= 1000) {
      newBadges.push('points_1000');
    }

    // Milestone: 10 Conquests (Archive Keeper)
    if (!currentBadges.includes('tomes_10') && (userData.tomesConquered >= 10 || approvedBooksCount >= 10)) {
      newBadges.push('tomes_10');
    }

    // Milestone: High Impact (produced a max impact manifestation)
    if (!currentBadges.includes('high_impact') && context?.impactScore === 10) {
      newBadges.push('high_impact');
    }

    // Milestone: Genre Master
    if (!currentBadges.includes('genre_master')) {
      const categories = new Set(approvedSubmissions.map(s => s.category));
      if (categories.has('novel') && categories.has('poetry') && categories.has('non-fiction')) {
        newBadges.push('genre_master');
      }
    }

    // Milestone: Colony Administrator (Reviewer check)
    // We can track reviewCount if we add it to the user profile, 
    // or just use tomesConquered if it represents reviews for Archivists.
    // Assuming tomesConquered for Archivist means "Reviews Done"
    if (userData.role === 'archivist' && !currentBadges.includes('master_reviewer') && userData.tomesConquered >= 20) {
      newBadges.push('master_reviewer');
    }

    if (newBadges.length > 0) {
      await updateDoc(userRef, {
        badges: arrayUnion(...newBadges)
      });
      return newBadges;
    }
    
    return [];
  } catch (error) {
    // Ignore
    return [];
  }
};
