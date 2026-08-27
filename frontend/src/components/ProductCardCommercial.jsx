import React, { useState } from 'react';
import { Heart, ShoppingCart, Check } from 'lucide-react';

function Stars({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div style={{ display: 'flex', gap: '1px', color: '#FFA41C', fontSize: '13px', lineHeight: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < full ? '★' : i === full && half ? '⯨' : '☆'}</span>
      ))}
    </div>
  );
}

export default function ProductCardCommercial({ product, onAddToCart, onQuickView, onBuyNow }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [justAdded,  setJustAdded]  = useState(false);
  const [hovered,    setHovered]    = useState(false);

  const price    = product.price || product.suggested_price || 2499;
  const mrp      = product.mrp || Math.round(price * 1.45);
  const discount = Math.round(((mrp - price) / mrp) * 100);
  const rating   = product.rating || 4.7;
  const reviews  = product.review_count || 230;
  const savings  = mrp - price;

  const handleCart = (e) => {
    e.stopPropagation();
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const handleBuy = (e) => {
    e.stopPropagation();
    onBuyNow(product);
  };

  return (
    <div
      className="product-card-hover"
      onClick={() => onQuickView(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── IMAGE ─────────────────────── */}
      <div style={{ position: 'relative', background: '#FAFAFA', paddingTop: '100%', overflow: 'hidden' }}>
        <div
          className="img-zoom-container"
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}
        >
          <img
            src={product.enhanced_image || product.original_image}
            alt={product.product_name}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            loading="lazy"
            onError={e => {
              e.target.src = `https://placehold.co/300x300/F7F8F8/9EA2A2?text=${encodeURIComponent((product.product_name || '').slice(0, 8))}`;
            }}
          />
        </div>

        {/* Discount badge — flat red, not gradient */}
        {discount > 5 && (
          <div style={{
            position: 'absolute', top: '8px', left: '8px',
            background: '#CC0C39', color: '#fff',
            fontSize: '11px', fontWeight: 800,
            padding: '2px 6px', borderRadius: '3px',
          }}>
            -{discount}%
          </div>
        )}

        {/* Wishlist — only visible on hover */}
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); setWishlisted(w => !w); }}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #D5D9D9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              cursor: 'pointer',
            }}
          >
            <Heart
              style={{ width: 14, height: 14, color: wishlisted ? '#CC0C39' : '#8D9096', fill: wishlisted ? '#CC0C39' : 'none' }}
            />
          </button>
        )}
      </div>

      {/* ── CONTENT ───────────────────── */}
      <div style={{ background: '#fff', padding: '12px', borderTop: '1px solid #EAEDED', display: 'flex', flexDirection: 'column', flex: 1 }}>

        {/* Seller name */}
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#007185', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.brand_or_guild || 'Verified Artisan'}
        </div>

        {/* Product title */}
        <h3 style={{
          fontSize: '13px', fontWeight: 500, color: '#0F1111', lineHeight: '1.4',
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          marginBottom: '6px',
        }}>
          {product.title || product.product_name}
        </h3>

        {/* Stars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <Stars rating={rating} />
          <span style={{ fontSize: '11px', color: '#007185', fontWeight: 600 }}>({reviews.toLocaleString()})</span>
        </div>

        {/* Badge */}
        {product.badge && (
          <div style={{ marginBottom: '6px' }}>
            <span style={{
              display: 'inline-block',
              fontSize: '10px', fontWeight: 800,
              padding: '2px 6px', borderRadius: '3px', color: '#fff',
              background:
                product.badge === 'Best Seller'      ? '#E87722' :
                product.badge === "Amazon's Choice"  ? '#131921' :
                product.badge === 'GI Certified'     ? '#1D7A3B' :
                '#CC0C39',
            }}>
              {product.badge === 'Best Seller' ? '#1 ' : ''}{product.badge}
            </span>
          </div>
        )}

        {/* Prime / Delivery */}
        <div style={{ fontSize: '11px', color: '#565959', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {product.is_prime && (
            <span className="prime-badge">prime</span>
          )}
          <span>FREE delivery by {product.delivery_days || 'Friday'}</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Price */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#0F1111' }}>₹</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0F1111', lineHeight: 1, letterSpacing: '-0.03em' }}>
              {price.toLocaleString('en-IN')}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#565959', marginTop: '2px' }}>
            M.R.P.: <span style={{ textDecoration: 'line-through' }}>₹{mrp.toLocaleString('en-IN')}</span>
            {' '}<span style={{ color: '#CC0C39', fontWeight: 700 }}>Save ₹{savings.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          <button className="btn-amazon-cart" onClick={handleCart}>
            {justAdded
              ? <><Check style={{ width: 13, height: 13 }} /> Added!</>
              : <><ShoppingCart style={{ width: 13, height: 13 }} /> Add to Cart</>
            }
          </button>
          <button className="btn-amazon-buy" onClick={handleBuy}>
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
