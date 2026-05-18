import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { fmt } from '../lib/utils'
import {
  SearchInput, FilterChip, Avatar, StudentStatusChip, ClassChip,
  BottomSheet, Input, Select, Btn, Icon, LoadingRows, EmptyState, StatusChip
} from '../components/ui'

const CLASS_OPTS = ['8','9','10','11','12']
const STATUS_OPTS = ['Active','Leave','Inactive']

export default function Students({ toast }) {
  const [students, setStudents]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterClass, setFilterClass]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [addOpen, setAddOpen]     = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [editing, setEditing]     = useState(null) // student obj or null
  // form state
  const [fAdmNo, setFAdmNo] = useState('')
  const [fName, setFName]   = useState('')
  const [fClass, setFClass] = useState('10-A')
  const [fStatus, setFStatus] = useState('Active')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load(filters = {}) {
    setLoading(true)
    try {
      const list = await api.getStudents({ search, class: filterClass, status: filterStatus, ...filters })
      setStudents(list)
    } catch { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, filterClass, filterStatus])

  function openAdd() {
    setEditing(null)
    setFAdmNo(''); setFName(''); setFClass('10-A'); setFStatus('Active')
    setAddOpen(true)
  }

  function openEdit(s) {
    setEditing(s)
    setFAdmNo(s.admNo); setFName(s.name); setFClass(s.class); setFStatus(s.status)
    setDetailOpen(false)
    setTimeout(() => setAddOpen(true), 200)
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
      setAddOpen(false); load()
    } catch { toast.error('Failed to save student') }
    finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Delete this student?')) return
    try { await api.deleteStudent(id); toast.success('Student deleted'); setDetailOpen(false); load() }
    catch { toast.error('Failed to delete') }
  }

  async function showDetail(s) {
    setDetailData(null); setDetailOpen(true)
    try {
      const d = await api.getStudentReport(s.id)
      setDetailData(d)
    } catch { toast.error('Failed to load details') }
  }

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--clr-surface)', borderBottom: '1px solid var(--clr-outline-var)', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="group" style={{ color: 'var(--clr-primary)' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--clr-primary)' }}>Students</h1>
        </div>
        <button onClick={openAdd} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'var(--clr-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="person_add" size={20} style={{ color: '#fff' }} />
        </button>
      </div>

      {/* Search + Filters sticky */}
      <div style={{ position: 'sticky', top: 56, zIndex: 30, background: 'var(--clr-surface)', borderBottom: '1px solid var(--clr-outline-var)', padding: '12px 16px 10px' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or admission no…" />
        <div className="hide-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 10 }}>
          <FilterChip label="All" active={!filterClass} onClick={() => setFilterClass('')} />
          {CLASS_OPTS.map(c => <FilterChip key={c} label={`Class ${c}`} active={filterClass === c} onClick={() => setFilterClass(filterClass === c ? '' : c)} />)}
        </div>
        <div className="hide-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginTop: 8 }}>
          <FilterChip label="All Status" active={!filterStatus} onClick={() => setFilterStatus('')} />
          {STATUS_OPTS.map(s => <FilterChip key={s} label={s} active={filterStatus === s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)} />)}
        </div>
      </div>

      {/* List */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading
          ? <LoadingRows n={5} />
          : students.length === 0
            ? <EmptyState icon="person_off" title="No students found" subtitle="Try a different search or filter" action={<Btn onClick={openAdd}><Icon name="person_add" size={18} />Add Student</Btn>} />
            : students.map(s => <StudentRow key={s.id} student={s} onClick={() => showDetail(s)} />)
        }
      </div>

      {/* Add/Edit sheet */}
      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title={editing ? 'Edit Student' : 'Add Student'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Admission Number" value={fAdmNo} onChange={setFAdmNo} placeholder="e.g. ADM2026001" required />
          <Input label="Student Name"     value={fName}  onChange={setFName}  placeholder="Full name" required />
          <Input label="Class"            value={fClass} onChange={setFClass} placeholder="e.g. 10-A" required />
          <Select label="Status" value={fStatus} onChange={setFStatus} options={STATUS_OPTS.map(v => ({ value: v, label: v }))} />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Btn variant="secondary" onClick={() => setAddOpen(false)} full>Cancel</Btn>
            <Btn onClick={save} disabled={saving} full><Icon name="save" size={18} />{saving ? 'Saving…' : 'Save'}</Btn>
          </div>
        </div>
      </BottomSheet>

      {/* Detail sheet */}
      <BottomSheet open={detailOpen} onClose={() => setDetailOpen(false)} title="">
        {!detailData
          ? <LoadingRows n={3} />
          : <DetailContent data={detailData} onEdit={openEdit} onDelete={del} onClose={() => setDetailOpen(false)} />
        }
      </BottomSheet>
    </div>
  )
}

