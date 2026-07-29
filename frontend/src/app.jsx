import { useEffect, useState } from 'preact/hooks';
import { createSessionId, formatMoney, requestJSON } from './api.js';
import { products } from './data.js';

const emptyAdminForm = {
  percentage: '15',
  type: 'manual',
  maxUsage: '',
  expiresAt: ''
};

function readSession() {
  const storedCartId = localStorage.getItem('uniblox-cart-id');
  const storedUserId = localStorage.getItem('uniblox-user-id');
  const cartId = storedCartId || createSessionId('cart');
  const userId = storedUserId || createSessionId('user');

  localStorage.setItem('uniblox-cart-id', cartId);
  localStorage.setItem('uniblox-user-id', userId);

  return { cartId, userId };
}

function sumCart(items) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

function formatDate(value) {
  if (!value) return 'Just now';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatCouponError(error) {
  const message = String(error?.message || '').toLowerCase();

  if (error?.status === 404 || message.includes('invalid discount code')) {
    return 'Invalid coupon code.';
  }

  if (error?.status === 409 || message.includes('already used') || message.includes('already applied')) {
    return 'Coupon already used.';
  }

  if (message.includes('expired')) {
    return 'Coupon expired.';
  }

  return 'Coupon not valid.';
}

function MetricCard({ label, value, hint }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  );
}

function ProductCard({ product, onAdd }) {
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
        <button type="button" className="button button-secondary" onClick={() => onAdd(product)}>
          Add to cart
        </button>
      </div>
    </article>
  );
}

function CartItemRow({ item, onRemove }) {
  return (
    <li className="cart-item">
      <div>
        <strong>{item.productName}</strong>
        <p>
          {item.quantity} x {formatMoney(item.price)}
        </p>
      </div>
      <div className="cart-item-actions">
        <strong>{formatMoney(item.price * item.quantity)}</strong>
        <button type="button" className="link-button" onClick={() => onRemove(item.productId)}>
          Remove
        </button>
      </div>
    </li>
  );
}

