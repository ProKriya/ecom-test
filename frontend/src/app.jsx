import { useEffect, useState } from 'preact/hooks';
import { createSessionId, formatMoney, requestJSON } from './api.js';
import { StorePage } from './pages/StorePage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { OrdersPage } from './pages/OrdersPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';

const ROUTES = {
  '/': StorePage,
  '/cart': CartPage,
  '/orders': OrdersPage,
  '/admin': AdminPage
};

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

function formatCouponError(error) {
  const message = String(error?.message || '').toLowerCase();
  if (error?.status === 404 || message.includes('invalid discount code')) return 'Invalid coupon code.';
  if (error?.status === 409 || message.includes('already used') || message.includes('already applied')) return 'Coupon already used.';
  if (message.includes('expired')) return 'Coupon expired.';
  return 'Coupon not valid.';
}

function useRouter() {
  const [route, setRoute] = useState(() => {
    const hash = window.location.hash.slice(1);
    return ROUTES[hash] ? hash : '/';
  });

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1);
      setRoute(ROUTES[hash] ? hash : '/');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function navigate(path) {
    window.location.hash = path;
  }

  const Page = ROUTES[route];
  return { Page, route, navigate };
}

export function App() {
  const { Page, route, navigate } = useRouter();
  const [session, setSession] = useState({ cartId: '', userId: '' });
  const [cart, setCart] = useState({ items: [] });
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [storeStatus, setStoreStatus] = useState('Connecting...');
  const [storeHealthy, setStoreHealthy] = useState(false);
  const [checkoutCode, setCheckoutCode] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [adminCode, setAdminCode] = useState(null);
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
    return () => { cancelled = true; };
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
        body: JSON.stringify({ userId: session.userId, product: { productId: product.id, productName: product.name, price: product.price, quantity: 1 } })
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
      await requestJSON(`/api/cart/${session.cartId}/items/${productId}`, { method: 'DELETE' });
      await Promise.all([refreshCart(), refreshAnalytics()]);
      setStoreStatus('Removed item from cart');
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleIncrement(product) {
    setError('');
    try {
      await requestJSON(`/api/cart/${session.cartId}/items`, {
        method: 'POST',
        body: JSON.stringify({ userId: session.userId, product: { productId: product.id, productName: product.name, price: product.price, quantity: 1 } })
      });
      await Promise.all([refreshCart(), refreshAnalytics()]);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleDecrement(productId) {
    setError('');
    try {
      const item = cartItems.find(i => i.productId === productId);
      if (!item) return;
      if (item.quantity <= 1) {
        await requestJSON(`/api/cart/${session.cartId}/items/${productId}`, { method: 'DELETE' });
      } else {
        await requestJSON(`/api/cart/${session.cartId}/items/${productId}`, {
          method: 'PATCH', body: JSON.stringify({ quantity: item.quantity - 1 })
        });
      }
      await Promise.all([refreshCart(), refreshAnalytics()]);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  async function handleClearCart() {
    setError('');
    setCheckoutError('');
    try {
      await requestJSON(`/api/cart/${session.cartId}`, { method: 'DELETE' });
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
    const cartItems = Array.isArray(cart?.items) ? cart.items : [];
    if (cartItems.length === 0) {
      setCheckoutError('Add at least one item before checkout.');
      return;
    }
    try {
      const payload = { userId: session.userId, discountCode: checkoutCode.trim() || undefined };
      const response = await requestJSON(`/api/checkout/${session.cartId}`, {
        method: 'POST', body: JSON.stringify(payload)
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
        method: 'POST', body: JSON.stringify(payload)
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

      <nav className="page-nav">
        <a href="#/" className={`page-nav-link ${route === '/' ? 'page-nav-link--active' : ''}`}>Store</a>
        <a href="#/cart" className={`page-nav-link ${route === '/cart' ? 'page-nav-link--active' : ''}`}>
          <span className="nav-cart-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {cartItems.length > 0 ? <span className="nav-cart-badge">{cartItems.length}</span> : null}
          </span>
        </a>
        <a href="#/orders" className={`page-nav-link ${route === '/orders' ? 'page-nav-link--active' : ''}`}>Orders</a>
        <a href="#/admin" className={`page-nav-link ${route === '/admin' ? 'page-nav-link--active' : ''}`}>Admin</a>
      </nav>

      <main>
        <Page
          session={session}
          cartItems={cartItems}
          orderCount={orderCount}
          analytics={analytics}
          adminForm={adminForm}
          adminCode={adminCode}
          checkoutCode={checkoutCode}
          checkoutError={checkoutError}
          checkoutResult={checkoutResult}
          error={error}
          orders={orders}
          onAdd={handleAdd}
          onRemove={handleRemove}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
          onCheckoutCodeChange={setCheckoutCode}
          onDismissResult={() => setCheckoutResult(null)}
          onGenerateDiscount={handleGenerateDiscount}
          onAdminFormChange={setAdminForm}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onRefreshCart={refreshCart}
          onResetSession={resetSession}
        />
        {error ? <div className="error-banner">{error}</div> : null}
      </main>
    </div>
  );
}
