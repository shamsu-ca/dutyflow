import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { fmt, STATUS_COLORS } from '../lib/utils'
import { StatCard, ProgressBar, LoadingRows, EmptyState, Icon, Btn, Avatar, StatusChip } from '../components/ui'

export default function Dashboard({ onNavigate, toast }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDashboard().then(d => { setData(d); setLoading(false) }).catch(() => { toast.error('Failed to load dashboard'); setLoading(false) })
  }, [])

  if (loading) return <div style={{ padding: '24px 16px' }}><LoadingRows n={6} /></div>
  if (!data) return <EmptyState icon="error_outline" title="Failed to load" />

  const { totalStudents, activeDuties, completedToday, pendingDuties, completionPct, notDoneToday, totalAreas, todayDuties, lowestStudents } = data

  // Group today's duties by area
  const byArea = {}
  todayDuties.forEach(d => {
    if (!byArea[d.areaId]) byArea[d.areaId] = { name: d.areaName, duties: [], worstStatus: 'Done' }
    byArea[d.areaId].duties.push(d)
    if (d.status === 'Pending') byArea[d.areaId].worstStatus = 'Pending'
    if (d.status === 'Not Done') byArea[d.areaId].worstStatus = 'Not Done'
  })

  return (
    <div className="page-enter" style={{ paddingBottom: 96 }}>
      {/* Greeting */}
      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--clr-on-surface-var)', marginBottom: 4 }}>Dashboard Overview</p>
        <h2 style={{ fontSize: 30, fontWeight: 800, color: 'var(--clr-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>Hello, Admin</h2>
      </div>

      {/* Alert banner */}
      {notDoneToday > 0 && (
        <div style={{ margin: '16px 16px 0', padding: '14px 16px', borderRadius: 'var(--r-lg)', background: 'var(--clr-error-container)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--clr-error)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="warning" filled size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--clr-on-error-cont)' }}>{notDoneToday} {notDoneToday === 1 ? 'duty' : 'duties'} not completed today</p>
            <p style={{ fontSize: 12, color: 'var(--clr-on-error-cont)', opacity: 0.8, marginTop: 2 }}>Review pending duties immediately</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, padding: '16px 16px 0' }}>
        <StatCard value={totalStudents} label="Active Students" icon="group" color="var(--clr-primary-fixed)" iconColor="var(--clr-on-primary-fixed)" />
        <StatCard value={activeDuties} label="Active Duties" icon="assignment" color="#dbeafe" iconColor="#1d4ed8" valueColor="#1d4ed8" />
        <StatCard value={completedToday} label="Completed Today" icon="check_circle" color="#dcfce7" iconColor="#15803d" valueColor="#15803d" />
        <StatCard value={pendingDuties} label="Pending" icon="pending_actions" color="var(--clr-error-container)" iconColor="var(--clr-on-error-cont)" valueColor="var(--clr-error)" />
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--clr-on-surface-var)', marginBottom: 12 }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
          {[
            { icon: 'auto_awesome', label: 'Generate Daily', color: 'var(--clr-primary-fixed)', iconColor: 'var(--clr-on-primary-fixed)', page: 'generate', tab: 'daily' },
            { icon: 'calendar_month', label: 'Non-Daily', color: '#d5e3fc', iconColor: '#1d4ed8', page: 'generate', tab: 'non-daily' },
            { icon: 'checklist', label: 'Mark Duties', color: 'var(--clr-surface-highest)', iconColor: 'var(--clr-on-surface)', page: 'duties', tab: 'today' },
            { icon: 'add_card', label: 'Add Credit', color: 'var(--clr-primary-container)', iconColor: '#fff', page: 'reports', tab: 'credits' },
          ].map(a => (
            <button key={a.label} onClick={() => onNavigate(a.page, a.tab)} style={{
              padding: '16px 12px', borderRadius: 'var(--r-lg)', border: '1px solid var(--clr-outline-var)',
              background: 'var(--clr-surface-white)', cursor: 'pointer', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              transition: 'transform 0.15s, box-shadow 0.15s', boxShadow: 'var(--sh-card)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--sh-md)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--sh-card)' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={a.icon} size={22} style={{ color: a.iconColor }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--clr-on-surface)' }}>{a.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Completion Progress */}
      <div style={{ margin: '20px 16px 0', padding: '16px', borderRadius: 'var(--r-lg)', background: 'var(--clr-surface-container)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--clr-on-surface-var)', marginBottom: 12 }}>Today's Completion</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--clr-on-surface)' }}>{completedToday} of {todayDuties.length} duties</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-primary)' }}>{completionPct}%</span>
            </div>
            <ProgressBar value={completionPct} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: '#15803d' }}>{completedToday} done</span>
              <span style={{ fontSize: 11, color: 'var(--clr-on-surface-var)' }}>{totalAreas} areas total</span>
            </div>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--clr-primary)', lineHeight: 1 }}>{completionPct}%</div>
        </div>
      </div>

      {/* Today's duties */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 17, fontWeight: 600 }}>Today's Duties</p>
          <button onClick={() => onNavigate('duties', 'today')} style={{ fontSize: 11, fontWeight: 700, color: 'var(--clr-primary)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em' }}>VIEW ALL</button>
        </div>
        {Object.keys(byArea).length === 0
          ? <EmptyState icon="event_busy" title="No duties today" subtitle="Generate duties to get started" action={<Btn onClick={() => onNavigate('generate', 'daily')}><Icon name="auto_awesome" size={18} />Generate Daily</Btn>} />
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.values(byArea).map((g, i) => (
                <div key={i} onClick={() => onNavigate('duties', 'today')} style={{
                  background: 'var(--clr-surface-white)', borderRadius: 'var(--r-lg)', display: 'flex', overflow: 'hidden', cursor: 'pointer',
                  boxShadow: 'var(--sh-card)', border: `1px solid var(--clr-outline-var)`, borderLeft: `4px solid ${STATUS_COLORS[g.worstStatus]?.strip || '#003527'}`,
                  transition: 'transform 0.15s',
                }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform=''}>
                  <div style={{ flex: 1, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 'var(--r)', background: 'var(--clr-surface-high)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="cleaning_services" size={20} style={{ color: 'var(--clr-primary)' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 600 }}>{g.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--clr-on-surface-var)' }}>{g.duties.length} student{g.duties.length !== 1 ? 's' : ''} assigned</p>
                      </div>
                    </div>
                    <StatusChip status={g.worstStatus} />
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Lowest count students */}
      {lowestStudents.length > 0 && (
        <div style={{ padding: '20px 16px 0' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--clr-on-surface-var)', marginBottom: 12 }}>Students Needing Duties</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lowestStudents.map(s => (
              <div key={s.id} style={{ background: 'var(--clr-surface-white)', borderRadius: 'var(--r-lg)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--sh-card)', border: '1px solid var(--clr-outline-var)' }}>
                <Avatar name={s.name} size={36} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--clr-on-surface-var)' }}>{s.class}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--clr-primary)', lineHeight: 1 }}>{s.effectiveCount}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--clr-on-surface-var)', letterSpacing: '0.05em' }}>EFFECTIVE</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
