import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import toast from 'react-hot-toast'
import { c } from '../../utils/styles.js'

export default function LoginPage() {
  const [email,    setEmail]    = useState('admin@deskoasis.in')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const submit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      const apiMessage = err?.response?.data?.message
      if (apiMessage) {
        toast.error(apiMessage)
      } else {
        toast.error('Unable to reach API. Confirm backend is running on http://localhost:5000')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg,${c.forest} 0%,${c.moss} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans, sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:20, padding:36, width:380, boxShadow:'0 24px 64px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign:'center', marginBottom:26 }}>
          <div style={{ fontSize:48 }}>🌿</div>
          <h1 style={{ fontFamily:'Playfair Display, serif', fontSize:28, color:c.forest, fontWeight:700, marginTop:8 }}>DeskOasis</h1>
          <p style={{ fontSize:13, color:c.text2, marginTop:4 }}>Admin Panel</p>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:c.text2, fontWeight:500, display:'block', marginBottom:5 }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={{ border:`1.5px solid ${c.border}`, borderRadius:8, padding:'10px 12px', fontSize:13, width:'100%', outline:'none', fontFamily:'inherit' }} />
          </div>
          <div style={{ marginBottom:22 }}>
            <label style={{ fontSize:12, color:c.text2, fontWeight:500, display:'block', marginBottom:5 }}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              style={{ border:`1.5px solid ${c.border}`, borderRadius:8, padding:'10px 12px', fontSize:13, width:'100%', outline:'none', fontFamily:'inherit' }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:13, background:c.forest, color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?.7:1, fontFamily:'inherit' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
