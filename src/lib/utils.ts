import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AwardTier } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getRequiredPositivationsForStore = (tier: AwardTier, storeState: string | undefined): number => {
  // Default to PR if state is undefined, not SC, or SC not specifically defined for the tier
  if (storeState === 'SC' && typeof tier.positivacoesRequired.SC === 'number') {
      return tier.positivacoesRequired.SC;
  }
  // Assume PR is always defined as a fallback or primary requirement
  return tier.positivacoesRequired.PR;
};
