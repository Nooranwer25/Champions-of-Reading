import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Calculates the global rank of a user based on their total points.
 * Rank is 1 + count of users with more points.
 */
export const getGlobalRank = async (totalPoints: number): Promise<number> => {
  try {
    if (totalPoints === 0) {
      // If user has 0 points, they are at the bottom. 
      // We could count all users, but usually just return a large number or N/A.
      // Let's count users with > 0 points first.
      const q = query(collection(db, 'users'), where('totalPoints', '>', 0));
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count + 1;
    }

    const q = query(collection(db, 'users'), where('totalPoints', '>', totalPoints));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count + 1;
  } catch (error) {
    // Ignore
    return 0;
  }
};
