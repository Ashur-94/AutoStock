import { PartCategory } from '../types';

export const ARABIC_PART_CATEGORIES: PartCategory[] = [];

export const normalizeCategory = (cat: string | undefined | null): PartCategory => {
  if (!cat) return '';
  return cat.trim();
};

export interface PartImagePreset {
  id: string;
  name: string;
  url: string;
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {};

export const getCategoryColorStyle = (cat: string | undefined | null) => {
  if (!cat || !cat.trim()) {
    return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', iconBg: 'bg-slate-500/15' };
  }
  const cleanCat = cat.trim();

  // Dynamic aesthetic palette for any custom categories created by the owner
  const palettes = [
    { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', iconBg: 'bg-amber-500/15' },
    { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', iconBg: 'bg-blue-500/15' },
    { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', iconBg: 'bg-rose-500/15' },
    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/15' },
    { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', iconBg: 'bg-violet-500/15' },
    { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', iconBg: 'bg-teal-500/15' },
    { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', iconBg: 'bg-indigo-500/15' },
    { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', iconBg: 'bg-orange-500/15' },
    { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', iconBg: 'bg-cyan-500/15' },
    { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20', iconBg: 'bg-fuchsia-500/15' },
    { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20', iconBg: 'bg-lime-500/15' },
    { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', iconBg: 'bg-sky-500/15' },
  ];

  let hash = 0;
  for (let i = 0; i < cleanCat.length; i++) {
    hash = (hash << 5) - hash + cleanCat.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
};


