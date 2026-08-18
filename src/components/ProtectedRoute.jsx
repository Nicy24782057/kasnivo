import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { supabase } from '../services/supabase'

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function checkSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (!active) {
        return
      }

      if (error) {
        console.error(
          'Gagal membaca session:',
          error
        )

        setSession(null)
      } else {
        setSession(session)
      }

      setLoading(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!active) {
          return
        }

        setSession(currentSession)
        setLoading(false)
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">

          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />

          <p className="text-sm text-slate-500 mt-4">
            Memeriksa sesi Kasnivo...
          </p>

        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  return children
}

export default ProtectedRoute