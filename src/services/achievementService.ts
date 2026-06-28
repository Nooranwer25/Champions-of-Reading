import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';
import { TROPHIES } from '../constants/trophies';

export const checkAndAwardTrophies = async (userId: string): Promise<string[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return [];
    
    const userData = userSnap.data();
    const currentTrophies = userData.trophies || [];
    const newTrophies: string[] = [];

    // Query approved submissions to count approved books, categories and total pages
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

    const novelsCount = approvedSubmissions.filter(s => s.category === 'novel').length;
    const poetryCount = approvedSubmissions.filter(s => s.category === 'poetry').length;
    const nonfictionCount = approvedSubmissions.filter(s => s.category === 'non-fiction').length;

    // 1. Tome Sanctifier
    if (!currentTrophies.includes('first_conquest') && approvedBooksCount >= 1) {
      newTrophies.push('first_conquest');
    }

    // 2. Epic Weaver
    if (!currentTrophies.includes('novel_apprentice') && novelsCount >= 3) {
      newTrophies.push('novel_apprentice');
    }

    // 3. Verse Conjurer
    if (!currentTrophies.includes('poetry_enthusiast') && poetryCount >= 2) {
      newTrophies.push('poetry_enthusiast');
    }

    // 4. Reality Anchor
    if (!currentTrophies.includes('nonfiction_sage') && nonfictionCount >= 3) {
      newTrophies.push('nonfiction_sage');
    }

    // 5. Scholar of the First Order
    if (!currentTrophies.includes('domain_scholar') && totalPagesRead >= 1500) {
      newTrophies.push('domain_scholar');
    }

    // 6. Special Grade Sovereign
    if (!currentTrophies.includes('energy_sovereign') && userData.totalPoints >= 2500) {
      newTrophies.push('energy_sovereign');
    }

    // 7. Impenetrable Discipline
    if (!currentTrophies.includes('streak_vow') && (userData.dailyStreak || 0) >= 3) {
      newTrophies.push('streak_vow');
    }

    if (newTrophies.length > 0) {
      try {
        await updateDoc(userRef, {
          trophies: arrayUnion(...newTrophies)
        });
      } catch (err) {
        handleFirestoreError(err, 'update', `/users/${userId}`);
      }
      return newTrophies;
    }
    
    return [];
  } catch (error) {
    // Ignore errors to ensure smooth experience
    return [];
  }
};
