import { useState, useEffect, useRef } from 'react'
import { STATUS_COLORS, STUDENT_STATUS_COLORS, fmt } from '../lib/utils'

// ─── Icon ─────────────────────────────────────────────────────────────────────
export function Icon({ name, filled = false, size = 24, style = {}, className = '' }) {
  return (
    <span
      className={`msym ${filled ? 'fill' : ''} ${className}`}
      style={{ fontSize: size, ...style }}
    >
      {name}
    </span>
  )
}

// ─── Chip / Badge ─────────────────────────────────────────────────────────────
export function StatusChip({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.Pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '2px 10px', borderRadius: 'var(--r-full)',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
      background: c.bg, color: c.color, whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  )
}

export function StudentStatusChip({ status }) {
  const c = STUDENT_STATUS_COLORS[status] || STUDENT_STATUS_COLORS.Inactive
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 'var(--r-full)',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
      background: c.bg, color: c.color,
    }}>
      {status}
    </span>
  )
}

export function ClassChip({ cls }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4,
      background: 'var(--clr-secondary-container)', color: 'var(--clr-on-secondary-cont)',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>
      {cls}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name = '', size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--clr-surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: 'var(--clr-primary)',
    }}>
      {fmt.initials(name)}
    </div>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', full = false, small = false, disabled = false, type = 'button', style = {} }) {
  const styles = {
    primary: { background: 'var(--clr-primary-container)', color: '#fff', border: 'none' },
    secondary: { background: 'var(--clr-surface-container)', color: 'var(--clr-on-surface)', border: '1px solid var(--clr-outline-var)' },
    danger: { background: 'var(--clr-error-container)', color: 'var(--clr-on-error-cont)', border: 'none' },
    ghost: { background: 'transparent', color: 'var(--clr-primary)', border: 'none' },
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        height: small ? 36 : 48, padding: small ? '0 14px' : '0 24px',
        borderRadius: 'var(--r-full)', fontFamily: 'inherit',
        fontSize: small ? 12 : 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, width: full ? '100%' : undefined,
        transition: 'all 0.15s', boxShadow: variant === 'primary' ? 'var(--sh-md)' : 'none',
        ...styles[variant], ...style,
      }}
    >
      {children}
    </button>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, onClick, style = {}, accentColor }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--clr-surface-white)', borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--sh-card)', overflow: 'hidden',
        borderLeft: accentColor ? `4px solid ${accentColor}` : undefined,
        border: accentColor ? undefined : '1px solid var(--clr-outline-var)',
        cursor: onClick ? 'pointer' : undefined,
        transition: onClick ? 'transform 0.15s, box-shadow 0.15s' : undefined,
        ...style,
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--sh-md)' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--sh-card)' }}
    >
      {children}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, value, onChange, type = 'text', placeholder = '', required = false, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-on-surface-var)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}{required && ' *'}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          height: 48, padding: '0 14px', borderRadius: 'var(--r-lg)',
          border: '1.5px solid var(--clr-outline-var)', background: 'var(--clr-surface-white)',
          fontFamily: 'inherit', fontSize: 15, color: 'var(--clr-on-surface)', outline: 'none',
          transition: 'border-color 0.2s', ...style,
        }}
        onFocus={e => e.target.style.borderColor = 'var(--clr-primary-container)'}
        onBlur={e => e.target.style.borderColor = 'var(--clr-outline-var)'}
      />
    </div>
  )
}

export function Select({ label, value, onChange, options = [], required = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-on-surface-var)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}{required && ' *'}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          height: 48, padding: '0 14px', borderRadius: 'var(--r-lg)',
          border: '1.5px solid var(--clr-outline-var)', background: 'var(--clr-surface-white)',
          fontFamily: 'inherit', fontSize: 15, color: 'var(--clr-on-surface)', outline: 'none',
          appearance: 'none', cursor: 'pointer',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--clr-primary-container)'}
        onBlur={e => e.target.style.borderColor = 'var(--clr-outline-var)'}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
export function Stepper({ label, value, onChange, min = 1, max = 99 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-on-surface-var)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 48, border: '1.5px solid var(--clr-outline-var)', borderRadius: 'var(--r-lg)',
        background: 'var(--clr-surface-white)', padding: '0 4px',
      }}>
        <button onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary-container)', fontSize: 20, transition: 'background 0.15s' }} onMouseEnter={e => e.target.style.background='var(--clr-surface-high)'} onMouseLeave={e => e.target.style.background='transparent'}>−</button>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-primary)', minWidth: 40, textAlign: 'center' }}>{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary-container)', fontSize: 20, transition: 'background 0.15s' }} onMouseEnter={e => e.target.style.background='var(--clr-surface-high)'} onMouseLeave={e => e.target.style.background='transparent'}>+</button>
      </div>
    </div>
  )
}

