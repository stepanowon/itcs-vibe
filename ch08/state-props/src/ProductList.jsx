import ProductCard from './ProductCard.jsx'

// 자체 state 없이, 부모(App)에게 받은 props를 그대로 자식(ProductCard)에게 전달만 한다.
const ProductList = ({ products, onAdd }) => {
  return (
    <section className="card">
      <h2>PRODUCTS</h2>
      <h3>상품 목록</h3>
      <ul className="product-list">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={onAdd} />
        ))}
      </ul>
    </section>
  )
}

export default ProductList
