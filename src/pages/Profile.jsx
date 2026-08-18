import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

function Profile() {
  const [userId, setUserId] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const [newPassword, setNewPassword] =
    useState('')

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState('')

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] =
    useState(false)

  const [savingPassword, setSavingPassword] =
    useState(false)

  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
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
        throw new Error(
          'User tidak ditemukan.'
        )
      }

      setUserId(user.id)
      setEmail(user.email || '')

      const {
        data,
        error,
      } = await supabase
        .from('profiles')
        .select(
          'full_name, email, created_at'
        )
        .eq('id', user.id)
        .single()

      if (error) {
        throw error
      }

      setName(
        data?.full_name || ''
      )

    } catch (error) {
      console.error(error)

      setMessage(
        error.message ||
          'Gagal mengambil profil.'
      )

      setIsError(true)

    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile(
    event
  ) {
    event.preventDefault()

    setMessage('')
    setIsError(false)

    if (!name.trim()) {
      setMessage(
        'Nama tidak boleh kosong.'
      )

      setIsError(true)
      return
    }

    try {
      setSavingProfile(true)

      const { error } =
        await supabase
          .from('profiles')
          .update({
            full_name:
              name.trim(),

            updated_at:
              new Date().toISOString(),
          })
          .eq('id', userId)

      if (error) {
        throw error
      }

      setMessage(
        'Profil berhasil diperbarui.'
      )

      setIsError(false)

    } catch (error) {
      console.error(error)

      setMessage(
        error.message ||
          'Profil gagal diperbarui.'
      )

      setIsError(true)

    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(
    event
  ) {
    event.preventDefault()

    setMessage('')
    setIsError(false)

    if (
      newPassword.length <
      8
    ) {
      setMessage(
        'Password baru minimal 8 karakter.'
      )

      setIsError(true)
      return
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      setMessage(
        'Konfirmasi password tidak sama.'
      )

      setIsError(true)
      return
    }

    try {
      setSavingPassword(true)

      const { error } =
        await supabase.auth.updateUser({
          password:
            newPassword,
        })

      if (error) {
        throw error
      }

      setNewPassword('')
      setConfirmNewPassword('')

      setMessage(
        'Password berhasil diperbarui.'
      )

      setIsError(false)

    } catch (error) {
      console.error(error)

      setMessage(
        error.message ||
          'Password gagal diperbarui.'
      )

      setIsError(true)

    } finally {
      setSavingPassword(false)
    }
  }

  function getInitial() {
    if (name.trim()) {
      return name
        .trim()
        .charAt(0)
        .toUpperCase()
    }

    if (email) {
      return email
        .charAt(0)
        .toUpperCase()
    }

    return 'U'
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">

        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />

      </div>
    )
  }

  return (
    <div>

      {/* HEADER */}

      <div className="mb-7">

        <p className="text-sm font-semibold text-emerald-600">
          Pengaturan Akun
        </p>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Profil
        </h1>

        <p className="text-slate-500 mt-2">
          Kelola informasi akun Kasnivo.
        </p>

      </div>


      {/* MESSAGE */}

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-2xl border text-sm ${
            isError
              ? 'bg-rose-50 border-rose-100 text-rose-600'
              : 'bg-emerald-50 border-emerald-100 text-emerald-700'
          }`}
        >
          {message}
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* PROFILE CARD */}

        <div className="bg-white border border-slate-200 rounded-[28px] p-6 h-fit">

          <div className="w-24 h-24 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold mx-auto">
            {getInitial()}
          </div>

          <div className="text-center mt-5">

            <h2 className="text-lg font-bold text-slate-900">
              {name ||
                'Pengguna Kasnivo'}
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              {email}
            </p>

          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">

            <p className="text-xs text-slate-400">
              ID Akun
            </p>

            <p className="text-xs font-mono text-slate-500 mt-2 break-all">
              {userId}
            </p>

          </div>

        </div>


        {/* RIGHT */}

        <div className="lg:col-span-2 space-y-6">

          {/* PERSONAL */}

          <form
            onSubmit={
              handleSaveProfile
            }
            className="bg-white border border-slate-200 rounded-[28px] p-6"
          >

            <h2 className="font-bold text-slate-900">
              Informasi Pribadi
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Informasi dasar akunmu.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nama
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full border border-slate-200 bg-slate-50 text-slate-400 rounded-2xl px-4 py-3 cursor-not-allowed"
                />

                <p className="text-xs text-slate-400 mt-2">
                  Email belum dapat diubah dari halaman ini.
                </p>

              </div>

            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="mt-6 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-5 py-3 rounded-2xl font-semibold"
            >
              {savingProfile
                ? 'Menyimpan...'
                : 'Simpan Profil'}
            </button>

          </form>


          {/* PASSWORD */}

          <form
            onSubmit={
              handleChangePassword
            }
            className="bg-white border border-slate-200 rounded-[28px] p-6"
          >

            <h2 className="font-bold text-slate-900">
              Keamanan
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Ubah password akun Kasnivo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password Baru
                </label>

                <input
                  type="password"
                  value={
                    newPassword
                  }
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
                />

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Konfirmasi Password
                </label>

                <input
                  type="password"
                  value={
                    confirmNewPassword
                  }
                  onChange={(event) =>
                    setConfirmNewPassword(
                      event.target.value
                    )
                  }
                  placeholder="Ulangi password baru"
                  autoComplete="new-password"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
                />

              </div>

            </div>

            <button
              type="submit"
              disabled={
                savingPassword ||
                !newPassword
              }
              className="mt-6 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-5 py-3 rounded-2xl font-semibold"
            >
              {savingPassword
                ? 'Memperbarui...'
                : 'Ubah Password'}
            </button>

          </form>

        </div>

      </div>

    </div>
  )
}

export default Profile