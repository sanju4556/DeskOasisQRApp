import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import AdminLayout  from './layouts/AdminLayout.jsx'
import LoginPage    from './pages/admin/LoginPage.jsx'
import Dashboard    from './pages/admin/Dashboard.jsx'
import Plants       from './pages/admin/Plants.jsx'
import Locations    from './pages/admin/Locations.jsx'
import Inventory    from './pages/admin/Inventory.jsx'
import QRManager    from './pages/admin/QRManager.jsx'
import Orders       from './pages/admin/Orders.jsx'
import Refill       from './pages/admin/Refill.jsx'
import BuyPage      from './pages/customer/BuyPage.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:18, color:'#1a3a2a' }}>🌿 Loading...</div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public — customer QR purchase page */}
          <Route path="/buy"   element={<BuyPage />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />

          {/* Admin (protected) */}
          <Route path="/" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
            <Route index              element={<Dashboard />} />
            <Route path="plants"      element={<Plants />} />
            <Route path="locations"   element={<Locations />} />
            <Route path="inventory"   element={<Inventory />} />
            <Route path="qr"          element={<QRManager />} />
            <Route path="orders"      element={<Orders />} />
            <Route path="refill"      element={<Refill />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
