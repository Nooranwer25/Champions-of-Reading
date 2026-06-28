import { Trophy, Compass, Shield, Zap, Sparkles, BookOpen, Crown } from 'lucide-react';

export interface TrophyDef {
  id: string;
  name: string;
  description: string;
  requirement: string;
  iconName: string;
  color: string;
  tier: 'bronze' | 'silver' | 'gold' | 'special_grade';
  points: number;
}

export const TROPHIES: TrophyDef[] = [
  {
    id: 'first_conquest',
    name: 'Tome Sanctifier',
    description: 'Purified and fully recorded your first cursed book log in the Archives.',
    requirement: '1 approved book log.',
    iconName: 'Zap',
    color: 'text-amber-600',
    tier: 'bronze',
    points: 100
  },
  {
    id: 'novel_apprentice',
    name: 'Epic Weaver',
    description: 'Deciphered 3 novels. Your understanding of fictional realms is growing.',
    requirement: '3 approved Novel category submissions.',
    iconName: 'BookOpen',
    color: 'text-amber-600',
    tier: 'bronze',
    points: 150
  },
  {
    id: 'poetry_enthusiast',
    name: 'Verse Conjurer',
    description: 'Recorded 2 poetry volumes. You can read the rhythmic flow of cursed verses.',
    requirement: '2 approved Poetry category submissions.',
    iconName: 'Compass',
    color: 'text-slate-400',
    tier: 'silver',
    points: 200
  },
  {
    id: 'nonfiction_sage',
    name: 'Reality Anchor',
    description: 'Mastered 3 non-fiction scrolls, grounding your cursed energy in objective reality.',
    requirement: '3 approved Non-Fiction category submissions.',
    iconName: 'Shield',
    color: 'text-slate-400',
    tier: 'silver',
    points: 250
  },
  {
    id: 'domain_scholar',
    name: 'Scholar of the First Order',
    description: 'Achieved a total reading volume of 1,500 pages. Your intellectual domain is expanding.',
    requirement: '1,500 total pages read from approved logs.',
    iconName: 'Sparkles',
    color: 'text-yellow-400',
    tier: 'gold',
    points: 500
  },
  {
    id: 'energy_sovereign',
    name: 'Special Grade Sovereign',
    description: 'Accumulated 2,500 or more points of certified cursed energy.',
    requirement: '2,500+ total points accumulated.',
    iconName: 'Crown',
    color: 'text-purple-400 animate-pulse',
    tier: 'special_grade',
    points: 1000
  },
  {
    id: 'streak_vow',
    name: 'Impenetrable Discipline',
    description: 'Maintained a daily reading streak of 3 or more days under a strict scholarly vow.',
    requirement: '3+ days reading streak.',
    iconName: 'Trophy',
    color: 'text-yellow-400',
    tier: 'gold',
    points: 300
  }
];

export const getTrophyIcon = (iconName: string): any => {
  const icons: Record<string, any> = { Trophy, Compass, Shield, Zap, Sparkles, BookOpen, Crown };
  return icons[iconName] || Trophy;
};
