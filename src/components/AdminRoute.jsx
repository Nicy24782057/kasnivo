import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { supabase } from '../services/supabase'

function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    try {
      setLoading(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        setIsAdmin(false)
        return
      }

      const {
        data,
        error,
      } = await supabase.rpc(
        'is_admin'
      )

      if (error) {
        throw error
      }

      setIsAdmin(
        data === true
      )

    } catch (error) {
      console.error(
        'Gagal memeriksa admin:',
        error
      )

      setIsAdmin(false)

    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />

          <p className="text-sm text-slate-500 mt-4">
            Memeriksa akses admin...
          </p>

        </div>

      </div>
    )
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return children
}

export default AdminRoute