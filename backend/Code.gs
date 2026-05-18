/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  DutyFlow — Google Apps Script Backend                       ║
 * ║                                                              ║
 * ║  SETUP STEPS:                                                ║
 * ║  1. Open Extensions → Apps Script in your Google Sheet       ║
 * ║  2. Paste this entire file                                   ║
 * ║  3. Set SHEET_ID and ADMIN_TOKEN in Script Properties:       ║
 * ║     Project Settings → Script Properties → Add:             ║
 * ║       SHEET_ID   = your-google-sheet-id                      ║
 * ║       ADMIN_TOKEN = your-secret-token                        ║
 * ║  4. Run → setupSheets (once, to create all sheets/headers)   ║
 * ║  5. Deploy → New Deployment → Web App                        ║
 * ║       Execute as: Me                                         ║
 * ║       Who has access: Anyone                                 ║
 * ║  6. Copy the Web App URL → paste into Vercel env vars        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ─── CONFIG (read from Script Properties — never hardcode secrets) ────────────
function getConfig() {
  const props = PropertiesService.getScriptProperties()
  return {
    SHEET_ID:    props.getProperty('SHEET_ID')    || '',
    ADMIN_TOKEN: props.getProperty('ADMIN_TOKEN') || 'changeme',
  }
}

// ─── SHEET NAMES ──────────────────────────────────────────────────────────────
const SHEETS = {
  STUDENTS:     'Students',
  AREAS:        'Areas',
  DUTIES:       'DutyAssignments',
  AREA_HISTORY: 'AreaHistory',
  CREDITS:      'ManualCredits',
  LEAVE:        'LeaveRecords',
}

// ─── SHEET HEADERS ────────────────────────────────────────────────────────────
const HEADERS = {
  Students:        ['StudentID','AdmissionNo','StudentName','Class','Status','CompletedCount','ManualCredit','PendingCount','UpcomingCount','LastDutyDate'],
  Areas:           ['AreaID','AreaName','AreaType','RequiredCount','EligibleClasses','Active'],
  DutyAssignments: ['AssignmentID','Date','AreaID','AreaName','StudentID','StudentName','Class','DutyType','Status','GeneratedAt'],
  AreaHistory:     ['StudentID','AreaID','CompletedCount','LastCompletedDate'],
  ManualCredits:   ['CreditID','StudentID','StudentName','CreditValue','Reason','AddedDate'],
  LeaveRecords:    ['LeaveID','StudentID','StartDate','EndDate','Reason'],
}

// ─── ENTRY POINTS ─────────────────────────────────────────────────────────────
function doPost(e) {
  const output = ContentService.createTextOutput
  try {
    const cfg  = getConfig()
    const body = JSON.parse(e.postData.contents)
    
    // Auth check
    if (body.token !== cfg.ADMIN_TOKEN) {
      return output(JSON.stringify({ success: false, error: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON)
    }

    const { action, ...data } = body
    const result = dispatch(action, data, cfg.SHEET_ID)
    return output(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON)

  } catch (err) {
    return output(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ status: 'DutyFlow API OK' }))
    .setMimeType(ContentService.MimeType.JSON)
}

// ─── DISPATCHER ───────────────────────────────────────────────────────────────
function dispatch(action, data, sheetId) {
  const handlers = {
    getStudents:            () => getStudents(sheetId, data),
    saveStudent:            () => saveStudent(sheetId, data),
    updateStudent:          () => updateStudent(sheetId, data),
    deleteStudent:          () => deleteStudent(sheetId, data),
    getAreas:               () => getAreas(sheetId, data),
    saveArea:               () => saveArea(sheetId, data),
    updateArea:             () => updateArea(sheetId, data),
    deleteArea:             () => deleteArea(sheetId, data),
    getDuties:              () => getDuties(sheetId, data),
    markDutyDone:           () => markDutyDone(sheetId, data),
    markDutyNotDone:        () => markDutyNotDone(sheetId, data),
    cancelDuty:             () => cancelDuty(sheetId, data),
    suggestReplacement:     () => suggestReplacement(sheetId, data),
    generateDailyDuties:    () => generateDailyDuties(sheetId, data),
    generateNonDailyDuties: () => generateNonDailyDuties(sheetId, data),
    getManualCredits:       () => getManualCredits(sheetId),
    addManualCredit:        () => addManualCredit(sheetId, data),
    addLeave:               () => addLeave(sheetId, data),
    getDashboard:           () => getDashboard(sheetId),
    getStudentReport:       () => getStudentReport(sheetId, data),
    getAreaReport:          () => getAreaReport(sheetId),
    getClassReport:         () => getClassReport(sheetId),
  }
  if (!handlers[action]) throw new Error('Unknown action: ' + action)
  return handlers[action]()
}

// ─── SHEET HELPERS ────────────────────────────────────────────────────────────
function getSheet(sheetId, name) {
  const ss = SpreadsheetApp.openById(sheetId)
  let sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    if (HEADERS[name]) {
      sheet.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]])
      sheet.setFrozenRows(1)
    }
  }
  return sheet
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues()
  if (data.length < 2) return []
  const headers = data[0]
  return data.slice(1).map(row => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = row[i] === '' ? null : row[i] })
    return obj
  })
}

