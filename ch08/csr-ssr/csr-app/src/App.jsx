import { Route, Routes } from 'react-router-dom'
import Nav from './Nav'
import Home from './pages/Home'
import About from './pages/About'
import Posts from './pages/Posts'

function App() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/posts" element={<Posts />} />
        </Routes>
      </main>
      <footer>CSR vs SSR 비교 예제 · React + Vite</footer>
    </>
  )
}

export default App
