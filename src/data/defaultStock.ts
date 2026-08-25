import { PartCategory } from '../types';

export const ARABIC_PART_CATEGORIES: PartCategory[] = [
  'زيوت وسوائل',
  'فرامل ودسكات',
  'فلاتر وترشيح',
  'إشعال وكهرباء',
  'بطاريات',
  'نظام تعليق وتوجيه',
  'سيور وخراطيم',
  'مواد ومستلزمات الورشة',
  'إطارات وجنوط',
  'قطع عامة ومسامير',
];

export const normalizeCategory = (cat: string | undefined | null): PartCategory => {
  if (!cat) return 'زيوت وسوائل';
  const trimmed = cat.trim();
  const map: Record<string, PartCategory> = {
    'Fluids & Oils': 'زيوت وسوائل',
    'Fluids and Oils': 'زيوت وسوائل',
    'Fluids': 'زيوت وسوائل',
    'Oils': 'زيوت وسوائل',
    'Brakes & Rotors': 'فرامل ودسكات',
    'Brakes and Rotors': 'فرامل ودسكات',
    'Brakes': 'فرامل ودسكات',
    'Rotors': 'فرامل ودسكات',
    'Filters': 'فلاتر وترشيح',
    'Filter': 'فلاتر وترشيح',
    'Ignition & Electrical': 'إشعال وكهرباء',
    'Ignition and Electrical': 'إشعال وكهرباء',
    'Ignition': 'إشعال وكهرباء',
    'Electrical': 'إشعال وكهرباء',
    'Batteries': 'بطاريات',
    'Battery': 'بطاريات',
    'Suspension & Steering': 'نظام تعليق وتوجيه',
    'Suspension and Steering': 'نظام تعليق وتوجيه',
    'Suspension': 'نظام تعليق وتوجيه',
    'Steering': 'نظام تعليق وتوجيه',
    'Belts & Hoses': 'سيور وخراطيم',
    'Belts and Hoses': 'سيور وخراطيم',
    'Belts': 'سيور وخراطيم',
    'Hoses': 'سيور وخراطيم',
    'Shop Supplies & Chemicals': 'مواد ومستلزمات الورشة',
    'Shop Supplies and Chemicals': 'مواد ومستلزمات الورشة',
    'Shop Supplies': 'مواد ومستلزمات الورشة',
    'Chemicals': 'مواد ومستلزمات الورشة',
    'Tires & Wheels': 'إطارات وجنوط',
    'Tires and Wheels': 'إطارات وجنوط',
    'Tires': 'إطارات وجنوط',
    'Wheels': 'إطارات وجنوط',
    'General Hardware': 'قطع عامة ومسامير',
    'Hardware': 'قطع عامة ومسامير',
    'مواد صيانة وسوائل': 'مواد ومستلزمات الورشة',
    'مواد صيانة': 'مواد ومستلزمات الورشة',
  };

  if (map[trimmed]) {
    return map[trimmed];
  }

  if (ARABIC_PART_CATEGORIES.includes(trimmed as PartCategory)) {
    return trimmed as PartCategory;
  }

  // Partial matches
  const lower = trimmed.toLowerCase();
  if (lower.includes('oil') || lower.includes('fluid') || lower.includes('زيت') || lower.includes('سوائل')) {
    return 'زيوت وسوائل';
  }
  if (lower.includes('brake') || lower.includes('rotor') || lower.includes('فرامل') || lower.includes('دسك') || lower.includes('فحم')) {
    return 'فرامل ودسكات';
  }
  if (lower.includes('filter') || lower.includes('فلتر') || lower.includes('فلاتر') || lower.includes('ترشيح')) {
    return 'فلاتر وترشيح';
  }
  if (lower.includes('spark') || lower.includes('ignition') || lower.includes('electr') || lower.includes('إشعال') || lower.includes('كهرباء') || lower.includes('بواجي')) {
    return 'إشعال وكهرباء';
  }
  if (lower.includes('batt') || lower.includes('بطار')) {
    return 'بطاريات';
  }
  if (lower.includes('suspension') || lower.includes('steer') || lower.includes('تعليق') || lower.includes('توجيه') || lower.includes('مقص')) {
    return 'نظام تعليق وتوجيه';
  }
  if (lower.includes('belt') || lower.includes('hose') || lower.includes('سير') || lower.includes('خرطوم') || lower.includes('سيور')) {
    return 'سيور وخراطيم';
  }
  if (lower.includes('chemical') || lower.includes('cleaner') || lower.includes('spray') || lower.includes('supply') || lower.includes('ورشة') || lower.includes('منظف')) {
    return 'مواد ومستلزمات الورشة';
  }
  if (lower.includes('tire') || lower.includes('wheel') || lower.includes('إطار') || lower.includes('جنط') || lower.includes('كفر')) {
    return 'إطارات وجنوط';
  }

  return 'زيوت وسوائل';
};

export interface PartImagePreset {
  id: string;
  name: string;
  url: string;
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  'زيوت وسوائل': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/15'
  },
  'فرامل ودسكات': {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    iconBg: 'bg-rose-500/15'
  },
  'فلاتر وترشيح': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/15'
  },
  'إشعال وكهرباء': {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/20',
    iconBg: 'bg-yellow-500/15'
  },
  'بطاريات': {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    iconBg: 'bg-violet-500/15'
  },
  'نظام تعليق وتوجيه': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/15'
  },
  'سيور وخراطيم': {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
    iconBg: 'bg-orange-500/15'
  },
  'مواد ومستلزمات الورشة': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/15'
  },
  'إطارات وجنوط': {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/20',
    iconBg: 'bg-zinc-500/15'
  },
  'قطع عامة ومسامير': {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
    iconBg: 'bg-slate-500/15'
  },
  'Fluids & Oils': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    iconBg: 'bg-amber-500/15'
  },
  'Brakes & Rotors': {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    iconBg: 'bg-rose-500/15'
  },
  'Filters': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    iconBg: 'bg-blue-500/15'
  },
  'Ignition & Electrical': {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/20',
    iconBg: 'bg-yellow-500/15'
  },
  'Batteries': {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    iconBg: 'bg-violet-500/15'
  },
  'Suspension & Steering': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
    iconBg: 'bg-cyan-500/15'
  },
  'Belts & Hoses': {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
    iconBg: 'bg-orange-500/15'
  },
  'Shop Supplies & Chemicals': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/15'
  },
  'Tires & Wheels': {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/20',
    iconBg: 'bg-zinc-500/15'
  },
  'General Hardware': {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
    iconBg: 'bg-slate-500/15'
  }
};

export const getCategoryColorStyle = (cat: string | undefined | null) => {
  if (!cat) return CATEGORY_COLORS['زيوت وسوائل'];
  const normalized = normalizeCategory(cat);
  if (CATEGORY_COLORS[normalized]) {
    return CATEGORY_COLORS[normalized];
  }
  if (CATEGORY_COLORS[cat]) {
    return CATEGORY_COLORS[cat];
  }

  // Dynamic palette for custom categories
  const palettes = [
    { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20', iconBg: 'bg-teal-500/15' },
    { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', iconBg: 'bg-indigo-500/15' },
    { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20', iconBg: 'bg-fuchsia-500/15' },
    { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20', iconBg: 'bg-lime-500/15' },
    { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', iconBg: 'bg-sky-500/15' },
    { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', iconBg: 'bg-pink-500/15' },
  ];

  let hash = 0;
  for (let i = 0; i < cat.length; i++) {
    hash = (hash << 5) - hash + cat.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
};