function genId(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase()
}

function todayStr() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')
}

// ─── STUDENTS ─────────────────────────────────────────────────────────────────
function getStudents(sheetId, filters) {
  let list = sheetToObjects(getSheet(sheetId, SHEETS.STUDENTS))
  
  if (filters.class)  list = list.filter(s => s.Class && String(s.Class).startsWith(filters.class))
  if (filters.status) list = list.filter(s => s.Status === filters.status)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    list = list.filter(s =>
      (s.StudentName && s.StudentName.toLowerCase().includes(q)) ||
      (s.AdmissionNo && String(s.AdmissionNo).toLowerCase().includes(q))
    )
  }

  return list.map(s => ({
    id:             s.StudentID,
    admNo:          s.AdmissionNo,
    name:           s.StudentName,
    class:          s.Class,
    status:         s.Status,
    completedCount: Number(s.CompletedCount) || 0,
    manualCredit:   Number(s.ManualCredit)   || 0,
    effectiveCount: (Number(s.CompletedCount) || 0) + (Number(s.ManualCredit) || 0),
    pendingCount:   Number(s.PendingCount)   || 0,
    upcomingCount:  Number(s.UpcomingCount)  || 0,
    lastDutyDate:   s.LastDutyDate || null,
  }))
}

function saveStudent(sheetId, data) {
  const id = genId('S')
  getSheet(sheetId, SHEETS.STUDENTS)
    .appendRow([id, data.admNo, data.name, data.class, data.status || 'Active', 0, 0, 0, 0, ''])
  return { id, ...data, completedCount: 0, manualCredit: 0, pendingCount: 0, upcomingCount: 0 }
}

function updateStudent(sheetId, data) {
  const sheet = getSheet(sheetId, SHEETS.STUDENTS)
  const rows  = sheet.getDataRange().getValues()
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      if (data.admNo  !== undefined) sheet.getRange(i + 1, 2).setValue(data.admNo)
      if (data.name   !== undefined) sheet.getRange(i + 1, 3).setValue(data.name)
      if (data.class  !== undefined) sheet.getRange(i + 1, 4).setValue(data.class)
      if (data.status !== undefined) sheet.getRange(i + 1, 5).setValue(data.status)
      return true
    }
  }
  return false
}

function deleteStudent(sheetId, data) {
  const sheet = getSheet(sheetId, SHEETS.STUDENTS)
  const rows  = sheet.getDataRange().getValues()
  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === data.studentId) { sheet.deleteRow(i + 1); return true }
  }
  return false
}

function bumpStudentField(sheetId, studentId, colIndex, delta) {
  const sheet = getSheet(sheetId, SHEETS.STUDENTS)
  const rows  = sheet.getDataRange().getValues()
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === studentId) {
      const cur = Number(rows[i][colIndex - 1]) || 0
      sheet.getRange(i + 1, colIndex).setValue(Math.max(0, cur + delta))
      return
    }
  }
}
// colIndex: CompletedCount=6, ManualCredit=7, PendingCount=8, UpcomingCount=9, LastDutyDate=10

// ─── AREAS ────────────────────────────────────────────────────────────────────
function getAreas(sheetId, filters) {
  let list = sheetToObjects(getSheet(sheetId, SHEETS.AREAS))
  if (filters && filters.type) list = list.filter(a => a.AreaType === filters.type)
  return list.map(a => ({
    id:             a.AreaID,
    name:           a.AreaName,
    type:           a.AreaType,
    requiredCount:  Number(a.RequiredCount) || 1,
    eligibleClasses: a.EligibleClasses ? String(a.EligibleClasses).split(',').map(c => c.trim()) : [],
    active:         a.Active === true || a.Active === 'TRUE' || a.Active === 'true',
  }))
}

