import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { supabase } from '../services/supabase'
import logo from '../assets/kasnivo-logo.png'

function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleRegister(event) {
    event.preventDefault()

    console.log('TOMBOL REGISTER DIKLIK')

    setMessage('')
    setIsError(false)

    if (!name.trim()) {
      setMessage('Nama wajib diisi.')
      setIsError(true)
      return
    }

    if (!email.trim()) {
      setMessage('Email wajib diisi.')
      setIsError(true)
      return
    }

    if (password.length < 8) {
      setMessage('Password minimal 8 karakter.')
      setIsError(true)
      return
    }

    if (password !== confirmPassword) {
      setMessage('Konfirmasi password tidak sama.')
      setIsError(true)
      return
    }

    try {
      setLoading(true)

      console.log('MENGIRIM DATA KE SUPABASE...')

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      })

      console.log('HASIL SUPABASE:', data)
      console.log('ERROR SUPABASE:', error)

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error('User tidak berhasil dibuat.')
      }

      setMessage('Akun berhasil dibuat.')
      setIsError(false)

      console.log('USER BERHASIL:', data.user)

      if (data.session) {
        navigate('/dashboard')
      } else {
        navigate('/login')
      }

    } catch (error) {
      console.error('REGISTER ERROR:', error)

      setMessage(
        error.message || 'Terjadi kesalahan saat membuat akun.'
      )

      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-emerald-50 flex items-center justify-center px-4 py-10">

      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-slate-300/30 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">

        <div className="text-center mb-7">

          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white shadow-lg border border-slate-200 mb-4">
            <img
              src={logo}
              alt="Kasnivo"
              className="w-16 h-16 object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Buat Akun Kasnivo
          </h1>

          <p className="text-slate-500 mt-2">
            Mulai catat dan kelola keuanganmu
          </p>

        </div>

        <div className="bg-white/90 backdrop-blur border border-white rounded-[28px] p-6 sm:p-8 shadow-xl shadow-slate-200/40">

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
            onSubmit={handleRegister}
            className="space-y-4"
          >

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nama
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama lengkap"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Konfirmasi Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Ulangi password"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-semibold py-3.5 rounded-2xl transition"
            >
              {loading
                ? 'Sedang membuat akun...'
                : 'Buat Akun'}
            </button>

          </form>

          <div className="mt-6 text-center text-sm text-slate-500">

            Sudah punya akun?{' '}

            <Link
              to="/login"
              className="font-semibold text-emerald-600"
            >
              Masuk
            </Link>

          </div>

        </div>

      </div>

    </div>
  )
}

export default Register