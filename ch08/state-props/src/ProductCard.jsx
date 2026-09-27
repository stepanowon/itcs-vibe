// props로 받은 product를 보여주고, 클릭 시 부모가 내려준 onAdd 콜백을 호출한다.
// state를 직접 바꾸는 게 아니라 "이벤트가 일어났다"는 사실만 부모에게 알린다.
const ProductCard = ({ product, onAdd }) => {
  return (
    <li className="product-card">
      <span>{product.name}</span>
      <span>{product.price.toLocaleString()}원</span>
      <button onClick={() => onAdd(product)}>담기</button>
    </li>
  )
}

export default ProductCard
