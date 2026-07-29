import { formatMoney } from '../api.js';
import { products } from '../data.js';

function ProductCard({ product, onAdd, onIncrement, onDecrement, qty }) {
  return (
    <article className="product-card">
      <div className="product-swatch" style={{ '--accent': product.accent }} />
      <div className="product-copy">
        <div className="eyebrow">{product.badge}</div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>
      <div className="product-footer">
        <strong>{formatMoney(product.price)}</strong>
        {qty > 0 ? (
          <span className="qty-stepper">
            <button type="button" className="stepper-btn" onClick={() => onDecrement(product.id)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span className="stepper-qty">{qty}</span>
            <button type="button" className="stepper-btn" onClick={() => onIncrement(product)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </span>
        ) : (
          <button type="button" className="button button-secondary" onClick={() => onAdd(product)}>
            Add to cart
          </button>
        )}
      </div>
    </article>
  );
}

export function StorePage({ session, cartItems, orderCount, onAdd, onIncrement, onDecrement, onRefreshCart, onResetSession }) {
  const qtyMap = {};
  for (const item of cartItems) {
    qtyMap[item.productId] = item.quantity;
  }
  return (
    <>
      <section className="hero card">
        <div>
          <p className="eyebrow">Shopify-like layout, minimal runtime</p>
          <h1>Beautiful commerce UI with a calm editorial feel.</h1>
          <p className="hero-copy">
            Built to sit lightly on top of the existing JSON API: browse a small collection,
            manage a cart, apply a discount, and watch admin metrics update in real time.
          </p>
          <div className="hero-actions">
            <button type="button" className="button button-primary" onClick={onRefreshCart}>
              Refresh cart
            </button>
            <button type="button" className="button button-secondary" onClick={onResetSession}>
              New session
            </button>
          </div>
        </div>
        <aside className="session-card">
          <h2>Session</h2>
          <dl>
            <div>
              <dt>Cart ID</dt>
              <dd>{session.cartId}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{session.userId}</dd>
            </div>
            <div>
              <dt>Items in cart</dt>
              <dd>{cartItems.length}</dd>
            </div>
            <div>
              <dt>Orders placed</dt>
              <dd>{orderCount}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="card catalog-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Collection</p>
            <h2>Curated essentials</h2>
          </div>
          <p>Tap any card to add one unit to the current cart.</p>
        </div>
        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} onAdd={onAdd} onIncrement={onIncrement} onDecrement={onDecrement} qty={qtyMap[product.id] || 0} />
          ))}
        </div>
      </section>
    </>
  );
}
