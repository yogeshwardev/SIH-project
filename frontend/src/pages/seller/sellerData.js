// Pure helpers that turn real API records into seller-facing numbers.
// Nothing here invents data: empty inputs produce zeros and empty lists.

export const ACTIVE_STATUSES = ['Placed', 'Confirmed', 'Packed', 'Shipped'];
export const TO_FULFIL = ['Placed', 'Confirmed', 'Packed'];

export const NEXT_STATUS = {
  Placed: { status: 'Confirmed', label: 'Confirm order' },
  Confirmed: { status: 'Packed', label: 'Mark as packed' },
  Packed: { status: 'Shipped', label: 'Mark as shipped' },
  Shipped: { status: 'Delivered', label: 'Mark as delivered' },
};
export const CANCELLABLE = ['Placed', 'Confirmed'];

export const LOW_STOCK_THRESHOLD = 2;

// Line items belonging to this store (all items when viewing every store).
export function storeLines(order, artisanId) {
  const items = order?.items || [];
  return artisanId == null ? items : items.filter((item) => item.artisan_id === artisanId);
}

export function storeOrderValue(order, artisanId) {
  return storeLines(order, artisanId).reduce((sum, item) => sum + Number(item.line_total || 0), 0);
}

export function computeSellerMetrics(products, orders, artisanId) {
  const live = orders.filter((order) => order.status !== 'Cancelled');
  const revenue = live.reduce((sum, order) => sum + storeOrderValue(order, artisanId), 0);
  const collected = orders.filter((order) => order.status === 'Delivered').reduce((sum, order) => sum + storeOrderValue(order, artisanId), 0);
  const inTransit = orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).reduce((sum, order) => sum + storeOrderValue(order, artisanId), 0);
  const unitsSold = live.reduce((sum, order) => sum + storeLines(order, artisanId).reduce((count, item) => count + Number(item.quantity || 0), 0), 0);
  const published = products.filter((product) => product.status === 'Published');
  return {
    revenue,
    collected,
    inTransit,
    unitsSold,
    orderCount: live.length,
    averageOrder: live.length ? revenue / live.length : 0,
    toFulfil: orders.filter((order) => TO_FULFIL.includes(order.status)),
    published,
    pending: products.filter((product) => product.status === 'Pending Approval'),
    rejected: products.filter((product) => product.status === 'Rejected'),
    lowStock: published.filter((product) => Number(product.stock_quantity ?? 0) <= LOW_STOCK_THRESHOLD),
  };
}

// Revenue per day for the last `days` days, oldest first.
export function dailyRevenue(orders, artisanId, days = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    return { date, key: date.toDateString(), value: 0, orders: 0 };
  });
  const byKey = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket]));
  orders.filter((order) => order.status !== 'Cancelled').forEach((order) => {
    const date = new Date(order.created_at);
    date.setHours(0, 0, 0, 0);
    const bucket = byKey[date.toDateString()];
    if (bucket) { bucket.value += storeOrderValue(order, artisanId); bucket.orders += 1; }
  });
  return buckets;
}

export function revenueByProduct(orders, artisanId) {
  const totals = {};
  orders.filter((order) => order.status !== 'Cancelled').forEach((order) => {
    storeLines(order, artisanId).forEach((item) => {
      const entry = totals[item.product_id] || { id: item.product_id, name: item.product_name, image: item.product_image, units: 0, revenue: 0 };
      entry.units += Number(item.quantity || 0);
      entry.revenue += Number(item.line_total || 0);
      totals[item.product_id] = entry;
    });
  });
  return Object.values(totals).sort((a, b) => b.revenue - a.revenue);
}

export function revenueByCategory(orders, products, artisanId) {
  const categoryOf = Object.fromEntries(products.map((product) => [product.id, product.category || 'Uncategorised']));
  const totals = {};
  revenueByProduct(orders, artisanId).forEach((row) => {
    const category = categoryOf[row.id] || 'Uncategorised';
    totals[category] = (totals[category] || 0) + row.revenue;
  });
  return Object.entries(totals).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
}

export const maskAccount = (value) => (value ? '•••• ' + String(value).slice(-4) : null);