function saveArea(sheetId, data) {
  const id = genId('A')
  const cls = Array.isArray(data.eligibleClasses) ? data.eligibleClasses.join(',') : (data.eligibleClasses || '')
  getSheet(sheetId, SHEETS.AREAS).appendRow([id, data.name, data.type, data.requiredCount || 1, cls, data.active !== false ? 'TRUE' : 'FALSE'])
  return { id, ...data }
}

function updateArea(sheetId, data) {
  const sheet = getSheet(sheetId, SHEETS.AREAS)
  const rows  = sheet.getDataRange().getValues()
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      if (data.name           !== undefined) sheet.getRange(i+1,2).setValue(data.name)
      if (data.type           !== undefined) sheet.getRange(i+1,3).setValue(data.type)
      if (data.requiredCount  !== undefined) sheet.getRange(i+1,4).setValue(data.requiredCount)
      if (data.eligibleClasses!== undefined) sheet.getRange(i+1,5).setValue(Array.isArray(data.eligibleClasses) ? data.eligibleClasses.join(',') : data.eligibleClasses)
      if (data.active         !== undefined) sheet.getRange(i+1,6).setValue(data.active ? 'TRUE' : 'FALSE')
      return true
    }
  }
  return false
}

function deleteArea(sheetId, data) {
  const sheet = getSheet(sheetId, SHEETS.AREAS)
  const rows  = sheet.getDataRange().getValues()
  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === data.areaId) { sheet.deleteRow(i + 1); return true }
  }
  return false
}

// ─── DUTIES ───────────────────────────────────────────────────────────────────
function getDuties(sheetId, filters) {
  const today = todayStr()
  let list = sheetToObjects(getSheet(sheetId, SHEETS.DUTIES))

  if (filters.filter === 'today')    list = list.filter(d => d.Date === today)
  if (filters.filter === 'upcoming') list = list.filter(d => d.Date > today && d.Status === 'Pending')
  if (filters.filter === 'completed')list = list.filter(d => d.Status === 'Done')
  if (filters.filter === 'pending')  list = list.filter(d => ['Pending','Not Done'].includes(d.Status))
  if (filters.studentId) list = list.filter(d => d.StudentID === filters.studentId)

  list.sort((a, b) => String(a.Date).localeCompare(String(b.Date)))

  return list.map(d => ({
    id:          d.AssignmentID,
    date:        d.Date,
    areaId:      d.AreaID,
    areaName:    d.AreaName,
    studentId:   d.StudentID,
    studentName: d.StudentName,
    class:       d.Class,
    type:        d.DutyType,
    status:      d.Status,
    generatedAt: d.GeneratedAt,
  }))
}

function markDutyDone(sheetId, data) {
  const sheet = getSheet(sheetId, SHEETS.DUTIES)
  const rows  = sheet.getDataRange().getValues()
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.assignmentId) {
      const prev      = rows[i][8]   // Status col
      const studentId = rows[i][4]
      const date      = rows[i][1]
      sheet.getRange(i + 1, 9).setValue('Done')
      if (prev !== 'Done') {
        bumpStudentField(sheetId, studentId, 6, 1)   // CompletedCount++
        bumpStudentField(sheetId, studentId, 8, -1)  // PendingCount--
        // Update LastDutyDate
        const sSheet = getSheet(sheetId, SHEETS.STUDENTS)
        const sRows  = sSheet.getDataRange().getValues()
        for (let j = 1; j < sRows.length; j++) {
          if (sRows[j][0] === studentId) { sSheet.getRange(j + 1, 10).setValue(date); break }
        }
        updateAreaHistory(sheetId, studentId, rows[i][2])
      }
      return true
    }
  }
  return false
}

function markDutyNotDone(sheetId, data) {
  const sheet = getSheet(sheetId, SHEETS.DUTIES)
  const rows  = sheet.getDataRange().getValues()
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.assignmentId) { sheet.getRange(i + 1, 9).setValue('Not Done'); return true }
  }
  return false
}

