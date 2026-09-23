export const DEMO_ACCOUNTS = {
  buyer: {
    label: 'buyer@craftlink.in',
    password: 'CraftLink@123',
    form: { identifier: 'buyer@craftlink.in', password: 'CraftLink@123' },
    user: {
      id: 'offline-buyer-1', name: 'Priya Sharma', email: 'buyer@craftlink.in',
      phone: '+91 98765 43210', role: 'buyer', default_pincode: '110001',
      default_city: 'New Delhi', offline_demo: true,
    },
  },
  seller: {
    label: 'mithila@sample.craftlink.in',
    password: 'CraftLink@123',
    form: { identifier: 'mithila@sample.craftlink.in', password: 'CraftLink@123' },
    user: {
      id: 'offline-24', name: 'Sunita Jha', store_name: 'Mithila Rang',
      email: 'mithila@sample.craftlink.in', phone: '+91 98765 84721', role: 'seller',
      craft_category: 'Traditional Paintings', region: 'Madhubani, Bihar',
      language: 'Hindi', kyc_status: 'Verified', created_at: '2025-08-15T10:00:00Z',
      offline_demo: true,
    },
  },
  admin: {
    label: 'MOSJE-101',
    password: 'CraftLink@123',
    form: { admin_id: 'MOSJE-101', officer_name: 'MoSJE Programme Officer', access_key: 'CraftLink@123' },
    user: {
      id: 'offline-admin-101', name: 'MoSJE Programme Officer', admin_id: 'MOSJE-101',
      role: 'admin', department: 'Department of Social Justice and Empowerment',
      access_level: 'Demo operations access', offline_demo: true,
    },
  },
};

const same = (left, right) => String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase();

/** Authenticate only the three documented accounts bundled with the APK. */
export function authenticateOfflineDemo(role, form = {}) {
  const account = DEMO_ACCOUNTS[role];
  if (!account) return null;
  const valid = role === 'admin'
    ? same(form.admin_id, account.form.admin_id) && form.access_key === account.form.access_key
    : same(form.identifier, account.form.identifier) && form.password === account.form.password;
  if (!valid) return null;
  return {
    ...account.user,
    ...(role === 'admin' && form.officer_name?.trim() ? { name: form.officer_name.trim() } : {}),
  };
}
