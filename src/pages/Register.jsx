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

    setMessage('')
    setIsError(false)

    // =========================
    // VALIDASI NAMA
    // =========================
    if (!name.trim()) {
      setMessage('Nama wajib diisi.')
      setIsError(true)
      return
    }

    // =========================
    // VALIDASI EMAIL
    // =========================
    if (!email.trim()) {
      setMessage('Email wajib diisi.')
      setIsError(true)
      return
    }

    // =========================
    // VALIDASI PASSWORD
    // =========================
    if (password.length < 8) {
      setMessage('Password minimal 8 karakter.')
      setIsError(true)
      return
    }

    // =========================
    // KONFIRMASI PASSWORD
    // =========================
    if (password !== confirmPassword) {
      setMessage('Konfirmasi password tidak sama.')
      setIsError(true)
      return
    }

    try {
      setLoading(true)

      console.log('MENGIRIM REGISTER KE SUPABASE...')

      // =========================
      // REGISTER SUPABASE
      // =========================
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      })

      console.log('DATA REGISTER:', data)
      console.log('ERROR REGISTER:', error)

      // =========================
      // JIKA ADA ERROR
      // =========================
      if (error) {
        throw error
      }

      // =========================
      // CEK USER
      // =========================
      if (!data.user) {
        throw new Error(
          'Akun tidak berhasil dibuat. Silakan coba lagi.'
        )
      }

      console.log('USER BERHASIL DIBUAT:', data.user)
      console.log('SESSION REGISTER:', data.session)

      // =========================
      // JIKA SESSION LANGSUNG ADA
      // =========================
      if (data.session) {
        setMessage('Akun berhasil dibuat. Membuka dashboard...')
        setIsError(false)

        navigate('/dashboard', {
          replace: true,
        })

        return
      }

      // =========================
      // JIKA EMAIL CONFIRMATION AKTIF
      // =========================
      setMessage(
        'Akun berhasil dibuat. Silakan cek email untuk melakukan konfirmasi sebelum login.'
      )

      setIsError(false)

      // Kosongkan password setelah register
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('REGISTER ERROR:', error)

      let errorMessage =
        error.message ||
        'Terjadi kesalahan saat membuat akun.'

      // Pesan lebih mudah dipahami
      if (
        errorMessage
          .toLowerCase()
          .includes('user already registered')
      ) {
        errorMessage =
          'Email ini sudah terdaftar. Silakan login.'
      }

      if (
        errorMessage
          .toLowerCase()
          .includes('password')
      ) {
        errorMessage =
          error.message || 'Password tidak memenuhi ketentuan.'
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
        <div className="text-center mb-7">

          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white shadow-lg border border-slate-200 mb-4">

            <img
              src={logo}
              alt="Logo Kasnivo"
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

        {/* REGISTER CARD */}
        <div className="bg-white/90 backdrop-blur border border-white rounded-[28px] p-6 sm:p-8 shadow-xl shadow-slate-200/40">

          {/* PESAN */}
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

          {/* FORM */}
          <form
            onSubmit={handleRegister}
            className="space-y-4"
          >

            {/* NAMA */}
            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nama
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Nama lengkap"
                autoComplete="name"
                required
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white/80 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

            </div>

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
                required
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white/80 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

            </div>

            {/* PASSWORD */}
            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white/80 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

            </div>

            {/* KONFIRMASI PASSWORD */}
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
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white/80 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

            </div>

            {/* REGISTER BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl transition shadow-md shadow-emerald-500/20"
            >

              {loading
                ? 'Sedang membuat akun...'
                : 'Buat Akun'}

            </button>

          </form>

          {/* LOGIN LINK */}
          <div className="mt-6 text-center text-sm text-slate-500">

            Sudah punya akun?{' '}

            <Link
              to="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Masuk
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

export default Register