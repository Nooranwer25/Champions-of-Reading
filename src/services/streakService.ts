import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Calculates and updates the user's consecutive day reading streak based on their book submissions.
 * A streak is maintained if there is at least one submission on consecutive calendar days.
 * The streak is active if the latest submission was today or yesterday.
 */
export const updateReadingStreak = async (userId: string): Promise<number> => {
  try {
    const submissionsRef = collection(db, 'submissions');
    const q = query(
      submissionsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    
    // Extract unique dates of submissions in local timezone
    const datesSet = new Set<string>();
    snap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const createdAt = data.createdAt;
      if (createdAt) {
        let dateObj: Date;
        if (typeof createdAt.toDate === 'function') {
          dateObj = createdAt.toDate();
        } else if (createdAt.seconds) {
          dateObj = new Date(createdAt.seconds * 1000);
        } else {
          dateObj = new Date(createdAt);
        }
        
        // Convert to local YYYY-MM-DD
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        datesSet.add(`${yyyy}-${mm}-${dd}`);
      }
    });

    const uniqueDates = Array.from(datesSet).sort((a, b) => b.localeCompare(a)); // newest first

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const userRef = doc(db, 'users', userId);

    if (uniqueDates.length === 0) {
      await updateDoc(userRef, { dailyStreak: 0 });
      return 0;
    }

    const newestDate = uniqueDates[0];
    
    // If the newest submission was neither today nor yesterday, the streak is broken
    if (newestDate !== todayStr && newestDate !== yesterdayStr) {
      await updateDoc(userRef, { dailyStreak: 0 });
      return 0;
    }

    // Traverse starting from newestDate to find the consecutive sequence
    let streak = 1;
    let currentDateStr = newestDate;

    for (let i = 1; i < uniqueDates.length; i++) {
      // Parse current date string to calculate the expected previous date
      const parts = currentDateStr.split('-').map(Number);
      const currDate = new Date(parts[0], parts[1] - 1, parts[2]);
      
      const expectedPrev = new Date(currDate);
      expectedPrev.setDate(expectedPrev.getDate() - 1);
      
      const expectedPrevStr = `${expectedPrev.getFullYear()}-${String(expectedPrev.getMonth() + 1).padStart(2, '0')}-${String(expectedPrev.getDate()).padStart(2, '0')}`;
      
      if (uniqueDates[i] === expectedPrevStr) {
        streak++;
        currentDateStr = expectedPrevStr;
      } else {
        break; // Sequence broken
      }
    }

    // Save streak and the last logged book date to the user's profile
    await updateDoc(userRef, { 
      dailyStreak: streak,
      lastBookLoggedDate: newestDate
    });

    return streak;
  } catch (error) {
    console.error("Failed to update reading streak:", error);
    return 0;
  }
};
