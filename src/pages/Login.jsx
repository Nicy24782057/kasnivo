import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '../services/supabase'
import logo from '../assets/kasnivo-logo.png'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()

    setMessage('')
    setIsError(false)

    if (!email.trim()) {
      setMessage('Email wajib diisi.')
      setIsError(true)
      return
    }

    if (!password) {
      setMessage('Password wajib diisi.')
      setIsError(true)
      return
    }

    try {
      setLoading(true)

      console.log('MENCOBA LOGIN KE SUPABASE...')

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        })

      console.log('HASIL LOGIN:', data)
      console.log('ERROR LOGIN:', error)

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error('User tidak ditemukan.')
      }

      if (!data.session) {
        throw new Error(
          'Login berhasil tetapi session tidak terbentuk.'
        )
      }

      console.log('LOGIN BERHASIL')
      console.log('USER:', data.user)

      navigate('/dashboard', {
        replace: true,
      })
    } catch (error) {
      console.error('LOGIN ERROR:', error)

      let errorMessage =
        error.message || 'Terjadi kesalahan saat login.'

      if (
        errorMessage
          .toLowerCase()
          .includes('invalid login credentials')
      ) {
        errorMessage =
          'Email atau password salah.'
      }

      if (
        errorMessage
          .toLowerCase()
          .includes('email not confirmed')
      ) {
        errorMessage =
          'Email belum dikonfirmasi. Silakan cek email kamu terlebih dahulu.'
      }

      setMessage(errorMessage)
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-emerald-50 flex items-center justify-center px-4 py-10">

      {/* BACKGROUND */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl" />

      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-slate-300/30 rounded-full blur-3xl" />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-white/40 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">

        {/* BRAND */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-white/80 backdrop-blur-sm shadow-lg ring-1 ring-slate-200 mb-5">

            <img
              src={logo}
              alt="Logo Kasnivo"
              className="w-16 h-16 object-contain"
            />

          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Selamat Datang di Kasnivo
          </h1>

          <p className="text-slate-600 mt-3 text-base">
            Kelola keuanganmu dengan lebih mudah, rapi, dan cerdas.
          </p>

        </div>

        {/* LOGIN CARD */}
        <div className="bg-white/85 backdrop-blur-md border border-white/60 rounded-[28px] p-6 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">

          {/* PESAN ERROR */}
          {message && (
            <div
              className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
                isError
                  ? 'bg-rose-50 border-rose-100 text-rose-600'
                  : 'bg-emerald-50 border-emerald-100 text-emerald-700'
              }`}
            >
              {message}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* EMAIL */}
            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="nama@email.com"
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white/80 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

            </div>

            {/* PASSWORD */}
            <div>

              <div className="flex items-center justify-between mb-2">

                <label className="text-sm font-semibold text-slate-700">
                  Password
                </label>

                <button
                  type="button"
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Lupa password?
                </button>

              </div>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Masukkan password"
                autoComplete="current-password"
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white/80 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition shadow-md shadow-emerald-500/20"
            >

              {loading
                ? 'Sedang masuk...'
                : 'Masuk'}

            </button>

          </form>

          {/* REGISTER */}
          <div className="mt-6 text-center text-sm text-slate-500">

            Belum punya akun?{' '}

            <Link
              to="/register"
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Daftar sekarang
            </Link>

          </div>

        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Kasnivo membantu pencatatan keuangan jadi lebih sederhana.
        </p>

      </div>

    </div>
  )
}

export default Login