import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, Banknote, ChevronLeft, ChevronRight, Hand, MapPin, PackageSearch, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Sparkles, Store, Truck, X } from 'lucide-react';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import BulkQuoteModal from '../components/BulkQuoteModal';
import { Notice, cx, formatINR } from '../components/ui';
import { useLanguage } from '../context/LanguageContext';
import { STOREFRONT_CATEGORIES, normalizeCategory, storefrontImage } from '../data/storefrontCategories';
import { productPrice, productTitle } from '../utils/productMedia';

const PAGE_SIZE = 16;
const CATEGORIES = [{ id: 'All', label: 'All crafts' }, ...STOREFRONT_CATEGORIES];
const PRICE_BUCKETS = [
  { id: 'u1000', label: 'Under ₹1,000', test: (price) => price < 1000 },
  { id: '1000-3000', label: '₹1,000 – ₹3,000', test: (price) => price >= 1000 && price <= 3000 },
  { id: '3000-10000', label: '₹3,000 – ₹10,000', test: (price) => price > 3000 && price <= 10000 },
  { id: 'o10000', label: 'Over ₹10,000', test: (price) => price > 10000 },
];
const SORTS = [['recent', 'Newest'], ['ascending', 'Price: low to high'], ['descending', 'Price: high to low'], ['name', 'Name: A–Z']];
const HERO_SLIDES = [
  ['hero-weaver.jpg', 'Handloom weaving'],
  ['hero-potter.jpg', 'Pottery on the wheel'],
  ['hero-blockprint.jpg', 'Hand block printing'],
  ['hero-woodcarver.jpg', 'Wood carving'],
];
const POPULAR = ['Kanchipuram', 'Blue pottery', 'Dhokra', 'Madhubani', 'Channapatna', 'Bamboo lamp'];

const stateOf = (product) => (product.region || '').split(',').pop().trim();
const imageOf = (product) => product?.enhanced_image || product?.original_image;

