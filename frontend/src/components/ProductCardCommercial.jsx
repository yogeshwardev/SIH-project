import React from 'react';

export default function ProductCardCommercial({ product, onAddToCart, onBuyNow, onViewDetail }) {
  const price = product.price || product.suggested_price || 2499;
  const mrp = product.mrp || Math.round(price * 1.45);
  const discount = Math.round(((mrp - price) / mrp) * 100);
  const rating = product.rating || 4.3;
  const ratingCount = product.rating_count || Math.floor(147 + (product.id || 0) * 13);
  const stars = Math.round(rating * 2) / 2;
  
  return (
    <div
      onClick={() => onViewDetail?.(product)}
      style={{
        background: '#fff',
        border: '1px solid #D5D9D9',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease, transform 0.1s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Image */}
      <div style={{ position: 'relative', background: '#F7F8F8', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
        <img
          src={product.enhanced_image || product.original_image || `https://placehold.co/200x200/F7F8F8/8D9096?text=${encodeURIComponent(product.product_name || 'Product')}`}
          alt={product.product_name}
          style={{ maxHeight: '176px', maxWidth: '100%', objectFit: 'contain' }}
          onError={e => e.target.src = `https://placehold.co/200x200/F7F8F8/8D9096?text=Craft`}
        />
        {/* GI Certified badge */}
        {product.gi_tag && (
          <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#007600', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', letterSpacing: '0.05em' }}>
            GI CERTIFIED
          </div>
        )}
        {discount > 0 && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', background: '#CC0C39', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 6px', borderRadius: '3px' }}>
            {discount}% off
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Brand/Artisan */}
        <div style={{ fontSize: '11px', color: '#007185', fontWeight: 600, marginBottom: '3px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {product.artisan_name || product.craft_type || 'Artisan Craft'}
        </div>
        
        {/* Product name */}
        <div style={{ fontSize: '13px', color: '#0F1111', lineHeight: 1.4, marginBottom: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '36px' }}>
          {product.product_name}
        </div>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', gap: '1px' }}>
            {[1,2,3,4,5].map(s => (
              <svg key={s} width="11" height="11" viewBox="0 0 20 20" fill={s <= Math.round(rating) ? '#FF9900' : '#D5D9D9'}>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span style={{ fontSize: '11px', color: '#565959' }}>({ratingCount.toLocaleString('en-IN')})</span>
        </div>

        {/* Price row */}
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#0F1111' }}>₹{price.toLocaleString('en-IN')}</span>
          {' '}
          <span style={{ fontSize: '12px', color: '#565959', textDecoration: 'line-through', marginLeft: '4px' }}>₹{mrp.toLocaleString('en-IN')}</span>
          {' '}
          {discount > 0 && <span style={{ fontSize: '12px', color: '#CC0C39', fontWeight: 600 }}>({discount}% off)</span>}
        </div>

        {/* Delivery */}
        <div style={{ fontSize: '11px', color: '#007600', fontWeight: 600, marginBottom: '10px' }}>FREE Delivery</div>

        {/* Buttons */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={e => { e.stopPropagation(); onAddToCart?.(product); }}
            style={{
              flex: 1,
              background: '#FF9900',
              border: '1px solid #e68900',
              borderRadius: '6px',
              padding: '7px 0',
              fontSize: '12px',
              fontWeight: 700,
              color: '#0F1111',
              cursor: 'pointer',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F7CA00'}
            onMouseLeave={e => e.currentTarget.style.background = '#FF9900'}
          >
            Add to Cart
          </button>
          <button
            onClick={e => { e.stopPropagation(); onBuyNow?.(product); }}
            style={{
              flex: 1,
              background: '#FFA41C',
              border: '1px solid #E07B1A',
              borderRadius: '6px',
              padding: '7px 0',
              fontSize: '12px',
              fontWeight: 700,
              color: '#0F1111',
              cursor: 'pointer',
            }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
