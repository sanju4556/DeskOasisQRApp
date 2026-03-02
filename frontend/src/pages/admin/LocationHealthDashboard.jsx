import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { getLocationHealthDashboard } from '../../api/client.js'
import { c, s, badge } from '../../utils/styles.js'
import toast from 'react-hot-toast'

const statusStyle = (status) => {
  if (status === 'Critical') return badge('red')
  if (status === 'DeadStock') return badge('orange')
  if (status === 'Low') return { ...badge(), background: '#fff8e1', color: '#8b6914' }
  return badge('green')
}

const cardAccent = (location) => {
  if (location.criticalCount > 0) return c.red
  if (location.deadStockCount > 0) return c.orange
  if (location.lowCount > 0) return '#8b6914'
  return c.green
}

const StatTile = ({ label, value, color }) => (
  <div style={{ ...s.card, padding: 14 }}>
    <div style={{ fontSize: 11, color: c.text2 }}>{label}</div>
    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color, fontWeight: 700 }}>{value}</div>
  </div>
)

export default function LocationHealthDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await getLocationHealthDashboard()
      setData(res.data)
    } catch {
      toast.error('Failed to load location health dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [])

  const sortedLocations = useMemo(() => {
    if (!data?.locations) return []
    return [...data.locations].sort((a, b) => {
      const score = (x) => (x.criticalCount * 1000) + (x.deadStockCount * 100) + (x.lowCount * 10)
      return score(b) - score(a)
    })
  }, [data])

  if (loading) return <div style={{ ...s.page, color: c.text2 }}>Loading location health dashboard...</div>
  if (!data) return <div style={{ ...s.page, color: c.text2 }}>No data available.</div>

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Location Health Dashboard</h1>
      <p style={s.sub}>Live location-wise plant status and movement visibility, auto-refresh every 30s</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 14 }}>
        <StatTile label="Locations" value={data.totalLocations} color={c.forest} />
        <StatTile label="Tracked Plants" value={data.totalPlants} color={c.forest} />
        <StatTile label="Healthy" value={data.healthyCount} color={c.green} />
        <StatTile label="Low (2 left)" value={data.lowCount} color="#8b6914" />
        <StatTile label="Critical (<=1)" value={data.criticalCount} color={c.red} />
        <StatTile label="Dead Stock (7d)" value={data.deadStockCount} color={c.orange} />
      </div>

      <div style={{ ...s.card, marginBottom: 14 }}>
        <div style={s.chHead}>Status Legend</div>
        <div style={{ ...s.chBody, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={badge('green')}>Healthy: more than 2 units and sales in last 7 days</span>
          <span style={{ ...badge(), background: '#fff8e1', color: '#8b6914' }}>Low: exactly 2 units left</span>
          <span style={badge('red')}>Critical: 1 or 0 units left</span>
          <span style={badge('orange')}>DeadStock: no sale in last 7 days</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 14 }}>
        {sortedLocations.map((location) => (
          <div key={location.locationId} style={{ ...s.card, borderTop: `4px solid ${cardAccent(location)}` }}>
            <div style={{ ...s.chHead, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{location.locationName}</div>
                <div style={{ fontSize: 11, color: c.text2, marginTop: 2 }}>
                  {location.totalPlants} plants, {location.totalUnits} units
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {location.criticalCount > 0 && <span style={badge('red')}>Critical {location.criticalCount}</span>}
                {location.deadStockCount > 0 && <span style={badge('orange')}>Dead {location.deadStockCount}</span>}
                {location.lowCount > 0 && <span style={{ ...badge(), background: '#fff8e1', color: '#8b6914' }}>Low {location.lowCount}</span>}
                {location.criticalCount === 0 && location.deadStockCount === 0 && location.lowCount === 0 && (
                  <span style={badge('green')}>All healthy</span>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Plant', 'Units', '7d Sales', 'Last Sale', 'Status'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: c.text2, padding: '12px 14px 8px', fontWeight: 500 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {location.plants.map((plant) => (
                    <tr key={plant.plantId} style={{ borderTop: `1px solid ${c.border}` }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>
                        {plant.plantName}
                        <div style={{ fontSize: 11, color: c.text2, marginTop: 2 }}>{plant.statusNote}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>{plant.quantityAvailable}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>{plant.soldLast7Days}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: c.text2 }}>
                        {plant.lastSoldAtUtc ? `${format(new Date(plant.lastSoldAtUtc), 'dd MMM')} (${plant.daysSinceLastSale}d ago)` : 'Never sold'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={statusStyle(plant.status)}>{plant.status}</span>
                      </td>
                    </tr>
                  ))}
                  {location.plants.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 14, color: c.text2 }}>No plants configured for this location.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
