import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPlantInfo, createPaymentOrder, verifyPayment } from '../../api/client.js'
import toast from 'react-hot-toast'

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = RAZORPAY_SCRIPT
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function BuyPage() {
  const [params] = useSearchParams()
  const plantId = parseInt(params.get('plantId') || '0', 10)
  const locationId = parseInt(params.get('locationId') || '0', 10)

  const [plant, setPlant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const [custName, setCustName] = useState('')
  const [custEmail, setCustEmail] = useState('')

  useEffect(() => {
    if (!plantId || !locationId) {
      setError('Invalid QR code')
      setLoading(false)
      return
    }

    getPlantInfo(plantId, locationId)
      .then(r => setPlant(r.data))
      .catch(() => setError('Plant not found or location unavailable'))
      .finally(() => setLoading(false))

    loadRazorpay()
  }, [plantId, locationId])

  const completePayment = async ({ orderData, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    const { data } = await verifyPayment({
      orderId: orderData.orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    })

    if (data.success) {
      setSuccess({ orderId: data.orderId, paymentId: razorpayPaymentId })
      return
    }

    throw new Error(data.message || 'Payment verification failed')
  }

  const handlePay = async () => {
    if (!custName.trim()) {
      toast.error('Please enter your name')
      return
    }

    setPaying(true)
    try {
      const { data: orderData } = await createPaymentOrder({
        plantId,
        locationId,
        customerName: custName,
        customerEmail: custEmail
      })

      if (orderData.isMockMode) {
        await completePayment({
          orderData,
          razorpayOrderId: orderData.razorpayOrderId,
          razorpayPaymentId: `mock_payment_${Date.now()}`,
          razorpaySignature: 'mock_signature'
        })
        toast.success('Payment simulated successfully')
        setPaying(false)
        return
      }

      const rzpLoaded = await loadRazorpay()
      if (!rzpLoaded) throw new Error('Razorpay failed to load')

      const options = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount * 100,
        currency: orderData.currency,
        name: 'DeskOasis',
        description: `Purchase: ${plant.name}`,
        order_id: orderData.razorpayOrderId,
        prefill: { name: custName, email: custEmail },
        theme: { color: '#1a3a2a' },
        handler: async response => {
          try {
            await completePayment({
              orderData,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
          } catch (e) {
            toast.error(e.message || 'Payment verification failed')
          } finally {
            setPaying(false)
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false)
            toast('Payment cancelled')
          }
        }
      }

      new window.Razorpay(options).open()
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment failed')
      setPaying(false)
    }
  }

  const s = {
    wrap: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: "'DM Sans', sans-serif"
    },
    card: {
      background: '#fff',
      borderRadius: 20,
      padding: 28,
      maxWidth: 420,
      width: '100%',
      boxShadow: '0 24px 64px rgba(0,0,0,.3)'
    },
    title: { fontFamily: 'Playfair Display, serif', fontSize: 26, color: '#1a3a2a', fontWeight: 700, textAlign: 'center' },
    price: { fontFamily: 'Playfair Display, serif', fontSize: 40, color: '#8b6914', fontWeight: 700, textAlign: 'center', margin: '14px 0' },
    info: { background: '#f4efe6', borderRadius: 10, padding: 14, margin: '12px 0' },
    row: { display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' },
    btn: { width: '100%', padding: 14, background: '#1a3a2a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 10 },
    input: { border: '1.5px solid #d8e5dc', borderRadius: 8, padding: '8px 11px', fontSize: 13, width: '100%', marginTop: 4 },
    label: { fontSize: 11.5, color: '#5a7060', fontWeight: 500 }
  }

  if (loading) {
    return (
      <div style={s.wrap}>
        <div style={{ ...s.card, textAlign: 'center' }}>
          <div style={s.title}>Loading plant details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={s.wrap}>
        <div style={{ ...s.card, textAlign: 'center' }}>
          <div style={s.title}>Oops</div>
          <p style={{ color: '#5a7060', marginTop: 8 }}>{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={s.wrap}>
        <div style={{ ...s.card, textAlign: 'center' }}>
          <div style={s.title}>Payment Successful</div>
          <p style={{ color: '#5a7060', marginTop: 6, fontSize: 14 }}>Thank you, {custName}</p>
          <div style={s.info}>
            <div style={s.row}><span>Plant</span><strong>{plant.name}</strong></div>
            <div style={s.row}><span>Location</span><span>{plant.locationName}</span></div>
            <div style={s.row}><span>Amount Paid</span><strong style={{ color: '#27ae60' }}>Rs {plant.price}</strong></div>
            <div style={s.row}><span>Order ID</span><code style={{ fontSize: 11 }}>{success.orderId}</code></div>
            <div style={s.row}><span>Payment ID</span><code style={{ fontSize: 11 }}>{success.paymentId}</code></div>
          </div>
          <p style={{ fontSize: 14, color: '#27ae60', fontWeight: 600, marginTop: 12 }}>Please take your plant. Enjoy.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={s.title}>{plant.name}</div>
          <div style={{ fontSize: 12, color: '#5a7060', marginTop: 4 }}>{plant.locationName}</div>
        </div>

        <div style={s.price}>Rs {plant.price}</div>

        <div style={s.info}>
          {[
            ['Category', plant.category],
            ['Pot Type', plant.potType || '-'],
            ['Maintenance', plant.maintenanceLevel],
            ['Stock Available', plant.isAvailable ? `${plant.stockAvailable} units` : 'Out of stock']
          ].map(([k, v]) => (
            <div key={k} style={s.row}>
              <span style={{ color: '#5a7060' }}>{k}</span>
              <span style={{ fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {plant.description && <p style={{ fontSize: 13, color: '#5a7060', marginBottom: 12, lineHeight: 1.6 }}>{plant.description}</p>}

        {plant.isAvailable ? (
          <>
            <div style={{ marginBottom: 10 }}>
              <div style={s.label}>Your Name *</div>
              <input style={s.input} value={custName} onChange={e => setCustName(e.target.value)} placeholder="Enter your name" />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={s.label}>Email (optional)</div>
              <input style={s.input} value={custEmail} onChange={e => setCustEmail(e.target.value)} placeholder="you@email.com" type="email" />
            </div>
            <button style={{ ...s.btn, opacity: paying ? 0.6 : 1 }} onClick={handlePay} disabled={paying}>
              {paying ? 'Processing...' : `Pay Rs ${plant.price}`}
            </button>
            <p style={{ textAlign: 'center', fontSize: 11, color: '#888', marginTop: 10 }}>
              Razorpay secure checkout. In local dev, payment can run in mock mode.
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 16, background: '#fdf0ef', borderRadius: 10, color: '#c0392b', fontWeight: 600 }}>
            Out of stock. Please check again later.
          </div>
        )}
      </div>
    </div>
  )
}
