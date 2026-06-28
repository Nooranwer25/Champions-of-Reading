export enum UserRole {
  CHAMPION = 'champion',
  ARCHIVIST = 'archivist'
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  totalPoints: number;
  rank?: number;
  titles: string[];
  badges: string[];
  tomesConquered: number;
  role: UserRole;
  createdAt: string;
  bio?: string;
  favoriteGenres?: string[];
  profileBannerUrl?: string;
  monthlyGoal?: number;
  dailyStreak?: number;
  lastActivityDate?: string;
  trophies?: string[];
}

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export enum BookCategory {
  NOVEL = 'novel',
  POETRY = 'poetry',
  NON_FICTION = 'non-fiction'
}

export interface Submission {
  submissionId: string;
  userId: string;
  userName: string;
  bookTitle: string;
  author: string;
  category: BookCategory;
  synopsis: string;
  assessment: string;
  rating: number;
  coverImageUrl?: string;
  status: SubmissionStatus;
  pointsEarned: number;
  impactScore?: number;
  judgeNotes?: string;
  pagesRead?: number;
  createdAt: any;
}

export interface LeagueRules {
  content: string;
  lastUpdated: any;
  updatedBy: string;
}

export interface GlobalStats {
  activeChampions: number;
  tomesConquered: number;
  pendingAdjudications: number;
}
