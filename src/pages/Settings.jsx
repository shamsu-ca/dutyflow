import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { BottomSheet, Btn, Icon, LoadingRows, EmptyState, FilterChip } from '../components/ui'

export default function Settings({ toast }) {
  const [section, setSection] = useState('areas')
  return (
    <div style={{ paddingBottom:90 }}>
      <div style={{ position:'sticky', top:0, zIndex:40, background:'var(--clr-surface)', borderBottom:'1px solid var(--clr-outline-var)', padding:'0 16px', height:56, display:'flex', alignItems:'center', gap:10, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <Icon name="settings" style={{ color:'var(--clr-primary)' }}/>
        <h1 style={{ fontSize:20, fontWeight:700, color:'var(--clr-primary)' }}>Settings</h1>
      </div>
      <div style={{ position:'sticky', top:56, zIndex:30, background:'var(--clr-surface)', borderBottom:'1px solid var(--clr-outline-var)', padding:'10px 16px' }}>
        <div className="hide-scroll" style={{ display:'flex', gap:8, overflowX:'auto' }}>
          <FilterChip label="Areas"         active={section==='areas'} onClick={() => setSection('areas')}/>
          <FilterChip label="Clear Records" active={section==='clear'} onClick={() => setSection('clear')}/>
        </div>
      </div>
      <div style={{ padding:'16px' }}>
        {section==='areas' && <AreasSection toast={toast}/>}
        {section==='clear' && <ClearSection toast={toast}/>}
      </div>
    </div>
  )
}

// ─── AREAS SECTION ────────────────────────────────────────────────────────────
function AreasSection({ toast }) {
  const [areas, setAreas]               = useState([])
  const [availClasses, setAvailClasses] = useState([])
  const [loading, setLoading]           = useState(true)
  const [sheetOpen, setSheetOpen]       = useState(false)
  const [editing, setEditing]           = useState(null)
  const [fName, setFName]       = useState('')
  const [fType, setFType]       = useState('Daily')
  const [fCount, setFCount]     = useState(2)
  const [fAllClasses, setFAllClasses] = useState(true)
  const [fSelected, setFSelected]     = useState([])
  const [fActive, setFActive]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [areaList, studentList] = await Promise.all([api.getAreas(), api.getStudents({})])
      setAreas(areaList)
      const cls = [...new Set(studentList.map(s => s.class.split('-')[0]))]
        .sort((a, b) => Number(a) - Number(b))
      setAvailClasses(cls)
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  function openAdd() {
    setEditing(null); setFName(''); setFType('Daily'); setFCount(2)
    setFAllClasses(true); setFSelected([]); setFActive(true)
    setSheetOpen(true)
  }

  function openEdit(a) {
    setEditing(a); setFName(a.name); setFType(a.type); setFCount(a.requiredCount)
    const cls = Array.isArray(a.eligibleClasses) ? a.eligibleClasses : []
    if (cls.length === 0) { setFAllClasses(true); setFSelected([]) }
    else { setFAllClasses(false); setFSelected(cls) }
    setFActive(a.active !== false)
    setSheetOpen(true)
  }

  function toggleClass(cls) {
    setFSelected(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls])
  }

  async function save() {
    if (!fName.trim()) { toast.error('Area name required'); return }
    setSaving(true)
    const eligibleClasses = fAllClasses ? [] : fSelected
    try {
      if (editing) {
        await api.updateArea({ id: editing.id, name: fName.trim(), type: fType, requiredCount: fCount, eligibleClasses, active: fActive })
        toast.success('Area updated')
      } else {
        await api.saveArea({ name: fName.trim(), type: fType, requiredCount: fCount, eligibleClasses, active: fActive })
        toast.success('Area added')
      }
      setSheetOpen(false); loadAll()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  async function del(id, name) {
    if (!confirm(`Delete area "${name}"?`)) return
    try { await api.deleteArea(id); toast.success('Area deleted'); loadAll() }
    catch { toast.error('Failed to delete') }
  }

  async function toggleActive(a) {
    try { await api.updateArea({ id: a.id, active: !a.active }); loadAll() }
    catch { toast.error('Failed to update') }
  }

  const daily    = areas.filter(a => a.type === 'Daily')
  const nonDaily = areas.filter(a => a.type === 'Non-Daily')

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <p style={{ fontSize:14, color:'var(--clr-on-surface-var)' }}>{areas.length} area{areas.length !== 1 ? 's' : ''} configured</p>
        <Btn onClick={openAdd} small><Icon name="add" size={16}/>Add Area</Btn>
      </div>

      {loading ? <LoadingRows n={4}/> : (
        <>
          {daily.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <p style={secLabel}>Daily Areas</p>
              {daily.map(a => <AreaRow key={a.id} area={a} onEdit={openEdit} onDelete={del} onToggle={toggleActive}/>)}
            </div>
          )}
          {nonDaily.length > 0 && (
            <div>
              <p style={secLabel}>Non-Daily / Event Areas</p>
              {nonDaily.map(a => <AreaRow key={a.id} area={a} onEdit={openEdit} onDelete={del} onToggle={toggleActive}/>)}
            </div>
          )}
          {areas.length === 0 && (
            <EmptyState icon="location_off" title="No areas yet" subtitle="Add cleaning/duty areas to get started"
              action={<Btn onClick={openAdd}><Icon name="add" size={18}/>Add Area</Btn>}/>
          )}
        </>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editing ? 'Edit Area' : 'Add Area'}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <div>
            <label style={lbl}>Area Name *</label>
            <input value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. Main Corridor" style={inputSt}
              onFocus={e => e.target.style.borderColor = 'var(--clr-primary-container)'}
              onBlur={e  => e.target.style.borderColor = 'var(--clr-outline-var)'}/>
          </div>

          <div>
            <label style={lbl}>Type</label>
            <div style={{ display:'flex', gap:8 }}>
              {['Daily','Non-Daily'].map(t => (
                <button key={t} onClick={() => setFType(t)} style={{ flex:1, height:44, border:`2px solid ${fType===t?'var(--clr-primary-container)':'var(--clr-outline-var)'}`, borderRadius:'var(--r-lg)', background:fType===t?'#f0fdf4':'var(--clr-surface-white)', color:fType===t?'var(--clr-primary-container)':'var(--clr-on-surface-var)', fontFamily:'inherit', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Required Students</label>
            <div style={{ display:'flex', alignItems:'center', border:'1.5px solid var(--clr-outline-var)', borderRadius:'var(--r-lg)', background:'var(--clr-surface-white)', height:48, overflow:'hidden' }}>
              <button onClick={() => setFCount(Math.max(1, fCount-1))} style={{ width:52, height:'100%', border:'none', background:'transparent', cursor:'pointer', fontSize:22, color:'var(--clr-primary-container)' }}>−</button>
              <span style={{ flex:1, textAlign:'center', fontSize:20, fontWeight:700, color:'var(--clr-primary)' }}>{fCount}</span>
              <button onClick={() => setFCount(Math.min(30, fCount+1))} style={{ width:52, height:'100%', border:'none', background:'transparent', cursor:'pointer', fontSize:22, color:'var(--clr-primary-container)' }}>+</button>
            </div>
          </div>

          {/* Eligible Classes — tap chips */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <label style={{ ...lbl, marginBottom:0 }}>Eligible Classes</label>
              <p style={{ fontSize:11, color:'var(--clr-outline)' }}>{fAllClasses ? 'All selected' : `${fSelected.length} selected`}</p>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {/* "All Classes" chip */}
              <button onClick={() => { setFAllClasses(true); setFSelected([]) }}
                style={{ padding:'8px 16px', borderRadius:'var(--r-full)', border:`2px solid ${fAllClasses?'var(--clr-primary-container)':'var(--clr-outline-var)'}`, background:fAllClasses?'var(--clr-primary-container)':'var(--clr-surface-white)', color:fAllClasses?'#fff':'var(--clr-on-surface-var)', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
                ✓ All Classes
              </button>
              {/* Individual class chips */}
              {availClasses.map(cls => {
                const active = !fAllClasses && fSelected.includes(cls)
                return (
                  <button key={cls}
                    onClick={() => { setFAllClasses(false); toggleClass(cls) }}
                    style={{ padding:'8px 16px', borderRadius:'var(--r-full)', border:`2px solid ${active?'var(--clr-primary-container)':'var(--clr-outline-var)'}`, background:active?'var(--clr-primary-container)':'var(--clr-surface-white)', color:active?'#fff':'var(--clr-on-surface-var)', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
                    Class {cls}
                  </button>
                )
              })}
            </div>
            {availClasses.length === 0 && (
              <p style={{ fontSize:12, color:'var(--clr-outline)', marginTop:6 }}>Add students first — class options come from student data.</p>
            )}
            <p style={{ fontSize:11, color:'var(--clr-on-surface-var)', marginTop:6 }}>
              {fAllClasses
                ? 'All classes are eligible.'
                : fSelected.length === 0
                  ? '⚠ No classes selected — nobody will be assigned.'
                  : `Class ${fSelected.join(', ')} will be eligible.`}
            </p>
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'var(--clr-surface-low)', borderRadius:'var(--r-lg)' }}>
            <div>
              <p style={{ fontSize:14, fontWeight:600 }}>Active</p>
              <p style={{ fontSize:12, color:'var(--clr-on-surface-var)' }}>Include in generation</p>
            </div>
            <button onClick={() => setFActive(!fActive)} style={{ width:48, height:28, borderRadius:14, border:'none', background:fActive?'var(--clr-primary-container)':'var(--clr-surface-highest)', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
              <div style={{ position:'absolute', top:4, left:fActive?22:4, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}/>
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
    <div style={{ background:'var(--clr-surface-white)', borderRadius:'var(--r-lg)', padding:'12px 14px', marginBottom:8, boxShadow:'var(--sh-card)', border:'1px solid var(--clr-outline-var)', opacity:a.active?1:0.55 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
            <p style={{ fontSize:15, fontWeight:600 }} className="ellipsis">{a.name}</p>
            <span style={{ padding:'2px 8px', borderRadius:'var(--r-full)', fontSize:9, fontWeight:700, letterSpacing:'0.05em', background:a.type==='Daily'?'#dcfce7':'#dbeafe', color:a.type==='Daily'?'#15803d':'#1d4ed8' }}>{a.type}</span>
            {!a.active && <span style={{ padding:'2px 6px', borderRadius:'var(--r-full)', fontSize:9, fontWeight:700, background:'var(--clr-surface-highest)', color:'var(--clr-outline)' }}>INACTIVE</span>}
          </div>
          <p style={{ fontSize:12, color:'var(--clr-on-surface-var)', marginTop:3 }}>
            {a.requiredCount} students · {a.eligibleClasses?.length ? `Class ${a.eligibleClasses.join(', ')}` : 'All classes'}
          </p>
        </div>
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          <button onClick={() => onToggle(a)} style={iconBtn} title={a.active?'Deactivate':'Activate'}>
            <Icon name={a.active?'toggle_on':'toggle_off'} size={20} style={{ color:a.active?'var(--clr-primary)':'var(--clr-outline)' }}/>
          </button>
          <button onClick={() => onEdit(a)} style={iconBtn}>
            <Icon name="edit" size={18} style={{ color:'var(--clr-on-surface-var)' }}/>
          </button>
          <button onClick={() => onDelete(a.id, a.name)} style={{ ...iconBtn, background:'var(--clr-error-container)' }}>
            <Icon name="delete_outline" size={18} style={{ color:'var(--clr-on-error-cont)' }}/>
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CLEAR RECORDS SECTION ────────────────────────────────────────────────────
function ClearSection({ toast }) {
  const [loading, setLoading]     = useState(true)
  const [preview, setPreview]     = useState([])
  const [mode, setMode]           = useState(null)   // 'balanced' | 'complete'
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [downloaded, setDownloaded]   = useState(false)
  const [clearing, setClearing]   = useState(false)

  useEffect(() => { loadPreview() }, [])

  async function loadPreview() {
    setLoading(true)
    try {
      const list = await api.getStudents({})
      setPreview(computeBalances(list))
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  function computeBalances(list) {
    const active  = list.filter(s => s.status !== 'Inactive')
    const classes = [...new Set(active.map(s => s.class.split('-')[0]))]
    const result  = []
    classes.forEach(cls => {
      const members = active.filter(s => s.class.startsWith(cls))
      if (!members.length) return
      const avg = members.reduce((acc, s) => acc + (s.completedCount||0) + (s.manualCredit||0), 0) / members.length
      members.forEach(s => {
        const cur = (s.completedCount||0) + (s.manualCredit||0)
        result.push({ ...s, classAvg: Math.round(avg), diff: cur - Math.round(avg) })
      })
    })
    return result.sort((a, b) => a.diff - b.diff)
  }

  function downloadCSV() {
    const db     = JSON.parse(localStorage.getItem('df_db') || '{}')
    const duties = db.duties || []
    if (!duties.length) { toast.info('No records to download'); return false }
    const header = ['Assignment ID','Date','Area','Student','Class','Type','Status','Generated At']
    const rows   = duties.map(d => [d.id, d.date, d.areaName, d.studentName, d.class, d.type, d.status, d.generatedAt])
    const csv    = [header, ...rows].map(r => r.map(v => `"${(v||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob   = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a')
    a.href = url; a.download = `dutyflow-history-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setDownloaded(true)
    toast.success('CSV downloaded — open in Excel')
    return true
  }

  function openConfirm(m) { setMode(m); setDownloaded(false); setConfirmOpen(true) }

  async function executeClear() {
    setClearing(true)
    try {
      await api.clearRecords({ mode })
      toast.success(mode === 'balanced' ? 'Done — balanced reset applied' : 'Done — full reset complete')
      setConfirmOpen(false); loadPreview()
    } catch (e) { toast.error('Failed: ' + e.message) }
    finally { setClearing(false) }
  }

  if (loading) return <LoadingRows n={4}/>

  return (
    <div>
      {/* Explanation */}
      <div style={{ background:'var(--clr-surface-container)', borderRadius:'var(--r-lg)', padding:'14px', marginBottom:18, display:'flex', gap:12, alignItems:'flex-start' }}>
        <Icon name="info" size={18} style={{ color:'var(--clr-primary)', flexShrink:0, marginTop:2 }}/>
        <p style={{ fontSize:13, color:'var(--clr-on-surface-var)', lineHeight:1.6 }}>
          <strong>Balanced Clear</strong> — resets counts but penalises students ahead of their class average, so fairness carries forward.<br/>
          <strong>Complete Clear</strong> — wipes everything to zero. Everyone starts equal.
        </p>
      </div>

      {/* Balance preview */}
      {preview.length > 0 && (
        <div style={{ marginBottom:18 }}>
          <p style={secLabel}>Current Balance (by class average)</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {preview.map(s => (
              <div key={s.id} style={{ background:'var(--clr-surface-white)', borderRadius:'var(--r-lg)', padding:'10px 14px', boxShadow:'var(--sh-card)', border:'1px solid var(--clr-outline-var)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:600 }}>{s.name}</p>
                  <p style={{ fontSize:11, color:'var(--clr-on-surface-var)' }}>
                    {s.class} · Done: {(s.completedCount||0)+(s.manualCredit||0)} · Class avg: {s.classAvg}
                  </p>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  {s.diff === 0
                    ? <span style={{ fontSize:11, fontWeight:700, color:'var(--clr-on-surface-var)' }}>Even</span>
                    : s.diff > 0
                      ? <div>
                          <p style={{ fontSize:12, fontWeight:700, color:'#15803d' }}>+{s.diff} ahead</p>
                          <p style={{ fontSize:10, color:'var(--clr-on-surface-var)' }}>gets penalty</p>
                        </div>
                      : <div>
                          <p style={{ fontSize:12, fontWeight:700, color:'var(--clr-error)' }}>{s.diff} behind</p>
                          <p style={{ fontSize:10, color:'var(--clr-on-surface-var)' }}>gets priority</p>
                        </div>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <Btn variant="secondary" onClick={downloadCSV} full>
          <Icon name="download" size={18}/>Download History CSV (no reset)
        </Btn>
        <Btn onClick={() => openConfirm('balanced')} full
          style={{ background:'#fef3c7', color:'#92400e', border:'2px solid #f59e0b', borderRadius:'var(--r-full)', height:48, display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:15, fontWeight:600, cursor:'pointer' }}>
          <Icon name="balance" size={18}/>Balanced Clear + Reset
        </Btn>
        <Btn variant="danger" onClick={() => openConfirm('complete')} full>
          <Icon name="delete_forever" size={18}/>Complete Clear (zero reset)
        </Btn>
      </div>

      {/* Confirm sheet */}
      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)}
        title={mode === 'balanced' ? 'Balanced Clear' : 'Complete Clear'}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          <div style={{ background: mode==='balanced'?'#fef3c7':'var(--clr-error-container)', borderRadius:'var(--r-lg)', padding:'14px' }}>
            <p style={{ fontSize:13, fontWeight:700, color: mode==='balanced'?'#92400e':'var(--clr-on-error-cont)', marginBottom:8 }}>
              {mode==='balanced' ? '⚖ This will:' : '⚠ This will:'}
            </p>
            <div style={{ fontSize:13, color: mode==='balanced'?'#92400e':'var(--clr-on-error-cont)', lineHeight:2 }}>
              <p>1. Download current duty history as CSV</p>
              <p>2. Delete all duty and credit records</p>
              <p>3. Reset completed counts to 0</p>
              {mode==='balanced'
                ? <p>4. Students who did extra duties get a penalty so classmates catch up next cycle</p>
                : <p>4. All counts reset to 0 — everyone starts equal, no balancing</p>
              }
            </div>
          </div>

          {/* Step 1 download */}
          <div style={{ background:'var(--clr-surface-low)', borderRadius:'var(--r-lg)', padding:'12px 14px' }}>
            <p style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Step 1 — Download history</p>
            <Btn variant="secondary" onClick={downloadCSV} full>
              <Icon name="download" size={18}/>{downloaded ? '✓ Downloaded (download again?)' : 'Download CSV Now'}
            </Btn>
            {!downloaded && (
              <p style={{ fontSize:11, color:'var(--clr-error)', marginTop:5 }}>Records cannot be recovered after clearing.</p>
            )}
          </div>

          {/* Step 2 execute */}
          <div>
            <p style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Step 2 — Execute</p>
            <div style={{ display:'flex', gap:10 }}>
              <Btn variant="secondary" onClick={() => setConfirmOpen(false)} full>Cancel</Btn>
              <Btn
                variant={mode==='balanced' ? 'secondary' : 'danger'}
                onClick={executeClear}
                disabled={clearing}
                full
                style={mode==='balanced' ? { background:'#fef3c7', color:'#92400e', border:'2px solid #f59e0b', borderRadius:'var(--r-full)', height:48, display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:15, fontWeight:600, cursor:'pointer' } : {}}
              >
                <Icon name={clearing?'hourglass_empty':'check'} size={18}/>
                {clearing ? 'Clearing…' : mode==='balanced' ? 'Apply & Clear' : 'Clear All'}
              </Btn>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

const secLabel = { fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--clr-on-surface-var)', marginBottom:10 }
const lbl      = { display:'block', fontSize:12, fontWeight:600, color:'var(--clr-on-surface-var)', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:5 }
const inputSt  = { width:'100%', height:48, padding:'0 14px', borderRadius:'var(--r-lg)', border:'1.5px solid var(--clr-outline-var)', background:'var(--clr-surface-white)', fontFamily:'inherit', fontSize:15, color:'var(--clr-on-surface)', outline:'none', transition:'border-color 0.15s' }
const iconBtn  = { width:36, height:36, border:'none', borderRadius:'var(--r)', background:'var(--clr-surface-low)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }
