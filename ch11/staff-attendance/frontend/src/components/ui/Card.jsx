export default function Card({ title, children }) {
  return (
    <div className="card shadow-sm">
      {title && (
        <div className="card-header bg-white">
          <h2 className="h6 fw-semibold mb-0">{title}</h2>
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  )
}
