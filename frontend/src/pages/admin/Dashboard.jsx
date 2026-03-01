import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getDashboard } from '../../api/client.js'
import { c, s } from '../../utils/styles.js'
import { format } from 'date-fns'

const KPI = ({ label, value, note, icon, warn }) => (
  <div style={s.card}>
    <div style={{ padding:'18px 20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <span style={{ fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', color:c.text2, fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:24 }}>{icon}</span>
      </div>
      <div style={{ fontFamily:'Playfair Display, serif', fontSize:32, fontWeight:700, color:c.forest, margin:'5px 0 3px', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color: warn ? c.red : c.green, fontWeight:500 }}>{note}</div>
    </div>
  </div>
)

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    getDashboard().then(r => setData(r.data))
    const t = setInterval(() => getDashboard().then(r => setData(r.data)), 30_000)
    return () => clearInterval(t)
  }, [])

  if (!data) return <div style={{ ...s.page, color:c.text2 }}>Loading dashboard…</div>

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Dashboard</h1>
      <p style={s.sub}>Live overview · auto-refreshes every 30s</p>

      {data.lowStockCount > 0 && (
        <div style={{ background:'#fdf0ef', border:'1px solid #f5c6c2', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', gap:10 }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <div>
            <strong style={{ color:c.red, fontSize:13 }}>Low Stock — {data.lowStockCount} item(s) need refill</strong>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:5 }}>
              {data.lowStockAlerts.map((a,i) => (
                <span key={i} style={{ fontSize:11, background:'#fff', border:'1px solid #f5c6c2', color:c.red, padding:'2px 8px', borderRadius:20, fontWeight:500 }}>
                  {a.plantName} @ {a.locationName.split(' ')[0]} — {a.qty} left
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        <KPI label="Today Revenue"   value={`₹${data.todayRevenue?.toLocaleString('en-IN')}`}  note={`${data.todayOrders} orders`}        icon="💰" />
        <KPI label="Total Revenue"   value={`₹${data.totalRevenue?.toLocaleString('en-IN')}`}  note={`${data.totalOrders} total`}          icon="📈" />
        <KPI label="Locations"       value={data.activeLocations}                               note="Active offices"                       icon="🏢" />
        <KPI label="Total Stock"     value={data.totalStock}                                    note={data.lowStockCount > 0 ? `${data.lowStockCount} low` : 'Healthy'} icon="🌿" warn={data.lowStockCount > 0} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:18, marginBottom:18 }}>
        <div style={s.card}>
          <div style={s.chHead}>Revenue by Location</div>
          <div style={{ padding:'16px 20px' }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.revenueByLocation} margin={{ left:-10 }}>
                <XAxis dataKey="locationName" tick={{ fontSize:11 }} tickFormatter={v => v.split(' ')[0]} />
                <YAxis tick={{ fontSize:11 }} tickFormatter={v => `₹${v/1000}k`} />
                <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                <Bar dataKey="revenue" fill={c.sage} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.chHead}>Top Plants</div>
          <div style={{ padding:'8px 20px' }}>
            {data.topPlants?.map((p,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderTop: i?`1px solid ${c.border}`:'none' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{p.plantName}</div>
                  <div style={{ fontSize:11, color:c.text2 }}>₹{p.revenue?.toLocaleString('en-IN')}</div>
                </div>
                <span style={{ background:'#e6f4ea', color:c.green, fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20 }}>{p.sales} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.chHead}>Recent Orders</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Order ID','Plant','Location','Customer','Amount','Status','Date'].map(h=>(
            <th key={h} style={{ textAlign:'left', fontSize:10.5, letterSpacing:1, textTransform:'uppercase', color:c.text2, padding:'0 14px 10px', fontWeight:500 }}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {data.recentOrders?.map(o => (
              <tr key={o.orderId} style={{ borderTop:`1px solid ${c.border}` }}>
                <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:12, fontWeight:600 }}>{o.orderId}</td>
                <td style={{ padding:'10px 14px', fontSize:13 }}>🪴 {o.plantName}</td>
                <td style={{ padding:'10px 14px', fontSize:12, color:c.text2 }}>{o.locationName.split(' ')[0]}</td>
                <td style={{ padding:'10px 14px', fontSize:13 }}>{o.customerName||'—'}</td>
                <td style={{ padding:'10px 14px', fontWeight:600, color:c.earth }}>₹{o.amount}</td>
                <td style={{ padding:'10px 14px' }}><span style={{ background:o.status==='Completed'?'#e6f4ea':'#fef9e7', color:o.status==='Completed'?c.green:c.orange, fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:20 }}>{o.status}</span></td>
                <td style={{ padding:'10px 14px', fontSize:12, color:c.text2 }}>{format(new Date(o.createdAt),'dd MMM')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
