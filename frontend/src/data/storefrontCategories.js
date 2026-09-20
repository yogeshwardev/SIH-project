export const STOREFRONT_CATEGORIES = [
  { id: 'Handloom & Textiles', label: 'Handloom', image: 'textiles-v2.jpg', detail: 'Woven with character', position: 'center' },
  { id: 'Pottery & Ceramics', label: 'Pottery', image: 'ceramics-hero-v2.jpg', detail: 'Form meets function', position: '70% center' },
  { id: 'Cane & Bamboo', label: 'Bamboo', image: 'basket-v2.jpg', detail: 'Naturally beautiful', position: '27% 42%' },
  { id: 'Woodcraft & Carving', label: 'Woodcraft', image: 'woodcraft-v2.jpg', detail: 'Made to be kept', position: 'center' },
  { id: 'Metal Craft & Bell Metal', label: 'Metal art', image: 'metalcraft-v2.jpg', detail: 'Details that shine', position: 'center' },
  { id: 'Traditional Paintings', label: 'Paintings', image: 'painting-v2.jpg', detail: 'Art with a story', position: 'center' },
];

export const normalizeCategory = category => ({
  'All Categories': 'All', 'Woodcraft & Toys': 'Woodcraft & Carving',
  'Metal & Bell Metal': 'Metal Craft & Bell Metal', 'Tribal Paintings': 'Traditional Paintings',
}[category] || category || 'All');

export const storefrontImage = filename => `/images/storefront/${filename}`;
