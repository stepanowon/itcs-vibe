const VARIANT_CLASS = {
  pending: 'text-bg-warning',
  approved: 'text-bg-success',
  rejected: 'text-bg-danger',
  warning: 'text-bg-warning',
  error: 'text-bg-danger',
  inactive: 'text-bg-secondary',
  manager: 'text-bg-success',
  employee: 'text-bg-warning',
}

export default function Badge({ status, children }) {
  return <span className={`badge rounded-pill ${VARIANT_CLASS[status] ?? 'text-bg-secondary'}`}>{children}</span>
}
