import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { fmt } from '../lib/utils'
import {
  SearchInput, FilterChip, Avatar, StudentStatusChip, ClassChip,
  BottomSheet, Input, Select, Btn, Icon, LoadingRows, EmptyState, StatusChip
} from '../components/ui'

const STATUS_OPTS = ['Active','Leave','Inactive']

export default function Students({ toast }) {
  const [students, setStudents]     = useState([])
  const [allClasses, setAllClasses] = useState([])   // derived from actual data
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterClass, setFilterClass]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [addOpen, setAddOpen]       = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [editing, setEditing]       = useState(null)
  const [fAdmNo, setFAdmNo] = useState('')
  const [fName, setFName]   = useState('')
  const [fClass, setFClass] = useState('')
  const [fStatus, setFStatus] = useState('Active')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  // Debounced search
  const searchTimer = useRef(null)
  function onSearch(v) {
    setSearch(v)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => loadFiltered(v, filterClass, filterStatus), 250)
  }

  async function loadAll() {
    setLoading(true)
    try {
      const list = await api.getStudents({})
      setStudents(list)
      // Derive unique class prefixes from real student data
      const cls = [...new Set(list.map(s => s.class.split('-')[0]))].sort((a,b) => Number(a)-Number(b))
      setAllClasses(cls)
    } catch { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }

  async function loadFiltered(s = search, c = filterClass, st = filterStatus) {
    try {
      const list = await api.getStudents({ search: s, class: c, status: st })
      setStudents(list)
    } catch { toast.error('Failed to refresh') }
  }

  useEffect(() => { loadFiltered() }, [filterClass, filterStatus])

  function openAdd() {
    setEditing(null); setFAdmNo(''); setFName(''); setFClass(''); setFStatus('Active')
    setAddOpen(true)
  }
  function openEdit(s) {
    setEditing(s); setFAdmNo(s.admNo); setFName(s.name); setFClass(s.class); setFStatus(s.status)
    setDetailOpen(false); setTimeout(() => setAddOpen(true), 180)
  }

  async function save() {
    if (!fAdmNo.trim() || !fName.trim() || !fClass.trim()) { toast.error('Fill all required fields'); return }
    setSaving(true)
    try {
      if (editing) {
        await api.updateStudent({ id: editing.id, admNo: fAdmNo.trim(), name: fName.trim(), class: fClass.trim(), status: fStatus })
        toast.success('Student updated')
      } else {
        await api.saveStudent({ admNo: fAdmNo.trim(), name: fName.trim(), class: fClass.trim(), status: fStatus })
        toast.success('Student added')
      }
      setAddOpen(false); loadAll()
    } catch (e) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Delete this student? This cannot be undone.')) return
    try { await api.deleteStudent(id); toast.success('Deleted'); setDetailOpen(false); loadAll() }
    catch { toast.error('Failed to delete') }
  }

  async function showDetail(s) {
    setDetailData(null); setDetailOpen(true)
    try { setDetailData(await api.getStudentReport(s.id)) }
    catch { toast.error('Failed to load details') }
  }

  return (
    <div style={{ paddingBottom: 90 }}>
      {/* Top bar */}
      <div style={{ position:'sticky', top:0, zIndex:40, background:'var(--clr-surface)', borderBottom:'1px solid var(--clr-outline-var)', padding:'0 16px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Icon name="group" style={{ color:'var(--clr-primary)' }} />
          <h1 style={{ fontSize:20, fontWeight:700, color:'var(--clr-primary)' }}>Students</h1>
          {!loading && <span style={{ fontSize:12, fontWeight:600, color:'var(--clr-on-surface-var)', background:'var(--clr-surface-high)', padding:'2px 8px', borderRadius:'var(--r-full)' }}>{students.length}</span>}
        </div>
        <button onClick={openAdd} style={{ width:44, height:44, borderRadius:'50%', border:'none', background:'var(--clr-primary-container)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <Icon name="person_add" size={20} style={{ color:'#fff' }} />
        </button>
      </div>

      {/* Search + class filters */}
      <div style={{ position:'sticky', top:56, zIndex:30, background:'var(--clr-surface)', borderBottom:'1px solid var(--clr-outline-var)', padding:'10px 16px 8px' }}>
        <SearchInput value={search} onChange={onSearch} placeholder="Search name, ID or class…" />
        {allClasses.length > 0 && (
          <div className="hide-scroll" style={{ display:'flex', gap:8, overflowX:'auto', marginTop:8 }}>
            <FilterChip label="All" active={!filterClass} onClick={() => setFilterClass('')} />
            {allClasses.map(c => <FilterChip key={c} label={`Class ${c}`} active={filterClass === c} onClick={() => setFilterClass(filterClass === c ? '' : c)} />)}
          </div>
        )}
        <div className="hide-scroll" style={{ display:'flex', gap:8, overflowX:'auto', marginTop:6 }}>
          <FilterChip label="All" active={!filterStatus} onClick={() => setFilterStatus('')} />
          {STATUS_OPTS.map(s => <FilterChip key={s} label={s} active={filterStatus === s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)} />)}
        </div>
      </div>

      {/* List */}
      <div style={{ padding:'10px 16px', display:'flex', flexDirection:'column', gap:8 }}>
        {loading
          ? <LoadingRows n={5} />
          : students.length === 0
            ? <EmptyState icon="person_off" title="No students found" subtitle={search ? 'Try a different search' : 'Add your first student'} action={<Btn onClick={openAdd}><Icon name="person_add" size={18}/>Add Student</Btn>} />
            : students.map(s => <StudentRow key={s.id} student={s} onClick={() => showDetail(s)} />)
        }
      </div>

      {/* Add/Edit sheet */}
      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title={editing ? 'Edit Student' : 'Add Student'}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={lbl}>Admission Number *<span style={{ fontWeight:400, color:'var(--clr-outline)', marginLeft:6 }}>(used as Student ID)</span></label>
            <input value={fAdmNo} onChange={e => setFAdmNo(e.target.value)} placeholder="e.g. ADM2026001"
              disabled={!!editing}
              style={{ ...inputSt, opacity: editing ? 0.6 : 1 }} />
            {editing && <p style={{ fontSize:11, color:'var(--clr-outline)', marginTop:4 }}>Admission No cannot be changed</p>}
          </div>
          <div>
            <label style={lbl}>Student Name *</label>
            <input value={fName} onChange={e => setFName(e.target.value)} placeholder="Full name" style={inputSt}
              onFocus={e=>e.target.style.borderColor='var(--clr-primary-container)'} onBlur={e=>e.target.style.borderColor='var(--clr-outline-var)'} />
          </div>
          <div>
            <label style={lbl}>Class *<span style={{ fontWeight:400, color:'var(--clr-outline)', marginLeft:6 }}>(e.g. 10-A)</span></label>
            <input value={fClass} onChange={e => setFClass(e.target.value)} placeholder="10-A" style={inputSt}
              onFocus={e=>e.target.style.borderColor='var(--clr-primary-container)'} onBlur={e=>e.target.style.borderColor='var(--clr-outline-var)'} />
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={{ ...inputSt, appearance:'none', cursor:'pointer' }}>
              {STATUS_OPTS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <Btn variant="secondary" onClick={() => setAddOpen(false)} full>Cancel</Btn>
            <Btn onClick={save} disabled={saving} full><Icon name="save" size={18}/>{saving ? 'Saving…' : 'Save'}</Btn>
          </div>
        </div>
      </BottomSheet>

      {/* Detail sheet */}
      <BottomSheet open={detailOpen} onClose={() => setDetailOpen(false)} title="">
        {!detailData ? <LoadingRows n={3} /> : <DetailContent data={detailData} onEdit={openEdit} onDelete={del} onClose={() => setDetailOpen(false)} />}
      </BottomSheet>
    </div>
  )
}

const lbl = { display:'block', fontSize:12, fontWeight:600, color:'var(--clr-on-surface-var)', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:5 }
const inputSt = { width:'100%', height:48, padding:'0 14px', borderRadius:'var(--r-lg)', border:'1.5px solid var(--clr-outline-var)', background:'var(--clr-surface-white)', fontFamily:'inherit', fontSize:15, color:'var(--clr-on-surface)', outline:'none', transition:'border-color 0.15s' }

function StudentRow({ student: s, onClick }) {
  const bc = s.status === 'Active' ? 'var(--clr-primary)' : s.status === 'Leave' ? '#f59e0b' : 'var(--clr-outline-var)'
  return (
    <div onClick={onClick} style={{ background:'var(--clr-surface-white)', borderRadius:'var(--r-lg)', padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', boxShadow:'var(--sh-card)', borderLeft:`4px solid ${bc}`, border:`1px solid var(--clr-outline-var)`, borderLeftWidth:4, borderLeftColor:bc, transition:'all 0.14s' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='var(--sh-md)'}}
      onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='var(--sh-card)'}}>
      <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
        <Avatar name={s.name} size={40} />
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:14, fontWeight:600 }} className="ellipsis">{s.name}</p>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3, flexWrap:'wrap' }}>
            <span style={{ fontSize:10, padding:'1px 6px', borderRadius:4, background:'var(--clr-secondary-container)', color:'var(--clr-on-secondary-cont)', fontWeight:700 }}>{s.class}</span>
            <StudentStatusChip status={s.status} />
          </div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        {[
          { l:'DONE', v:s.completedCount, c:'var(--clr-primary)' },
          { l:'PEND', v:s.pendingCount,   c:'var(--clr-error)' },
        ].map((st, i) => (
          <div key={st.l} style={{ display:'flex', alignItems:'center', gap:8 }}>
            {i > 0 && <div style={{ width:1, height:24, background:'var(--clr-outline-var)' }}/>}
            <div style={{ textAlign:'center' }}>
              <p style={{ fontSize:9, fontWeight:700, color:'var(--clr-on-surface-var)', letterSpacing:'0.05em' }}>{st.l}</p>
              <p style={{ fontSize:14, fontWeight:700, color:st.c }}>{st.v}</p>
            </div>
          </div>
        ))}
        <Icon name="chevron_right" size={18} style={{ color:'var(--clr-outline)' }}/>
      </div>
    </div>
  )
}

