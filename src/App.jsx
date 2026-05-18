import { useState } from 'react'
import { isDemoMode } from './lib/api'
import { useToast } from './hooks/useToast'
import { ToastContainer, Icon } from './components/ui'
import Dashboard from './pages/Dashboard'
import Students  from './pages/Students'
import Generate  from './pages/Generate'
import Duties    from './pages/Duties'
import Reports   from './pages/Reports'

const NAV = [
  { id: 'dashboard', icon: 'home',         label: 'Home'     },
  { id: 'students',  icon: 'group',        label: 'Students' },
  { id: 'generate',  icon: 'auto_awesome', label: 'Generate' },
  { id: 'duties',    icon: 'assignment',   label: 'Duties'   },
  { id: 'reports',   icon: 'analytics',    label: 'Reports'  },
]

export default function App() {
  const [page, setPage]       = useState('dashboard')
  const [subTab, setSubTab]   = useState(null)
  const toast                 = useToast()

  function navigate(p, tab = null) {
    setPage(p)
    setSubTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pageProps = { toast, onNavigate: navigate }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--clr-surface)' }}>
      {/* Demo banner */}
      {isDemoMode && (
        <div style={{ background: '#92400e', color: '#fff', textAlign: 'center', padding: '7px 16px', fontSize: 12, fontWeight: 600 }}>
          <span className="msym sm" style={{ verticalAlign: 'middle', marginRight: 6 }}>science</span>
          Demo Mode — data is local only.
          <a href="https://github.com/yourusername/dutyflow#deployment" target="_blank" rel="noreferrer" style={{ color: '#fcd34d', marginLeft: 8, textDecoration: 'underline' }}>Connect backend →</a>
        </div>
      )}

      {/* Page */}
      {page === 'dashboard' && <Dashboard key="dashboard" {...pageProps} />}
      {page === 'students'  && <Students  key="students"  {...pageProps} />}
      {page === 'generate'  && <Generate  key={`generate-${subTab}`} initialTab={subTab || 'daily'} {...pageProps} />}
      {page === 'duties'    && <Duties    key={`duties-${subTab}`}   initialTab={subTab || 'today'} {...pageProps} />}
      {page === 'reports'   && <Reports   key={`reports-${subTab}`}  initialTab={subTab || 'overview'} {...pageProps} />}

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 50,
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '6px 4px', background: 'var(--clr-surface-white)',
        borderTop: '1px solid var(--clr-outline-var)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        borderRadius: '20px 20px 0 0',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}>
        {NAV.map(n => {
          const active = page === n.id
          return (
            <button key={n.id} onClick={() => navigate(n.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '4px 12px', borderRadius: 'var(--r-lg)', border: 'none', cursor: 'pointer',
              background: active ? 'var(--clr-secondary-container)' : 'transparent',
              color: active ? 'var(--clr-on-secondary-cont)' : 'var(--clr-on-surface-var)',
              transition: 'all 0.18s', minWidth: 52,
            }}>
              <span className={`msym ${active ? 'fill' : ''}`} style={{ fontSize: 24 }}>{n.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, marginTop: 2, letterSpacing: '0.02em' }}>{n.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Toasts */}
      <ToastContainer toasts={toast.toasts} />
    </div>
  )
}
