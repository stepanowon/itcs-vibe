import CartItem from './CartItem.jsx'

const Cart = ({ cartItems, onRemove }) => {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)

  return (
    <section className="card">
      <h2>CART</h2>
      <h3>장바구니</h3>
      {cartItems.length === 0 ? (
        <p className="empty">담은 상품이 없습니다.</p>
      ) : (
        <ul className="cart-list">
          {cartItems.map((item) => (
            <CartItem key={item.id} item={item} onRemove={onRemove} />
          ))}
        </ul>
      )}
      <p className="total">합계: {total.toLocaleString()}원</p>
    </section>
  )
}

export default Cart
