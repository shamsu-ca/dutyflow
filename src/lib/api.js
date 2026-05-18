// ─── DutyFlow API Client ──────────────────────────────────────────────────────
// Calls Google Apps Script Web App. Falls back to MOCK if URL not configured.

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || ''

async function call(action, data = {}) {
  if (!SCRIPT_URL) return MOCK.handle(action, data)
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // avoid CORS preflight
    body: JSON.stringify({ action, token: ADMIN_TOKEN, ...data }),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'API Error')
  return json.data
}

export const api = {
  // Students
  getStudents:    (f = {}) => call('getStudents', f),
  saveStudent:    (d)      => call('saveStudent', d),
  updateStudent:  (d)      => call('updateStudent', d),
  deleteStudent:  (id)     => call('deleteStudent', { studentId: id }),

  // Areas
  getAreas:    (f = {}) => call('getAreas', f),
  saveArea:    (d)      => call('saveArea', d),
  updateArea:  (d)      => call('updateArea', d),
  deleteArea:  (id)     => call('deleteArea', { areaId: id }),

  // Duties
  getDuties:           (f = {}) => call('getDuties', f),
  markDutyDone:        (id)     => call('markDutyDone', { assignmentId: id }),
  markDutyNotDone:     (id)     => call('markDutyNotDone', { assignmentId: id }),
  cancelDuty:          (id)     => call('cancelDuty', { assignmentId: id }),
  suggestReplacement:  (id)     => call('suggestReplacement', { assignmentId: id }),

  // Generation
  generateDailyDuties:    (p) => call('generateDailyDuties', p),
  generateNonDailyDuties: (p) => call('generateNonDailyDuties', p),

  // Credits
  getCredits:      ()  => call('getManualCredits'),
  addManualCredit: (d) => call('addManualCredit', d),

  // Leave
  addLeave: (d) => call('addLeave', d),

  // Reports
  getDashboard:     () => call('getDashboard'),
  getStudentReport: (id) => call('getStudentReport', { studentId: id }),
  getAreaReport:    () => call('getAreaReport'),
  getClassReport:   () => call('getClassReport'),
}

export const isDemoMode = !SCRIPT_URL

