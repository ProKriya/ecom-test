import { formatMoney } from '../api.js';

function formatDate(value) {
  if (!value) return 'Just now';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export function OrdersPage({ orders }) {
  return (
    <section className="card admin-panel orders-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">History</p>
          <h2>Order ledger</h2>
        </div>
        <p>Customer activity from the current session.</p>
      </div>

      <ul className="ledger-list">
        {orders.length === 0 ? (
          <li className="empty-state">No orders yet. Checkout will populate this ledger.</li>
        ) : (
          orders.map(order => (
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
    </section>
  );
}
