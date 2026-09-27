const CartItem = ({ item, onRemove }) => {
  return (
    <li className="cart-item">
      <span>{item.name} x {item.qty}</span>
      <span>{(item.price * item.qty).toLocaleString()}원</span>
      <button onClick={() => onRemove(item.id)}>삭제</button>
    </li>
  )
}

export default CartItem
