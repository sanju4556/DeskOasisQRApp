import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useState } from 'react'
import { getStock } from '../api/client.js'
import toast from 'react-hot-toast'
import { c } from '../utils/styles.js'

const NAV = [
  { to: '/', icon: 'DB', label: 'Dashboard' },
  { to: '/location-health', icon: 'LH', label: 'Location Health' },
  { to: '/plants', icon: 'PL', label: 'Plant Catalog' },
  { to: '/locations', icon: 'LO', label: 'Locations' },
  { to: '/inventory', icon: 'IN', label: 'Inventory', alert: true },
  { to: '/qr', icon: 'QR', label: 'QR Manager' },
  { to: '/orders', icon: 'OR', label: 'Orders' },
  { to: '/refill', icon: 'RF', label: 'Refill' }
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [alertCount, setCount] = useState(0)

  useEffect(() => {
    const load = () => getStock('low').then(r => setCount(r.data.length)).catch(() => {})
    load()
    const t = setInterval(load, 60_000)
    return () => clearInterval(t)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 230, background: c.forest, position: 'fixed', top: 0, left: 0, height: '100vh', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#fff', fontWeight: 700 }}>DeskOasis</div>
          <div style={{ fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: c.mint, marginTop: 2 }}>Admin Panel</div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '9px 11px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13.5,
                textDecoration: 'none',
                marginBottom: 2,
                color: isActive ? '#fff' : 'rgba(255,255,255,.6)',
                background: isActive ? c.moss : 'transparent',
                fontWeight: isActive ? 500 : 400
              })}
            >
              <span style={{ width: 18, fontSize: 10, fontWeight: 700, letterSpacing: '.4px' }}>{n.icon}</span>
              <span>{n.label}</span>
              {n.alert && alertCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#c0392b', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 12 }}>
                  {alertCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: c.sage, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 14, padding: 4 }}
          >
            OUT
          </button>
        </div>
      </aside>

      <main style={{ marginLeft: 230, flex: 1, background: c.cream, minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  )
}
