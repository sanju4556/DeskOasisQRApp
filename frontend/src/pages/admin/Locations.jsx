import { useEffect, useState } from 'react'
import { getLocations, createLocation, updateLocation } from '../../api/client.js'
import { c, s, btn, badge } from '../../utils/styles.js'
import toast from 'react-hot-toast'

const blank = { name:'', address:'', contactPerson:'', mobileNumber:'', status:'Active' }

export default function Locations() {
  const [locs,  setLocs]  = useState([])
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState(blank)

  useEffect(() => { getLocations().then(r => setLocs(r.data)) }, [])

  const save = async () => {
    if (!form.name) { toast.error('Name required'); return }
    try {
      if (modal === 'new') {
        const r = await createLocation(form)
        setLocs(prev => [...prev, r.data]); toast.success(`${r.data.name} added`)
      } else {
        const r = await updateLocation(form.locationId, form)
        setLocs(prev => prev.map(l => l.locationId === form.locationId ? r.data : l)); toast.success('Updated')
      }
      setModal(null)
    } catch { toast.error('Save failed') }
  }

  const toggleStatus = async (loc) => {
    const r = await updateLocation(loc.locationId, { ...loc, status: loc.status === 'Active' ? 'Inactive' : 'Active' })
    setLocs(prev => prev.map(l => l.locationId === loc.locationId ? r.data : l))
    toast.success('Status updated')
  }

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Locations</h1>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:18 }}>
        <button style={btn('primary')} onClick={() => { setForm(blank); setModal('new') }}>+ Add Location</button>
      </div>
      <div style={s.card}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>{['Location','Address','Contact','Mobile','Status','Actions'].map(h => (
            <th key={h} style={{ textAlign:'left', fontSize:10.5, letterSpacing:1, textTransform:'uppercase', color:c.text2, padding:'0 14px 10px', fontWeight:500 }}>{h}</th>
          ))}</tr></thead>
          <tbody>
            {locs.map(l => (
              <tr key={l.locationId} style={{ borderTop:`1px solid ${c.border}` }}>
                <td style={{ padding:'11px 14px', fontWeight:600, fontSize:13 }}>🏢 {l.name}</td>
                <td style={{ padding:'11px 14px', fontSize:12, color:c.text2, maxWidth:180 }}>{l.address}</td>
                <td style={{ padding:'11px 14px', fontSize:13 }}>{l.contactPerson||'—'}</td>
                <td style={{ padding:'11px 14px', fontFamily:'monospace', fontSize:12 }}>{l.mobileNumber||'—'}</td>
                <td style={{ padding:'11px 14px' }}><span style={badge(l.status==='Active'?'green':'default')}>{l.status}</span></td>
                <td style={{ padding:'11px 14px' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <button style={{ ...btn(), padding:'5px 10px', fontSize:11 }} onClick={() => { setForm({...l}); setModal('edit') }}>Edit</button>
                    <button style={{ ...btn(l.status==='Active'?'danger':''), padding:'5px 10px', fontSize:11 }} onClick={() => toggleStatus(l)}>
                      {l.status==='Active'?'Deactivate':'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily:'Playfair Display, serif', fontSize:21, color:c.forest, marginBottom:18 }}>
              {modal==='new' ? 'Add Location' : 'Edit Location'}
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div style={{ gridColumn:'span 2' }}>
                <label style={s.label}>Location Name *</label>
                <input value={form.name} onChange={e => setForm({...form,name:e.target.value})} style={s.input} />
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={s.label}>Address</label>
                <input value={form.address||''} onChange={e => setForm({...form,address:e.target.value})} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Contact Person</label>
                <input value={form.contactPerson||''} onChange={e => setForm({...form,contactPerson:e.target.value})} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Mobile Number</label>
                <input value={form.mobileNumber||''} onChange={e => setForm({...form,mobileNumber:e.target.value})} style={s.input} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:18 }}>
              <button style={btn()} onClick={() => setModal(null)}>Cancel</button>
              <button style={btn('primary')} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
