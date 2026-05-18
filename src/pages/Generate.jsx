import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { fmt } from '../lib/utils'
import { Icon, Btn, Stepper, FilterChip, LoadingRows, EmptyState, Avatar, StatusChip } from '../components/ui'

export default function Generate({ initialTab = 'daily', toast }) {
  const [tab, setTab]       = useState(initialTab)
  const [areas, setAreas]   = useState([])
  const [preview, setPreview] = useState([])
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  // Daily form
  const [startDate, setStartDate]     = useState(fmt.today())
  const [days, setDays]               = useState(7)
  const [excludedClasses, setExcludedClasses] = useState([])

  // Non-daily form
  const [ndDate, setNdDate]           = useState(fmt.today())
  const [selectedAreas, setSelectedAreas] = useState([])

  const CLASSES = ['8','9','10','11','12']

  useEffect(() => {
    api.getAreas().then(a => setAreas(a)).catch(() => toast.error('Failed to load areas'))
  }, [])

  useEffect(() => {
    setTab(initialTab)
    setPreview([]); setGenerated(false)
  }, [initialTab])

  function toggleExclude(cls) {
    setExcludedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls])
  }

  function toggleArea(id) {
    setSelectedAreas(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  async function generate() {
    setGenerating(true)
    try {
      let result
      if (tab === 'daily') {
        if (!startDate) { toast.error('Select a start date'); setGenerating(false); return }
        result = await api.generateDailyDuties({ startDate, days, excludeClasses: excludedClasses })
      } else {
        if (!ndDate) { toast.error('Select a date'); setGenerating(false); return }
        if (!selectedAreas.length) { toast.error('Select at least one area'); setGenerating(false); return }
        result = await api.generateNonDailyDuties({ date: ndDate, areaIds: selectedAreas })
      }
      setPreview(result)
      setGenerated(true)
      toast.success(`${result.length} duties generated successfully`)
    } catch (e) {
      toast.error('Generation failed — ' + (e.message || 'try again'))
    } finally { setGenerating(false) }
  }

  const nonDailyAreas = areas.filter(a => a.type === 'Non-Daily' && a.active)

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--clr-surface)', borderBottom: '1px solid var(--clr-outline-var)', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <Icon name="auto_awesome" style={{ color: 'var(--clr-primary)' }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-primary)' }}>Generate Duties</h1>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', background: 'var(--clr-surface-high)', padding: 4, borderRadius: 'var(--r-lg)', marginBottom: 20 }}>
          {['daily','non-daily'].map(t => (
            <button key={t} onClick={() => { setTab(t); setPreview([]); setGenerated(false) }} style={{
              flex: 1, padding: '9px 0', border: 'none', borderRadius: 'var(--r)', cursor: 'pointer',
              background: tab === t ? 'var(--clr-surface-white)' : 'transparent',
              color: tab === t ? 'var(--clr-primary)' : 'var(--clr-on-surface-var)',
              fontSize: 13, fontWeight: 700, letterSpacing: '0.03em',
              boxShadow: tab === t ? 'var(--sh-card)' : 'none',
              transition: 'all 0.2s',
            }}>
              {t === 'daily' ? 'Daily Duties' : 'Non-Daily / Event'}
            </button>
          ))}
        </div>

        {/* ── DAILY FORM ── */}
        {tab === 'daily' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Start date */}
            <div>
              <label style={labelStyle}>Start Date</label>
              <div style={{ position: 'relative' }}>
                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setGenerated(false) }}
                  style={{ width: '100%', height: 48, padding: '0 40px 0 14px', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--clr-outline-var)', background: 'var(--clr-surface-white)', fontFamily: 'inherit', fontSize: 15, color: 'var(--clr-on-surface)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor='var(--clr-primary-container)'}
                  onBlur={e => e.target.style.borderColor='var(--clr-outline-var)'}
                />
                <Icon name="calendar_today" size={20} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-on-surface-var)', pointerEvents: 'none' }} />
              </div>
            </div>

            {/* Days stepper */}
            <Stepper label="Number of Days" value={days} onChange={v => { setDays(v); setGenerated(false) }} min={1} max={30} />

            {/* Exclude classes */}
            <div>
              <label style={labelStyle}>Exclude Classes (optional)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CLASSES.map(c => (
                  <FilterChip key={c} label={`Class ${c}`} active={excludedClasses.includes(c)} onClick={() => { toggleExclude(c); setGenerated(false) }} />
                ))}
              </div>
              {excludedClasses.length > 0 && (
                <p style={{ fontSize: 12, color: 'var(--clr-on-surface-var)', marginTop: 8 }}>
                  Excluding: {excludedClasses.map(c => `Class ${c}`).join(', ')}
                </p>
              )}
            </div>

            {/* Summary */}
            <div style={{ padding: 14, borderRadius: 'var(--r-lg)', background: 'var(--clr-surface-container)' }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Generation Summary</p>
              <p style={{ fontSize: 13, color: 'var(--clr-on-surface-var)' }}>Generating <strong>{days}</strong> day{days !== 1 ? 's' : ''} from <strong>{fmt.shortDate(startDate)}</strong></p>
              {excludedClasses.length > 0 && <p style={{ fontSize: 13, color: 'var(--clr-on-surface-var)' }}>Skipping classes: <strong>{excludedClasses.join(', ')}</strong></p>}
            </div>
          </div>
        )}

        {/* ── NON-DAILY FORM ── */}
        {tab === 'non-daily' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={labelStyle}>Event Date</label>
              <div style={{ position: 'relative' }}>
                <input type="date" value={ndDate} onChange={e => { setNdDate(e.target.value); setGenerated(false) }}
                  style={{ width: '100%', height: 48, padding: '0 40px 0 14px', borderRadius: 'var(--r-lg)', border: '1.5px solid var(--clr-outline-var)', background: 'var(--clr-surface-white)', fontFamily: 'inherit', fontSize: 15, color: 'var(--clr-on-surface)', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor='var(--clr-primary-container)'}
                  onBlur={e => e.target.style.borderColor='var(--clr-outline-var)'}
                />
                <Icon name="calendar_today" size={20} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-on-surface-var)', pointerEvents: 'none' }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Select Areas *</label>
              {nonDailyAreas.length === 0
                ? <p style={{ fontSize: 13, color: 'var(--clr-on-surface-var)' }}>No non-daily areas configured. Add areas in the Areas section.</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {nonDailyAreas.map(a => (
                      <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: 'var(--clr-surface-white)', borderRadius: 'var(--r-lg)', border: `1.5px solid ${selectedAreas.includes(a.id) ? 'var(--clr-primary-container)' : 'var(--clr-outline-var)'}`, cursor: 'pointer', transition: 'border-color 0.15s' }}>
                        <input type="checkbox" checked={selectedAreas.includes(a.id)} onChange={() => { toggleArea(a.id); setGenerated(false) }} style={{ width: 18, height: 18, accentColor: 'var(--clr-primary)', cursor: 'pointer' }} />
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</p>
                          <p style={{ fontSize: 12, color: 'var(--clr-on-surface-var)' }}>{a.requiredCount} students needed</p>
                        </div>
                      </label>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div style={{ marginTop: 24 }}>
          <Btn onClick={generate} disabled={generating} full>
            <Icon name="auto_awesome" size={20} />
            {generating ? 'Generating…' : generated ? 'Regenerate' : 'Generate'}
          </Btn>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 16, fontWeight: 600 }}>Generated Duties</p>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--clr-primary)', letterSpacing: '0.06em' }}>{preview.length} TOTAL</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {preview.map(d => (
                <div key={d.id} style={{ background: 'var(--clr-surface-white)', borderRadius: 'var(--r-lg)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--sh-card)', borderLeft: '4px solid var(--clr-primary)', border: '1px solid var(--clr-outline-var)', borderLeftWidth: 4, borderLeftColor: 'var(--clr-primary)' }}>
                  <Avatar name={d.studentName} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }} className="ellipsis">{d.areaName}</p>
                    <p style={{ fontSize: 12, color: 'var(--clr-on-surface-var)' }} className="ellipsis">{fmt.shortDate(d.date)} · {d.studentName} · {d.class}</p>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--clr-secondary-container)', color: 'var(--clr-on-secondary-cont)', fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{d.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {preview.length === 0 && generated && (
          <EmptyState icon="info" title="No duties generated" subtitle="Check your settings or student availability" />
        )}
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--clr-on-surface-var)',
  letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6,
}
