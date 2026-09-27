export default function Input({ label, error, id, ...inputProps }) {
  const inputId = id ?? inputProps.name

  return (
    <div className="mb-3">
      {label && (
        <label className="form-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input id={inputId} className={`form-control${error ? ' is-invalid' : ''}`} {...inputProps} />
      {error && (
        <div className="invalid-feedback d-block" role="alert">
          ⚠ {error}
        </div>
      )}
    </div>
  )
}