function cancelDuty(sheetId, data) {
  const sheet = getSheet(sheetId, SHEETS.DUTIES)
  const rows  = sheet.getDataRange().getValues()
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.assignmentId) {
      const prev = rows[i][8]
      sheet.getRange(i + 1, 9).setValue('Cancelled')
      if (prev === 'Pending') bumpStudentField(sheetId, rows[i][4], 8, -1)
      return true
    }
  }
  return false
}

function suggestReplacement(sheetId, data) {
  const duties  = sheetToObjects(getSheet(sheetId, SHEETS.DUTIES))
  const duty    = duties.find(d => d.AssignmentID === data.assignmentId)
  if (!duty) return null

  const today   = todayStr()
  const busyIds = new Set(duties.filter(d => d.Date >= today && d.Status === 'Pending' && d.AssignmentID !== data.assignmentId).map(d => d.StudentID))
  const students = getStudents(sheetId, { status: 'Active' })
  const eligible = students.filter(s => s.id !== duty.StudentID && !busyIds.has(s.id)).sort((a, b) => a.effectiveCount - b.effectiveCount)
  return eligible[0] || null
}

// ─── AREA HISTORY ─────────────────────────────────────────────────────────────
function updateAreaHistory(sheetId, studentId, areaId) {
  const sheet = getSheet(sheetId, SHEETS.AREA_HISTORY)
  const rows  = sheet.getDataRange().getValues()
  const today = todayStr()
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === studentId && rows[i][1] === areaId) {
      sheet.getRange(i + 1, 3).setValue((Number(rows[i][2]) || 0) + 1)
      sheet.getRange(i + 1, 4).setValue(today)
      return
    }
  }
  sheet.appendRow([studentId, areaId, 1, today])
}

// ─── GENERATION ───────────────────────────────────────────────────────────────
function generateDailyDuties(sheetId, data) {
  const { startDate, days, excludeClasses = [] } = data
  const areas    = getAreas(sheetId, { type: 'Daily' }).filter(a => a.active)
  const students = getStudents(sheetId, { status: 'Active' }).filter(s => !excludeClasses.some(c => s.class.startsWith(c)))
  const today    = todayStr()

  const dutiesSheet = getSheet(sheetId, SHEETS.DUTIES)
  const existing    = sheetToObjects(dutiesSheet)
  const generated   = []
  const byDate      = {}
  existing.forEach(d => {
    if (!byDate[d.Date]) byDate[d.Date] = new Set()
    byDate[d.Date].add(d.StudentID)
  })

  for (let i = 0; i < days; i++) {
    const dt = new Date(startDate + 'T00:00:00')
    dt.setDate(dt.getDate() + i)
    const ds = Utilities.formatDate(dt, Session.getScriptTimeZone(), 'yyyy-MM-dd')
    if (!byDate[ds]) byDate[ds] = new Set()

    for (const area of areas) {
      const pool = students
        .filter(s => !byDate[ds].has(s.id) && (area.eligibleClasses.length === 0 || area.eligibleClasses.some(c => s.class.startsWith(c))))
        .sort((a, b) => a.effectiveCount - b.effectiveCount)

      const n = Math.min(area.requiredCount, pool.length)
      for (let j = 0; j < n; j++) {
        const st  = pool[j]
        const id  = genId('D')
        const row = [id, ds, area.id, area.name, st.id, st.name, st.class, 'Daily', 'Pending', today]
        dutiesSheet.appendRow(row)
        byDate[ds].add(st.id)
        bumpStudentField(sheetId, st.id, 8, 1) // PendingCount++
        generated.push({ id, date: ds, areaId: area.id, areaName: area.name, studentId: st.id, studentName: st.name, class: st.class, type: 'Daily', status: 'Pending' })
      }
    }
  }
  return generated
}

