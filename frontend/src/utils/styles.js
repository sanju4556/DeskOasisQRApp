export const c = {
  forest: '#1a3a2a', moss: '#2d5a3d', sage: '#4a7c59', mint: '#7ab893',
  cream: '#f5f0e8', warm: '#ece5d6', sand: '#d4c5a0', earth: '#8b6914',
  text: '#1a2e1f', text2: '#5a7060', border: '#d8e5dc',
  red: '#c0392b', orange: '#e67e22', green: '#27ae60', blue: '#1967d2'
}

export const s = {
  card:   { background: '#fff', borderRadius: 14, border: `1px solid ${c.border}`, boxShadow: '0 2px 16px rgba(26,58,42,.07)', overflow: 'hidden' },
  chHead: { padding: '15px 20px', borderBottom: `1px solid ${c.border}`, fontWeight: 600, fontSize: 14.5, color: c.forest },
  chBody: { padding: 20 },
  label:  { fontSize: 11.5, color: c.text2, fontWeight: 500, display: 'block', marginBottom: 4 },
  input:  { border: `1.5px solid ${c.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit', color: c.text },
  overlay:{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:  { background: '#fff', borderRadius: 16, padding: 26, width: '100%', maxWidth: 520, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.22)' },
  page:   { padding: 28 },
  h1:     { fontFamily: 'Playfair Display, serif', fontSize: 26, color: c.forest, fontWeight: 700 },
  sub:    { fontSize: 12.5, color: c.text2, marginTop: 3, marginBottom: 20 },
}

export const btn = (v = 'default') => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px',
  borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
  transition: 'opacity .15s',
  ...(v === 'primary' ? { background: c.forest, color: '#fff', border: 'none' } :
      v === 'danger'  ? { background: '#fdf0ef', color: c.red, border: `1px solid #f5c6c2` } :
                        { background: 'transparent', color: c.forest, border: `1.5px solid ${c.border}` })
})

export const badge = (v = 'green') => ({
  display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
  ...(v === 'green'  ? { background: '#e6f4ea', color: c.green } :
      v === 'red'    ? { background: '#fdf0ef', color: c.red } :
      v === 'orange' ? { background: '#fef9e7', color: c.orange } :
      v === 'blue'   ? { background: '#e8f0fe', color: c.blue } :
                       { background: c.warm, color: c.text2 })
})
