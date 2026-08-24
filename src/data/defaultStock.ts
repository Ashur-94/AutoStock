import { StockItem, SampleInvoicePreset, PartCategory } from '../types';

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

export const DEFAULT_PART_PRESET_IMAGES: PartImagePreset[] = [
  {
    id: 'img-oil-syn',
    name: 'زيت محرك تخليقي',
    url: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'img-oil-valv',
    name: 'عبوة زيت سيارات',
    url: 'https://images.unsplash.com/photo-1596568359553-a56de6970068?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'img-brakes-pads',
    name: 'فحمات فرامل سيراميك',
    url: 'https://images.unsplash.com/photo-1600793575654-910699b5e4d4?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'img-rotors',
    name: 'دسكات وهوبات فرامل',
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'img-filter-oil',
    name: 'فلتر زيت وترشيح',
    url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'img-filter-air',
    name: 'فلتر هواء ومكيف',
    url: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'img-battery',
    name: 'بطارية سيارة جافة',
    url: 'https://images.unsplash.com/photo-1592853625597-7d17be820d0c?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'img-spark-plugs',
    name: 'بواجي وإشعال',
    url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'img-belts',
    name: 'سيور وخراطيم محرك',
    url: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'img-suspension',
    name: 'مساعدات ومقصات تعليق',
    url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'img-brake-cleaner',
    name: 'بخاخات ومنظفات الورشة',
    url: 'https://images.unsplash.com/photo-1585670270606-d7a8d56b0933?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'img-tires',
    name: 'إطارات وجنوط',
    url: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'img-supplies',
    name: 'مناشف ومستلزمات ورشة',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
  }
];

export const SAMPLE_INVOICE_PRESETS: SampleInvoicePreset[] = [
  {
    id: 'sample-autozone-01',
    name: 'فاتورة توريد زيوت ومستلزمات دورية',
    supplier: 'شركة الأوتوزون التجارية #4182',
    invoiceNumber: 'INV-AZ-892401',
    date: '2026-08-20',
    total: 442.20,
    itemCount: 4,
    description: 'شحنة أسبوعية من الزيوت، فلاتر المحرك، ومستلزمات الورشة الكيميائية',
    sampleItems: [
      {
        partNumber: 'MOB-5W30-SYN',
        name: 'زيت موبيل 1 تخليقي بالكامل 5W-30 (جالون 5 لتر)',
        category: 'زيوت وسوائل',
        quantity: 10,
        unitCost: 24.50,
        suggestedSellingPrice: 38.00,
        unit: 'جالون',
        locationSuggestion: 'المسار 1 - رف الزيوت أ',
        notes: 'كرتونة 10 جوالين'
      },
      {
        partNumber: 'BOSCH-3323',
        name: 'فلتر زيت محرك بوش بريميوم 3323',
        category: 'فلاتر وترشيح',
        quantity: 12,
        unitCost: 5.80,
        suggestedSellingPrice: 11.99,
        unit: 'قطعة',
        locationSuggestion: 'الرف ب-2',
        notes: 'فلتر عالي الطلب'
      },
      {
        partNumber: 'CRC-05089',
        name: 'بخاخ منظف فرامل سي آر سي براكلين الاحترافي (19 أونصة)',
        category: 'مواد ومستلزمات الورشة',
        quantity: 24,
        unitCost: 3.65,
        suggestedSellingPrice: 6.99,
        unit: 'علبة بخاخ',
        locationSuggestion: 'خزانة الكيماويات - المسار 1',
        notes: 'صندوقان كاملان (12 بخاخ لكل صندوق)'
      },
      {
        partNumber: 'VALV-0W20-5Q',
        name: 'زيت فالفولين تخليقي بالكامل 0W-20 (جالون 5 لتر)',
        category: 'زيوت وسوائل',
        quantity: 6,
        unitCost: 23.00,
        suggestedSellingPrice: 36.50,
        unit: 'جالون',
        locationSuggestion: 'المسار 1 - رف الزيوت ب'
      }
    ]
  },
  {
    id: 'sample-brakes-02',
    name: 'فاتورة تسليم فحمات ودسكات الفرامل',
    supplier: 'شركة وورلد باك لأنظمة الفرامل',
    invoiceNumber: 'WP-883190-TX',
    date: '2026-08-20',
    total: 624.00,
    itemCount: 3,
    description: 'فحمات فرامل سيراميك، دسكات مهواة، وأطقم كلبسات تثبيت',
    sampleItems: [
      {
        partNumber: 'BRM-P83024N',
        name: 'طقم فحمات فرامل أمامية سيراميك بريمبو',
        category: 'فرامل ودسكات',
        quantity: 6,
        unitCost: 34.00,
        suggestedSellingPrice: 62.00,
        unit: 'طقم',
        locationSuggestion: 'خزانة الفرامل يسار',
        notes: 'يشمل مسامير وكلبسات ستانلس ستيل'
      },
      {
        partNumber: 'PST-AR8263',
        name: 'دسكات فرامل مهواة باورستوب إيفوليوشن (زوج)',
        category: 'فرامل ودسكات',
        quantity: 4,
        unitCost: 68.00,
        suggestedSellingPrice: 115.00,
        unit: 'زوج',
        locationSuggestion: 'الرف السفلي للقطع الثقيلة أ',
        notes: 'مطلية بطبقة Geomet المقاومة للصدأ'
      },
      {
        partNumber: 'HW-BRK-CLIP-KIT',
        name: 'طقم مسامير وجلود كلبرات الفرامل ريبستوس',
        category: 'فرامل ودسكات',
        quantity: 8,
        unitCost: 18.50,
        suggestedSellingPrice: 32.00,
        unit: 'علبة',
        locationSuggestion: 'درج مستلزمات الفرامل 1',
        notes: 'طقم صيانة كليبر شامل'
      }
    ]
  },
  {
    id: 'sample-battery-ign-03',
    name: 'فاتورة بطاريات وبواجي الإشعال',
    supplier: 'بطاريات إنترستيت وبوش للكهرباء',
    invoiceNumber: 'IB-90214-E',
    date: '2026-08-19',
    total: 755.00,
    itemCount: 3,
    description: 'شحنة بطاريات سيارات جافة وبواجي إيريديوم ليزر',
    sampleItems: [
      {
        partNumber: 'INT-AGM-GRP35',
        name: 'بطارية إنترستيت AGM عالية القدرة (مقاس 35)',
        category: 'بطاريات',
        quantity: 4,
        unitCost: 135.00,
        suggestedSellingPrice: 195.00,
        unit: 'قطعة',
        locationSuggestion: 'منصة البطاريات المركزية',
        notes: 'مشحونة مسبقاً ومغلقة مصنعياً'
      },
      {
        partNumber: 'NGK-IR-6510',
        name: 'بواجي ليزر إيريديوم إن جي كي (طقم 4 حبات)',
        category: 'إشعال وكهرباء',
        quantity: 6,
        unitCost: 28.00,
        suggestedSellingPrice: 48.00,
        unit: 'علبة',
        locationSuggestion: 'درج القطع الكهربائية 3'
      },
      {
        partNumber: 'DEN-IGN-COIL-4X',
        name: 'طقم كويلات إشعال مباشر دينسو (4 كويلات)',
        category: 'إشعال وكهرباء',
        quantity: 1,
        unitCost: 125.00,
        suggestedSellingPrice: 185.00,
        unit: 'طقم',
        locationSuggestion: 'درج القطع الكهربائية 2',
        notes: 'مطابق لمواصفات الوكالة الأصلية OEM'
      }
    ]
  }
];

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


