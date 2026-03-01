import { useEffect, useMemo, useState } from 'react'
import { getStock, getPlants, getLocations, upsertStock } from '../../api/client.js'
import { c, s, btn, badge } from '../../utils/styles.js'
import toast from 'react-hot-toast'

const blank = { locationId: '', plantId: '', quantityAvailable: 0, refillThreshold: 3 }

export default function Inventory() {
  const [rows, setRows] = useState([])
  const [plants, setPlants] = useState([])
  const [locations, setLocations] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(blank)

  const load = async (activeFilter = filter) => {
    try {
      const [stockRes, plantRes, locationRes] = await Promise.all([
        getStock(activeFilter === 'all' ? undefined : activeFilter),
        getPlants(true),
        getLocations()
      ])
      setRows(stockRes.data || [])
      setPlants((plantRes.data || []).filter(p => p.isActive))
      setLocations((locationRes.data || []).filter(l => l.status === 'Active'))
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(filter)
    const t = setInterval(() => load(filter), 20_000)
    return () => clearInterval(t)
  }, [filter])

  const openNew = () => {
    setForm({
      ...blank,
      plantId: plants[0]?.plantId ?? '',
      locationId: locations[0]?.locationId ?? ''
    })
    setModal(true)
  }

  const openEdit = row => {
    setForm({
      locationId: row.locationId,
      plantId: row.plantId,
      quantityAvailable: row.quantityAvailable,
      refillThreshold: row.refillThreshold
    })
    setModal(true)
  }

  const save = async () => {
    if (!form.locationId || !form.plantId) {
      toast.error('Plant and location are required')
      return
    }
    if (form.quantityAvailable < 0 || form.refillThreshold < 1) {
      toast.error('Quantity must be >= 0 and threshold must be >= 1')
      return
    }
    try {
      await upsertStock({
        locationId: Number(form.locationId),
        plantId: Number(form.plantId),
        quantityAvailable: Number(form.quantityAvailable),
        refillThreshold: Number(form.refillThreshold)
      })
      toast.success('Inventory saved')
      setModal(false)
      load(filter)
    } catch {
      toast.error('Failed to save inventory')
    }
  }

  const totals = useMemo(() => {
    const total = rows.reduce((sum, r) => sum + (r.quantityAvailable || 0), 0)
    const low = rows.filter(r => r.stockStatus === 'Low').length
    const out = rows.filter(r => r.stockStatus === 'OutOfStock').length
    return { total, low, out }
  }, [rows])

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Inventory</h1>
      <p style={s.sub}>Live stock view with 20s auto-refresh</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
        <div style={{ ...s.card, padding: 14 }}>
          <div style={{ fontSize: 11, color: c.text2 }}>Total Units</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: c.forest, fontWeight: 700 }}>{totals.total}</div>
        </div>
        <div style={{ ...s.card, padding: 14 }}>
          <div style={{ fontSize: 11, color: c.text2 }}>Low Stock Items</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: c.orange, fontWeight: 700 }}>{totals.low}</div>
        </div>
        <div style={{ ...s.card, padding: 14 }}>
          <div style={{ fontSize: 11, color: c.text2 }}>Out of Stock Items</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: c.red, fontWeight: 700 }}>{totals.out}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'low', 'out'].map(v => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              style={v === filter ? btn('primary') : btn()}
            >
              {v === 'all' ? 'All' : v === 'low' ? 'Low' : 'Out'}
            </button>
          ))}
        </div>
        <button style={btn('primary')} onClick={openNew}>+ Add / Set Stock</button>
      </div>

      <div style={s.card}>
        {loading ? (
          <div style={{ padding: 18, color: c.text2 }}>Loading inventory...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Location', 'Plant', 'Available', 'Threshold', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: c.text2, padding: '0 14px 10px', fontWeight: 500 }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} style={{ borderTop: `1px solid ${c.border}` }}>
                    <td style={{ padding: '11px 14px', fontSize: 13 }}>{row.locationName}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600 }}>{row.plantName}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13 }}>{row.quantityAvailable}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13 }}>{row.refillThreshold}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={badge(row.stockStatus === 'InStock' ? 'green' : row.stockStatus === 'Low' ? 'orange' : 'red')}>
                        {row.stockStatus}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <button style={{ ...btn(), padding: '5px 10px', fontSize: 11 }} onClick={() => openEdit(row)}>Edit</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 16, color: c.text2 }}>No stock rows found for this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div style={s.overlay} onClick={() => setModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 21, color: c.forest, marginBottom: 18 }}>Upsert Inventory</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={s.label}>Location</label>
                <select value={form.locationId} onChange={e => setForm({ ...form, locationId: e.target.value })} style={s.input}>
                  {locations.map(l => <option key={l.locationId} value={l.locationId}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Plant</label>
                <select value={form.plantId} onChange={e => setForm({ ...form, plantId: e.target.value })} style={s.input}>
                  {plants.map(p => <option key={p.plantId} value={p.plantId}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Quantity Available</label>
                <input type="number" min="0" value={form.quantityAvailable} onChange={e => setForm({ ...form, quantityAvailable: e.target.value })} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Refill Threshold</label>
                <input type="number" min="1" value={form.refillThreshold} onChange={e => setForm({ ...form, refillThreshold: e.target.value })} style={s.input} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
              <button style={btn()} onClick={() => setModal(false)}>Cancel</button>
              <button style={btn('primary')} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
