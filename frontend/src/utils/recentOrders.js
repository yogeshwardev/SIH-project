// Orders placed on this device, so buyers can re-open tracking without retyping.
const KEY = 'craftlink_recent_orders';

export function getRecentOrders() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.filter((item) => item?.order_number && item?.email) : [];
  } catch {
    return [];
  }
}

export function rememberOrder(order) {
  if (!order?.order_number || !order?.buyer_email) return;
  const entry = { order_number: order.order_number, email: order.buyer_email, total: order.total_amount, placed_at: order.created_at };
  const list = [entry, ...getRecentOrders().filter((item) => item.order_number !== entry.order_number)].slice(0, 10);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
}
