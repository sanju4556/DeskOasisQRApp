import { useEffect, useState } from 'react'
import { getPlants, createPlant, updatePlant, togglePlant } from '../../api/client.js'
import { c, s, btn, badge } from '../../utils/styles.js'
import toast from 'react-hot-toast'

const blank = { name:'', category:'Indoor', basePrice:'', potType:'', maintenanceLevel:'Low', description:'', imageUrl:'' }

export default function Plants() {
  const [plants, setPlants] = useState([])
  const [modal,  setModal]  = useState(null) // null | 'new' | plant obj
  const [form,   setForm]   = useState(blank)

  useEffect(() => { getPlants(true).then(r => setPlants(r.data)) }, [])

  const openNew  = ()  => { setForm(blank); setModal('new') }
  const openEdit = (p) => { setForm({...p, basePrice: p.basePrice}); setModal(p) }

  const save = async () => {
    if (!form.name || !form.basePrice) { toast.error('Name and price required'); return }
    try {
      if (modal === 'new') {
        const r = await createPlant({ ...form, basePrice: +form.basePrice })
        setPlants(prev => [...prev, r.data])
        toast.success(`${r.data.name} added`)
      } else {
        const r = await updatePlant(form.plantId, { ...form, basePrice: +form.basePrice })
        setPlants(prev => prev.map(p => p.plantId === form.plantId ? r.data : p))
        toast.success('Updated')
      }
      setModal(null)
    } catch { toast.error('Save failed') }
  }

  const toggle = async (plant) => {
    await togglePlant(plant.plantId)
    setPlants(prev => prev.map(p => p.plantId === plant.plantId ? { ...p, isActive: !p.isActive } : p))
    toast.success(`${plant.isActive ? 'Deactivated' : 'Activated'}`)
  }

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Plant Catalog</h1>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <p style={{ fontSize:13, color:c.text2 }}>{plants.filter(p=>p.isActive).length} active · {plants.length} total</p>
        <button style={btn('primary')} onClick={openNew}>+ Add Plant</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {plants.map(p => (
          <div key={p.plantId} onClick={() => openEdit(p)}
            style={{ ...s.card, padding:18, cursor:'pointer', opacity: p.isActive ? 1 : .5, transition:'opacity .2s' }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🪴</div>
            <div style={{ fontWeight:600, fontSize:14, color:c.forest }}>{p.name}</div>
            <div style={{ fontSize:11.5, color:c.text2, margin:'2px 0 8px' }}>{p.category} · {p.potType || '—'}</div>
            <div style={{ fontFamily:'Playfair Display, serif', fontSize:22, color:c.earth, fontWeight:700 }}>₹{p.basePrice}</div>
            <div style={{ display:'flex', gap:5, marginTop:10 }}>
              <span style={badge(p.isActive ? 'green' : 'default')}>{p.isActive ? 'Active' : 'Inactive'}</span>
              <span style={badge('blue')}>{p.maintenanceLevel}</span>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={s.overlay} onClick={() => setModal(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily:'Playfair Display, serif', fontSize:21, color:c.forest, marginBottom:18 }}>
              {modal === 'new' ? 'Add Plant' : 'Edit Plant'}
            </h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['name','Plant Name *','text'],['basePrice','Price (₹) *','number'],['potType','Pot Type','text'],['imageUrl','Image URL','url']].map(([k,l,t]) => (
                <div key={k}>
                  <label style={s.label}>{l}</label>
                  <input type={t} value={form[k]||''} onChange={e => setForm({...form,[k]:e.target.value})} style={s.input} />
                </div>
              ))}
              <div>
                <label style={s.label}>Category</label>
                <select value={form.category} onChange={e => setForm({...form,category:e.target.value})} style={s.input}>
                  {['Indoor','Air Purifier','Desk Plant'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Maintenance</label>
                <select value={form.maintenanceLevel} onChange={e => setForm({...form,maintenanceLevel:e.target.value})} style={s.input}>
                  {['Low','Medium','High'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'span 2' }}>
                <label style={s.label}>Description</label>
                <textarea value={form.description||''} onChange={e => setForm({...form,description:e.target.value})}
                  rows={2} style={{ ...s.input, resize:'vertical' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:18 }}>
              {modal !== 'new' && (
                <button style={btn('danger')} onClick={() => { toggle(form); setModal(null) }}>
                  {form.isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
              <button style={btn()} onClick={() => setModal(null)}>Cancel</button>
              <button style={btn('primary')} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
