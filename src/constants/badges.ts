import { Zap, Shield, Target, Award, Flame, Star, Trophy, Gavel, BookOpen, Bookmark } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  requirement: string;
}

export const BADGES: Badge[] = [
  {
    id: 'first_submission',
    name: 'Vow of Initiation',
    description: 'Manifested your first technique in the Culling Games.',
    iconName: 'Zap',
    color: 'text-primary',
    requirement: 'First submission created.'
  },
  {
    id: 'books_5',
    name: 'Grade 2 Scholar',
    description: 'Sealed and recorded 5 complete tomes in the Archive.',
    iconName: 'BookOpen',
    color: 'text-teal-400',
    requirement: '5 approved books.'
  },
  {
    id: 'tomes_10',
    name: 'Archive Keeper',
    description: 'Conquered 10 separate tomes of knowledge.',
    iconName: 'Award',
    color: 'text-blue-400',
    requirement: '10 approved submissions.'
  },
  {
    id: 'pages_1000',
    name: 'Sage of the Archive',
    description: 'Deciphered over 1,000 pages of sacred texts.',
    iconName: 'Bookmark',
    color: 'text-rose-500',
    requirement: '1,000 pages read.'
  },
  {
    id: 'points_1000',
    name: 'Special Grade Potential',
    description: 'Accumulated 1,000 points of cursed energy.',
    iconName: 'Flame',
    color: 'text-orange-500',
    requirement: 'Reach 1,000 points.'
  },
  {
    id: 'master_reviewer',
    name: 'Colony Administrator',
    description: 'Exerted significant influence over the barrier statutes.',
    iconName: 'Gavel',
    color: 'text-purple-500',
    requirement: 'Reviewed 20 manifestations (Archivists only).'
  },
  {
    id: 'high_impact',
    name: 'Black Flash Artist',
    description: 'Produced a manifestation with maximum impact score.',
    iconName: 'Star',
    color: 'text-[#F8E71C]',
    requirement: 'Impact score of 10.'
  },
  {
    id: 'genre_master',
    name: 'Genre Master',
    description: 'Mastered multiple disciplines of knowledge.',
    iconName: 'Shield',
    color: 'text-emerald-500',
    requirement: 'Conquered a book in all three categories.'
  },
  {
    id: 'mission_page_slasher',
    name: 'Domain Slasher',
    description: 'Conquered the 24-hour challenge of reading 50+ pages.',
    iconName: 'Zap',
    color: 'text-red-400',
    requirement: 'Completed "Page Slasher" Daily Mission.'
  },
  {
    id: 'mission_tome_finisher',
    name: 'Tome Exorcist',
    description: 'Completed and logged an entire book within a 24-hour cycle.',
    iconName: 'Trophy',
    color: 'text-yellow-400',
    requirement: 'Completed "Tome Finisher" Daily Mission.'
  },
  {
    id: 'mission_point_manifest',
    name: 'Apex Aura Focus',
    description: 'Manifested over 100 points of cursed energy in a single day.',
    iconName: 'Flame',
    color: 'text-orange-500',
    requirement: 'Completed "Cursed Purge" Daily Mission.'
  }
];

export const getBadgeIcon = (iconName: string): any => {
  const icons: Record<string, any> = { Zap, Shield, Target, Award, Flame, Star, Trophy, Gavel, BookOpen, Bookmark };
  return icons[iconName] || Star;
};
