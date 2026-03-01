import { useEffect, useState } from 'react';
import { getPlants, getLocations, getQRImageUrl } from '../../api/client.js';
import QRCode from 'react-qr-code';
import toast from 'react-hot-toast';

const FRONTEND_BASE = window.location.origin;

export default function QRManager() {
  const [plants,    setPlants]    = useState([]);
  const [locations, setLocations] = useState([]);
  const [plantId,   setPlantId]   = useState('');
  const [locId,     setLocId]     = useState('');

  useEffect(() => {
    getPlants().then(r => {
      const activePlants = (r.data || []).filter(p => p.isActive);
      setPlants(activePlants);
      setPlantId(activePlants[0]?.plantId || '');
    });
    getLocations().then(r => {
      const activeLocations = (r.data || []).filter(l => l.status === 'Active');
      setLocations(activeLocations);
      setLocId(activeLocations[0]?.locationId || '');
    });
  }, []);

  const plant = plants.find(p => p.plantId == plantId);
  const loc   = locations.find(l => l.locationId == locId);
  const qrUrl = plantId && locId ? `${FRONTEND_BASE}/buy?plantId=${plantId}&locationId=${locId}` : '';

  const downloadQR = async () => {
    if (!plantId || !locId) return;
    try {
      const token = localStorage.getItem('dk_token');
      const res = await fetch(getQRImageUrl(plantId, locId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `QR_Plant${plantId}_Loc${locId}.png`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('QR Code downloaded!');
    } catch { toast.error('Download failed'); }
  };

  const copyUrl = () => { navigator.clipboard.writeText(qrUrl); toast.success('URL copied!'); };

  const s = {
    card: { background: '#fff', borderRadius: 14, border: '1px solid #d8e5dc', boxShadow: '0 2px 16px rgba(26,58,42,.08)', overflow: 'hidden' },
    ch: { padding: '16px 20px 12px', borderBottom: '1px solid #d8e5dc', fontWeight: 600, fontSize: 14.5, color: '#1a3a2a' },
    cb: { padding: 20 },
    label: { fontSize: 11.5, color: '#5a7060', fontWeight: 500, marginBottom: 4, display: 'block' },
    select: { border: '1.5px solid #d8e5dc', borderRadius: 8, padding: '8px 11px', fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit', color: '#1a3a2a' },
    btn: (variant) => ({
      display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
      cursor: 'pointer', border: variant === 'primary' ? 'none' : '1.5px solid #d8e5dc',
      background: variant === 'primary' ? '#1a3a2a' : 'transparent',
      color: variant === 'primary' ? '#fff' : '#1a3a2a', fontFamily: 'inherit'
    }),
  };

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, color: '#1a3a2a', fontWeight: 700 }}>QR Manager</h1>
        <p style={{ fontSize: 12, color: '#5a7060', marginTop: 2 }}>Generate QR codes for plant+location combinations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Generator */}
        <div style={s.card}>
          <div style={s.ch}>Generate QR Code</div>
          <div style={s.cb}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={s.label}>Plant</label>
                <select style={s.select} value={plantId} onChange={e => setPlantId(e.target.value)}>
                  {plants.map(p => <option key={p.plantId} value={p.plantId}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Location</label>
                <select style={s.select} value={locId} onChange={e => setLocId(e.target.value)}>
                  {locations.map(l => <option key={l.locationId} value={l.locationId}>{l.name}</option>)}
                </select>
              </div>
            </div>

            {qrUrl && (
              <>
                <div style={{ background: '#f4efe6', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#5a7060', marginBottom: 5 }}>Customer URL</div>
                  <code style={{ fontSize: 11, color: '#1a3a2a', background: '#fff', padding: '7px 10px', borderRadius: 6, display: 'block', border: '1px solid #d8e5dc', wordBreak: 'break-all' }}>
                    {qrUrl}
                  </code>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <button style={s.btn('primary')} onClick={downloadQR}>⬇ Download</button>
                  <button style={s.btn()} onClick={copyUrl}>📋 Copy URL</button>
                  <button style={s.btn()} onClick={() => window.open(qrUrl, '_blank')}>🔗 Preview</button>
                </div>
                {plant && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
                    <div style={{ background: '#f4efe6', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 11, color: '#5a7060' }}>Price</div>
                      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#8b6914', fontWeight: 700 }}>₹{plant.basePrice}</div>
                    </div>
                    <div style={{ background: '#e6f4ea', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 11, color: '#5a7060' }}>Maintenance</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#1a3a2a' }}>{plant.maintenanceLevel}</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Preview */}
        {plant && loc && qrUrl ? (
          <div style={{ background: '#1a3a2a', borderRadius: 16, padding: 28, color: '#fff', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>DeskOasis</div>
            <div style={{ fontSize: 26, marginBottom: 4 }}>🪴</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, marginBottom: 3 }}>{plant.name}</div>
            <div style={{ fontSize: 12, color: '#7ab893', marginBottom: 16 }}>{loc.name}</div>
            <div style={{ background: '#fff', borderRadius: 12, padding: 12, display: 'inline-flex' }}>
              <QRCode value={qrUrl} size={140} fgColor="#1a3a2a" />
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#7ab893', fontWeight: 700, marginTop: 14 }}>₹{plant.basePrice}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 8 }}>Scan to purchase</div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #d8e5dc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#5a7060' }}><span style={{ display: 'block', fontSize: 32, marginBottom: 8 }}>🔳</span>Select a plant and location</div>
          </div>
        )}
      </div>

      {/* All QR Combinations table */}
      <div style={{ ...s.card, marginTop: 20 }}>
        <div style={s.ch}>All QR Code Combinations</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['Plant','Location','QR URL','Actions'].map(h => (
                <th key={h} style={{ textAlign:'left', fontSize:10.5, letterSpacing:1, textTransform:'uppercase', color:'#5a7060', padding:'0 14px 10px', fontWeight:500 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {plants.flatMap(p => locations.map(l => {
                const url = `${FRONTEND_BASE}/buy?plantId=${p.plantId}&locationId=${l.locationId}`;
                return (
                  <tr key={`${p.plantId}-${l.locationId}`} style={{ borderTop: '1px solid #d8e5dc' }}>
                    <td style={{ padding: '11px 14px', fontSize: 13 }}><strong>{p.name}</strong></td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#5a7060' }}>{l.name.split(' ').slice(0,2).join(' ')}</td>
                    <td style={{ padding: '11px 14px' }}><code style={{ fontSize: 11, color: '#5a7060' }}>{url.replace(FRONTEND_BASE,'')}</code></td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => window.open(url,'_blank')} style={{ ...s.btn(), padding:'5px 10px', fontSize:11 }}>Preview</button>
                        <button onClick={() => { setPlantId(p.plantId); setLocId(l.locationId); window.scrollTo(0,0); }} style={{ ...s.btn(), padding:'5px 10px', fontSize:11 }}>Download</button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