export default function BuyerDashboardPage({ onAddToCart, onBuyNow, searchTerm = '', onSearch, onOpenSeller, onClearSearch, selectedCategory = 'All', onCategoryChange, currentUser = null }) {
  const { locale, t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceBucket, setPriceBucket] = useState('');
  const [region, setRegion] = useState('');
  const [maker, setMaker] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState('recent');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [bulkProduct, setBulkProduct] = useState(null);
  const requestRef = useRef(0);
  const activeCategory = normalizeCategory(selectedCategory);

  const loadProducts = async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setError('');
    try {
      const [data, artisans] = await Promise.all([api.getProducts({ status: 'Published' }), api.getArtisans().catch(() => [])]);
      if (!Array.isArray(data)) throw new Error('Invalid collection response');
      if (request !== requestRef.current) return;
      setProducts(data.map((product) => ({ ...product, _catalogKey: 'database-' + product.id })));
      setStores(Object.fromEntries((artisans || []).map((artisan) => [artisan.id, artisan.store_name || artisan.name])));
    } catch {
      if (request === requestRef.current) setError('Could not load the collection.');
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  };
  useEffect(() => { loadProducts(); return () => { requestRef.current += 1; }; }, []);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchTerm, activeCategory, priceBucket, region, maker, inStockOnly, sort]);

  const matchesSearch = (product) => {
    const query = searchTerm.trim().toLocaleLowerCase(locale);
    if (!query) return true;
    return [product.product_name, product.title, product.title_hindi, product.title_telugu, product.material, product.artisan_name, stores[product.artisan_id], product.craft_type, product.region, product.category]
      .filter(Boolean).join(' ').toLocaleLowerCase(locale).includes(query);
  };
  const passes = (product, skip) => matchesSearch(product)
    && (skip === 'category' || activeCategory === 'All' || normalizeCategory(product.category) === activeCategory)
    && (skip === 'price' || !priceBucket || PRICE_BUCKETS.find((bucket) => bucket.id === priceBucket).test(productPrice(product)))
    && (skip === 'region' || !region || stateOf(product) === region)
    && (skip === 'maker' || !maker || String(product.artisan_id) === maker)
    && (!inStockOnly || Number(product.stock_quantity) > 0);

  const filtered = useMemo(() => products.filter((product) => passes(product)).sort((a, b) => {
    if (sort === 'ascending') return productPrice(a) - productPrice(b);
    if (sort === 'descending') return productPrice(b) - productPrice(a);
    if (sort === 'recent') return Number(b.id) - Number(a.id);
    return productTitle(a, locale).localeCompare(productTitle(b, locale), locale);
  }), [products, stores, searchTerm, activeCategory, priceBucket, region, maker, inStockOnly, sort, locale]);

  const tally = (items, keyOf) => Object.entries(items.reduce((map, item) => { const key = keyOf(item); if (key) map[key] = (map[key] || 0) + 1; return map; }, {})).sort((a, b) => b[1] - a[1]);
  const counts = useMemo(() => ({
    category: Object.fromEntries(CATEGORIES.map((category) => [category.id, products.filter((product) => passes(product, 'category') && (category.id === 'All' || normalizeCategory(product.category) === category.id)).length])),
    price: Object.fromEntries(PRICE_BUCKETS.map((bucket) => [bucket.id, products.filter((product) => passes(product, 'price') && bucket.test(productPrice(product))).length])),
    regions: tally(products.filter((product) => passes(product, 'region')), stateOf),
    makers: tally(products.filter((product) => passes(product, 'maker')), (product) => product.artisan_id && String(product.artisan_id)),
  }), [products, stores, searchTerm, activeCategory, priceBucket, region, maker, inStockOnly]);

  // Maker profiles derived from published listings only.
  const makers = useMemo(() => {
    const map = {};
    products.forEach((product) => {
      if (!product.artisan_id) return;
      const entry = map[product.artisan_id] || { id: String(product.artisan_id), name: product.artisan_name, store: stores[product.artisan_id] || product.artisan_name, region: product.region, products: [], crafts: new Set() };
      entry.products.push(product);
      if (product.craft_type) entry.crafts.add(product.craft_type);
      map[product.artisan_id] = entry;
    });
    // Makers with full product photography first, then by catalogue size.
    const photoCount = (entry) => entry.products.filter((item) => !/\.png/i.test(imageOf(item) || '')).length;
    return Object.values(map).sort((a, b) => photoCount(b) - photoCount(a) || b.products.length - a.products.length);
  }, [products, stores]);

  const hasFilters = activeCategory !== 'All' || Boolean(priceBucket || region || maker) || inStockOnly || Boolean(searchTerm.trim());
  const clearFilters = () => { onCategoryChange?.('All'); setPriceBucket(''); setRegion(''); setMaker(''); setInStockOnly(false); onClearSearch?.(); };
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const showCollection = (apply) => { clearFilters(); apply?.(); setTimeout(() => scrollTo('collection'), 30); };
  const featured = useMemo(() => {
    const picks = products.filter((product) => product.is_featured);
    return (picks.length ? picks : [...products].sort((a, b) => b.id - a.id)).slice(0, 10);
  }, [products]);
  const states = useMemo(() => tally(products, stateOf), [products]);
  const categoryLabel = CATEGORIES.find((category) => category.id === activeCategory)?.label || 'All crafts';
  const makerName = makers.find((entry) => entry.id === maker)?.store;
  const findImage = (words) => imageOf(products.find((product) => words.some((word) => `${product.product_name} ${product.craft_type}`.toLowerCase().includes(word))));

  const activeChips = [
    activeCategory !== 'All' && { key: 'cat', label: t(categoryLabel), clear: () => onCategoryChange?.('All') },
    priceBucket && { key: 'price', label: PRICE_BUCKETS.find((bucket) => bucket.id === priceBucket).label, clear: () => setPriceBucket('') },
    region && { key: 'region', label: region, clear: () => setRegion('') },
    maker && { key: 'maker', label: makerName || t('Maker'), clear: () => setMaker('') },
    inStockOnly && { key: 'stock', label: t('In stock'), clear: () => setInStockOnly(false) },
    searchTerm.trim() && { key: 'q', label: `“${searchTerm.trim()}”`, clear: () => onClearSearch?.() },
  ].filter(Boolean);

  const filterPanel = (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1 pb-2">
        <h2 className="text-lg font-bold">{t('Filters')}</h2>
        {hasFilters && <button type="button" onClick={clearFilters} className="text-sm font-semibold text-brand-600 hover:underline">{t('Clear all')}</button>}
      </div>
      <FilterGroup title={t('Craft')}>
        {CATEGORIES.map((category) => <FilterOption key={category.id} name="category" checked={activeCategory === category.id} onChange={() => onCategoryChange?.(category.id)} label={t(category.label)} count={counts.category[category.id]} />)}
      </FilterGroup>
      <FilterGroup title={t('Price')}>
        <FilterOption name="price" checked={!priceBucket} onChange={() => setPriceBucket('')} label={t('Any price')} />
        {PRICE_BUCKETS.map((bucket) => <FilterOption key={bucket.id} name="price" checked={priceBucket === bucket.id} onChange={() => setPriceBucket(bucket.id)} label={bucket.label} count={counts.price[bucket.id]} />)}
      </FilterGroup>
      {counts.regions.length > 0 && (
        <FilterGroup title={t('Made in')}>
          <FilterOption name="region" checked={!region} onChange={() => setRegion('')} label={t('All states')} />
          {counts.regions.map(([name, count]) => <FilterOption key={name} name="region" checked={region === name} onChange={() => setRegion(name)} label={name} count={count} />)}
        </FilterGroup>
      )}
      {counts.makers.length > 0 && (
        <FilterGroup title={t('Maker')} defaultOpen={false}>
          <FilterOption name="maker" checked={!maker} onChange={() => setMaker('')} label={t('All makers')} />
          {counts.makers.map(([id, count]) => <FilterOption key={id} name="maker" checked={maker === id} onChange={() => setMaker(id)} label={makers.find((entry) => entry.id === id)?.store || t('Maker')} count={count} />)}
        </FilterGroup>
      )}
      <FilterGroup title={t('Availability')}>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-ink-800 hover:bg-paper-100">
          <input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} className="h-4 w-4 rounded accent-brand-600" />
          {t('In stock only')}
        </label>
      </FilterGroup>
    </div>
  );

  return (
    <div className="pb-6">
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-4 pt-5 sm:px-6">
        <div className="grid overflow-hidden rounded-3xl bg-brand-900 lg:grid-cols-[1.05fr_1fr]">
          <div className="bg-buti relative flex flex-col justify-center px-6 py-10 sm:px-12 sm:py-14">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-clay-200">
              <Sparkles className="h-3.5 w-3.5" />
              {makers.length ? `${makers.length} ${t('makers')} · ${states.length} ${t('states')} · ${products.length} ${t('handmade pieces')}` : t('Handmade across India')}
            </span>
            <h1 className="mt-5 text-[34px] font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-[56px]">
              {t('Made by hand.')}<br /><span className="text-clay-400">{t('Sent from the maker.')}</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-brand-100">{t('Sarees, pottery, brass and folk art from artisan studios across India. Every piece is checked before it goes live, and you pay cash on delivery.')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button type="button" onClick={() => showCollection()} className="btn btn-lg btn-accent rounded-full">{t('Shop the collection')}<ArrowRight className="h-5 w-5" /></button>
              <button type="button" onClick={() => scrollTo('makers')} className="btn btn-lg rounded-full border border-white/25 text-white hover:bg-white/10">{t('Meet the makers')}</button>
            </div>
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">{t('Popular searches')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {POPULAR.map((term) => (
                  <button key={term} type="button" onClick={() => { clearFilters(); onSearch?.(term); setTimeout(() => scrollTo('collection'), 30); }} className="rounded-full border border-white/15 px-3 py-1 text-sm text-brand-100 transition hover:border-clay-400 hover:text-white">
                    {t(term)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <HeroGallery featured={featured[0]} onView={setDetailProduct} />
        </div>
      </section>

      {/* ── Trust strip ───────────────────────────────────── */}
      <section className="mx-auto mt-4 grid max-w-[1320px] grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4" aria-label={t('Why CraftLink')}>
        {[[Hand, 'Made by hand', 'Direct from artisan studios'], [ShieldCheck, 'Checked before listing', 'Every piece is reviewed'], [Banknote, 'Cash on delivery', 'Pay when it reaches you'], [Truck, 'Free delivery', 'On every order in India']].map(([Icon, title, detail]) => (
          <div key={title} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-card">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-clay-50 text-clay-600"><Icon className="h-5 w-5" /></span>
            <span className="min-w-0"><strong className="block truncate font-display text-sm font-bold text-ink-950">{t(title)}</strong><span className="block truncate text-xs text-ink-500">{t(detail)}</span></span>
          </div>
        ))}
      </section>

      {/* ── Shop by craft ─────────────────────────────────── */}
      <Section id="crafts" eyebrow={t('Six craft traditions')} title={t('Shop by craft')} action={<button type="button" onClick={() => showCollection()} className="link text-sm">{t('Browse everything')} →</button>}>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
          {STOREFRONT_CATEGORIES.map((category) => {
            const items = products.filter((product) => normalizeCategory(product.category) === category.id);
            const cover = imageOf(items.find((item) => item.is_featured) || items.find((item) => !/\.png/i.test(imageOf(item) || ''))) || storefrontImage(category.image);
            const makerCount = new Set(items.map((item) => item.artisan_id)).size;
            return (
              <button key={category.id} type="button" onClick={() => showCollection(() => onCategoryChange?.(category.id))} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-brand-900 text-left">
                <img src={cover} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block font-display text-lg font-bold text-white">{t(category.label)}</span>
                  <span className="mt-0.5 block text-xs text-brand-100">{items.length} {t('pieces')} · {makerCount} {t(makerCount === 1 ? 'maker' : 'makers')}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-clay-300 opacity-0 transition group-hover:opacity-100">{t('Explore')} <ArrowRight className="h-3.5 w-3.5" /></span>
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Maker's picks ─────────────────────────────────── */}
      {featured.length > 0 && (
        <Section eyebrow={t('Handpicked')} title={t('Maker’s picks this week')}>
          <Rail>
            {featured.map((product) => (
              <div key={product._catalogKey} className="w-[46%] flex-shrink-0 snap-start sm:w-[31%] md:w-[23%] xl:w-[18.4%]">
                <ProductCard product={product} onAddToCart={onAddToCart} onViewDetail={setDetailProduct} />
              </div>
            ))}
          </Rail>
        </Section>
      )}

      {/* ── Promo tiles ───────────────────────────────────── */}
      {products.length > 0 && (
        <section className="mx-auto mt-10 grid max-w-[1320px] gap-4 px-4 sm:px-6 md:grid-cols-2">
          <PromoTile
            tone="bg-clay-400 text-ink-950"
            eyebrow={t('Festive edit')}
            title={t('Diyas, brass lamps & temple bells')}
            action={t('Light up your home')}
            image={findImage(['diya', 'bell', 'lamp'])}
            onClick={() => { clearFilters(); onSearch?.('diya'); setTimeout(() => scrollTo('collection'), 30); }}
          />
          <PromoTile
            tone="bg-brand-600 text-white"
            eyebrow={t('Thoughtful gifts')}
            title={t('Handmade gifts under ₹1,000')}
            action={t('Shop gifts')}
            image={findImage(['spinning tops', 'coasters', 'money box'])}
            onClick={() => showCollection(() => setPriceBucket('u1000'))}
          />
        </section>
      )}

      {/* ── Meet the makers ───────────────────────────────── */}
      {makers.length > 0 && (
        <Section id="makers" eyebrow={t('The people behind the pieces')} title={t('Meet the makers')} description={t('Shop directly from independent artisan studios. Every rupee of the listed price is set by the maker.')}>
          <Rail>
            {makers.map((entry) => (
              <article key={entry.id} className="w-[78%] flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-card sm:w-[42%] md:w-[31%] xl:w-[23.5%]">
                <div className="grid h-32 grid-cols-3 gap-0.5 bg-paper-200">
                  {[0, 1, 2].map((index) => {
                    const item = entry.products[index] || entry.products[0];
                    return <img key={index} src={imageOf(item)} alt="" loading="lazy" className={cx('h-full w-full', /\.png/i.test(imageOf(item) || '') ? 'object-contain p-2' : 'object-cover')} />;
                  })}
                </div>
                <div className="relative px-4 pb-4 pt-8">
                  <span className="absolute -top-6 left-4 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-brand-600 font-display text-base font-bold text-white">
                    {(entry.name || 'M').split(' ').map((word) => word[0]).slice(0, 2).join('')}
                  </span>
                  <h3 className="truncate text-base font-bold">{entry.store}</h3>
                  <p className="truncate text-sm text-ink-600">{entry.name}</p>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-ink-500"><MapPin className="h-3.5 w-3.5 text-clay-500" />{entry.region}</p>
                  <p className="mt-2 line-clamp-1 text-xs font-medium text-brand-600">{[...entry.crafts].join(' · ')}</p>
                  <button type="button" onClick={() => showCollection(() => setMaker(entry.id))} className="btn btn-secondary btn-sm mt-3 w-full rounded-full">
                    <Store className="h-4 w-4" />{t('Visit shop')} · {entry.products.length}
                  </button>
                </div>
              </article>
            ))}
          </Rail>
        </Section>
      )}

      {/* ── Crafts by state ───────────────────────────────── */}
      {states.length > 1 && (
        <Section eyebrow={t('From every corner')} title={t('Shop by state')}>
          <div className="flex flex-wrap gap-2.5">
            {states.map(([name, count]) => (
              <button key={name} type="button" onClick={() => showCollection(() => setRegion(name))} className="group flex items-center gap-2 rounded-full border border-line bg-white py-2 pl-3 pr-2 text-sm font-medium text-ink-800 shadow-xs transition hover:border-brand-600 hover:text-brand-700">
                <MapPin className="h-4 w-4 text-clay-500" />{name}
                <span className="rounded-full bg-paper-200 px-2 py-0.5 text-xs font-semibold text-ink-600 group-hover:bg-brand-50 group-hover:text-brand-700">{count}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ── Collection ────────────────────────────────────── */}
      <section id="collection" className="mx-auto mt-12 max-w-[1320px] scroll-mt-36 px-4 sm:px-6" aria-labelledby="collection-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">{t('The collection')}</span>
            <h2 id="collection-title" className="mt-1.5 text-2xl font-extrabold sm:text-3xl">
              {searchTerm.trim() ? `${t('Results for')} “${searchTerm.trim()}”` : makerName || t(categoryLabel)}
            </h2>
            <p className="mt-1 text-sm text-ink-500" role="status">{loading ? t('Loading…') : `${filtered.length} ${t(filtered.length === 1 ? 'piece' : 'pieces')}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setFiltersOpen(true)} className="btn btn-secondary rounded-full lg:hidden"><SlidersHorizontal className="h-4 w-4" />{t('Filters')}{hasFilters && <span className="h-2 w-2 rounded-full bg-clay-500" />}</button>
            <label className="relative">
              <span className="sr-only">{t('Sort by')}</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="field h-10 cursor-pointer rounded-full py-0 pl-4 pr-9">
                {SORTS.map(([id, label]) => <option key={id} value={id}>{t('Sort')}: {t(label)}</option>)}
              </select>
            </label>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <button key={chip.key} type="button" onClick={chip.clear} aria-label={`${t('Remove filter')}: ${chip.label}`} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 py-1.5 pl-3.5 pr-2.5 text-xs font-semibold text-white hover:bg-brand-700">
                {chip.label}<X className="h-3.5 w-3.5" />
              </button>
            ))}
            <button type="button" onClick={clearFilters} className="px-2 text-xs font-semibold text-ink-500 hover:text-ink-900">{t('Clear all')}</button>
          </div>
        )}

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="sticky top-40 hidden max-h-[calc(100vh-11rem)] overflow-y-auto pr-2 lg:block">{filterPanel}</aside>
          <div className="min-w-0">
            {error && (
              <Notice tone="error" className="mb-5">
                <span className="flex flex-wrap items-center justify-between gap-3">{t(error)}<button type="button" onClick={loadProducts} className="btn btn-secondary btn-sm"><RefreshCw className="h-3.5 w-3.5" />{t('Try again')}</button></span>
              </Notice>
            )}
            {loading ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4" role="status" aria-label={t('Loading…')}>
                {Array.from({ length: 8 }, (_, index) => <div key={index}><div className="skeleton aspect-[4/5] rounded-2xl" /><div className="skeleton mt-3 h-3 w-1/2" /><div className="skeleton mt-2 h-4 w-4/5" /></div>)}
              </div>
            ) : filtered.length ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
                  {filtered.slice(0, visibleCount).map((product) => <ProductCard key={product._catalogKey} product={product} onAddToCart={onAddToCart} onViewDetail={setDetailProduct} />)}
                </div>
                {visibleCount < filtered.length && (
                  <div className="mt-10 flex flex-col items-center gap-3">
                    <p className="text-sm text-ink-500">{t('Showing')} {visibleCount} {t('of')} {filtered.length}</p>
                    <div className="h-1.5 w-56 overflow-hidden rounded-full bg-paper-300"><div className="h-full rounded-full bg-clay-400" style={{ width: `${(visibleCount / filtered.length) * 100}%` }} /></div>
                    <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="btn btn-secondary mt-1 min-w-[220px] rounded-full">{t('Load more')}</button>
                  </div>
                )}
              </>
            ) : !error && (
              <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-16 text-center shadow-card">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><PackageSearch className="h-8 w-8" /></span>
                <h3 className="mt-4 text-xl font-bold">{t(products.length ? 'Nothing matches yet' : 'New crafts are on the way')}</h3>
                <p className="mt-1.5 max-w-sm text-sm text-ink-500">{t(products.length ? 'Try a different word or remove a filter.' : 'Published artisan products will appear here. Check back soon.')}</p>
                {hasFilters && <button type="button" onClick={clearFilters} className="btn btn-primary mt-5 rounded-full">{t('Clear all filters')}</button>}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── How it works + sell ───────────────────────────── */}
      <section className="mx-auto mt-16 max-w-[1320px] px-4 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-3xl bg-white p-6 shadow-card sm:p-10">
            <span className="eyebrow">{t('How CraftLink works')}</span>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">{t('From their workshop to your home')}</h2>
            <ol className="mt-6 space-y-5">
              {[[Search, 'Find something you love', 'Browse by craft, state or maker. Every listing shows who made it and where.'], [BadgeCheck, 'Order with cash on delivery', 'Stock is confirmed when you order. No online payment needed.'], [Truck, 'Track it to your door', 'Use your order number to follow it from Placed to Delivered.']].map(([Icon, title, detail], index) => (
                <li key={title} className="flex gap-4">
                  <span className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-clay-400 text-[11px] font-bold text-ink-950">{index + 1}</span>
                  </span>
                  <span><strong className="block font-display font-bold text-ink-950">{t(title)}</strong><span className="text-sm text-ink-600">{t(detail)}</span></span>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-brand-900 text-white">
            <img src={storefrontImage('hero-blockprint.jpg')} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-900/80 to-brand-900/30" />
            <div className="relative flex h-full flex-col justify-center p-6 sm:p-10">
              <span className="eyebrow text-clay-300">{t('For artisans')}</span>
              <h2 className="mt-2 max-w-md text-2xl font-extrabold text-white sm:text-3xl">{t('Your craft deserves buyers across India')}</h2>
              <p className="mt-3 max-w-md text-brand-100">{t('Take one photo, answer a few questions in your own language, and we write your listing and suggest a fair price. No listing fees to start.')}</p>
              <button type="button" onClick={onOpenSeller} className="btn btn-lg btn-accent mt-6 w-fit rounded-full">{t('Start selling')}<ArrowRight className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </section>

      {filtersOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-ink-950/50 animate-fade-in lg:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}>
          <div className="flex h-full w-80 max-w-[88vw] flex-col bg-white animate-slide-in">
            <div className="flex-1 overflow-y-auto p-4">{filterPanel}</div>
            <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
              <button type="button" onClick={clearFilters} className="btn btn-secondary rounded-full">{t('Clear all')}</button>
              <button type="button" onClick={() => setFiltersOpen(false)} className="btn btn-primary rounded-full">{t('Show')} {filtered.length}</button>
            </div>
          </div>
        </div>
      )}

      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          allProducts={products}
          storeName={stores[detailProduct.artisan_id]}
          onClose={() => setDetailProduct(null)}
          onAddToCart={onAddToCart}
          onBuyNow={onBuyNow}
          onViewProduct={setDetailProduct}
          onVisitMaker={(id) => { setDetailProduct(null); showCollection(() => setMaker(String(id))); }}
          onRequestBulkQuote={(product) => { setDetailProduct(null); setBulkProduct(product); }}
        />
      )}

      <BulkQuoteModal
        isOpen={Boolean(bulkProduct)}
        product={bulkProduct}
        currentUser={currentUser}
        onClose={() => setBulkProduct(null)}
      />
    </div>
  );
}

function HeroGallery({ featured, onView }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % HERO_SLIDES.length), 5500);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="relative min-h-[300px] overflow-hidden sm:min-h-[420px]">
      {HERO_SLIDES.map(([file, caption], slideIndex) => (
        <img key={file} src={storefrontImage(file)} alt={t(caption)} loading={slideIndex === 0 ? 'eager' : 'lazy'} className={cx('absolute inset-0 h-full w-full object-cover transition-opacity duration-1000', slideIndex === index ? 'opacity-100' : 'opacity-0')} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-transparent to-brand-950/20" />
      <div className="absolute left-4 top-4 flex gap-1.5">
        {HERO_SLIDES.map(([file, caption], slideIndex) => (
          <button key={file} type="button" onClick={() => setIndex(slideIndex)} aria-label={t(caption)} aria-current={slideIndex === index} className={cx('h-1.5 rounded-full transition-all', slideIndex === index ? 'w-8 bg-clay-400' : 'w-4 bg-white/50 hover:bg-white')} />
        ))}
      </div>
      <p className="absolute bottom-4 left-4 rounded-full bg-brand-950/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">{t(HERO_SLIDES[index][1])}</p>
      {featured && (
        <button type="button" onClick={() => onView(featured)} className="absolute bottom-4 right-4 hidden w-64 items-center gap-3 rounded-2xl bg-white/95 p-2.5 text-left shadow-lift backdrop-blur transition hover:-translate-y-0.5 sm:flex">
          <img src={imageOf(featured)} alt="" className="h-16 w-14 flex-shrink-0 rounded-xl object-cover" />
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-clay-600">{t('Maker’s pick')}</span>
            <span className="line-clamp-2 font-display text-sm font-bold leading-snug text-ink-950">{featured.product_name}</span>
            <span className="text-sm font-bold text-brand-600">{formatINR(productPrice(featured))}</span>
          </span>
        </button>
      )}
    </div>
  );
}

function Section({ id, eyebrow, title, description, action, children }) {
  return (
    <section id={id} className="mx-auto mt-12 max-w-[1320px] scroll-mt-36 px-4 sm:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2 className="mt-1.5 text-2xl font-extrabold sm:text-3xl">{title}</h2>
          {description && <p className="mt-1.5 max-w-2xl text-sm text-ink-600">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Rail({ children }) {
  const { t } = useLanguage();
  const scroller = useRef(null);
  const scroll = (direction) => scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth * 0.85, behavior: 'smooth' });
  return (
    <div className="group/rail relative">
      <div ref={scroller} className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:px-0">{children}</div>
      <button type="button" onClick={() => scroll(-1)} className="absolute -left-4 top-[38%] hidden h-11 w-11 items-center justify-center rounded-full bg-white text-ink-900 shadow-lift transition hover:bg-clay-400 md:flex" aria-label={t('Scroll left')}><ChevronLeft className="h-5 w-5" /></button>
      <button type="button" onClick={() => scroll(1)} className="absolute -right-4 top-[38%] hidden h-11 w-11 items-center justify-center rounded-full bg-white text-ink-900 shadow-lift transition hover:bg-clay-400 md:flex" aria-label={t('Scroll right')}><ChevronRight className="h-5 w-5" /></button>
    </div>
  );
}

function PromoTile({ tone, eyebrow, title, action, image, onClick }) {
  return (
    <button type="button" onClick={onClick} className={cx('group relative flex min-h-[180px] items-center overflow-hidden rounded-3xl text-left sm:min-h-[210px]', tone)}>
      <span className="bg-buti-dark absolute inset-0 opacity-60" />
      <span className="relative z-10 w-[58%] p-6 sm:p-8">
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">{eyebrow}</span>
        <span className="mt-2 block font-display text-xl font-extrabold leading-tight sm:text-2xl">{title}</span>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold underline-offset-4 group-hover:underline">{action}<ArrowRight className="h-4 w-4" /></span>
      </span>
      {image && (
        <span className="absolute inset-y-0 right-0 w-[42%] overflow-hidden">
          <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" style={{ clipPath: 'ellipse(95% 100% at 100% 50%)' }} />
        </span>
      )}
    </button>
  );
}

function FilterGroup({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-line py-3">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between px-1 text-sm font-bold text-ink-900">
        {title}<ChevronRight className={cx('h-4 w-4 text-ink-400 transition', open && 'rotate-90')} />
      </button>
      {open && <div className="mt-2 max-h-72 space-y-0.5 overflow-y-auto">{children}</div>}
    </div>
  );
}

function FilterOption({ name, checked, onChange, label, count }) {
  const disabled = count === 0 && !checked;
  return (
    <label className={cx('flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm', disabled ? 'cursor-not-allowed text-ink-300' : 'cursor-pointer text-ink-800 hover:bg-paper-100', checked && 'font-semibold text-brand-700')}>
      <input type="radio" name={name} checked={checked} onChange={onChange} disabled={disabled} className="h-4 w-4 accent-brand-600" />
      <span className="flex-1 truncate">{label}</span>
      {count != null && <span className="text-xs text-ink-400">{count}</span>}
    </label>
  );
}
