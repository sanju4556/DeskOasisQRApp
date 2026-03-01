import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { getOrders } from '../../api/client.js'
import { c, s, btn, badge } from '../../utils/styles.js'
import toast from 'react-hot-toast'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const load = async () => {
    try {
      const { data } = await getOrders()
      setOrders(data || [])
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 20_000)
    return () => clearInterval(t)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter(o => {
      const matchesStatus = status === 'all' || o.status === status
      if (!matchesStatus) return false
      if (!q) return true
      return [
        o.orderId,
        o.plantName,
        o.locationName,
        o.customerName,
        o.customerEmail
      ].some(v => String(v || '').toLowerCase().includes(q))
    })
  }, [orders, query, status])

  const summary = useMemo(() => {
    const completed = orders.filter(o => o.status === 'Completed')
    const pending = orders.filter(o => o.status === 'Pending')
    const revenue = completed.reduce((sum, o) => sum + (o.amount || 0), 0)
    return { total: orders.length, completed: completed.length, pending: pending.length, revenue }
  }, [orders])

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Orders</h1>
      <p style={s.sub}>Live order stream with 20s auto-refresh</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        <div style={{ ...s.card, padding: 14 }}>
          <div style={{ fontSize: 11, color: c.text2 }}>Total Orders</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: c.forest, fontWeight: 700 }}>{summary.total}</div>
        </div>
        <div style={{ ...s.card, padding: 14 }}>
          <div style={{ fontSize: 11, color: c.text2 }}>Completed</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: c.green, fontWeight: 700 }}>{summary.completed}</div>
        </div>
        <div style={{ ...s.card, padding: 14 }}>
          <div style={{ fontSize: 11, color: c.text2 }}>Pending</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: c.orange, fontWeight: 700 }}>{summary.pending}</div>
        </div>
        <div style={{ ...s.card, padding: 14 }}>
          <div style={{ fontSize: 11, color: c.text2 }}>Revenue</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: c.earth, fontWeight: 700 }}>Rs {summary.revenue.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by order, customer, plant, location"
          style={{ ...s.input, maxWidth: 420 }}
        />
        {['all', 'Completed', 'Pending'].map(v => (
          <button key={v} style={status === v ? btn('primary') : btn()} onClick={() => setStatus(v)}>
            {v}
          </button>
        ))}
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={{ padding: 18, color: c.text2 }}>Loading orders...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Order ID', 'Plant', 'Location', 'Customer', 'Amount', 'Status', 'Created'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: c.text2, padding: '0 14px 10px', fontWeight: 500 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.orderId} style={{ borderTop: `1px solid ${c.border}` }}>
                    <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{o.orderId}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13 }}>{o.plantName}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: c.text2 }}>{o.locationName}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12 }}>
                      <div>{o.customerName || '-'}</div>
                      <div style={{ color: c.text2 }}>{o.customerEmail || '-'}</div>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600 }}>Rs {o.amount}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={badge(o.status === 'Completed' ? 'green' : 'orange')}>{o.status}</span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: c.text2 }}>
                      {format(new Date(o.createdAt), 'dd MMM yyyy, hh:mm a')}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 16, color: c.text2 }}>No orders match your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
