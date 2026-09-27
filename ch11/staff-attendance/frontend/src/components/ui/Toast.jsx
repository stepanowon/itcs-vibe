import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)
const VARIANT_CLASS = { success: 'text-bg-success', error: 'text-bg-danger' }

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 2000 }}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast show border-0 ${VARIANT_CLASS[toast.type]}`} role="status">
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
