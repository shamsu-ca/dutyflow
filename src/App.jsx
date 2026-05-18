import { useState } from 'react'
import { isDemoMode } from './lib/api'
import { useToast } from './hooks/useToast'
import { ToastContainer, Icon } from './components/ui'
import Dashboard from './pages/Dashboard'
import Students  from './pages/Students'
import Generate  from './pages/Generate'
import Duties    from './pages/Duties'
import Reports   from './pages/Reports'
import Settings  from './pages/Settings'

const NAV = [
  { id:'dashboard', icon:'home',         label:'Home'     },
  { id:'students',  icon:'group',        label:'Students' },
  { id:'generate',  icon:'auto_awesome', label:'Generate' },
  { id:'duties',    icon:'assignment',   label:'Duties'   },
  { id:'settings',  icon:'settings',     label:'Settings' },
]

export default function App() {
  const [page, setPage]   = useState('dashboard')
  const [subTab, setSubTab] = useState(null)
  const toast = useToast()

  function navigate(p, tab = null) {
    setPage(p); setSubTab(tab)
    window.scrollTo({ top:0, behavior:'smooth' })
  }

  const props = { toast, onNavigate: navigate }

  return (
    <div style={{ minHeight:'100dvh', background:'var(--clr-surface)' }}>
      {isDemoMode && (
        <div style={{ background:'#92400e', color:'#fff', textAlign:'center', padding:'6px 16px', fontSize:11, fontWeight:600 }}>
          <span className="msym sm" style={{ verticalAlign:'middle', marginRight:5 }}>science</span>
          Demo Mode — data saved locally only.
        </div>
      )}

      {page==='dashboard' && <Dashboard key="dash" {...props}/>}
      {page==='students'  && <Students  key="stu"  {...props}/>}
      {page==='generate'  && <Generate  key={`gen-${subTab}`}  initialTab={subTab||'daily'} {...props}/>}
      {page==='duties'    && <Duties    key={`dut-${subTab}`}  initialTab={subTab||'today'} {...props}/>}
      {page==='reports'   && <Reports   key={`rep-${subTab}`}  initialTab={subTab||'overview'} {...props}/>}
      {page==='settings'  && <Settings  key="set"  {...props}/>}

      {/* Bottom Nav */}
      <nav style={{ position:'fixed', bottom:0, left:0, width:'100%', zIndex:50, display:'flex', justifyContent:'space-around', alignItems:'center', padding:'5px 4px', background:'var(--clr-surface-white)', borderTop:'1px solid var(--clr-outline-var)', boxShadow:'0 -3px 12px rgba(0,0,0,0.06)', borderRadius:'18px 18px 0 0', paddingBottom:'max(6px, env(safe-area-inset-bottom))' }}>
        {NAV.map(n => {
          const active = page === n.id
          return (
            <button key={n.id} onClick={() => navigate(n.id)} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'3px 10px', borderRadius:'var(--r-lg)', border:'none', cursor:'pointer', background:active?'var(--clr-secondary-container)':'transparent', color:active?'var(--clr-on-secondary-cont)':'var(--clr-on-surface-var)', transition:'all 0.15s', minWidth:48 }}>
              <span className={`msym ${active?'fill':''}`} style={{ fontSize:22 }}>{n.icon}</span>
              <span style={{ fontSize:9, fontWeight:700, marginTop:1, letterSpacing:'0.02em' }}>{n.label}</span>
            </button>
          )
        })}
      </nav>

      <ToastContainer toasts={toast.toasts}/>
    </div>
  )
}