function generateNonDailyDuties(sheetId, data) {
  const { date, areaIds } = data
  const areas    = getAreas(sheetId, {}).filter(a => areaIds.includes(a.id))
  const today    = todayStr()
  const duties   = sheetToObjects(getSheet(sheetId, SHEETS.DUTIES))
  const busy     = new Set(duties.filter(d => d.Date >= today && d.Status === 'Pending').map(d => d.StudentID))
  const students = getStudents(sheetId, { status: 'Active' }).filter(s => !busy.has(s.id)).sort((a, b) => a.effectiveCount - b.effectiveCount)

  const dutiesSheet = getSheet(sheetId, SHEETS.DUTIES)
  const generated   = []
  const used        = new Set()

  for (const area of areas) {
    const pool = students.filter(s => !used.has(s.id) && (area.eligibleClasses.length === 0 || area.eligibleClasses.some(c => s.class.startsWith(c))))
    const n    = Math.min(area.requiredCount, pool.length)
    for (let j = 0; j < n; j++) {
      const st  = pool[j]
      const id  = genId('D')
      dutiesSheet.appendRow([id, date, area.id, area.name, st.id, st.name, st.class, 'Non-Daily', 'Pending', today])
      used.add(st.id)
      bumpStudentField(sheetId, st.id, 8, 1)
      generated.push({ id, date, areaId: area.id, areaName: area.name, studentId: st.id, studentName: st.name, class: st.class, type: 'Non-Daily', status: 'Pending' })
    }
  }
  return generated
}

// ─── MANUAL CREDITS ───────────────────────────────────────────────────────────
function getManualCredits(sheetId) {
  return sheetToObjects(getSheet(sheetId, SHEETS.CREDITS)).map(c => ({
    id:          c.CreditID,
    studentId:   c.StudentID,
    studentName: c.StudentName,
    creditValue: Number(c.CreditValue) || 0,
    reason:      c.Reason || '',
    addedDate:   c.AddedDate,
  }))
}

function addManualCredit(sheetId, data) {
  const { studentIds, creditValue, reason } = data
  const students = getStudents(sheetId, {})
  const sheet    = getSheet(sheetId, SHEETS.CREDITS)
  const today    = todayStr()

  for (const sid of studentIds) {
    const s = students.find(x => x.id === sid)
    if (!s) continue
    sheet.appendRow([genId('C'), sid, s.name, creditValue, reason || '', today])
    bumpStudentField(sheetId, sid, 7, creditValue) // ManualCredit += creditValue
  }
  return true
}

// ─── LEAVE ────────────────────────────────────────────────────────────────────
function addLeave(sheetId, data) {
  getSheet(sheetId, SHEETS.LEAVE).appendRow([genId('L'), data.studentId, data.startDate, data.endDate, data.reason || ''])
  updateStudent(sheetId, { id: data.studentId, status: 'Leave' })
  return true
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function getDashboard(sheetId) {
  const today      = todayStr()
  const duties     = sheetToObjects(getSheet(sheetId, SHEETS.DUTIES))
  const students   = getStudents(sheetId, {})
  const todayD     = duties.filter(d => d.Date === today)
  const completed  = todayD.filter(d => d.Status === 'Done').length
  const notDone    = todayD.filter(d => d.Status === 'Not Done').length
  const pending    = todayD.filter(d => ['Pending','Not Done'].includes(d.Status)).length
  const pct        = todayD.length ? Math.round((completed / todayD.length) * 100) : 0
  const areas      = getAreas(sheetId, {})

  return {
    totalStudents:  students.filter(s => s.status === 'Active').length,
    activeDuties:   todayD.filter(d => d.Status === 'Pending').length,
    completedToday: completed,
    pendingDuties:  pending,
    notDoneToday:   notDone,
    completionPct:  pct,
    totalAreas:     areas.filter(a => a.active).length,
    lowestStudents: students.filter(s => s.status === 'Active').sort((a, b) => a.effectiveCount - b.effectiveCount).slice(0, 5),
    todayDuties: todayD.map(d => ({ id: d.AssignmentID, date: d.Date, areaId: d.AreaID, areaName: d.AreaName, studentId: d.StudentID, studentName: d.StudentName, class: d.Class, type: d.DutyType, status: d.Status })),
  }
}

function getStudentReport(sheetId, data) {
  const students = getStudents(sheetId, {})
  const student  = students.find(s => s.id === data.studentId)
  if (!student) throw new Error('Student not found')
  const duties = sheetToObjects(getSheet(sheetId, SHEETS.DUTIES))
    .filter(d => d.StudentID === data.studentId)
    .sort((a, b) => String(b.Date).localeCompare(String(a.Date)))
    .map(d => ({ id: d.AssignmentID, date: d.Date, areaName: d.AreaName, type: d.DutyType, status: d.Status }))
  return { student, duties }
}

function getAreaReport(sheetId) {
  const areas  = getAreas(sheetId, {})
  const duties = sheetToObjects(getSheet(sheetId, SHEETS.DUTIES))
  return areas.map(a => {
    const ad   = duties.filter(d => d.AreaID === a.id)
    const done = ad.filter(d => d.Status === 'Done').length
    return { ...a, totalAssigned: ad.length, completedCount: done, completionRate: ad.length ? Math.round((done / ad.length) * 100) : 0 }
  })
}

function getClassReport(sheetId) {
  const students = getStudents(sheetId, {})
  const classes  = [...new Set(students.map(s => s.class.split('-')[0]))].sort()
  return classes.map(cls => {
    const ss    = students.filter(s => s.class.startsWith(cls))
    const total = ss.reduce((acc, s) => acc + s.completedCount + s.pendingCount, 0)
    const done  = ss.reduce((acc, s) => acc + s.completedCount, 0)
    return { class: cls, studentCount: ss.length, totalDuties: total, completedDuties: done, completionRate: total ? Math.round((done / total) * 100) : 0 }
  })
}

// ─── SETUP (run once manually from Apps Script editor) ────────────────────────
/**
 * HOW TO RUN:
 * 1. Open this file in Apps Script editor
 * 2. Select "setupSheets" from the function dropdown at the top
 * 3. Click Run ▶
 * This creates all required sheets with proper headers.
 */
function setupSheets() {
  const cfg = getConfig()
  if (!cfg.SHEET_ID) {
    throw new Error('SHEET_ID not set in Script Properties. Go to Project Settings → Script Properties and add SHEET_ID.')
  }
  const ss = SpreadsheetApp.openById(cfg.SHEET_ID)
  Object.entries(HEADERS).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name)
    if (!sheet) {
      sheet = ss.insertSheet(name)
      Logger.log('Created sheet: ' + name)
    }
    // Only write headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      sheet.setFrozenRows(1)
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#064e3b').setFontColor('#ffffff')
    }
  })
  Logger.log('✅ DutyFlow sheets initialized successfully!')
  // No SpreadsheetApp.getActiveSpreadsheet().toast() — that only works when bound to a sheet
}

