export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPING: 'SHIPPING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Chờ xử lý',
  [ORDER_STATUS.PROCESSING]: 'Đang xử lý',
  [ORDER_STATUS.SHIPPING]: 'Đang giao',
  [ORDER_STATUS.COMPLETED]: 'Hoàn thành',
  [ORDER_STATUS.CANCELLED]: 'Đã hủy',
};

export const ORDER_STATUS_CLASSES = {
  [ORDER_STATUS.PENDING]: 'bg-amber-100 text-amber-800',
  [ORDER_STATUS.PROCESSING]: 'bg-blue-100 text-blue-800',
  [ORDER_STATUS.SHIPPING]: 'bg-violet-100 text-violet-800',
  [ORDER_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
};

/**
 * Valid order state machine transitions according to SRS FR-06:
 * PENDING -> PROCESSING -> SHIPPING -> COMPLETED
 * PENDING / PROCESSING / SHIPPING can transition to CANCELLED
 * COMPLETED / CANCELLED are terminal states
 */
export const VALID_ORDER_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPING]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

export const SORT_OPTIONS = [
  { value: '', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá: Thấp đến Cao' },
  { value: 'price_desc', label: 'Giá: Cao đến Thấp' },
  { value: 'stock_desc', label: 'Tồn kho nhiều nhất' },
  { value: 'rating_desc', label: 'Đánh giá cao nhất' },
];

/**
 * Free shipping threshold in VND (Design.md 7.4)
 */
export const FREE_SHIP_THRESHOLD = 300000;

/**
 * Category metadata mapping per Design.md 2.7.4
 * Matches category name / slug to icon emoji, card bg and sticker bg
 */
export const CATEGORY_META = {
  'Đồ chơi': {
    emoji: '🧩',
    bg: 'bg-secondary-50',
    sticker: 'bg-secondary-100',
    border: 'border-secondary-200',
    text: 'text-secondary-700',
  },
  'Quà tặng': {
    emoji: '🎁',
    bg: 'bg-primary-50',
    sticker: 'bg-primary-100',
    border: 'border-primary-200',
    text: 'text-primary-700',
  },
  'Phụ kiện': {
    emoji: '🔑',
    bg: 'bg-secondary-50',
    sticker: 'bg-secondary-200',
    border: 'border-secondary-200',
    text: 'text-secondary-700',
  },
  'Văn phòng phẩm': {
    emoji: '✏️',
    bg: 'bg-primary-50',
    sticker: 'bg-primary-200',
    border: 'border-primary-200',
    text: 'text-primary-700',
  },
  'Gối & thú bông': {
    emoji: '🧸',
    bg: 'bg-secondary-50',
    sticker: 'bg-secondary-100',
    border: 'border-secondary-200',
    text: 'text-secondary-700',
  },
};

export const DEFAULT_CATEGORY_META = {
  emoji: '🎈',
  bg: 'bg-primary-50',
  sticker: 'bg-primary-100',
  border: 'border-primary-200',
  text: 'text-primary-700',
};

export function getCategoryMeta(name) {
  if (!name) return DEFAULT_CATEGORY_META;
  const lower = name.toLowerCase();
  if (lower.includes('đồ chơi') || lower.includes('lego') || lower.includes('game')) {
    return CATEGORY_META['Đồ chơi'];
  }
  if (lower.includes('quà tặng') || lower.includes('lưu niệm')) {
    return CATEGORY_META['Quà tặng'];
  }
  if (lower.includes('phụ kiện') || lower.includes('điện thoại') || lower.includes('móc khóa')) {
    return CATEGORY_META['Phụ kiện'];
  }
  if (lower.includes('văn phòng phẩm') || lower.includes('sách') || lower.includes('vở') || lower.includes('bút')) {
    return CATEGORY_META['Văn phòng phẩm'];
  }
  if (lower.includes('gối') || lower.includes('thú bông') || lower.includes('gấu') || lower.includes('gia dụng')) {
    return CATEGORY_META['Gối & thú bông'];
  }
  return DEFAULT_CATEGORY_META;
}
