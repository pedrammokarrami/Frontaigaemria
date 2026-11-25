import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Film,
  Gamepad2,
  Headphones,
  Layers,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  INITIAL_STORE_PRODUCTS,
  type NewUserListingInput,
  STORE_CATEGORIES_BY_HUB,
  STORE_COLLECTIONS,
  type StoreProductItem,
  type StoreSortMode,
  type StoreSourceKind,
  filterStoreProducts,
  loadUserStoreListings,
  saveUserStoreListings,
  validateAndCreateUserListing,
} from '../../utils/platformStoreEngine';
import type { MasterHubId } from './MasterHubSwitcher';

interface PlatformStoreModalProps {
  open: boolean;
  activeHub: MasterHubId;
  initialCollectionId?: string | null;
  onClose: () => void;
}

interface CartEntry {
  product: StoreProductItem;
  qty: number;
}

export const PlatformStoreModal: React.FC<PlatformStoreModalProps> = ({
  open,
  activeHub,
  initialCollectionId = null,
  onClose,
}) => {
  const { isRtl, copy } = useLanguage();
  const [userListings, setUserListings] = useState<StoreProductItem[]>(() =>
    loadUserStoreListings()
  );
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | StoreSourceKind>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [collectionFilter, setCollectionFilter] = useState<string | null>(initialCollectionId);
  const [maxPriceUsd, setMaxPriceUsd] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<StoreSortMode>('featured');

  // Add Product modal/drawer state (strictly NO photo upload!)
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftPrice, setDraftPrice] = useState('');
  const [draftCategory, setDraftCategory] = useState<string>(
    STORE_CATEGORIES_BY_HUB[activeHub][1] ?? 'Peripherals'
  );
  const [draftCondition, setDraftCondition] =
    useState<NewUserListingInput['condition']>('New');
  const [draftSeller, setDraftSeller] = useState('Kian_Player');
  const [draftDescription, setDraftDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Shopping Bag Drawer
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [orderDoneNotice, setOrderDoneNotice] = useState(false);

  useEffect(() => {
    saveUserStoreListings(userListings);
  }, [userListings]);

  useEffect(() => {
    setCategoryFilter('all');
    setCollectionFilter(initialCollectionId ?? null);
    setDraftCategory(STORE_CATEGORIES_BY_HUB[activeHub][1] ?? 'Peripherals');
    setFormError(null);
  }, [activeHub, initialCollectionId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const allProducts = useMemo(
    () => [...userListings, ...INITIAL_STORE_PRODUCTS],
    [userListings]
  );

  const hubCollections = useMemo(
    () => STORE_COLLECTIONS.filter((c) => c.hub === activeHub),
    [activeHub]
  );

  const categories = STORE_CATEGORIES_BY_HUB[activeHub];

  const filteredProducts = useMemo(
    () =>
      filterStoreProducts(allProducts, {
        hub: activeHub,
        query,
        source: sourceFilter,
        category: categoryFilter,
        collectionId: collectionFilter,
        maxPriceUsd,
        sortBy,
      }),
    [allProducts, activeHub, query, sourceFilter, categoryFilter, collectionFilter, maxPriceUsd, sortBy]
  );

  const handleSubmitNewListing = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const res = validateAndCreateUserListing({
      hub: activeHub,
      title: draftTitle,
      priceRaw: draftPrice,
      category: draftCategory,
      condition: draftCondition,
      description: draftDescription,
      sellerName: draftSeller,
    });
    if (!res.ok || !res.item) {
      setFormError(isRtl ? res.errorFa ?? 'اطلاعات نامعتبر است' : res.errorEn ?? 'Invalid input');
      return;
    }
    setUserListings((prev) => [res.item!, ...prev]);
    setDraftTitle('');
    setDraftPrice('');
    setDraftDescription('');
    setIsAddFormOpen(false);
    setSourceFilter('all');
    setCategoryFilter('all');
    setCollectionFilter(null);
  };

  const handleAddToCart = (product: StoreProductItem) => {
    setOrderDoneNotice(false);
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === productId ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const bagCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const bagSubtotal = cart.reduce((acc, item) => acc + item.product.priceUsd * item.qty, 0);

  if (typeof document === 'undefined') return null;

  const isGame = activeHub === 'game';
  const isCinema = activeHub === 'cinema';

  const headerTitle = isGame
    ? copy.storeTitleGame
    : isCinema
      ? copy.storeTitleCinema
      : copy.storeTitleAudio;

  const headerSubtitle = isGame
    ? copy.storeSubtitleGame
    : isCinema
      ? copy.storeSubtitleCinema
      : copy.storeSubtitleAudio;

  const accentHex = isGame ? '#00F0FF' : isCinema ? '#E5A93C' : '#D4AF37';
  const secondaryHex = isGame ? '#FCEE0A' : isCinema ? '#E11D48' : '#FA243C';

  const getRarityBorder = (rarity: StoreProductItem['rarity']) => {
    if (rarity === 'mythic') return 'border-amber-400/55';
    if (rarity === 'epic') return isGame ? 'border-purple-400/50' : 'border-rose-400/45';
    if (rarity === 'rare') return 'border-cyan-400/45';
    return 'border-white/12';
  };

  const renderHubEmblem = () => {
    if (isGame) return <Gamepad2 className="w-5 h-5" style={{ color: accentHex }} />;
    if (isCinema) return <Film className="w-5 h-5" style={{ color: accentHex }} />;
    return <Headphones className="w-5 h-5" style={{ color: accentHex }} />;
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="platform-store-backdrop"
          dir={isRtl ? 'rtl' : 'ltr'}
          role="dialog"
          aria-modal="true"
          aria-label={headerTitle}
          data-testid={`platform-store-modal-${activeHub}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[95] bg-black/82 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl max-h-[92dvh] rounded-2xl border overflow-hidden flex flex-col text-white shadow-[0_28px_88px_rgba(0,0,0,0.85)]"
            style={{
              backgroundColor: isGame ? '#090D16' : isCinema ? '#0E0D11' : '#12100E',
              borderColor: `${accentHex}55`,
            }}
          >
            {/* Store Header */}
            <header className="px-4 sm:px-6 py-3.5 border-b border-white/12 bg-black/35 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${accentHex}18`,
                    borderColor: `${accentHex}55`,
                  }}
                >
                  {renderHubEmblem()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[16px] sm:text-[19px] font-black truncate">{headerTitle}</h2>
                  <p className="text-[11.5px] sm:text-[12px] text-white/65 truncate">
                    {headerSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-testid="store-add-product-btn"
                  onClick={() => setIsAddFormOpen((v) => !v)}
                  className="min-h-[38px] px-3.5 rounded-xl font-extrabold text-[12px] text-slate-950 transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                  style={{ backgroundColor: secondaryHex }}
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>{copy.storeAddProductBtn}</span>
                </button>

                <button
                  type="button"
                  data-testid="store-cart-btn"
                  onClick={() => setIsBagOpen((v) => !v)}
                  className="min-h-[38px] px-3 rounded-xl border border-white/18 bg-white/8 hover:bg-white/15 text-[12px] font-bold text-white inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <ShoppingCart className="w-4 h-4" style={{ color: accentHex }} />
                  <span className="font-mono tabular-nums">{bagCount}</span>
                </button>

                <button
                  type="button"
                  data-testid="store-modal-close-btn"
                  onClick={onClose}
                  aria-label={copy.back}
                  className="w-9 h-9 rounded-full border border-white/15 bg-white/8 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* User Product Listing Form (NO PHOTO UPLOAD ALLOWED) */}
            {isAddFormOpen && (
              <form
                onSubmit={handleSubmitNewListing}
                data-testid="store-add-product-form"
                className="px-4 sm:px-6 py-4 border-b border-white/15 bg-white/[0.04] space-y-3 shrink-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[14px] font-extrabold text-white">
                    {copy.storeAddProductBtn}
                  </h3>
                  <span className="text-[11.5px] font-medium text-amber-200/90">
                    {copy.storeNoPhotoNote}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    required
                    data-testid="store-new-title-input"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder={isRtl ? 'نام محصول (مثلاً هدفون استودیویی...)' : 'Product title...'}
                    className="min-h-[40px] px-3 rounded-xl bg-black/50 border border-white/15 text-[12.5px] text-white placeholder:text-white/45 focus:outline-none focus:border-white/40"
                  />
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    data-testid="store-new-price-input"
                    value={draftPrice}
                    onChange={(e) => setDraftPrice(e.target.value)}
                    placeholder={isRtl ? 'قیمت (دلار، مثلاً 120)' : 'Price USD (e.g. 120)'}
                    className="min-h-[40px] px-3 rounded-xl bg-black/50 border border-white/15 text-[12.5px] font-mono tabular-nums text-white placeholder:text-white/45 focus:outline-none focus:border-white/40"
                  />
                  <select
                    data-testid="store-new-category-select"
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value)}
                    className="min-h-[40px] px-3 rounded-xl bg-black/75 border border-white/15 text-[12.5px] text-white focus:outline-none"
                  >
                    {categories
                      .filter((c) => c !== 'all')
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                  </select>
                  <select
                    data-testid="store-new-condition-select"
                    value={draftCondition}
                    onChange={(e) =>
                      setDraftCondition(e.target.value as NewUserListingInput['condition'])
                    }
                    className="min-h-[40px] px-3 rounded-xl bg-black/75 border border-white/15 text-[12.5px] text-white focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Mint Used">Mint Used</option>
                    <option value="Digital / Code">Digital / Code</option>
                    <option value="Collector">Collector</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
                  <input
                    type="text"
                    value={draftSeller}
                    onChange={(e) => setDraftSeller(e.target.value)}
                    placeholder={isRtl ? 'نام فروشنده / آیدی شما' : 'Your handle'}
                    className="sm:col-span-3 min-h-[40px] px-3 rounded-xl bg-black/50 border border-white/15 text-[12.5px] text-white placeholder:text-white/45 focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    required
                    data-testid="store-new-desc-input"
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    placeholder={
                      isRtl
                        ? 'توضیحات کامل محصول، مشخصات فنی و وضعیت تحویل...'
                        : 'Full description, technical specs & condition details...'
                    }
                    className="sm:col-span-6 p-2.5 rounded-xl bg-black/50 border border-white/15 text-[12.5px] text-white placeholder:text-white/45 focus:outline-none"
                  />
                  <div className="sm:col-span-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddFormOpen(false)}
                      className="min-h-[40px] px-3 rounded-xl border border-white/18 text-[12px] font-bold text-white/80 hover:bg-white/10 cursor-pointer"
                    >
                      {copy.storeCancel}
                    </button>
                    <button
                      type="submit"
                      data-testid="store-submit-listing-btn"
                      className="min-h-[40px] px-4 rounded-xl text-[12px] font-extrabold text-slate-950 cursor-pointer"
                      style={{ backgroundColor: accentHex }}
                    >
                      {copy.storeSubmitProduct}
                    </button>
                  </div>
                </div>

                {formError && (
                  <p data-testid="store-form-error" className="text-[12px] font-bold text-rose-400">
                    {formError}
                  </p>
                )}
              </form>
            )}

            {/* Shopping Bag Drawer */}
            {isBagOpen && (
              <div
                data-testid="store-bag-panel"
                className="px-4 sm:px-6 py-3.5 border-b border-white/15 bg-black/55 shrink-0 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] font-extrabold">
                    {copy.storeBagTitle} ({bagCount})
                  </span>
                  <span className="text-[14px] font-mono tabular-nums font-black" style={{ color: accentHex }}>
                    ${bagSubtotal.toFixed(2)}
                  </span>
                </div>
                {cart.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {cart.map((entry) => (
                      <div
                        key={entry.product.id}
                        className="flex items-center justify-between gap-2 text-[12px] bg-white/5 rounded-lg px-2.5 py-1.5"
                      >
                        <span className="truncate flex-1 font-semibold">
                          {isRtl ? entry.product.titleFa : entry.product.titleEn}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateCartQty(entry.product.id, -1)}
                            aria-label="Decrease quantity"
                            className="w-6 h-6 rounded bg-white/10 flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono tabular-nums w-5 text-center">{entry.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(entry.product.id, 1)}
                            aria-label="Increase quantity"
                            className="w-6 h-6 rounded bg-white/10 flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCartQty(entry.product.id, -entry.qty)}
                            aria-label="Remove item"
                            className="w-6 h-6 rounded text-rose-300 hover:bg-rose-500/20 flex items-center justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      data-testid="store-checkout-btn"
                      onClick={() => {
                        setCart([]);
                        setOrderDoneNotice(true);
                      }}
                      className="w-full min-h-[38px] rounded-xl font-extrabold text-[12.5px] text-slate-950 cursor-pointer"
                      style={{ backgroundColor: accentHex }}
                    >
                      {copy.storeCheckoutBtn}
                    </button>
                  </div>
                )}
                {orderDoneNotice && (
                  <p className="text-[12px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>{copy.storeOrderConfirmed}</span>
                  </p>
                )}
              </div>
            )}

            {/* Advanced Search & Filter Bar */}
            <div className="px-4 sm:px-6 py-3 border-b border-white/10 bg-black/25 space-y-2.5 shrink-0">
              <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
                <div className="flex items-center gap-2 flex-1 min-h-[42px] px-3.5 rounded-xl bg-black/50 border border-white/15">
                  <Search className="w-4 h-4 text-white/55 shrink-0" />
                  <input
                    type="search"
                    data-testid="store-search-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={copy.storeSearchPlaceholder}
                    className="w-full bg-transparent text-[13px] font-medium text-white placeholder:text-white/45 focus:outline-none py-1.5"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 rounded-xl bg-black/45 border border-white/12 p-1">
                    {(
                      [
                        { id: 'all', label: copy.storeSourceAll },
                        { id: 'online-store', label: copy.storeSourceOnline },
                        { id: 'community', label: copy.storeSourceCommunity },
                        { id: 'collection', label: copy.storeSourceCollection },
                      ] as const
                    ).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        data-testid={`store-source-${s.id}`}
                        onClick={() => setSourceFilter(s.id)}
                        className={`min-h-[30px] px-2.5 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                          sourceFilter === s.id
                            ? 'bg-white text-slate-950'
                            : 'text-white/75 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-white/55" />
                    <select
                      aria-label="Max price filter"
                      value={maxPriceUsd === null ? 'all' : String(maxPriceUsd)}
                      onChange={(e) =>
                        setMaxPriceUsd(e.target.value === 'all' ? null : Number(e.target.value))
                      }
                      className="min-h-[36px] px-2.5 rounded-lg bg-black/65 border border-white/15 text-[11.5px] font-bold text-white cursor-pointer"
                    >
                      <option value="all">{isRtl ? 'هر قیمتی' : 'Any Price'}</option>
                      <option value="50">≤ $50</option>
                      <option value="150">≤ $150</option>
                      <option value="300">≤ $300</option>
                    </select>

                    <select
                      aria-label="Sort products"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as StoreSortMode)}
                      className="min-h-[36px] px-2.5 rounded-lg bg-black/65 border border-white/15 text-[11.5px] font-bold text-white cursor-pointer"
                    >
                      <option value="featured">{isRtl ? 'پیشنهادی' : 'Featured'}</option>
                      <option value="price-asc">{isRtl ? 'ارزان‌ترین' : 'Price: Low → High'}</option>
                      <option value="price-desc">{isRtl ? 'گران‌ترین' : 'Price: High → Low'}</option>
                      <option value="newest">{isRtl ? 'جدیدترین آگهی' : 'Newest'}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {categories.map((cat) => {
                  const active = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`min-h-[30px] px-3 rounded-lg text-[11.5px] font-bold border transition cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'text-slate-950'
                          : 'bg-white/5 text-white/75 border-white/12 hover:bg-white/12'
                      }`}
                      style={
                        active
                          ? { backgroundColor: accentHex, borderColor: accentHex }
                          : undefined
                      }
                    >
                      {cat === 'all' ? copy.showAll : cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Storefront Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Section 1: Curated Collections from Partner Websites & Community */}
              <section aria-label={copy.storeCollectionsHeading} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[13.5px] font-extrabold text-white/90 flex items-center gap-2">
                    <Layers className="w-4 h-4" style={{ color: accentHex }} />
                    <span>{copy.storeCollectionsHeading}</span>
                  </h3>
                  {collectionFilter && (
                    <button
                      type="button"
                      onClick={() => setCollectionFilter(null)}
                      className="text-[11.5px] font-bold underline cursor-pointer"
                      style={{ color: accentHex }}
                    >
                      {copy.storeAllCollections}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hubCollections.map((col) => {
                    const isActive = collectionFilter === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        data-testid={`store-collection-${col.id}`}
                        onClick={() =>
                          setCollectionFilter((prev) => (prev === col.id ? null : col.id))
                        }
                        className="text-start rounded-xl p-4 border transition cursor-pointer flex items-center justify-between gap-3 bg-white/[0.03] hover:bg-white/[0.07]"
                        style={{
                          borderColor: isActive ? col.accentHex : 'rgba(255,255,255,0.12)',
                          boxShadow: isActive ? `0 0 22px ${col.accentHex}26` : undefined,
                        }}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="text-[11px] font-semibold text-white/60">
                            {isRtl ? col.sourceLabelFa : col.sourceLabelEn} ·{' '}
                            {isRtl ? col.itemCountLabelFa : col.itemCountLabelEn}
                          </div>
                          <div className="text-[15px] font-extrabold text-white truncate">
                            {isRtl ? col.titleFa : col.titleEn}
                          </div>
                          <p className="text-[12px] text-white/65 truncate">
                            {isRtl ? col.curatorFa : col.curatorEn}
                          </p>
                        </div>
                        <Sparkles className="w-5 h-5 shrink-0" style={{ color: col.accentHex }} />
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Section 2: Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-[14px] font-bold text-white/75">{copy.storeNoProducts}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setSourceFilter('all');
                      setCategoryFilter('all');
                      setCollectionFilter(null);
                      setMaxPriceUsd(null);
                    }}
                    className="min-h-[36px] px-4 rounded-xl bg-white/10 hover:bg-white/18 text-[12px] font-bold cursor-pointer"
                  >
                    {copy.showAll}
                  </button>
                </div>
              ) : (
                <section
                  aria-label="Storefront product catalog"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {filteredProducts.map((product) => {
                    const inCart = cart.some((c) => c.product.id === product.id);
                    return (
                      <article
                        key={product.id}
                        data-testid={`store-product-card-${product.id}`}
                        className={`rounded-xl border bg-white/[0.03] overflow-hidden flex flex-col justify-between transition hover:-translate-y-0.5 ${getRarityBorder(
                          product.rarity
                        )}`}
                      >
                        {/* Media Slot: Partner/Online Store photo OR Clean Typographic Monogram Card for User Listings (Zero Uploaded Photo) */}
                        {product.imageUrl && !product.isUserListing ? (
                          <div className="relative w-full aspect-[4/3] bg-black/50 overflow-hidden border-b border-white/10">
                            <img
                              src={product.imageUrl}
                              alt={isRtl ? product.titleFa : product.titleEn}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            data-testid={`store-text-card-emblem-${product.id}`}
                            className="relative w-full aspect-[4/3] px-5 py-4 border-b border-white/10 flex flex-col justify-between"
                            style={{
                              background: `linear-gradient(140deg, ${accentHex}1A 0%, rgba(12,14,22,0.96) 72%)`,
                            }}
                          >
                            <div className="flex items-center justify-between text-[11px] text-white/60">
                              <span>{product.category}</span>
                              <span>
                                {isRtl ? 'آگهی متنی کاربر' : 'Text-Only User Listing'}
                              </span>
                            </div>
                            <div className="my-auto flex items-center gap-3">
                              <div
                                className="w-11 h-11 rounded-xl border border-white/15 bg-black/40 flex items-center justify-center shrink-0"
                                style={{ color: accentHex }}
                              >
                                <Tag className="w-5 h-5" />
                              </div>
                              <div className="text-[14px] font-black text-white leading-snug line-clamp-2">
                                {isRtl ? product.titleFa : product.titleEn}
                              </div>
                            </div>
                            <div className="text-[11px] text-white/55 font-mono truncate">
                              {product.sellerName} · {product.partnerSiteName}
                            </div>
                          </div>
                        )}

                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="text-[11px] text-white/60 flex items-center justify-between gap-2">
                              <span className="truncate">
                                {product.category} · {product.partnerSiteName}
                              </span>
                              <span className="font-mono tabular-nums shrink-0">
                                ★ {product.rating.toFixed(1)}
                              </span>
                            </div>

                            <h4 className="text-[15px] font-extrabold text-white leading-snug line-clamp-2">
                              {isRtl ? product.titleFa : product.titleEn}
                            </h4>

                            <p className="text-[12px] text-white/70 leading-relaxed line-clamp-3">
                              {isRtl ? product.descriptionFa : product.descriptionEn}
                            </p>
                          </div>

                          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                            <div>
                              <div className="text-[16px] font-mono tabular-nums font-black text-white">
                                ${product.priceUsd.toFixed(2)}
                              </div>
                              <div className="text-[10.5px] text-white/55">
                                {isRtl ? product.conditionLabelFa : product.conditionLabelEn}
                              </div>
                            </div>

                            <button
                              type="button"
                              data-testid={`store-add-bag-${product.id}`}
                              onClick={() => handleAddToCart(product)}
                              className="min-h-[36px] px-3.5 rounded-xl text-[12px] font-extrabold transition cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                              style={{
                                backgroundColor: inCart ? '#10B981' : accentHex,
                                color: inCart ? '#FFFFFF' : '#05080F',
                              }}
                            >
                              {inCart ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <ShoppingBag className="w-3.5 h-3.5" />
                              )}
                              <span>{copy.storeAddToBag}</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
