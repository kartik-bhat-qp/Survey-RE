export type MediaFileType = 'image' | 'video' | 'document' | 'font';

export type MediaLibraryView = 'grid' | 'list';

export type MediaLibraryShareMode = 'everyone' | 'restricted';

export interface MediaLibraryShareOption {
  value: MediaLibraryShareMode;
  label: string;
}

export const MOCK_MEDIA_LIBRARY_TEAMS = [
  'USA team',
  'EU team',
  'APAC team',
  'LATAM team',
  'Research',
  'Design',
  'Product Marketing',
  'Customer Insights',
];

export function getMediaLibraryShareOptions(orgName: string): MediaLibraryShareOption[] {
  return [
    {
      value: 'everyone',
      label: `Everyone at ${orgName} will have access to Edit`,
    },
    {
      value: 'restricted',
      label: 'OFF - only specific users or teams can access',
    },
  ];
}

export type MediaLibraryFilter =
  | 'All files'
  | 'Images'
  | 'Videos/Audio'
  | 'Documents'
  | 'Fonts';

export interface MediaLibraryFile {
  id: string;
  name: string;
  type: MediaFileType;
  /** Human readable size, e.g. "696 KB". */
  size: string;
  /** Pixel dimensions; omitted for documents and fonts. */
  resolution?: string;
  uploadedAt: string;
  folderId: string;
}

export interface MediaLibraryFolder {
  id: string;
  name: string;
  /** System folders render in the top nav instead of the Folders list. */
  system?: boolean;
  icon?: string;
}

export interface MediaLibraryStorage {
  usedLabel: string;
  totalLabel: string;
  usedPercent: number;
}

export const MEDIA_LIBRARY_SYSTEM_FOLDERS: MediaLibraryFolder[] = [
  { id: 'my-files', name: 'My Files', system: true, icon: 'wm-home-storage' },
  { id: 'common-files', name: 'Common Files', system: true, icon: 'wm-folder-shared' },
];

export const MEDIA_LIBRARY_FOLDERS: MediaLibraryFolder[] = [
  { id: 'brand-assets', name: 'Brand Assets' },
  { id: 'ali-tyson', name: 'Ali vs Tyson Campaign' },
];

export const MEDIA_LIBRARY_FILTERS: MediaLibraryFilter[] = [
  'All files',
  'Images',
  'Videos/Audio',
  'Documents',
  'Fonts',
];

export const MEDIA_LIBRARY_STORAGE: MediaLibraryStorage = {
  usedLabel: '467 MB',
  totalLabel: '5.0 GB',
  usedPercent: 9,
};

export const MEDIA_LIBRARY_PAGE_SIZE = 100;

const MEDIA_LIBRARY_SEED_FILES: MediaLibraryFile[] = [
  {
    id: 'media-1',
    name: 'SAR LOGO-2021.jpg',
    type: 'image',
    size: '696 KB',
    resolution: '731 × 447',
    uploadedAt: '2026-07-02',
    folderId: 'my-files',
  },
  {
    id: 'media-2',
    name: 'SAR LOGO-2021 (1).jpg',
    type: 'image',
    size: '696 KB',
    resolution: '731 × 447',
    uploadedAt: '2026-07-02',
    folderId: 'my-files',
  },
  {
    id: 'media-3',
    name: 'HPE-logo-full-clr-pos-rgb-survey-header-primary-2026.png',
    type: 'image',
    size: '128 KB',
    resolution: '1200 × 503',
    uploadedAt: '2026-06-28',
    folderId: 'my-files',
  },
  {
    id: 'media-4',
    name: 'ai-icon.png',
    type: 'image',
    size: '42 KB',
    resolution: '512 × 512',
    uploadedAt: '2026-06-25',
    folderId: 'my-files',
  },
  {
    id: 'media-5',
    name: 'liali.png',
    type: 'image',
    size: '1.2 MB',
    resolution: '1080 × 1080',
    uploadedAt: '2026-06-21',
    folderId: 'my-files',
  },
  {
    id: 'media-6',
    name: 'Monosnap-Ready-to-Sell-Advance-Quotas.png',
    type: 'image',
    size: '864 KB',
    resolution: '1440 × 900',
    uploadedAt: '2026-06-18',
    folderId: 'my-files',
  },
  {
    id: 'media-7',
    name: 'heatmap-first-click.png',
    type: 'image',
    size: '733 KB',
    resolution: '960 × 1200',
    uploadedAt: '2026-06-12',
    folderId: 'my-files',
  },
  {
    id: 'media-8',
    name: 'heatmap_4141119_2084451.png',
    type: 'image',
    size: '733 KB',
    resolution: '960 × 1200',
    uploadedAt: '2026-06-12',
    folderId: 'my-files',
  },
  {
    id: 'media-9',
    name: 'Gemini_Generated_Image_7tg5mj7tg.png',
    type: 'image',
    size: '2.1 MB',
    resolution: '2048 × 2048',
    uploadedAt: '2026-06-08',
    folderId: 'my-files',
  },
  {
    id: 'media-10',
    name: 'brand-guidelines.pdf',
    type: 'document',
    size: '3.4 MB',
    uploadedAt: '2026-05-12',
    folderId: 'my-files',
  },
  {
    id: 'media-11',
    name: 'FiraSans-Regular.ttf',
    type: 'font',
    size: '418 KB',
    uploadedAt: '2026-05-05',
    folderId: 'my-files',
  },
  {
    id: 'media-12',
    name: 'confused-cat.png',
    type: 'image',
    size: '388 KB',
    resolution: '1024 × 1024',
    uploadedAt: '2026-05-27',
    folderId: 'brand-assets',
  },
  {
    id: 'media-13',
    name: 'questionpro-wordmark-light.svg',
    type: 'image',
    size: '18 KB',
    resolution: '640 × 160',
    uploadedAt: '2026-05-19',
    folderId: 'brand-assets',
  },
  {
    id: 'media-14',
    name: 'mayweather-presser.jpg',
    type: 'image',
    size: '512 KB',
    resolution: '1280 × 720',
    uploadedAt: '2026-05-30',
    folderId: 'ali-tyson',
  },
  {
    id: 'media-15',
    name: 'ali-1966-archive.jpg',
    type: 'image',
    size: '244 KB',
    resolution: '800 × 1000',
    uploadedAt: '2026-05-22',
    folderId: 'ali-tyson',
  },
  {
    id: 'media-16',
    name: 'fight-night-intro.mp4',
    type: 'video',
    size: '24.6 MB',
    resolution: '1920 × 1080',
    uploadedAt: '2026-05-18',
    folderId: 'ali-tyson',
  },
];