export function App() {
  const [session, setSession] = useState({ cartId: '', userId: '' });
  const [cart, setCart] = useState({ items: [] });
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [storeStatus, setStoreStatus] = useState('Connecting...');
  const [storeHealthy, setStoreHealthy] = useState(false);
  const [checkoutCode, setCheckoutCode] = useState('');
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [adminCode, setAdminCode] = useState(null);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSession(readSession());
  }, []);

  useEffect(() => {
    if (!session.cartId || !session.userId) return;

    let cancelled = false;

    async function refreshAll() {
      try {
        const [health, cartResponse, ordersResponse, analyticsResponse] = await Promise.all([
          requestJSON('/health'),
          requestJSON(`/api/cart/${session.cartId}`).catch(() => ({ items: [] })),
          requestJSON(`/api/orders/user/${session.userId}`).catch(() => []),
          requestJSON('/api/admin/analytics')
      ]);

        if (cancelled) return;

        setStoreHealthy(health.status === 'ok');
        setStoreStatus(`API ${health.status} at ${new Date(health.timestamp).toLocaleTimeString('en-US')}`);
        setCart(cartResponse || { items: [] });
        setOrders(Array.isArray(ordersResponse) ? ordersResponse : []);
        setAnalytics(analyticsResponse);
        setCheckoutError('');
        setError('');
      } catch (nextError) {
        if (cancelled) return;
        setStoreHealthy(false);
        setStoreStatus('Storefront is offline');
        setError(nextError.message);
      }
    }

    refreshAll();

    return () => {
      cancelled = true;
    };
  }, [session.cartId, session.userId]);

  async function refreshCart() {
    const response = await requestJSON(`/api/cart/${session.cartId}`).catch(() => ({ items: [] }));
    setCart(response || { items: [] });
  }

  async function refreshOrders() {
    const response = await requestJSON(`/api/orders/user/${session.userId}`).catch(() => []);
    setOrders(Array.isArray(response) ? response : []);
  }

  async function refreshAnalytics() {
    const response = await requestJSON('/api/admin/analytics');
    setAnalytics(response);
  }

  async function handleAdd(product) {
    setError('');
    setCheckoutError('');
    try {
      await requestJSON(`/api/cart/${session.cartId}/items`, {
        method: 'POST',
        body: JSON.stringify({
          userId: session.userId,
          product: {
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: 1
          }
        })
      });
      await Promise.all([refreshCart(), refreshAnalytics()]);
      setStoreStatus(`Added ${product.name} to cart`);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleRemove(productId) {
    setError('');
    setCheckoutError('');
    try {
      await requestJSON(`/api/cart/${session.cartId}/items/${productId}`, {
        method: 'DELETE'
      });
      await Promise.all([refreshCart(), refreshAnalytics()]);
      setStoreStatus('Removed item from cart');
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleClearCart() {
    setError('');
    setCheckoutError('');
    try {
      await requestJSON(`/api/cart/${session.cartId}`, {
        method: 'DELETE'
      });
      setCart({ items: [] });
      setStoreStatus('Cart cleared');
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleCheckout(event) {
    event.preventDefault();
    setError('');
    setCheckoutError('');
    if (cartItems.length === 0) {
      setCheckoutError('Add at least one item before checkout.');
      return;
    }
    try {
      const payload = {
        userId: session.userId,
        discountCode: checkoutCode.trim() || undefined
      };
      const response = await requestJSON(`/api/checkout/${session.cartId}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setCheckoutResult(response);
      setCheckoutCode('');
      setCheckoutError('');
      await Promise.all([refreshCart(), refreshOrders(), refreshAnalytics()]);
      setStoreStatus('Checkout complete');
    } catch (nextError) {
      if (checkoutCode.trim()) {
        setCheckoutError(formatCouponError(nextError));
      } else {
        setCheckoutError('');
        setError(nextError.message);
      }
    }
  }

  async function handleGenerateDiscount(event) {
    event.preventDefault();
    setError('');
    setCheckoutError('');
    try {
      const payload = {
        percentage: Number(adminForm.percentage),
        type: adminForm.type,
        maxUsage: adminForm.maxUsage === '' ? null : Number(adminForm.maxUsage),
        expiresAt: adminForm.expiresAt ? new Date(adminForm.expiresAt).toISOString() : null
      };

      const response = await requestJSON('/api/admin/discount/generate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setAdminCode(response);
      setStoreStatus('Discount code generated');
      await refreshAnalytics();
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  function resetSession() {
    localStorage.removeItem('uniblox-cart-id');
    localStorage.removeItem('uniblox-user-id');
    setCheckoutResult(null);
    setCheckoutError('');
    setAdminCode(null);
    setCheckoutCode('');
    setAdminForm(emptyAdminForm);
    setSession(readSession());
  }

  const cartItems = Array.isArray(cart?.items) ? cart.items : [];
  const subtotal = sumCart(cartItems);
  const orderCount = orders.length;

  return (
    <div className="page-shell">
      <div className="background-orb background-orb-left" />
      <div className="background-orb background-orb-right" />

      <header className="topbar">
        <div>
          <div className="brand">
            <span className="brand-mark">U</span>
            <span>Uniblox Market</span>
          </div>
          <p className="topbar-copy">A quiet storefront for essentials, checkout, and admin controls.</p>
        </div>

        <div className="status-stack">
          <span className={`status-pill ${storeHealthy ? 'status-pill--good' : 'status-pill--bad'}`}>
            {storeHealthy ? 'Store online' : 'Store offline'}
          </span>
          <small>{storeStatus}</small>
        </div>
      </header>

      <main>
        <section className="hero card">
          <div>
            <p className="eyebrow">Shopify-like layout, minimal runtime</p>
            <h1>Beautiful commerce UI with a calm editorial feel.</h1>
            <p className="hero-copy">
              Built to sit lightly on top of the existing JSON API: browse a small collection,
              manage a cart, apply a discount, and watch admin metrics update in real time.
            </p>

            <div className="hero-actions">
              <button type="button" className="button button-primary" onClick={() => refreshCart()}>
                Refresh cart
              </button>
              <button type="button" className="button button-secondary" onClick={resetSession}>
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

        <section className="stats-grid" aria-label="Store metrics">
          <MetricCard label="Orders" value={analytics ? analytics.totalOrders : '0'} hint="Completed checkouts" />
          <MetricCard label="Revenue" value={analytics ? formatMoney(analytics.totalRevenue) : '$0.00'} hint="Final totals" />
          <MetricCard label="Discount codes" value={analytics ? analytics.totalDiscountCodes : '0'} hint="Generated by admin" />
          <MetricCard label="Discounts given" value={analytics ? formatMoney(analytics.totalDiscountsGiven) : '$0.00'} hint="Applied at checkout" />
        </section>

        <section className="layout">
          <div className="card catalog-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Collection</p>
                <h2>Curated essentials</h2>
              </div>
              <p>Tap any card to add one unit to the current cart.</p>
            </div>

            <div className="product-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} onAdd={handleAdd} />
              ))}
            </div>
          </div>

          <aside className="card cart-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Cart</p>
                <h2>Checkout desk</h2>
              </div>
              <button type="button" className="link-button" onClick={handleClearCart}>
                Clear cart
              </button>
            </div>

            <ul className="cart-list">
              {cartItems.length === 0 ? (
                <li className="empty-state">Your cart is empty. Add an item from the collection.</li>
              ) : (
                cartItems.map(item => <CartItemRow key={item.productId} item={item} onRemove={handleRemove} />)
              )}
            </ul>

            <div className="cart-summary">
              <div>
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal)}</strong>
              </div>
              <div>
                <span>Items</span>
                <strong>{cartItems.length}</strong>
              </div>
            </div>

            <form className="stack" onSubmit={handleCheckout}>
              <label className="field">
                <span>Discount code</span>
                <input
                  value={checkoutCode}
                  onInput={(event) => {
                    setCheckoutCode(event.currentTarget.value);
                    setCheckoutError('');
                  }}
                  placeholder="SAVE10"
                />
              </label>
              <button type="submit" className="button button-primary" disabled={cartItems.length === 0}>
                Place order
              </button>
            </form>

            {checkoutError ? <p className="field-note field-note--error">{checkoutError}</p> : null}

            {checkoutResult ? (
              <section className="result-card" aria-live="polite">
                <p className="eyebrow">Latest order</p>
                <strong>{checkoutResult.message}</strong>
                <small>
                  Order {checkoutResult.order.id} for {formatMoney(checkoutResult.order.finalAmount)}
                </small>
              </section>
            ) : null}
          </aside>
        </section>

        <section className="admin-grid">
          <article className="card admin-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Admin</p>
                <h2>Generate a code</h2>
              </div>
              <p>Use the same API as the backend admin route.</p>
            </div>

            <form className="admin-form" onSubmit={handleGenerateDiscount}>
              <label className="field">
                <span>Percentage</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={adminForm.percentage}
                  onInput={(event) => setAdminForm({ ...adminForm, percentage: event.currentTarget.value })}
                />
              </label>

              <label className="field">
                <span>Type</span>
                <select
                  value={adminForm.type}
                  onChange={(event) => setAdminForm({ ...adminForm, type: event.currentTarget.value })}
                >
                  <option value="manual">Manual</option>
                  <option value="nth_order">Nth order</option>
                  <option value="special">Special</option>
                </select>
              </label>

              <label className="field">
                <span>Max usage</span>
                <input
                  type="number"
                  min="1"
                  value={adminForm.maxUsage}
                  onInput={(event) => setAdminForm({ ...adminForm, maxUsage: event.currentTarget.value })}
                  placeholder="Optional"
                />
              </label>

              <label className="field field--wide">
                <span>Expiration</span>
                <input
                  type="datetime-local"
                  value={adminForm.expiresAt}
                  onInput={(event) => setAdminForm({ ...adminForm, expiresAt: event.currentTarget.value })}
                />
              </label>

              <button type="submit" className="button button-primary field--wide">
                Generate code
              </button>
            </form>

            {adminCode ? (
              <section className="result-card">
                <p className="eyebrow">Generated code</p>
                <strong>{adminCode.code}</strong>
                <small>
                  {adminCode.details.percentage}% {adminCode.details.type} discount
                </small>
              </section>
            ) : null}
          </article>

          <article className="card admin-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Recent orders</p>
                <h2>Order ledger</h2>
              </div>
              <p>Customer activity from the current session.</p>
            </div>

            <ul className="ledger-list">
              {orders.length === 0 ? (
                <li className="empty-state">No orders yet. Checkout will populate this ledger.</li>
              ) : (
                orders.slice(0, 4).map(order => (
                  <li key={order.id} className="ledger-item">
                    <div>
                      <strong>{order.id.slice(0, 8)}</strong>
                      <p>{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <strong>{formatMoney(order.finalAmount)}</strong>
                      <p>{order.discountCode ? `Discount ${order.discountCode}` : 'No discount'}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </article>
        </section>

        {error ? <div className="error-banner">{error}</div> : null}
      </main>
    </div>
  );
}
