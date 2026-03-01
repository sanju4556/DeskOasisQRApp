import { useEffect, useMemo, useState } from 'react'
import { getStock, refillStock } from '../../api/client.js'
import { c, s, btn, badge } from '../../utils/styles.js'
import toast from 'react-hot-toast'

const blank = { locationId: '', plantId: '', quantityToAdd: 1, notes: '' }

export default function Refill() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(blank)
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try {
      const { data } = await getStock('low')
      setRows(data || [])
      if ((data || []).length > 0 && !form.locationId) {
        setForm(prev => ({
          ...prev,
          locationId: data[0].locationId,
          plantId: data[0].plantId
        }))
      }
    } catch {
      toast.error('Failed to load refill list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 15_000)
    return () => clearInterval(t)
  }, [])

  const selected = useMemo(
    () => rows.find(r => r.locationId === Number(form.locationId) && r.plantId === Number(form.plantId)),
    [rows, form.locationId, form.plantId]
  )

  const submit = async e => {
    e.preventDefault()
    if (!form.locationId || !form.plantId || Number(form.quantityToAdd) < 1) {
      toast.error('Select stock and add at least 1 unit')
      return
    }
    setSubmitting(true)
    try {
      await refillStock({
        locationId: Number(form.locationId),
        plantId: Number(form.plantId),
        quantityToAdd: Number(form.quantityToAdd),
        notes: form.notes.trim() || null
      })
      toast.success('Stock refilled successfully')
      setForm(prev => ({ ...prev, quantityToAdd: 1, notes: '' }))
      load()
    } catch {
      toast.error('Refill failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Refill</h1>
      <p style={s.sub}>Low stock queue with 15s auto-refresh</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 }}>
        <div style={s.card}>
          <div style={s.chHead}>Needs Refill</div>
          {loading ? (
            <div style={{ padding: 16, color: c.text2 }}>Loading...</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 16, color: c.green, fontWeight: 600 }}>All inventory looks healthy.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Location', 'Plant', 'Available', 'Threshold', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color: c.text2, padding: '0 14px 10px', fontWeight: 500 }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id} style={{ borderTop: `1px solid ${c.border}` }}>
                      <td style={{ padding: '11px 14px', fontSize: 12 }}>{row.locationName}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600 }}>{row.plantName}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12 }}>{row.quantityAvailable}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12 }}>{row.refillThreshold}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={badge(row.stockStatus === 'OutOfStock' ? 'red' : 'orange')}>{row.stockStatus}</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <button
                          style={{ ...btn(), padding: '5px 10px', fontSize: 11 }}
                          onClick={() => setForm(prev => ({ ...prev, locationId: row.locationId, plantId: row.plantId }))}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={s.card}>
          <div style={s.chHead}>Refill Form</div>
          <form onSubmit={submit} style={{ padding: 16 }}>
            <div style={{ marginBottom: 10 }}>
              <label style={s.label}>Location + Plant</label>
              <select
                style={s.input}
                value={selected ? `${selected.locationId}:${selected.plantId}` : ''}
                onChange={e => {
                  const [locationId, plantId] = e.target.value.split(':')
                  setForm(prev => ({ ...prev, locationId, plantId }))
                }}
              >
                <option value="" disabled>Select low-stock item</option>
                {rows.map(row => (
                  <option key={row.id} value={`${row.locationId}:${row.plantId}`}>
                    {row.locationName} - {row.plantName} ({row.quantityAvailable} left)
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={s.label}>Quantity To Add</label>
              <input
                type="number"
                min="1"
                value={form.quantityToAdd}
                onChange={e => setForm(prev => ({ ...prev, quantityToAdd: e.target.value }))}
                style={s.input}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Notes (optional)</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                style={{ ...s.input, resize: 'vertical' }}
                placeholder="Example: Refilled during evening maintenance round"
              />
            </div>

            {selected && (
              <div style={{ background: c.warm, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: c.text2 }}>Current Stock</div>
                <div style={{ fontSize: 14, color: c.forest, fontWeight: 600 }}>{selected.quantityAvailable} units</div>
              </div>
            )}

            <button type="submit" disabled={submitting} style={{ ...btn('primary'), width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Saving...' : 'Refill Stock'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
