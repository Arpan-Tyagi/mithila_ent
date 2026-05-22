export const categories = [
  { id: '1', slug: 'cotton', name: 'Pure Cotton' },
  { id: '2', slug: 'linen', name: 'Fine Linen' },
  { id: '3', slug: 'blends', name: 'Heritage Blends' }
];

export const products = [
  { id: '1', category_id: '1', slug: 'saree-peacock', title: 'Madhubani Peacock Saree', description: 'A beautiful silk saree with intricate peacock motifs.', weave: 'Handwoven', gsm: 120, is_featured: true, tags: ['saree', 'peacock'], status: 'active' },
  { id: '2', category_id: '1', slug: 'dupatta-lotus', title: 'Lotus Motif Dupatta', description: 'Luxurious cotton dupatta scarf featuring lotus motifs.', weave: 'Cotton', gsm: 80, is_featured: true, tags: ['dupatta', 'lotus'], status: 'active' },
  { id: '3', category_id: '2', slug: 'wall-art-tree', title: 'Tree of Life Wall Art', description: 'Traditional Madhubani wall painting showing the tree of life.', weave: 'Canvas', gsm: 300, is_featured: false, tags: ['art', 'decor'], status: 'active' },
  { id: '4', category_id: '3', slug: 'tote-elephant', title: 'Elephant Canvas Tote Bag', description: 'Stylish canvas tote bag featuring an elephant motif.', weave: 'Canvas', gsm: 250, is_featured: true, tags: ['bag', 'accessories'], status: 'active' },
  { id: '5', category_id: '2', slug: 'coaster-set', title: 'Wooden Coaster Set', description: 'Set of wooden coasters with floral patterns.', weave: 'Wood', gsm: 0, is_featured: false, tags: ['home', 'decor'], status: 'active' },
  { id: '6', category_id: '1', slug: 'cushion-cover', title: 'Peacock Cushion Cover', description: 'Square decorative cushion cover featuring vibrant peacocks.', weave: 'Cotton', gsm: 150, is_featured: false, tags: ['home', 'decor'], status: 'active' },
  { id: '7', category_id: '3', slug: 'diary-cover', title: 'Handcrafted Leather Diary', description: 'Premium leather diary with Madhubani painted cover.', weave: 'Leather', gsm: 0, is_featured: false, tags: ['stationery'], status: 'active' },
  { id: '8', category_id: '2', slug: 'shawl-pashmina', title: 'Pashmina Shawl', description: 'Luxurious pashmina shawl elegantly draped.', weave: 'Pashmina', gsm: 200, is_featured: true, tags: ['apparel', 'shawl'], status: 'active' },
  { id: '9', category_id: '1', slug: 'kurti-tunic', title: 'Cotton Kurti Tunic', description: 'Beautiful cotton kurti tunic for women with floral prints.', weave: 'Cotton', gsm: 110, is_featured: false, tags: ['apparel', 'kurti'], status: 'active' },
  { id: '10', category_id: '3', slug: 'lamp-shade', title: 'Madhubani Lamp Shade', description: 'Cylindrical table lamp shade painted with traditional motifs.', weave: 'Paper/Canvas', gsm: 100, is_featured: false, tags: ['home', 'decor'], status: 'active' }
];

export const product_variants = [
  { id: 'v1', product_id: '1', sku: 'SAR-PEA-01', color: 'Lotus Pink', price: 120.00, stock_quantity: 15, images: ['/images/products/saree_peacock_1779396777053.png'] },
  { id: 'v2', product_id: '2', sku: 'DUP-LOT-01', color: 'Yellow/Green', price: 45.00, stock_quantity: 30, images: ['/images/products/dupatta_lotus_1779396789937.png'] },
  { id: 'v3', product_id: '3', sku: 'ART-TRE-01', color: 'Multicolor', price: 85.00, stock_quantity: 10, images: ['/images/products/wall_art_tree_1779396805244.png'] },
  { id: 'v4', product_id: '4', sku: 'TOT-ELE-01', color: 'Turmeric Yellow', price: 35.00, stock_quantity: 50, images: ['/images/products/tote_elephant_1779396820360.png'] },
  { id: 'v5', product_id: '5', sku: 'COA-SET-01', color: 'Red/Blue', price: 25.00, stock_quantity: 40, images: ['/images/products/coaster_set_1779396834556.png'] },
  { id: 'v6', product_id: '6', sku: 'CUS-COV-01', color: 'Vibrant', price: 20.00, stock_quantity: 25, images: ['/images/products/cushion_cover_1779396858959.png'] },
  { id: 'v7', product_id: '7', sku: 'DIA-COV-01', color: 'Brown/Painted', price: 40.00, stock_quantity: 20, images: ['/images/products/diary_cover_1779396871270.png'] },
  { id: 'v8', product_id: '8', sku: 'SHA-PAS-01', color: 'Cream/Embroidery', price: 150.00, stock_quantity: 12, images: ['/images/products/shawl_pashmina_1779396885634.png'] },
  { id: 'v9', product_id: '9', sku: 'KUR-TUN-01', color: 'White/Floral', price: 65.00, stock_quantity: 35, images: ['/images/products/kurti_tunic_1779396899827.png'] },
  { id: 'v10', product_id: '10', sku: 'LAM-SHA-01', color: 'Warm Colors', price: 55.00, stock_quantity: 8, images: ['/images/products/lamp_shade_1779396914228.png'] }
];

export async function getShopProducts() {
  return product_variants.map(variant => ({
    ...variant,
    products: products.find(p => p.id === variant.product_id)
  }));
}

export async function getCategoryProducts(categorySlug: string) {
  const category = categories.find(c => c.slug === categorySlug);
  if (!category) return null;
  return product_variants.filter(v => products.find(p => p.id === v.product_id)?.category_id === category.id).map(variant => ({
    ...variant,
    products: products.find(p => p.id === variant.product_id)
  }));
}

export async function getProductDetail(slug: string) {
  const product = products.find(p => p.slug === slug);
  if (!product) return null;
  return {
    ...product,
    categories: categories.find(c => c.id === product.category_id),
    product_variants: product_variants.filter(v => v.product_id === product.id)
  };
}

export async function searchProducts(query: string) {
  const q = query.toLowerCase();
  const matched = products.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  return matched.map(product => ({
    ...product,
    product_variants: product_variants.filter(v => v.product_id === product.id)
  }));
}
