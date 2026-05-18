import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { fmt } from '../lib/utils'
import {
  FilterChip, ProgressBar, Btn, Icon, Avatar, LoadingRows, EmptyState,
  StudentStatusChip, BottomSheet, Stepper
} from '../components/ui'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'students', label: 'Students' },
  { key: 'areas',    label: 'Areas' },
  { key: 'credits',  label: 'Credits' },
]

export default function Reports({ initialTab = 'overview', toast }) {
  const [tab, setTab]       = useState(initialTab)
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [creditOpen, setCreditOpen] = useState(false)

  useEffect(() => { setTab(initialTab) }, [initialTab])
  useEffect(() => { load() }, [tab])

  async function load() {
    setLoading(true)
    try {
      let result
      if (tab === 'overview') {
        const [cls, areas] = await Promise.all([api.getClassReport(), api.getAreaReport()])
        result = { classReport: cls, areaReport: areas }
      } else if (tab === 'students') {
        result = await api.getStudents()
      } else if (tab === 'areas') {
        result = await api.getAreaReport()
      } else if (tab === 'credits') {
        result = await api.getCredits()
      }
      setData(result)
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--clr-surface)', borderBottom: '1px solid var(--clr-outline-var)', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="analytics" style={{ color: 'var(--clr-primary)' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-primary)' }}>Reports</h1>
        </div>
        <button onClick={() => setCreditOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 36, border: 'none', borderRadius: 'var(--r-full)', background: 'var(--clr-primary-container)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
          <Icon name="add_card" size={18} style={{ color: '#fff' }} />
          Add Credit
        </button>
      </div>

      {/* Tabs */}
      <div style={{ position: 'sticky', top: 56, zIndex: 30, background: 'var(--clr-surface)', borderBottom: '1px solid var(--clr-outline-var)', padding: '10px 16px' }}>
        <div className="hide-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {TABS.map(t => <FilterChip key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />)}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {loading
          ? <LoadingRows n={5} />
          : tab === 'overview' ? <OverviewTab data={data} /> 
          : tab === 'students' ? <StudentsTab data={data} />
          : tab === 'areas'    ? <AreasTab data={data} />
          : tab === 'credits'  ? <CreditsTab data={data} onRefresh={load} />
          : null
        }
      </div>

      {/* Add Credit Sheet */}
      <AddCreditSheet open={creditOpen} onClose={() => setCreditOpen(false)} onSaved={() => { setCreditOpen(false); if (tab === 'credits') load(); toast.success('Credits added') }} toast={toast} />
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ data }) {
  if (!data) return null
  const { classReport, areaReport } = data
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Section title="Class Performance">
        {classReport.map(c => (
          <div key={c.class} style={{ background: 'var(--clr-surface-white)', borderRadius: 'var(--r-lg)', padding: '14px 16px', marginBottom: 10, boxShadow: 'var(--sh-card)', border: '1px solid var(--clr-outline-var)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>Class {c.class}</p>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--clr-primary)' }}>{c.completionRate}%</span>
            </div>
            <ProgressBar value={c.completionRate} />
            <p style={{ fontSize: 12, color: 'var(--clr-on-surface-var)', marginTop: 6 }}>{c.studentCount} students · {c.completedDuties}/{c.totalDuties} duties</p>
          </div>
        ))}
      </Section>
      <Section title="Area Completion Rates">
        {areaReport.map(a => (
          <div key={a.id} style={{ background: 'var(--clr-surface-white)', borderRadius: 'var(--r-lg)', padding: '14px 16px', marginBottom: 10, boxShadow: 'var(--sh-card)', border: '1px solid var(--clr-outline-var)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600 }} className="ellipsis">{a.name}</p>
              <p style={{ fontSize: 12, color: 'var(--clr-on-surface-var)', marginTop: 2 }}>{a.type} · {a.completedCount}/{a.totalAssigned}</p>
              <div style={{ marginTop: 8 }}><ProgressBar value={a.completionRate} /></div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--clr-primary)', lineHeight: 1 }}>{a.completionRate}%</p>
            </div>
          </div>
        ))}
      </Section>
    </div>
  )
}

// ── Students Tab ──────────────────────────────────────────────────────────────
function StudentsTab({ data }) {
  if (!data) return null
  const sorted = [...data].sort((a, b) => (b.completedCount + b.manualCredit) - (a.completedCount + a.manualCredit))
  return (
    <Section title="Student Workload Ranking">
      {sorted.map((s, i) => (
        <div key={s.id} style={{ background: 'var(--clr-surface-white)', borderRadius: 'var(--r-lg)', padding: '12px 14px', marginBottom: 8, boxShadow: 'var(--sh-card)', border: '1px solid var(--clr-outline-var)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>
            {i < 3
              ? <span style={{ fontSize: 18 }}>{['🥇','🥈','🥉'][i]}</span>
              : <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--clr-on-surface-var)' }}>{i + 1}</span>
            }
          </div>
          <Avatar name={s.name} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600 }} className="ellipsis">{s.name}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'var(--clr-secondary-container)', color: 'var(--clr-on-secondary-cont)', fontWeight: 700 }}>{s.class}</span>
              <StudentStatusChip status={s.status} />
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--clr-primary)', lineHeight: 1 }}>{s.completedCount + s.manualCredit}</p>
            <p style={{ fontSize: 10, color: 'var(--clr-on-surface-var)', marginTop: 2 }}>{s.completedCount}+{s.manualCredit}</p>
          </div>
        </div>
      ))}
    </Section>
  )
}