function StudentRow({ student: s, onClick }) {
  const borderColor = s.status === 'Active' ? 'var(--clr-primary)' : s.status === 'Leave' ? '#f59e0b' : 'var(--clr-outline-var)'
  return (
    <div onClick={onClick} style={{
      background: 'var(--clr-surface-white)', borderRadius: 'var(--r-lg)', padding: '12px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
      boxShadow: 'var(--sh-card)', borderLeft: `4px solid ${borderColor}`,
      border: `1px solid var(--clr-outline-var)`, borderLeftWidth: 4, borderLeftColor: borderColor,
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--sh-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--sh-card)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <Avatar name={s.name} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--clr-on-surface)' }} className="ellipsis">{s.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            <ClassChip cls={s.class} />
            <StudentStatusChip status={s.status} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'DONE', val: s.completedCount, color: 'var(--clr-primary)' },
            { label: 'PEND', val: s.pendingCount,   color: 'var(--clr-error)' },
            { label: 'NEXT', val: s.upcomingCount,  color: 'var(--clr-secondary)' },
          ].map((stat, i) => (
            <div key={stat.label} style={{ textAlign: 'center', display: 'flex', alignItems: 'center', gap: 10 }}>
              {i > 0 && <div style={{ width: 1, height: 28, background: 'var(--clr-outline-var)' }} />}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--clr-on-surface-var)', letterSpacing: '0.04em' }}>{stat.label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: stat.color }}>{stat.val}</p>
              </div>
            </div>
          ))}
        </div>
        <Icon name="chevron_right" size={18} style={{ color: 'var(--clr-outline)' }} />
      </div>
    </div>
  )
}

function DetailContent({ data, onEdit, onDelete, onClose }) {
  const { student: s, duties } = data
  const recent = duties.slice(0, 10)
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <Avatar name={s.name} size={56} />
        <div>
          <p style={{ fontSize: 18, fontWeight: 700 }}>{s.name}</p>
          <p style={{ fontSize: 13, color: 'var(--clr-on-surface-var)', marginTop: 2 }}>{s.admNo} · {s.class}</p>
          <div style={{ marginTop: 6 }}><StudentStatusChip status={s.status} /></div>
        </div>
      </div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { val: s.completedCount, label: 'Completed', color: 'var(--clr-primary)' },
          { val: s.pendingCount,   label: 'Pending',   color: 'var(--clr-error)' },
          { val: s.effectiveCount, label: 'Effective', color: 'var(--clr-primary)' },
        ].map(st => (
          <div key={st.label} style={{ background: 'var(--clr-surface-low)', borderRadius: 'var(--r-lg)', padding: '12px 10px', textAlign: 'center' }}>
            <p style={{ fontSize: 26, fontWeight: 800, color: st.color, lineHeight: 1 }}>{st.val}</p>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--clr-on-surface-var)', letterSpacing: '0.05em', marginTop: 4 }}>{st.label.toUpperCase()}</p>
          </div>
        ))}
      </div>
      {/* Duty history */}
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--clr-on-surface-var)', marginBottom: 10 }}>Recent Duties</p>
      {recent.length === 0
        ? <p style={{ fontSize: 13, color: 'var(--clr-on-surface-var)', marginBottom: 16 }}>No duty history yet</p>
        : <div style={{ marginBottom: 16 }}>
            {recent.map(d => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--clr-outline-var)' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{d.areaName}</p>
                  <p style={{ fontSize: 12, color: 'var(--clr-on-surface-var)' }}>{fmt.date(d.date)}</p>
                </div>
                <StatusChip status={d.status} />
              </div>
            ))}
          </div>
      }
      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="secondary" onClick={onClose} full>Close</Btn>
        <Btn onClick={() => onEdit(data.student)} full><Icon name="edit" size={18} />Edit</Btn>
      </div>
      <div style={{ marginTop: 10 }}>
        <Btn variant="danger" onClick={() => onDelete(s.id)} full><Icon name="delete_outline" size={18} />Delete Student</Btn>
      </div>
    </div>
  )
}
