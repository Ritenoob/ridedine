import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home Chef Delivery - Admin',
  description: 'Admin dashboard for Home Chef Delivery marketplace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
