'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

interface Order {
  id: string
  tracking_token: string
  customer_name: string
  customer_email: string
  status: string
  total_cents: number
  created_at: string
  chefs?: {
    profiles?: {
      name: string
    }
  }
}

const STATUS_OPTIONS = [
  'placed',
  'accepted',
  'preparing',
  'ready',
  'picked_up',
  'delivered',
  'cancelled',
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          chefs!inner (
            profiles!inner (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      
      // Reload orders
      loadOrders()
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order status')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <nav style={{ 
        background: 'white', 
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <Link href="/dashboard" style={{ color: '#1976d2', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </nav>

      <div style={{ padding: '0 2rem 2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Orders Management</h1>

        {orders.length === 0 ? (
          <div style={{ 
            background: 'white',
            padding: '3rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#666' }}>No orders yet</p>
          </div>
        ) : (
          <div style={{ 
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={cellStyle}>Tracking Token</th>
                  <th style={cellStyle}>Customer</th>
                  <th style={cellStyle}>Chef</th>
                  <th style={cellStyle}>Total</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Created</th>
                  <th style={cellStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={cellStyle}>
                      <code style={{ 
                        fontSize: '0.875rem',
                        background: '#f5f5f5',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        {order.tracking_token}
                      </code>
                    </td>
                    <td style={cellStyle}>
                      <div>{order.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {order.customer_email}
                      </div>
                    </td>
                    <td style={cellStyle}>
                      {order.chefs?.profiles?.name || 'N/A'}
                    </td>
                    <td style={cellStyle}>
                      ${(order.total_cents / 100).toFixed(2)}
                    </td>
                    <td style={cellStyle}>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          background: getStatusColor(order.status),
                          cursor: 'pointer'
                        }}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={cellStyle}>
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td style={cellStyle}>
                      <a
                        href={`/tracking?token=${order.tracking_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#1976d2',
                          textDecoration: 'none',
                          fontSize: '0.875rem'
                        }}
                      >
                        View Tracking
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const cellStyle: React.CSSProperties = {
  padding: '1rem',
  textAlign: 'left',
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    placed: '#e3f2fd',
    accepted: '#e8f5e9',
    preparing: '#fff3e0',
    ready: '#f3e5f5',
    picked_up: '#e0f2f1',
    delivered: '#c8e6c9',
    cancelled: '#ffebee',
  }
  return colors[status] || '#f5f5f5'
}

export const dynamic = 'force-dynamic'