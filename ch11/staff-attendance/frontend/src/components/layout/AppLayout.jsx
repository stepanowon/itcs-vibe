import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import './layout.css'

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-content p-3 p-md-4">
        <Outlet />
      </main>
    </div>
  )
}