// ─── FilterChip ───────────────────────────────────────────────────────────────
export function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, padding: '6px 16px', borderRadius: 'var(--r-full)', border: 'none',
        background: active ? 'var(--clr-primary-container)' : 'var(--clr-surface-high)',
        color: active ? 'var(--clr-on-primary-cont)' : 'var(--clr-on-surface-var)',
        fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', cursor: 'pointer',
        transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

// ─── BottomSheet / Modal ──────────────────────────────────────────────────────
export function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'overlayIn 0.2s ease',
      }}
    >
      <style>{`@keyframes overlayIn{from{opacity:0}to{opacity:1}} @keyframes sheetIn{from{transform:translateY(100%)}to{transform:none}}`}</style>
      <div style={{
        width: '100%', maxWidth: 640,
        background: 'var(--clr-surface-white)',
        borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
        padding: '16px 20px 32px',
        maxHeight: '90dvh', overflowY: 'auto',
        animation: 'sheetIn 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ width: 40, height: 4, background: 'var(--clr-outline-var)', borderRadius: 4, margin: '0 auto 16px' }} />
        {title && <p style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>{title}</p>}
        {children}
      </div>
    </div>
  )
}

// ─── SearchInput ──────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon name="search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-on-surface-var)', pointerEvents: 'none' }} />
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', height: 48, paddingLeft: 48, paddingRight: 14,
          background: 'var(--clr-surface-white)', border: '1.5px solid var(--clr-outline-var)',
          borderRadius: 'var(--r-full)', fontFamily: 'inherit', fontSize: 14,
          color: 'var(--clr-on-surface)', outline: 'none', transition: 'all 0.2s',
          boxShadow: 'var(--sh-card)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--clr-primary)'}
        onBlur={e => e.target.style.borderColor = 'var(--clr-outline-var)'}
      />
    </div>
  )
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value = 0, color = 'var(--clr-primary)', height = 6 }) {
  return (
    <div style={{ width: '100%', height, background: 'var(--clr-surface-highest)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: color, borderRadius: 'var(--r-full)', transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ value, label, icon, color = 'var(--clr-primary-fixed)', iconColor = 'var(--clr-on-primary-fixed)', valueColor = 'var(--clr-primary)' }) {
  return (
    <div style={{ background: 'var(--clr-surface-white)', borderRadius: 'var(--r-lg)', padding: '14px 14px 12px', boxShadow: 'var(--sh-card)', border: '1px solid var(--clr-outline-var)' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Icon name={icon} size={20} style={{ color: iconColor }} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--clr-on-surface-var)', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = 'inbox', title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12, textAlign: 'center' }}>
      <Icon name={icon} size={48} style={{ color: 'var(--clr-outline-var)' }} />
      {title && <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--clr-on-surface)' }}>{title}</p>}
      {subtitle && <p style={{ fontSize: 14, color: 'var(--clr-on-surface-var)' }}>{subtitle}</p>}
      {action}
    </div>
  )
}

// ─── LoadingRows ──────────────────────────────────────────────────────────────
export function LoadingRows({ n = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{ height: 72, borderRadius: 'var(--r-lg)', background: `linear-gradient(90deg,var(--clr-surface-high) 25%,var(--clr-surface-highest) 50%,var(--clr-surface-high) 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      ))}
      <style>{`@keyframes shimmer{to{background-position:-200% 0}}`}</style>
    </div>
  )
}

// ─── Toast system ─────────────────────────────────────────────────────────────
export function ToastContainer({ toasts }) {
  return (
    <div style={{ position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8, width: 'calc(100% - 32px)', maxWidth: 400, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'success' ? 'var(--clr-primary-container)' : t.type === 'error' ? 'var(--clr-error)' : 'var(--clr-inverse-surface)',
          color: '#fff', padding: '12px 16px', borderRadius: 'var(--r-lg)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500,
          boxShadow: 'var(--sh-lg)', pointerEvents: 'all',
          animation: 'toastIn 0.25s ease',
        }}>
          <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}`}</style>
          <Icon name={t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'} size={20} style={{ flexShrink: 0 }} />
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ─── DutyCard ─────────────────────────────────────────────────────────────────
export function DutyCard({ duty, onClick }) {
  const strip = STATUS_COLORS[duty.status]?.strip || '#003527'
  return (
    <Card onClick={onClick} accentColor={strip} style={{ display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--clr-on-surface)' }} className="ellipsis">{duty.areaName}</span>
            <span style={{ padding: '1px 7px', borderRadius: 4, background: 'var(--clr-secondary-container)', color: 'var(--clr-on-secondary-cont)', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{duty.type}</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--clr-on-surface-var)' }}>{duty.studentName} · {duty.class}</p>
          <p style={{ fontSize: 11, color: 'var(--clr-outline)', marginTop: 1 }}>{fmt.date(duty.date)}</p>
        </div>
        <StatusChip status={duty.status} />
      </div>
    </Card>
  )
}
