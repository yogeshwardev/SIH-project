import React, { useMemo, useState } from 'react';
import { AlertTriangle, Download, Edit3, MessageSquareWarning, MoreHorizontal, Package, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import ProductImage from '../../components/ProductImage';
import { EmptyState, Modal, Notice, Spinner, StatusPill, cx, downloadCsv, formatDate, formatINR } from '../../components/ui';
import { LOW_STOCK_THRESHOLD, revenueByProduct } from './sellerData';

const FILTERS = [
  ['all', 'All'],
  ['Published', 'Live'],
  ['Pending Approval', 'In review'],
  ['Rejected', 'Returned'],
  ['low', 'Low stock'],
];

export default function SellerInventory({ products, orders, storeId, loading, setProducts, onNavigate }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [flash, setFlash] = useState('');

  const salesById = useMemo(() => Object.fromEntries(revenueByProduct(orders, storeId).map((row) => [row.id, row])), [orders, storeId]);
  const isLow = (product) => product.status === 'Published' && Number(product.stock_quantity ?? 0) <= LOW_STOCK_THRESHOLD;
  const counts = {
    all: products.length,
    Published: products.filter((product) => product.status === 'Published').length,
    'Pending Approval': products.filter((product) => product.status === 'Pending Approval').length,
    Rejected: products.filter((product) => product.status === 'Rejected').length,
    low: products.filter(isLow).length,
  };

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products
      .filter((product) => filter === 'all' || (filter === 'low' ? isLow(product) : product.status === filter))
      .filter((product) => !needle || [product.product_name, product.title, product.category, product.material, product.craft_type, String(product.id)].filter(Boolean).join(' ').toLowerCase().includes(needle))
      .sort((a, b) => {
        if (sort === 'price-high') return Number(b.suggested_price) - Number(a.suggested_price);
        if (sort === 'price-low') return Number(a.suggested_price) - Number(b.suggested_price);
        if (sort === 'stock') return Number(a.stock_quantity ?? 0) - Number(b.stock_quantity ?? 0);
        if (sort === 'sales') return (salesById[b.id]?.revenue || 0) - (salesById[a.id]?.revenue || 0);
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [products, filter, query, sort, salesById]);

  const exportCsv = () => {
    downloadCsv(`craftlink-products-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['ID', 'Product', 'Category', 'Status', 'Price (INR)', 'Cost (INR)', 'Stock', 'Units sold', 'Sales (INR)', 'Listed on'],
      ...visible.map((product) => [product.id, product.product_name, product.category, product.status, product.suggested_price, product.total_cost, product.stock_quantity, salesById[product.id]?.units || 0, salesById[product.id]?.revenue || 0, formatDate(product.created_at)]),
    ]);
  };

  const replaceProduct = (updated) => setProducts((list) => list.map((product) => (product.id === updated.id ? updated : product)));
  const showFlash = (message) => { setFlash(message); setTimeout(() => setFlash(''), 3500); };

  return (
    <div className="space-y-5">
      {flash && <Notice tone="success" onDismiss={() => setFlash('')}>{flash}</Notice>}

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label={t('Filter products')}>
        {FILTERS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} className={cx('chip', filter === id && 'chip-active')}>
            {id === 'low' && <AlertTriangle className={cx('h-3.5 w-3.5', filter === id ? 'text-amber-300' : 'text-amber-600')} />}
            {t(label)}<span className={cx('text-xs tabular-nums', filter === id ? 'text-brand-200' : 'text-ink-400')}>{counts[id]}</span>
          </button>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search by name, category or ID')} aria-label={t('Search products')} className="field pl-9" />
            {query && <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-800" aria-label={t('Clear search')}><X className="h-4 w-4" /></button>}
          </div>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label={t('Sort products')} className="field w-auto">
            <option value="newest">{t('Newest first')}</option>
            <option value="sales">{t('Best selling')}</option>
            <option value="price-high">{t('Price: high to low')}</option>
            <option value="price-low">{t('Price: low to high')}</option>
            <option value="stock">{t('Lowest stock')}</option>
          </select>
          <button type="button" onClick={exportCsv} disabled={!visible.length} className="btn btn-secondary"><Download className="h-4 w-4" />{t('Export')}</button>
        </div>

        {loading && !products.length ? (
          <div className="space-y-3 p-4">{[0, 1, 2, 3].map((index) => <div key={index} className="skeleton h-14" />)}</div>
        ) : !products.length ? (
          <EmptyState icon={Package} title={t('No products yet')} action={<button type="button" onClick={() => onNavigate('studio')} className="btn btn-primary"><Plus className="h-4 w-4" />{t('Create your first listing')}</button>}>
            {t('Products you create appear here after you send them for review.')}
          </EmptyState>
        ) : !visible.length ? (
          <EmptyState icon={Search} title={t('No products match')} action={<button type="button" onClick={() => { setQuery(''); setFilter('all'); }} className="btn btn-secondary">{t('Clear filters')}</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t('Product')}</th>
                  <th>{t('Status')}</th>
                  <th className="text-right">{t('Price')}</th>
                  <th className="text-right">{t('Margin')}</th>
                  <th className="text-right">{t('Stock')}</th>
                  <th className="text-right">{t('Sold')}</th>
                  <th className="w-12"><span className="sr-only">{t('Actions')}</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => {
                  const price = Number(product.suggested_price || 0);
                  const cost = Number(product.total_cost || 0);
                  const margin = price > 0 && cost > 0 ? Math.round(((price - cost) / price) * 100) : null;
                  const stock = Number(product.stock_quantity ?? 0);
                  const sales = salesById[product.id];
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="flex min-w-[260px] items-center gap-3">
                          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-paper-200 p-1 [&_img]:h-full [&_img]:object-contain"><ProductImage product={product} alt="" /></span>
                          <span className="min-w-0">
                            <span className="line-clamp-1 font-medium text-ink-900">{product.product_name}</span>
                            <span className="block text-xs text-ink-500">#{product.id} · {product.category || t('Uncategorised')}</span>
                            {product.status === 'Rejected' && product.admin_notes && (
                              <span className="mt-1 flex max-w-sm items-start gap-1 text-xs text-red-700"><MessageSquareWarning className="mt-px h-3.5 w-3.5 flex-shrink-0" /><span className="line-clamp-2">{product.admin_notes}</span></span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td><StatusPill status={product.status} label={t({ Published: 'Live', 'Pending Approval': 'In review', Rejected: 'Returned' }[product.status] || product.status)} /></td>
                      <td className="text-right font-semibold tabular-nums">{formatINR(price)}</td>
                      <td className={cx('text-right tabular-nums', margin == null ? 'text-ink-400' : margin >= 30 ? 'text-emerald-700' : margin >= 15 ? 'text-amber-700' : 'text-red-700')}>{margin == null ? '—' : `${margin}%`}</td>
                      <td className="text-right tabular-nums">
                        <span className={cx('font-medium', stock <= 0 ? 'text-red-700' : stock <= LOW_STOCK_THRESHOLD ? 'text-amber-700' : 'text-ink-800')}>{stock}</span>
                      </td>
                      <td className="text-right tabular-nums text-ink-600">{sales ? <><span className="font-medium text-ink-900">{sales.units}</span><span className="block text-xs">{formatINR(sales.revenue)}</span></> : '0'}</td>
                      <td className="relative">
                        <button type="button" onClick={() => setMenuFor(menuFor === product.id ? null : product.id)} className="btn btn-ghost btn-icon h-9 w-9" aria-label={`${t('Actions for')} ${product.product_name}`} aria-expanded={menuFor === product.id}><MoreHorizontal className="h-4 w-4" /></button>
                        {menuFor === product.id && (
                          <>
                            <button type="button" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuFor(null)} aria-hidden="true" tabIndex={-1} />
                            <div className="absolute right-4 top-12 z-20 w-48 rounded-xl border border-line bg-white p-1 shadow-lift animate-pop" role="menu">
                              <MenuButton icon={Edit3} onClick={() => { setMenuFor(null); setEditing(product); }}>{t('Edit price & stock')}</MenuButton>
                              {product.status === 'Rejected' && <MenuButton icon={RotateCcw} onClick={() => { setMenuFor(null); setEditing({ ...product, _resubmit: true }); }}>{t('Fix & resubmit')}</MenuButton>}
                              <MenuButton icon={Trash2} danger onClick={() => { setMenuFor(null); setDeleting(product); }}>{t('Delete')}</MenuButton>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {visible.length > 0 && <p className="border-t border-line px-4 py-3 text-xs text-ink-500">{t('Showing')} {visible.length} {t('of')} {products.length} {t('products')}</p>}
      </section>

      {editing && <EditProductModal product={editing} onClose={() => setEditing(null)} onSaved={(updated, message) => { replaceProduct(updated); setEditing(null); showFlash(message); }} />}
      {deleting && <DeleteProductModal product={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setProducts((list) => list.filter((product) => product.id !== deleting.id)); setDeleting(null); showFlash(t('Product deleted.')); }} />}
    </div>
  );
}

function MenuButton({ icon: Icon, danger, children, onClick }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className={cx('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium', danger ? 'text-red-700 hover:bg-red-50' : 'text-ink-800 hover:bg-paper-200')}>
      <Icon className="h-4 w-4" />{children}
    </button>
  );
}

function EditProductModal({ product, onClose, onSaved }) {
  const { t } = useLanguage();
  const resubmit = Boolean(product._resubmit);
  const [form, setForm] = useState({
    product_name: product.product_name || '',
    suggested_price: product.suggested_price ?? '',
    stock_quantity: product.stock_quantity ?? 0,
    description: product.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const price = Number(form.suggested_price);
  const stock = Number(form.stock_quantity);
  const cost = Number(product.total_cost || 0);
  const minimum = Number(product.minimum_price || 0);
  const invalid = !(price > 0) || !Number.isInteger(stock) || stock < 0 || (resubmit && form.product_name.trim().length < 3);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { suggested_price: price, stock_quantity: stock };
      if (resubmit) Object.assign(payload, { product_name: form.product_name.trim(), description: form.description.trim(), status: 'Pending Approval' });
      const updated = await api.updateProduct(product.id, payload);
      onSaved(updated, t(resubmit ? 'Sent back for review.' : 'Changes saved.'));
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={t(resubmit ? 'Fix & resubmit' : 'Edit price & stock')}
      description={product.product_name}
      footer={<><button type="button" onClick={onClose} className="btn btn-secondary">{t('Cancel')}</button><button type="button" onClick={save} disabled={invalid || saving} className="btn btn-primary">{saving && <Spinner className="h-4 w-4" />}{t(resubmit ? 'Resubmit for review' : 'Save changes')}</button></>}
    >
      <div className="space-y-4 p-5 sm:p-6">
        {error && <Notice tone="error">{error}</Notice>}
        {resubmit && product.admin_notes && <Notice tone="warning"><strong className="font-semibold">{t('Reviewer note')}:</strong> {product.admin_notes}</Notice>}
        {resubmit && (
          <>
            <div>
              <label htmlFor="edit-name" className="label">{t('Product name')}</label>
              <input id="edit-name" value={form.product_name} onChange={(event) => setForm({ ...form, product_name: event.target.value })} className="field" />
            </div>
            <div>
              <label htmlFor="edit-description" className="label">{t('Description')}</label>
              <textarea id="edit-description" rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="field resize-y" />
            </div>
          </>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-price" className="label">{t('Selling price')}</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-500">₹</span>
              <input id="edit-price" type="number" min="1" inputMode="numeric" value={form.suggested_price} onChange={(event) => setForm({ ...form, suggested_price: event.target.value })} className="field pl-8 tabular-nums" />
            </div>
          </div>
          <div>
            <label htmlFor="edit-stock" className="label">{t('Units in stock')}</label>
            <input id="edit-stock" type="number" min="0" step="1" inputMode="numeric" value={form.stock_quantity} onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })} className="field tabular-nums" />
          </div>
        </div>
        {cost > 0 && price > 0 && (
          <div className="rounded-xl bg-paper-100 px-4 py-3 text-sm">
            <div className="flex justify-between text-ink-600"><span>{t('Your cost')}</span><span className="tabular-nums">{formatINR(cost)}</span></div>
            <div className="mt-1 flex justify-between font-semibold text-ink-900"><span>{t('You earn per piece')}</span><span className={cx('tabular-nums', price - cost < 0 && 'text-red-700')}>{formatINR(price - cost)}</span></div>
          </div>
        )}
        {minimum > 0 && price > 0 && price < minimum && <Notice tone="warning">{t('This is below the minimum sustainable price of')} {formatINR(minimum)}.</Notice>}
      </div>
    </Modal>
  );
}

function DeleteProductModal({ product, onClose, onDeleted }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const remove = async () => {
    setBusy(true);
    try { await api.deleteProduct(product.id); onDeleted(); } catch (deleteError) { setError(deleteError.message); setBusy(false); }
  };
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={t('Delete this product?')}
      footer={<><button type="button" onClick={onClose} className="btn btn-secondary">{t('Keep product')}</button><button type="button" onClick={remove} disabled={busy} className="btn bg-red-700 text-white hover:bg-red-800">{busy && <Spinner className="h-4 w-4" />}{t('Delete permanently')}</button></>}
    >
      <div className="space-y-3 p-5 text-sm text-ink-700 sm:p-6">
        {error && <Notice tone="error">{error}</Notice>}
        <p><strong className="font-semibold text-ink-950">{product.product_name}</strong> {t('will be removed from your store and the marketplace. This cannot be undone.')}</p>
        <p className="text-ink-500">{t('Past orders keep their record of this item.')}</p>
      </div>
    </Modal>
  );
}
