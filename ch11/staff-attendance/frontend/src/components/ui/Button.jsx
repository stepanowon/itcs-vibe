const VARIANT_CLASS = {
  primary: 'btn-success',
  secondary: 'btn-outline-secondary',
  danger: 'btn-danger',
}

export default function Button({ variant = 'primary', disabled, loading, children, ...props }) {
  const isDisabled = disabled || loading

  return (
    <button className={`btn ${VARIANT_CLASS[variant]}`} disabled={isDisabled} {...props}>
      {children}
    </button>
  )
}
