import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { AlertCircle, LoaderCircle } from 'lucide-react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`button button-${variant} button-${size} ${className}`}
      {...props}
    />
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'green' | 'amber' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: string
  detail?: string
  icon: ReactNode
}) {
  return (
    <Card className="stat-card">
      <div className="stat-heading"><span>{label}</span><span className="stat-icon">{icon}</span></div>
      <div className="stat-value">{value}</div>
      {detail && <div className="stat-detail">{detail}</div>}
    </Card>
  )
}

export function PageHeading({ eyebrow, title, description, action }: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function LoadingState({ label = 'Loading your training data…' }: { label?: string }) {
  return <div className="state-panel" role="status"><LoaderCircle className="spin" size={20} />{label}</div>
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="state-panel state-error" role="alert">
      <AlertCircle size={20} />
      <span>{message}</span>
      {retry && <Button variant="secondary" size="sm" onClick={retry}>Try again</Button>}
    </div>
  )
}

export function EmptyState({ title, description, action }: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-mark">—</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function ChartCard({ title, subtitle, children, className = '' }: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={`chart-card ${className}`}>
      <div className="card-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>
      <div className="chart-wrap">{children}</div>
    </Card>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field ${props.className ?? ''}`} {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`field ${props.className ?? ''}`} {...props} />
}

export function DatePicker(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="date" className={`field ${props.className ?? ''}`} {...props} />
}

export type DataColumn<T> = {
  key: string
  heading: string
  render: (row: T) => ReactNode
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyMessage = 'No data to display.',
}: {
  columns: DataColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string
  emptyMessage?: string
}) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.heading}</th>)}</tr></thead>
        <tbody>{rows.length ? rows.map((row) => (
          <tr key={getRowKey(row)}>{columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}</tr>
        )) : <tr><td colSpan={columns.length} className="table-empty">{emptyMessage}</td></tr>}</tbody>
      </table>
    </div>
  )
}

export function Modal({ open, title, children, onClose }: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading"><h2>{title}</h2><Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">×</Button></div>
        {children}
      </section>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="confirm-message">{message}</p>
      <div className="modal-actions"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button onClick={onConfirm}>{confirmLabel}</Button></div>
    </Modal>
  )
}
