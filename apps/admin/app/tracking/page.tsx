'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'accepted', label: 'Accepted by Chef' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready for Pickup' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'delivered', label: 'Delivered' },
]

function TrackingPageContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (token) {
      loadOrder()
      // Poll every 10 seconds
      const interval = setInterval(loadOrder, 10000)
      return () => clearInterval(interval)
    } else {
      setError('No tracking token provided')
      setLoading(false)
    }
  }, [token])

  const loadOrder = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('orders')
        .select(`
          *,
          chefs!inner (
            profiles!inner (
              name
            )
          )
        `)
        .eq('tracking_token', token)
        .single()

      if (queryError) throw queryError
      setOrder(data)
      setError('')
    } catch (err) {
      console.error('Error loading order:', err)
      setError('Order not found')
    } finally {
      setLoading(false)
    }
  }

  const getCurrentStepIndex = () => {
    if (!order) return -1
    return STATUS_STEPS.findIndex(step => step.key === order.status)
  }

  if (loading) {
    return (
      <div style={centerContainerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={spinnerStyle} />
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading order...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={centerContainerStyle}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#d32f2f', fontSize: '1.125rem' }}>{error}</p>
        </div>
      </div>
    )
  }

  const currentStepIndex = getCurrentStepIndex()

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Order Tracking</h1>
        <p style={subtitleStyle}>Token: {token}</p>
      </div>

      {order && (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
          <div style={infoCardStyle}>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Customer</span>
              <span style={valueStyle}>{order.customer_name}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Chef</span>
              <span style={valueStyle}>{order.chefs?.profiles?.name}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Total</span>
              <span style={valueStyle}>${(order.total_cents / 100).toFixed(2)}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Delivery Method</span>
              <span style={valueStyle}>{order.delivery_method}</span>
            </div>
          </div>

          <div style={timelineContainerStyle}>
            <h2 style={timelineTitleStyle}>Order Status</h2>
            {STATUS_STEPS.map((step, index) => (
              <div key={step.key} style={timelineItemStyle}>
                <div style={{
                  ...timelineDotStyle,
                  ...(index <= currentStepIndex ? timelineDotActiveStyle : {})
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{
                    ...timelineLabelStyle,
                    ...(index <= currentStepIndex ? timelineLabelActiveStyle : {})
                  }}>
                    {step.label}
                  </p>
                  {index === currentStepIndex && (
                    <p style={currentLabelStyle}>Current</p>
                  )}
                </div>
                {index < STATUS_STEPS.length - 1 && (
                  <div style={{
                    ...timelineLineStyle,
                    ...(index < currentStepIndex ? timelineLineActiveStyle : {})
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Styles
const centerContainerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f5f5f5',
}

const spinnerStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #1976d2',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto',
}

const headerStyle: React.CSSProperties = {
  background: '#1976d2',
  color: 'white',
  padding: '2rem',
  textAlign: 'center',
}

const titleStyle: React.CSSProperties = {
  margin: '0 0 0.5rem 0',
  fontSize: '2rem',
  fontWeight: 'bold',
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  opacity: 0.9,
}

const infoCardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '8px',
  padding: '1.5rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginBottom: '2rem',
}

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.75rem 0',
  borderBottom: '1px solid #eee',
}

const labelStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '0.875rem',
}

const valueStyle: React.CSSProperties = {
  fontWeight: '600',
}

const timelineContainerStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '8px',
  padding: '2rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
}

const timelineTitleStyle: React.CSSProperties = {
  margin: '0 0 2rem 0',
  fontSize: '1.5rem',
  fontWeight: 'bold',
}

const timelineItemStyle: React.CSSProperties = {
  position: 'relative',
  marginBottom: '2rem',
  display: 'flex',
  alignItems: 'flex-start',
}

const timelineDotStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  background: '#ddd',
  marginRight: '1rem',
  flexShrink: 0,
}

const timelineDotActiveStyle: React.CSSProperties = {
  background: '#1976d2',
}

const timelineLineStyle: React.CSSProperties = {
  position: 'absolute',
  left: '11px',
  top: '24px',
  width: '2px',
  height: '40px',
  background: '#ddd',
}

const timelineLineActiveStyle: React.CSSProperties = {
  background: '#1976d2',
}

const timelineLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#666',
}

const timelineLabelActiveStyle: React.CSSProperties = {
  color: '#000',
  fontWeight: '600',
}

const currentLabelStyle: React.CSSProperties = {
  margin: '0.25rem 0 0 0',
  color: '#1976d2',
  fontSize: '0.875rem',
  fontWeight: '600',
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div style={centerContainerStyle}>
      <div style={{ textAlign: 'center' }}>
        <div style={spinnerStyle} />
        <p style={{ marginTop: '1rem', color: '#666' }}>Loading...</p>
      </div>
    </div>}>
      <TrackingPageContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'
