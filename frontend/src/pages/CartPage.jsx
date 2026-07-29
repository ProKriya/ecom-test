import { formatMoney } from '../api.js';

function CartItemRow({ item, onRemove }) {
  return (
    <li className="cart-item">
      <div>
        <strong>{item.productName}</strong>
        <p>{item.quantity} x {formatMoney(item.price)}</p>
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

function sumCart(items) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function CartPage({
  cartItems,
  checkoutCode,
  onCheckoutCodeChange,
  checkoutError,
  onCheckout,
  onRemove,
  onClearCart,
  checkoutResult,
  onDismissResult
}) {
  const subtotal = sumCart(cartItems);

  return (
    <section className="card cart-panel cart-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cart</p>
          <h2>Checkout desk</h2>
        </div>
        <button type="button" className="link-button" onClick={onClearCart}>
          Clear cart
        </button>
      </div>

      <ul className="cart-list">
        {cartItems.length === 0 ? (
          <li className="empty-state">Your cart is empty. Add an item from the collection.</li>
        ) : (
          cartItems.map(item => <CartItemRow key={item.productId} item={item} onRemove={onRemove} />)
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

      <form className="stack" onSubmit={onCheckout}>
        <label className="field">
          <span>Discount code</span>
          <input
            value={checkoutCode}
            onInput={(event) => {
              onCheckoutCodeChange(event.currentTarget.value);
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
        <div className="dialog-overlay" onClick={onDismissResult}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-header">
              <p className="eyebrow">Order confirmed</p>
              <button type="button" className="link-button" onClick={onDismissResult}>Close</button>
            </div>
            <dl className="invoice">
              <div>
                <dt>Order</dt>
                <dd>{checkoutResult.order.id.slice(0, 8)}</dd>
              </div>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatMoney(checkoutResult.order.subtotal)}</dd>
              </div>
              <div>
                <dt>Discount</dt>
                <dd>{checkoutResult.order.discountAmount > 0 ? `-${formatMoney(checkoutResult.order.discountAmount)}` : '$0.00'}</dd>
              </div>
              <div className="invoice-total">
                <dt>Total</dt>
                <dd>{formatMoney(checkoutResult.order.finalAmount)}</dd>
              </div>
              {checkoutResult.order.discountCode ? (
                <div>
                  <dt>Code</dt>
                  <dd className="discount-code">{checkoutResult.order.discountCode}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      ) : null}
    </section>
  );
}