// ── Areas Tab ─────────────────────────────────────────────────────────────────
function AreasTab({ data }) {
  if (!data) return null
  return (
    <Section title="Area Statistics">
      {data.map(a => (
        <div key={a.id} style={{ background: 'var(--clr-surface-white)', borderRadius: 'var(--r-lg)', padding: '16px', marginBottom: 10, boxShadow: 'var(--sh-card)', border: '1px solid var(--clr-outline-var)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600 }}>{a.name}</p>
              <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 4, background: a.type === 'Daily' ? '#dcfce7' : '#dbeafe', color: a.type === 'Daily' ? '#15803d' : '#1d4ed8', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>{a.type}</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--clr-primary)' }}>{a.completionRate}%</span>
          </div>
          <ProgressBar value={a.completionRate} />
          <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--clr-on-surface-var)' }}>Total: {a.totalAssigned}</p>
            <p style={{ fontSize: 12, color: '#15803d' }}>Done: {a.completedCount}</p>
            <p style={{ fontSize: 12, color: 'var(--clr-error)' }}>Pending: {a.totalAssigned - a.completedCount}</p>
          </div>
        </div>
      ))}
    </Section>
  )
}

// ── Credits Tab ───────────────────────────────────────────────────────────────
function CreditsTab({ data }) {
  if (!data || data.length === 0) return <EmptyState icon="add_card" title="No manual credits yet" subtitle="Use 'Add Credit' to add workload credits" />
  return (
    <Section title={`${data.length} Manual Credits`}>
      {data.map(c => (
        <div key={c.id} style={{ background: 'var(--clr-surface-white)', borderRadius: 'var(--r-lg)', padding: '12px 14px', marginBottom: 8, boxShadow: 'var(--sh-card)', border: '1px solid var(--clr-outline-var)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600 }}>{c.studentName}</p>
            <p style={{ fontSize: 12, color: 'var(--clr-on-surface-var)', marginTop: 2 }}>{c.reason || 'No reason given'}</p>
            <p style={{ fontSize: 11, color: 'var(--clr-outline)', marginTop: 2 }}>{fmt.date(c.addedDate)}</p>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--clr-primary-fixed)', padding: '8px 14px', borderRadius: 'var(--r-lg)', flexShrink: 0 }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--clr-on-primary-fixed)', lineHeight: 1 }}>+{c.creditValue}</p>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--clr-on-primary-fixed)', opacity: 0.7, letterSpacing: '0.06em', marginTop: 2 }}>CREDIT</p>
          </div>
        </div>
      ))}
    </Section>
  )
}

// ── Add Credit Sheet ──────────────────────────────────────────────────────────
function AddCreditSheet({ open, onClose, onSaved, toast }) {
  const [students, setStudents]   = useState([])
  const [selected, setSelected]   = useState([])
  const [creditVal, setCreditVal] = useState(1)
  const [reason, setReason]       = useState('')
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    if (open) {
      api.getStudents({ status: 'Active' }).then(setStudents).catch(() => toast.error('Failed to load students'))
      setSelected([]); setCreditVal(1); setReason(''); setSearch('')
    }
  }, [open])

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  async function save() {
    if (!selected.length) { toast.error('Select at least one student'); return }
    setSaving(true)
    try {
      await api.addManualCredit({ studentIds: selected, creditValue: creditVal, reason })
      onSaved()
    } catch { toast.error('Failed to add credits') }
    finally { setSaving(false) }
  }

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.class.toLowerCase().includes(search.toLowerCase()))

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Manual Credits">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-on-surface-var)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter students…"
            style={{ width: '100%', height: 40, paddingLeft: 38, paddingRight: 12, borderRadius: 'var(--r-lg)', border: '1.5px solid var(--clr-outline-var)', background: 'var(--clr-surface-white)', fontFamily: 'inherit', fontSize: 13, color: 'var(--clr-on-surface)', outline: 'none' }}
          />
        </div>

        {/* Student list */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-on-surface-var)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Select Students ({selected.length} selected)</p>
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(s => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--r-lg)', border: `1.5px solid ${selected.includes(s.id) ? 'var(--clr-primary-container)' : 'var(--clr-outline-var)'}`, cursor: 'pointer', background: selected.includes(s.id) ? '#f0fdf4' : 'var(--clr-surface-white)', transition: 'all 0.15s' }}>
                <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} style={{ width: 16, height: 16, accentColor: 'var(--clr-primary)', cursor: 'pointer' }} />
                <Avatar name={s.name} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }} className="ellipsis">{s.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--clr-on-surface-var)' }}>{s.class} · Effective: {(s.completedCount || 0) + (s.manualCredit || 0)}</p>
                </div>
              </label>
            ))}
            {filtered.length === 0 && <p style={{ fontSize: 13, color: 'var(--clr-on-surface-var)', padding: '8px 0' }}>No students match</p>}
          </div>
        </div>

        {/* Credit value */}
        <Stepper label="Credit Count" value={creditVal} onChange={setCreditVal} min={1} max={10} />

        {/* Reason */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-on-surface-var)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Reason (optional)</label>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Event volunteer work"
            style={{ width: '100%', height: 48, padding: '0 14px', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--clr-outline-var)', background: 'var(--clr-surface-white)', fontFamily: 'inherit', fontSize: 14, color: 'var(--clr-on-surface)', outline: 'none' }}
            onFocus={e => e.target.style.borderColor='var(--clr-primary-container)'}
            onBlur={e => e.target.style.borderColor='var(--clr-outline-var)'}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" onClick={onClose} full>Cancel</Btn>
          <Btn onClick={save} disabled={saving} full><Icon name="add_card" size={18} />{saving ? 'Saving…' : 'Add Credits'}</Btn>
        </div>
      </div>
    </BottomSheet>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--clr-on-surface-var)', marginBottom: 12 }}>{title}</p>
      {children}
    </div>
  )
}
