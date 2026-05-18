import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { BottomSheet, Btn, Icon, LoadingRows, EmptyState, FilterChip } from '../components/ui'

export default function Settings({ toast }) {
  const [section, setSection] = useState('areas') // 'areas' | 'clear'

  return (
    <div style={{ paddingBottom:90 }}>
      {/* Top bar */}
      <div style={{ position:'sticky', top:0, zIndex:40, background:'var(--clr-surface)', borderBottom:'1px solid var(--clr-outline-var)', padding:'0 16px', height:56, display:'flex', alignItems:'center', gap:10, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <Icon name="settings" style={{ color:'var(--clr-primary)' }}/>
        <h1 style={{ fontSize:20, fontWeight:700, color:'var(--clr-primary)' }}>Settings</h1>
      </div>

      {/* Section tabs */}
      <div style={{ position:'sticky', top:56, zIndex:30, background:'var(--clr-surface)', borderBottom:'1px solid var(--clr-outline-var)', padding:'10px 16px' }}>
        <div className="hide-scroll" style={{ display:'flex', gap:8, overflowX:'auto' }}>
          <FilterChip label="Areas" active={section==='areas'} onClick={() => setSection('areas')}/>
          <FilterChip label="Clear Records" active={section==='clear'} onClick={() => setSection('clear')}/>
        </div>
      </div>

      <div style={{ padding:'16px' }}>
        {section === 'areas' && <AreasSection toast={toast}/>}
        {section === 'clear' && <ClearSection toast={toast}/>}
      </div>
    </div>
  )
}

// ─── AREAS SECTION ────────────────────────────────────────────────────────────
function AreasSection({ toast }) {
  const [areas, setAreas]     = useState([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  // form
  const [fName, setFName]       = useState('')
  const [fType, setFType]       = useState('Daily')
  const [fCount, setFCount]     = useState(2)
  const [fClasses, setFClasses] = useState('')  // comma-separated, free text
  const [fActive, setFActive]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setAreas(await api.getAreas()) }
    catch { toast.error('Failed to load areas') }
    finally { setLoading(false) }
  }

  function openAdd() {
    setEditing(null); setFName(''); setFType('Daily'); setFCount(2); setFClasses(''); setFActive(true)
    setSheetOpen(true)
  }
  function openEdit(a) {
    setEditing(a); setFName(a.name); setFType(a.type); setFCount(a.requiredCount)
    setFClasses(Array.isArray(a.eligibleClasses) ? a.eligibleClasses.join(', ') : (a.eligibleClasses || ''))
    setFActive(a.active !== false)
    setSheetOpen(true)
  }

  async function save() {
    if (!fName.trim()) { toast.error('Area name required'); return }
    setSaving(true)
    const eligibleClasses = fClasses.trim() ? fClasses.split(',').map(s => s.trim()).filter(Boolean) : []
    try {
      if (editing) {
        await api.updateArea({ id: editing.id, name: fName.trim(), type: fType, requiredCount: fCount, eligibleClasses, active: fActive })
        toast.success('Area updated')
      } else {
        await api.saveArea({ name: fName.trim(), type: fType, requiredCount: fCount, eligibleClasses, active: fActive })
        toast.success('Area added')
      }
      setSheetOpen(false); load()
    } catch { toast.error('Failed to save area') }
    finally { setSaving(false) }
  }

  async function del(id, name) {
    if (!confirm(`Delete area "${name}"?`)) return
    try { await api.deleteArea(id); toast.success('Area deleted'); load() }
    catch { toast.error('Failed to delete') }
  }

  async function toggleActive(a) {
    try {
      await api.updateArea({ id: a.id, active: !a.active })
      load()
    } catch { toast.error('Failed to update') }
  }

  const daily    = areas.filter(a => a.type === 'Daily')
  const nonDaily = areas.filter(a => a.type === 'Non-Daily')

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <p style={{ fontSize:14, color:'var(--clr-on-surface-var)' }}>{areas.length} areas configured</p>
        <Btn onClick={openAdd} small><Icon name="add" size={16}/>Add Area</Btn>
      </div>

      {loading ? <LoadingRows n={4}/> : (
        <>
          {daily.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <p style={sectionLabel}>Daily Areas</p>
              {daily.map(a => <AreaRow key={a.id} area={a} onEdit={openEdit} onDelete={del} onToggle={toggleActive}/>)}
            </div>
          )}
          {nonDaily.length > 0 && (
            <div>
              <p style={sectionLabel}>Non-Daily / Event Areas</p>
              {nonDaily.map(a => <AreaRow key={a.id} area={a} onEdit={openEdit} onDelete={del} onToggle={toggleActive}/>)}
            </div>
          )}
          {areas.length === 0 && <EmptyState icon="location_off" title="No areas yet" subtitle="Add cleaning areas to get started" action={<Btn onClick={openAdd}><Icon name="add" size={18}/>Add Area</Btn>}/>}
        </>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Edit Area' : 'Add Area'}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={lbl}>Area Name *</label>
            <input value={fName} onChange={e=>setFName(e.target.value)} placeholder="e.g. Main Corridor" style={inputSt}
              onFocus={e=>e.target.style.borderColor='var(--clr-primary-container)'} onBlur={e=>e.target.style.borderColor='var(--clr-outline-var)'}/>
          </div>

          <div>
            <label style={lbl}>Type</label>
            <div style={{ display:'flex', gap:10 }}>
              {['Daily','Non-Daily'].map(t => (
                <button key={t} onClick={() => setFType(t)} style={{ flex:1, height:44, border:`2px solid ${fType===t?'var(--clr-primary-container)':'var(--clr-outline-var)'}`, borderRadius:'var(--r-lg)', background:fType===t?'#f0fdf4':'var(--clr-surface-white)', color:fType===t?'var(--clr-primary-container)':'var(--clr-on-surface-var)', fontFamily:'inherit', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Required Students</label>
            <div style={{ display:'flex', alignItems:'center', gap:0, border:'1.5px solid var(--clr-outline-var)', borderRadius:'var(--r-lg)', background:'var(--clr-surface-white)', height:48, overflow:'hidden' }}>
              <button onClick={() => setFCount(Math.max(1,fCount-1))} style={{ width:48, height:'100%', border:'none', background:'transparent', cursor:'pointer', fontSize:20, color:'var(--clr-primary-container)', transition:'background 0.15s' }} onMouseEnter={e=>e.target.style.background='var(--clr-surface-high)'} onMouseLeave={e=>e.target.style.background='transparent'}>−</button>
              <span style={{ flex:1, textAlign:'center', fontSize:18, fontWeight:700, color:'var(--clr-primary)' }}>{fCount}</span>
              <button onClick={() => setFCount(Math.min(30,fCount+1))} style={{ width:48, height:'100%', border:'none', background:'transparent', cursor:'pointer', fontSize:20, color:'var(--clr-primary-container)', transition:'background 0.15s' }} onMouseEnter={e=>e.target.style.background='var(--clr-surface-high)'} onMouseLeave={e=>e.target.style.background='transparent'}>+</button>
            </div>
          </div>

          <div>
            <label style={lbl}>Eligible Classes <span style={{ fontWeight:400, textTransform:'none', color:'var(--clr-outline)' }}>(leave blank = all)</span></label>
            <input value={fClasses} onChange={e=>setFClasses(e.target.value)} placeholder="e.g. 10, 11, 12" style={inputSt}
              onFocus={e=>e.target.style.borderColor='var(--clr-primary-container)'} onBlur={e=>e.target.style.borderColor='var(--clr-outline-var)'}/>
            <p style={{ fontSize:11, color:'var(--clr-outline)', marginTop:4 }}>Separate class numbers with commas. Matches any class starting with that number.</p>
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'var(--clr-surface-low)', borderRadius:'var(--r-lg)' }}>
            <div>
              <p style={{ fontSize:14, fontWeight:600 }}>Active</p>
              <p style={{ fontSize:12, color:'var(--clr-on-surface-var)' }}>Include in duty generation</p>
            </div>
            <button onClick={() => setFActive(!fActive)} style={{ width:48, height:28, borderRadius:14, border:'none', background:fActive?'var(--clr-primary-container)':'var(--clr-surface-highest)', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
              <div style={{ position:'absolute', top:4, left: fActive?22:4, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
            </button>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <Btn variant="secondary" onClick={() => setSheetOpen(false)} full>Cancel</Btn>
            <Btn onClick={save} disabled={saving} full><Icon name="save" size={18}/>{saving?'Saving…':'Save'}</Btn>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

function AreaRow({ area: a, onEdit, onDelete, onToggle }) {
  return (
    <div style={{ background:'var(--clr-surface-white)', borderRadius:'var(--r-lg)', padding:'12px 14px', marginBottom:8, boxShadow:'var(--sh-card)', border:'1px solid var(--clr-outline-var)', opacity:a.active?1:0.6 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <p style={{ fontSize:15, fontWeight:600 }} className="ellipsis">{a.name}</p>
            <span style={{ padding:'2px 8px', borderRadius:'var(--r-full)', fontSize:9, fontWeight:700, letterSpacing:'0.05em', background:a.type==='Daily'?'#dcfce7':'#dbeafe', color:a.type==='Daily'?'#15803d':'#1d4ed8' }}>{a.type}</span>
            {!a.active && <span style={{ padding:'2px 6px', borderRadius:'var(--r-full)', fontSize:9, fontWeight:700, background:'var(--clr-surface-highest)', color:'var(--clr-outline)' }}>INACTIVE</span>}
          </div>
          <p style={{ fontSize:12, color:'var(--clr-on-surface-var)', marginTop:4 }}>
            {a.requiredCount} students · {a.eligibleClasses?.length ? `Class ${a.eligibleClasses.join(', ')}` : 'All classes'}
          </p>
        </div>
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          <button onClick={() => onToggle(a)} title={a.active?'Deactivate':'Activate'} style={{ width:36, height:36, border:'none', borderRadius:'var(--r)', background:'var(--clr-surface-low)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name={a.active?'toggle_on':'toggle_off'} size={20} style={{ color:a.active?'var(--clr-primary)':'var(--clr-outline)' }}/>
          </button>
          <button onClick={() => onEdit(a)} style={{ width:36, height:36, border:'none', borderRadius:'var(--r)', background:'var(--clr-surface-low)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="edit" size={18} style={{ color:'var(--clr-on-surface-var)' }}/>
          </button>
          <button onClick={() => onDelete(a.id, a.name)} style={{ width:36, height:36, border:'none', borderRadius:'var(--r)', background:'var(--clr-error-container)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon name="delete_outline" size={18} style={{ color:'var(--clr-on-error-cont)' }}/>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CLEAR RECORDS SECTION ────────────────────────────────────────────────────
function ClearSection({ toast }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [preview, setPreview]   = useState(null)  // balance preview
  const [clearing, setClearing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => { loadPreview() }, [])

  async function loadPreview() {
    setLoading(true)
    try {
      const list = await api.getStudents({})
      setStudents(list)
      setPreview(computeBalances(list))
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  function computeBalances(list) {
    const active = list.filter(s => s.status !== 'Inactive')
    const classes = [...new Set(active.map(s => s.class.split('-')[0]))]
    const result = []
    classes.forEach(cls => {
      const members = active.filter(s => s.class.startsWith(cls))
      if (!members.length) return
      const avg = members.reduce((acc, s) => acc + (s.completedCount||0) + (s.manualCredit||0), 0) / members.length
      members.forEach(s => {
        const current = (s.completedCount||0) + (s.manualCredit||0)
        const diff = current - Math.round(avg)
        result.push({ ...s, classAvg: Math.round(avg), diff, newCredit: diff < 0 ? diff : 0 })
      })
    })
    return result.sort((a,b) => a.diff - b.diff)
  }

  // Excel download using SheetJS-style CSV (no dep needed for simple CSV)
  function downloadHistory() {
    const allDuties = JSON.parse(localStorage.getItem('df_db') || '{}').duties || []
    if (!allDuties.length) { toast.info('No duty history to download'); return }
    const header = ['Assignment ID','Date','Area Name','Student Name','Class','Type','Status','Generated At']
    const rows = allDuties.map(d => [d.id, d.date, d.areaName, d.studentName, d.class, d.type, d.status, d.generatedAt])
    const csv = [header, ...rows].map(r => r.map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `dutyflow-history-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    return true
  }

  async function doClear() {
    setClearing(true)
    try {
      const downloaded = downloadHistory()
      const result = await api.clearRecords({})
      toast.success('Records cleared. Balances applied.')
      setConfirmOpen(false)
      loadPreview()
    } catch (e) { toast.error('Failed to clear: ' + e.message) }
    finally { setClearing(false) }
  }

  if (loading) return <LoadingRows n={4}/>

  return (
    <div>
      {/* Explanation */}
      <div style={{ background:'var(--clr-error-container)', borderRadius:'var(--r-lg)', padding:'14px 16px', marginBottom:20 }}>
        <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
          <Icon name="warning" size={20} style={{ color:'var(--clr-on-error-cont)', flexShrink:0, marginTop:2 }}/>
          <div>
            <p style={{ fontSize:14, fontWeight:700, color:'var(--clr-on-error-cont)' }}>This action resets all duty counts</p>
            <p style={{ fontSize:12, color:'var(--clr-on-error-cont)', marginTop:4, lineHeight:1.5 }}>
              History CSV will be downloaded first. Then all completed counts reset to 0. Balance credits are applied so students who did more duties than classmates get a head-start advantage in future generation.
            </p>
          </div>
        </div>
      </div>

      {/* Balance Preview */}
      {preview && preview.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--clr-on-surface-var)', marginBottom:10 }}>Balance Preview (after reset)</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {preview.map(s => (
              <div key={s.id} style={{ background:'var(--clr-surface-white)', borderRadius:'var(--r-lg)', padding:'10px 14px', boxShadow:'var(--sh-card)', border:'1px solid var(--clr-outline-var)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600 }}>{s.name}</p>
                  <p style={{ fontSize:11, color:'var(--clr-on-surface-var)' }}>{s.class} · Current: {(s.completedCount||0)+(s.manualCredit||0)} · Avg: {s.classAvg}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  {s.diff === 0
                    ? <span style={{ fontSize:11, fontWeight:700, color:'var(--clr-on-surface-var)' }}>Balanced</span>
                    : s.diff > 0
                      ? <div>
                          <p style={{ fontSize:12, fontWeight:700, color:'#15803d' }}>+{s.diff} ahead</p>
                          <p style={{ fontSize:10, color:'var(--clr-on-surface-var)' }}>No credit needed</p>
                        </div>
                      : <div>
                          <p style={{ fontSize:12, fontWeight:700, color:'var(--clr-error)' }}>{s.diff} behind</p>
                          <p style={{ fontSize:10, color:'var(--clr-on-surface-var)' }}>Will get duties first</p>
                        </div>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <Btn variant="secondary" onClick={downloadHistory} full><Icon name="download" size={18}/>Download History CSV (without clearing)</Btn>
        <Btn variant="danger" onClick={() => setConfirmOpen(true)} full><Icon name="delete_sweep" size={18}/>Clear Records + Download + Reset</Btn>
      </div>

      {/* Confirm sheet */}
      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Clear Records">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'var(--clr-error-container)', borderRadius:'var(--r-lg)', padding:'14px' }}>
            <p style={{ fontSize:14, fontWeight:700, color:'var(--clr-on-error-cont)', marginBottom:8 }}>⚠ This will:</p>
            <div style={{ fontSize:13, color:'var(--clr-on-error-cont)', lineHeight:1.8 }}>
              <p>1. Download current duty history as CSV</p>
              <p>2. Delete all duty assignment records</p>
              <p>3. Reset all completed counts to 0</p>
              <p>4. Apply balance credits per class average</p>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <Btn variant="secondary" onClick={() => setConfirmOpen(false)} full>Go back</Btn>
            <Btn variant="danger" onClick={doClear} disabled={clearing} full>
              <Icon name="check" size={18}/>{clearing?'Clearing…':'Yes, Clear Everything'}
            </Btn>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

const sectionLabel = { fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--clr-on-surface-var)', marginBottom:10 }
const lbl = { display:'block', fontSize:12, fontWeight:600, color:'var(--clr-on-surface-var)', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:5 }
const inputSt = { width:'100%', height:48, padding:'0 14px', borderRadius:'var(--r-lg)', border:'1.5px solid var(--clr-outline-var)', background:'var(--clr-surface-white)', fontFamily:'inherit', fontSize:15, color:'var(--clr-on-surface)', outline:'none', transition:'border-color 0.15s' }
