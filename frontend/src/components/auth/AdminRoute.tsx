import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { api, type User } from '@/lib/api'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await api.getCurrentUser()
        setUser(currentUser)
      } catch (err) {
        console.error('Admin authentication failed:', err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error || !user || !user.is_staff) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