const GENERATED_FILE_TEMPLATES: {
  prefix: string;
  ext: string;
  type: MediaFileType;
  resolution?: string;
}[] = [
  { prefix: 'survey-hero', ext: 'jpg', type: 'image', resolution: '1600 × 900' },
  { prefix: 'brand-mark', ext: 'png', type: 'image', resolution: '512 × 512' },
  { prefix: 'quota-screenshot', ext: 'png', type: 'image', resolution: '1440 × 900' },
  { prefix: 'heatmap-overlay', ext: 'png', type: 'image', resolution: '960 × 1200' },
  { prefix: 'campaign-still', ext: 'jpg', type: 'image', resolution: '1280 × 720' },
  { prefix: 'logo-lockup', ext: 'svg', type: 'image', resolution: '640 × 160' },
  { prefix: 'respondent-intro', ext: 'mp4', type: 'video', resolution: '1920 × 1080' },
  { prefix: 'field-guide', ext: 'pdf', type: 'document' },
  { prefix: 'brand-typeface', ext: 'ttf', type: 'font' },
  { prefix: 'question-icon', ext: 'png', type: 'image', resolution: '256 × 256' },
];

function padFileIndex(index: number): string {
  return String(index).padStart(3, '0');
}

function generatedFileSize(index: number, type: MediaFileType): string {
  if (type === 'video') return `${(12 + (index % 18)).toFixed(1)} MB`;
  if (type === 'document') return `${(1.1 + (index % 9) * 0.3).toFixed(1)} MB`;
  if (type === 'font') return `${180 + (index % 40) * 7} KB`;
  return index % 5 === 0 ? `${(1.1 + (index % 4) * 0.4).toFixed(1)} MB` : `${120 + (index % 80) * 9} KB`;
}

function generatedUploadDate(index: number): string {
  const day = 1 + (index % 28);
  const month = 1 + (index % 7);
  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildMyFilesLibrary(): MediaLibraryFile[] {
  const seed = MEDIA_LIBRARY_SEED_FILES.filter((file) => file.folderId === 'my-files');
  const generated: MediaLibraryFile[] = [];
  // Seed files already occupy media-1 … media-16 across folders.
  let index = 17;
  while (seed.length + generated.length < 480) {
    const template = GENERATED_FILE_TEMPLATES[(index - 1) % GENERATED_FILE_TEMPLATES.length];
    generated.push({
      id: `media-${index}`,
      name: `${template.prefix}-${padFileIndex(index)}.${template.ext}`,
      type: template.type,
      size: generatedFileSize(index, template.type),
      resolution: template.resolution,
      uploadedAt: generatedUploadDate(index),
      folderId: 'my-files',
    });
    index += 1;
  }
  return [...seed, ...generated];
}

export const MOCK_MEDIA_LIBRARY_FILES: MediaLibraryFile[] = [
  ...buildMyFilesLibrary(),
  ...MEDIA_LIBRARY_SEED_FILES.filter((file) => file.folderId !== 'my-files'),
];

/** File names used by the simulated upload flow. */
export const MEDIA_LIBRARY_SAMPLE_UPLOADS: string[] = [
  'ali-vs-tyson-poster-v2.png',
  'sar-station-hero.jpg',
  'sponsor-reel.mp4',
];

const TYPE_META: Record<MediaFileType, { icon: string; label: string }> = {
  image: { icon: 'wm-image', label: 'image' },
  video: { icon: 'wm-movie', label: 'video' },
  document: { icon: 'wm-description', label: 'document' },
  font: { icon: 'wm-font-download', label: 'font' },
};

export function getMediaTypeMeta(type: MediaFileType): { icon: string; label: string } {
  return TYPE_META[type];
}

export function getMediaTypeFromFileName(name: string): MediaFileType {
  const lower = name.toLowerCase();
  if (/\.(mp4|mov|webm|mp3|wav|m4a)$/.test(lower)) return 'video';
  if (/\.(pdf|docx?|xlsx?|pptx?|csv|txt)$/.test(lower)) return 'document';
  if (/\.(ttf|otf|woff2?)$/.test(lower)) return 'font';
  return 'image';
}

export function matchesMediaLibraryFilter(
  file: MediaLibraryFile,
  filter: MediaLibraryFilter
): boolean {
  if (filter === 'All files') return true;
  if (filter === 'Images') return file.type === 'image';
  if (filter === 'Videos/Audio') return file.type === 'video';
  if (filter === 'Documents') return file.type === 'document';
  return file.type === 'font';
}

export function buildMediaFileUrl(name: string): string {
  return `https://admin.questionpro.com/qp_userimages/sub-2/2084451/${encodeURIComponent(name)}`;
}