function DetailContent({ data, onEdit, onDelete, onClose }) {
  const { student: s, duties } = data
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
        <Avatar name={s.name} size={52} />
        <div>
          <p style={{ fontSize:18, fontWeight:700 }}>{s.name}</p>
          <p style={{ fontSize:12, color:'var(--clr-on-surface-var)', marginTop:2 }}>ID: {s.admNo} · {s.class}</p>
          <div style={{ marginTop:5 }}><StudentStatusChip status={s.status}/></div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:18 }}>
        {[
          { v:s.completedCount, l:'Completed', c:'var(--clr-primary)' },
          { v:s.pendingCount,   l:'Pending',   c:'var(--clr-error)' },
          { v:s.effectiveCount, l:'Effective', c:'var(--clr-primary)' },
        ].map(st => (
          <div key={st.l} style={{ background:'var(--clr-surface-low)', borderRadius:'var(--r-lg)', padding:'10px', textAlign:'center' }}>
            <p style={{ fontSize:24, fontWeight:800, color:st.c, lineHeight:1 }}>{st.v}</p>
            <p style={{ fontSize:9, fontWeight:700, color:'var(--clr-on-surface-var)', letterSpacing:'0.05em', marginTop:3 }}>{st.l.toUpperCase()}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--clr-on-surface-var)', marginBottom:8 }}>Recent Duties</p>
      {duties.length === 0
        ? <p style={{ fontSize:13, color:'var(--clr-on-surface-var)', marginBottom:14 }}>No duty history</p>
        : <div style={{ marginBottom:14 }}>
            {duties.slice(0,8).map(d => (
              <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--clr-outline-var)' }}>
                <div><p style={{ fontSize:13, fontWeight:600 }}>{d.areaName}</p><p style={{ fontSize:11, color:'var(--clr-on-surface-var)' }}>{fmt.date(d.date)}</p></div>
                <StatusChip status={d.status}/>
              </div>
            ))}
          </div>
      }
      <div style={{ display:'flex', gap:8 }}>
        <Btn variant="secondary" onClick={onClose} full>Close</Btn>
        <Btn onClick={() => onEdit(data.student)} full><Icon name="edit" size={18}/>Edit</Btn>
      </div>
      <div style={{ marginTop:8 }}>
        <Btn variant="danger" onClick={() => onDelete(s.id)} full><Icon name="delete_outline" size={18}/>Delete</Btn>
      </div>
    </div>
  )
}