// ─── SEED SAMPLE DATA (optional, run once) ────────────────────────────────────
function seedSampleData() {
  const cfg = getConfig()
  if (!cfg.SHEET_ID) throw new Error('Set SHEET_ID in Script Properties first')

  // Sample areas
  const areas = [
    ['A001','Main Corridor','Daily',4,'8,9,10,11,12','TRUE'],
    ['A002','Dining Hall','Daily',6,'10,11,12','TRUE'],
    ['A003','Outdoor Courtyard','Daily',3,'8,9,10','TRUE'],
    ['A004','Washrooms Block A','Daily',2,'9,10,11','TRUE'],
    ['A005','Library Hall','Daily',2,'11,12','TRUE'],
    ['A006','Event Hall','Non-Daily',8,'10,11,12','TRUE'],
    ['A007','Sports Ground','Non-Daily',5,'8,9,10,11,12','TRUE'],
  ]
  const aSheet = getSheet(cfg.SHEET_ID, SHEETS.AREAS)
  if (aSheet.getLastRow() <= 1) areas.forEach(r => aSheet.appendRow(r))

  // Sample students
  const students = [
    ['S001','ADM001','Arjun Nair','10-A','Active',12,2,1,3,'2026-05-10'],
    ['S002','ADM002','Priya Menon','10-B','Active',8,0,3,2,'2026-05-12'],
    ['S003','ADM003','Rahul Krishna','11-A','Leave',15,1,0,0,'2026-05-05'],
    ['S004','ADM004','Sneha Das','9-C','Active',5,0,2,4,'2026-05-14'],
    ['S005','ADM005','Aditya Sharma','12-A','Active',20,3,0,1,'2026-05-16'],
    ['S006','ADM006','Meera Pillai','8-B','Active',4,0,1,2,'2026-05-13'],
    ['S007','ADM007','Vikram Patel','11-B','Inactive',0,0,0,0,''],
    ['S008','ADM008','Anjali Reddy','9-A','Active',9,1,0,3,'2026-05-15'],
  ]
  const sSheet = getSheet(cfg.SHEET_ID, SHEETS.STUDENTS)
  if (sSheet.getLastRow() <= 1) students.forEach(r => sSheet.appendRow(r))

  Logger.log('✅ Sample data seeded!')
}