// ─── MOCK ENGINE (localStorage-backed) ───────────────────────────────────────
const MOCK = (() => {
  const TODAY = () => new Date().toISOString().slice(0, 10)
  const genId = (p) => p + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase()

  const DEFAULT_DB = {
    students: [
      { id: 'S001', admNo: 'ADM001', name: 'Arjun Nair',      class: '10-A', status: 'Active',   completedCount: 12, manualCredit: 2, pendingCount: 1, upcomingCount: 3, lastDutyDate: '2026-05-10' },
      { id: 'S002', admNo: 'ADM002', name: 'Priya Menon',     class: '10-B', status: 'Active',   completedCount: 8,  manualCredit: 0, pendingCount: 3, upcomingCount: 2, lastDutyDate: '2026-05-12' },
      { id: 'S003', admNo: 'ADM003', name: 'Rahul Krishna',   class: '11-A', status: 'Leave',    completedCount: 15, manualCredit: 1, pendingCount: 0, upcomingCount: 0, lastDutyDate: '2026-05-05' },
      { id: 'S004', admNo: 'ADM004', name: 'Sneha Das',       class: '9-C',  status: 'Active',   completedCount: 5,  manualCredit: 0, pendingCount: 2, upcomingCount: 4, lastDutyDate: '2026-05-14' },
      { id: 'S005', admNo: 'ADM005', name: 'Aditya Sharma',   class: '12-A', status: 'Active',   completedCount: 20, manualCredit: 3, pendingCount: 0, upcomingCount: 1, lastDutyDate: '2026-05-16' },
      { id: 'S006', admNo: 'ADM006', name: 'Meera Pillai',    class: '8-B',  status: 'Active',   completedCount: 4,  manualCredit: 0, pendingCount: 1, upcomingCount: 2, lastDutyDate: '2026-05-13' },
      { id: 'S007', admNo: 'ADM007', name: 'Vikram Patel',    class: '11-B', status: 'Inactive', completedCount: 0,  manualCredit: 0, pendingCount: 0, upcomingCount: 0, lastDutyDate: null },
      { id: 'S008', admNo: 'ADM008', name: 'Anjali Reddy',    class: '9-A',  status: 'Active',   completedCount: 9,  manualCredit: 1, pendingCount: 0, upcomingCount: 3, lastDutyDate: '2026-05-15' },
      { id: 'S009', admNo: 'ADM009', name: 'Kiran Menon',     class: '8-A',  status: 'Active',   completedCount: 3,  manualCredit: 0, pendingCount: 2, upcomingCount: 1, lastDutyDate: '2026-05-11' },
      { id: 'S010', admNo: 'ADM010', name: 'Divya Thomas',    class: '12-B', status: 'Active',   completedCount: 18, manualCredit: 0, pendingCount: 1, upcomingCount: 2, lastDutyDate: '2026-05-16' },
    ],
    areas: [
      { id: 'A001', name: 'Main Corridor',    type: 'Daily',     requiredCount: 4, eligibleClasses: ['8','9','10','11','12'], active: true },
      { id: 'A002', name: 'Dining Hall',      type: 'Daily',     requiredCount: 6, eligibleClasses: ['10','11','12'],         active: true },
      { id: 'A003', name: 'Outdoor Courtyard',type: 'Daily',     requiredCount: 3, eligibleClasses: ['8','9','10'],           active: true },
      { id: 'A004', name: 'Washrooms Blk A',  type: 'Daily',     requiredCount: 2, eligibleClasses: ['9','10','11'],          active: true },
      { id: 'A005', name: 'Library Hall',     type: 'Daily',     requiredCount: 2, eligibleClasses: ['11','12'],              active: true },
      { id: 'A006', name: 'Event Hall',       type: 'Non-Daily', requiredCount: 8, eligibleClasses: ['10','11','12'],         active: true },
      { id: 'A007', name: 'Sports Ground',    type: 'Non-Daily', requiredCount: 5, eligibleClasses: ['8','9','10','11','12'], active: true },
    ],
    duties: [
      { id: 'D001', date: TODAY(), areaId: 'A001', areaName: 'Main Corridor',    studentId: 'S001', studentName: 'Arjun Nair',   class: '10-A', type: 'Daily', status: 'Pending',  generatedAt: '2026-05-15' },
      { id: 'D002', date: TODAY(), areaId: 'A002', areaName: 'Dining Hall',      studentId: 'S002', studentName: 'Priya Menon',  class: '10-B', type: 'Daily', status: 'Done',     generatedAt: '2026-05-15' },
      { id: 'D003', date: TODAY(), areaId: 'A003', areaName: 'Outdoor Courtyard',studentId: 'S004', studentName: 'Sneha Das',    class: '9-C',  type: 'Daily', status: 'Not Done', generatedAt: '2026-05-15' },
      { id: 'D004', date: TODAY(), areaId: 'A004', areaName: 'Washrooms Blk A',  studentId: 'S008', studentName: 'Anjali Reddy', class: '9-A',  type: 'Daily', status: 'Pending',  generatedAt: '2026-05-15' },
      { id: 'D005', date: '2026-05-18', areaId: 'A001', areaName: 'Main Corridor',studentId: 'S005', studentName: 'Aditya Sharma',class: '12-A', type: 'Daily', status: 'Pending', generatedAt: '2026-05-15' },
      { id: 'D006', date: '2026-05-14', areaId: 'A005', areaName: 'Library Hall', studentId: 'S005', studentName: 'Aditya Sharma',class: '12-A', type: 'Daily', status: 'Done',    generatedAt: '2026-05-13' },
      { id: 'D007', date: '2026-05-13', areaId: 'A003', areaName: 'Outdoor Courtyard',studentId: 'S002', studentName: 'Priya Menon',class: '10-B', type: 'Daily', status: 'Not Done', generatedAt: '2026-05-12' },
    ],
    credits: [
      { id: 'C001', studentId: 'S003', studentName: 'Rahul Krishna', creditValue: 1, reason: 'Event Hall Volunteer', addedDate: '2026-05-10' },
      { id: 'C002', studentId: 'S005', studentName: 'Aditya Sharma', creditValue: 3, reason: 'Sports Day Organizer',  addedDate: '2026-05-08' },
    ],
  }

  function load() {
    try { return JSON.parse(localStorage.getItem('df_db') || 'null') || structuredClone(DEFAULT_DB) }
    catch { return structuredClone(DEFAULT_DB) }
  }
  function save(db) { try { localStorage.setItem('df_db', JSON.stringify(db)) } catch {} }
  function eff(s) { return (s.completedCount || 0) + (s.manualCredit || 0) }

  return {
    handle(action, data) {
      const db = load()
      const today = TODAY()

      const result = (() => {
        switch (action) {

          // ── STUDENTS ────────────────────────────────
          case 'getStudents': {
            let list = db.students
            if (data.class)  list = list.filter(s => s.class.startsWith(data.class))
            if (data.status) list = list.filter(s => s.status === data.status)
            if (data.search) {
              const q = data.search.toLowerCase()
              list = list.filter(s => s.name.toLowerCase().includes(q) || s.admNo.toLowerCase().includes(q))
            }
            return list.map(s => ({ ...s, effectiveCount: eff(s) }))
          }
          case 'saveStudent': {
            const s = { ...data, id: genId('S'), completedCount: 0, manualCredit: 0, pendingCount: 0, upcomingCount: 0, lastDutyDate: null }
            db.students.push(s); save(db); return s
          }
          case 'updateStudent': {
            const i = db.students.findIndex(s => s.id === data.id)
            if (i >= 0) { db.students[i] = { ...db.students[i], ...data }; save(db) }
            return db.students[i]
          }
          case 'deleteStudent': {
            db.students = db.students.filter(s => s.id !== data.studentId); save(db); return true
          }

          // ── AREAS ───────────────────────────────────
          case 'getAreas': {
            let list = db.areas
            if (data.type) list = list.filter(a => a.type === data.type)
            return list
          }
          case 'saveArea': {
            const a = { ...data, id: genId('A') }; db.areas.push(a); save(db); return a
          }
          case 'updateArea': {
            const i = db.areas.findIndex(a => a.id === data.id)
            if (i >= 0) { db.areas[i] = { ...db.areas[i], ...data }; save(db) }
            return db.areas[i]
          }
          case 'deleteArea': {
            db.areas = db.areas.filter(a => a.id !== data.areaId); save(db); return true
          }

          // ── DUTIES ──────────────────────────────────
          case 'getDuties': {
            let list = db.duties
            if (data.filter === 'today')    list = list.filter(d => d.date === today)
            if (data.filter === 'upcoming') list = list.filter(d => d.date > today && d.status === 'Pending')
            if (data.filter === 'completed')list = list.filter(d => d.status === 'Done')
            if (data.filter === 'pending')  list = list.filter(d => ['Pending','Not Done'].includes(d.status))
            if (data.studentId) list = list.filter(d => d.studentId === data.studentId)
            return [...list].sort((a, b) => a.date.localeCompare(b.date))
          }
          case 'markDutyDone': {
            const d = db.duties.find(d => d.id === data.assignmentId)
            if (d && d.status !== 'Done') {
              d.status = 'Done'
              const s = db.students.find(s => s.id === d.studentId)
              if (s) { s.completedCount++; s.pendingCount = Math.max(0, s.pendingCount - 1); s.lastDutyDate = d.date }
            }
            save(db); return true
          }
          case 'markDutyNotDone': {
            const d = db.duties.find(d => d.id === data.assignmentId)
            if (d) d.status = 'Not Done'; save(db); return true
          }
          case 'cancelDuty': {
            const d = db.duties.find(d => d.id === data.assignmentId)
            if (d) { d.status = 'Cancelled'; const s = db.students.find(s => s.id === d.studentId); if (s) s.pendingCount = Math.max(0, s.pendingCount - 1) }
            save(db); return true
          }
          case 'suggestReplacement': {
            const d = db.duties.find(d => d.id === data.assignmentId)
            if (!d) return null
            const busy = new Set(db.duties.filter(x => x.date >= today && x.status === 'Pending').map(x => x.studentId))
            const eligible = db.students.filter(s => s.status === 'Active' && s.id !== d.studentId && !busy.has(s.id)).sort((a, b) => eff(a) - eff(b))
            return eligible[0] || null
          }

          // ── GENERATION ──────────────────────────────
          case 'generateDailyDuties': {
            const { startDate, days, excludeClasses = [] } = data
            const areas = db.areas.filter(a => a.type === 'Daily' && a.active)
            const active = db.students.filter(s => s.status === 'Active' && !excludeClasses.some(c => s.class.startsWith(c)))
            const upcoming = new Set(db.duties.filter(d => d.date >= today && d.status === 'Pending').map(d => d.studentId))
            const generated = []
            const usedPerDay = {}

            for (let i = 0; i < days; i++) {
              const dt = new Date(startDate + 'T00:00:00'); dt.setDate(dt.getDate() + i)
              const ds = dt.toISOString().slice(0, 10)
              if (!usedPerDay[ds]) usedPerDay[ds] = new Set()

              for (const area of areas) {
                const pool = active.filter(s => !usedPerDay[ds].has(s.id) && (area.eligibleClasses.length === 0 || area.eligibleClasses.some(c => s.class.startsWith(c)))).sort((a, b) => eff(a) - eff(b))
                const n = Math.min(area.requiredCount, pool.length)
                for (let j = 0; j < n; j++) {
                  const st = pool[j]
                  const row = { id: genId('D'), date: ds, areaId: area.id, areaName: area.name, studentId: st.id, studentName: st.name, class: st.class, type: 'Daily', status: 'Pending', generatedAt: today }
                  db.duties.push(row); generated.push(row)
                  usedPerDay[ds].add(st.id)
                  const sx = db.students.find(s => s.id === st.id); if (sx) sx.pendingCount++
                }
              }
            }
            save(db); return generated
          }
          case 'generateNonDailyDuties': {
            const { date, areaIds } = data
            const areas = db.areas.filter(a => areaIds.includes(a.id))
            const busy = new Set(db.duties.filter(d => d.date >= today && d.status === 'Pending').map(d => d.studentId))
            const pool = db.students.filter(s => s.status === 'Active' && !busy.has(s.id)).sort((a, b) => eff(a) - eff(b))
            const generated = []; const used = new Set()
            for (const area of areas) {
              const eligible = pool.filter(s => !used.has(s.id) && (area.eligibleClasses.length === 0 || area.eligibleClasses.some(c => s.class.startsWith(c))))
              const n = Math.min(area.requiredCount, eligible.length)
              for (let j = 0; j < n; j++) {
                const st = eligible[j]
                const row = { id: genId('D'), date, areaId: area.id, areaName: area.name, studentId: st.id, studentName: st.name, class: st.class, type: 'Non-Daily', status: 'Pending', generatedAt: today }
                db.duties.push(row); generated.push(row); used.add(st.id)
                const sx = db.students.find(s => s.id === st.id); if (sx) sx.pendingCount++
              }
            }
            save(db); return generated
          }

          // ── CREDITS ─────────────────────────────────
          case 'getManualCredits': return db.credits
          case 'addManualCredit': {
            const { studentIds, creditValue, reason } = data
            for (const sid of studentIds) {
              const s = db.students.find(s => s.id === sid); if (!s) continue
              s.manualCredit = (s.manualCredit || 0) + creditValue
              db.credits.push({ id: genId('C'), studentId: sid, studentName: s.name, creditValue, reason, addedDate: today })
            }
            save(db); return true
          }

          // ── LEAVE ───────────────────────────────────
          case 'addLeave': {
            const s = db.students.find(s => s.id === data.studentId)
            if (s) s.status = 'Leave'; save(db); return true
          }

          // ── REPORTS ─────────────────────────────────
          case 'getDashboard': {
            const todayDuties = db.duties.filter(d => d.date === today)
            const completedToday = todayDuties.filter(d => d.status === 'Done').length
            const totalToday = todayDuties.length
            return {
              totalStudents: db.students.filter(s => s.status === 'Active').length,
              activeDuties: todayDuties.filter(d => d.status === 'Pending').length,
              completedToday,
              pendingDuties: todayDuties.filter(d => ['Pending','Not Done'].includes(d.status)).length,
              notDoneToday: todayDuties.filter(d => d.status === 'Not Done').length,
              completionPct: totalToday ? Math.round((completedToday / totalToday) * 100) : 0,
              totalAreas: db.areas.filter(a => a.active).length,
              todayDuties,
              lowestStudents: [...db.students].filter(s => s.status === 'Active').sort((a, b) => eff(a) - eff(b)).slice(0, 5).map(s => ({ ...s, effectiveCount: eff(s) })),
            }
          }
          case 'getStudentReport': {
            const s = db.students.find(s => s.id === data.studentId)
            if (!s) throw new Error('Student not found')
            return { student: { ...s, effectiveCount: eff(s) }, duties: db.duties.filter(d => d.studentId === data.studentId).sort((a, b) => b.date.localeCompare(a.date)) }
          }
          case 'getAreaReport': {
            return db.areas.map(a => {
              const ad = db.duties.filter(d => d.areaId === a.id)
              const done = ad.filter(d => d.status === 'Done').length
              return { ...a, totalAssigned: ad.length, completedCount: done, completionRate: ad.length ? Math.round((done / ad.length) * 100) : 0 }
            })
          }
          case 'getClassReport': {
            const classes = [...new Set(db.students.map(s => s.class.split('-')[0]))].sort()
            return classes.map(cls => {
              const ss = db.students.filter(s => s.class.startsWith(cls))
              const total = ss.reduce((acc, s) => acc + s.completedCount + s.pendingCount, 0)
              const done  = ss.reduce((acc, s) => acc + s.completedCount, 0)
              return { class: cls, studentCount: ss.length, totalDuties: total, completedDuties: done, completionRate: total ? Math.round((done / total) * 100) : 0 }
            })
          }

          default: throw new Error('Unknown action: ' + action)
        }
      })()

      return Promise.resolve(result)
    },
  }
})()
