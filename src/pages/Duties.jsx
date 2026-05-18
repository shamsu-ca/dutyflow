import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { fmt, STATUS_COLORS } from '../lib/utils'
import { FilterChip, DutyCard, BottomSheet, Btn, Icon, LoadingRows, EmptyState, StatusChip, Avatar } from '../components/ui'

const FILTERS = [
  { key: 'today',     label: 'Today' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'pending',   label: 'Pending / Failed' },
  { key: 'completed', label: 'Completed' },
]

export default function Duties({ initialTab = 'today', toast }) {
  const [filter, setFilter]   = useState(initialTab)
  const [duties, setDuties]   = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null) // duty for action sheet
  const [actionOpen, setActionOpen] = useState(false)
  const [replacing, setReplacing]   = useState(false)
  const [replacement, setReplacement] = useState(null)

  useEffect(() => { setFilter(initialTab) }, [initialTab])
  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    try { setDuties(await api.getDuties({ filter })) }
    catch { toast.error('Failed to load duties') }
    finally { setLoading(false) }
  }

  function openAction(duty) {
    setSelected(duty); setReplacement(null); setActionOpen(true)
  }

  async function markDone() {
    try { await api.markDutyDone(selected.id); toast.success('Marked as Done'); setActionOpen(false); load() }
    catch { toast.error('Failed to update') }
  }

  async function markNotDone() {
    try { await api.markDutyNotDone(selected.id); toast.success('Marked as Not Done'); setActionOpen(false); load() }
    catch { toast.error('Failed to update') }
  }

  async function cancel() {
    if (!confirm('Cancel this duty?')) return
    try { await api.cancelDuty(selected.id); toast.success('Duty cancelled'); setActionOpen(false); load() }
    catch { toast.error('Failed to cancel') }
  }

  async function suggest() {
    setReplacing(true)
    try {
      const r = await api.suggestReplacement(selected.id)
      setReplacement(r)
      if (!r) toast.info('No eligible replacement found')
    } catch { toast.error('Could not suggest replacement') }
    finally { setReplacing(false) }
  }

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--clr-surface)', borderBottom: '1px solid var(--clr-outline-var)', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Icon name="assignment" style={{ color: 'var(--clr-primary)' }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-primary)' }}>Duties</h1>
        <button onClick={load} style={{ marginLeft: 'auto', width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="refresh" size={20} style={{ color: 'var(--clr-on-surface-var)' }} />
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ position: 'sticky', top: 56, zIndex: 30, background: 'var(--clr-surface)', borderBottom: '1px solid var(--clr-outline-var)', padding: '10px 16px' }}>
        <div className="hide-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <FilterChip key={f.key} label={f.label} active={filter === f.key} onClick={() => setFilter(f.key)} />
          ))}
        </div>
      </div>

      {/* Count badge */}
      {!loading && duties.length > 0 && (
        <div style={{ padding: '10px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--clr-on-surface-var)', letterSpacing: '0.06em' }}>{duties.length} DUTIES</span>
        </div>
      )}

      {/* Duty list */}
      <div style={{ padding: '10px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading
          ? <LoadingRows n={5} />
          : duties.length === 0
            ? <EmptyState
                icon={filter === 'completed' ? 'assignment_turned_in' : 'event_busy'}
                title={filter === 'today' ? 'No duties today' : `No ${filter} duties`}
                subtitle={filter === 'today' ? 'Generate duties to get started' : 'All clear!'}
              />
            : duties.map(d => <DutyCard key={d.id} duty={d} onClick={() => openAction(d)} />)
        }
      </div>

      {/* Action Sheet */}
      <BottomSheet open={actionOpen} onClose={() => setActionOpen(false)} title="Manage Duty">
        {selected && (
          <div>
            {/* Duty summary */}
            <div style={{ background: 'var(--clr-surface-container)', borderRadius: 'var(--r-lg)', padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selected.areaName}</p>
              <p style={{ fontSize: 13, color: 'var(--clr-on-surface-var)' }}>{selected.studentName} · {selected.class}</p>
              <p style={{ fontSize: 13, color: 'var(--clr-on-surface-var)', marginTop: 2 }}>{fmt.date(selected.date)}</p>
              <div style={{ marginTop: 10 }}><StatusChip status={selected.status} /></div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.status !== 'Done' && (
                <Btn onClick={markDone} full>
                  <Icon name="check_circle" size={18} />Mark as Done
                </Btn>
              )}
              {selected.status !== 'Not Done' && selected.status !== 'Done' && selected.status !== 'Cancelled' && (
                <Btn variant="secondary" onClick={markNotDone} full>
                  <Icon name="cancel" size={18} />Mark as Not Done
                </Btn>
              )}
              {selected.status !== 'Cancelled' && (
                <Btn variant="secondary" onClick={suggest} disabled={replacing} full>
                  <Icon name="swap_horiz" size={18} />{replacing ? 'Finding…' : 'Suggest Replacement'}
                </Btn>
              )}
              {selected.status !== 'Cancelled' && (
                <Btn variant="danger" onClick={cancel} full>
                  <Icon name="delete_outline" size={18} />Cancel Duty
                </Btn>
              )}
              <Btn variant="ghost" onClick={() => setActionOpen(false)} full>Close</Btn>
            </div>

            {/* Replacement result */}
            {replacement && (
              <div style={{ marginTop: 16, padding: 14, borderRadius: 'var(--r-lg)', background: 'var(--clr-primary-fixed)', border: '1px solid var(--clr-primary-fixed-dim)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-on-primary-fixed)', letterSpacing: '0.06em', marginBottom: 10 }}>SUGGESTED REPLACEMENT</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={replacement.name} size={40} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--clr-on-primary-fixed)' }}>{replacement.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--clr-on-primary-fixed)', opacity: 0.8 }}>{replacement.class} · Effective count: {(replacement.completedCount || 0) + (replacement.manualCredit || 0)}</p>
                  </div>
                </div>
              </div>
            )}
            {replacement === null && !replacing && selected && (
              <div /> // no replacement found state handled via toast
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
