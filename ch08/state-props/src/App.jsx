import { useState } from 'react'
import { PRODUCTS } from './products.js'
import ProductList from './ProductList.jsx'
import Cart from './Cart.jsx'

// 장바구니 상태(cartItems)는 여기, 최상위 컴포넌트에만 둔다.
// 자식들은 이 state를 직접 건드리지 못하고, props로 받은 값과 콜백 함수로만 상호작용한다.
const App = () => {
  const [cartItems, setCartItems] = useState([])

  const handleAdd = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        )
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const handleRemove = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId))
  }

  const totalCount = cartItems.reduce((sum, item) => sum + item.qty, 0)

  return (
    <>
      <header className="hero">
        <span className="badge">React · state &amp; props</span>
        <h1>쇼핑몰 장바구니</h1>
        <p className="subtitle">
          장바구니 상태는 최상위 App 컴포넌트에만 있고, 자식 컴포넌트들은 props로 받은 값과
          콜백 함수로만 상태와 상호작용합니다. 담긴 수량: {totalCount}개
        </p>
      </header>
      <main>
        <div className="grid">
          <ProductList products={PRODUCTS} onAdd={handleAdd} />
          <Cart cartItems={cartItems} onRemove={handleRemove} />
        </div>

        <div className="devtools-guide">
          <h3>컴포넌트 트리로 직접 확인해보기</h3>
          <p>
            브라우저 개발자 도구를 열고(F12) 상단의 <strong>⚛️ Components</strong> 탭에서
            App → ProductList/Cart → ProductCard/CartItem으로 이어지는 트리와, 각 컴포넌트가
            어떤 state·props를 갖고 있는지 확인해보세요.
          </p>
          <a
            className="button"
            href="https://react.dev/learn/react-developer-tools"
            target="_blank"
            rel="noopener"
          >
            React Developer Tools 설치 ↗
          </a>
        </div>
      </main>
    </>
  )
}

export default App
