import {
  useEffect,
  useState,
} from 'react'

import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router'

import { supabase } from '../services/supabase'
import logo from '../assets/kasnivo-logo.png'

function AppLayout() {
  const navigate = useNavigate()

  const [profile, setProfile] =
    useState(null)

  const [email, setEmail] =
    useState('')

  const [isAdmin, setIsAdmin] =
    useState(false)

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        return
      }

      setEmail(
        user.email || ''
      )

      const [
        profileResult,
        adminResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'full_name, email'
          )
          .eq('id', user.id)
          .single(),

        supabase.rpc(
          'is_admin'
        ),
      ])

      if (profileResult.error) {
        throw profileResult.error
      }

      setProfile(
        profileResult.data
      )

      if (!adminResult.error) {
        setIsAdmin(
          adminResult.data === true
        )
      }

    } catch (error) {
      console.error(
        'Gagal mengambil user:',
        error
      )
    }
  }

  async function handleLogout() {
    const confirmation =
      window.confirm(
        'Keluar dari akun Kasnivo?'
      )

    if (!confirmation) {
      return
    }

    try {
      setLoggingOut(true)

      const { error } =
        await supabase.auth.signOut({
          scope: 'local',
        })

      if (error) {
        throw error
      }

      navigate(
        '/login',
        {
          replace: true,
        }
      )

    } catch (error) {
      console.error(error)

      alert(
        'Gagal keluar dari akun.'
      )

    } finally {
      setLoggingOut(false)
    }
  }

  function getInitial() {
    const name =
      profile?.full_name?.trim()

    if (name) {
      return name
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

  const menuClass =
    ({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
        isActive
          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`

  const mobileMenuClass =
    ({ isActive }) =>
      `flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
        isActive
          ? 'text-emerald-600'
          : 'text-slate-400'
      }`

  return (
    <div className="min-h-screen bg-slate-50">

      {/* SIDEBAR */}

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col z-40">

        <div className="p-6">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">

              <img
                src={logo}
                alt="Kasnivo"
                className="w-8 h-8 object-contain"
              />

            </div>

            <div>

              <h1 className="text-xl font-bold text-slate-900">
                Kasnivo
              </h1>

              <p className="text-xs text-slate-400">
                Personal Finance
              </p>

            </div>

          </div>

        </div>


        {/* MENU */}

        <nav className="px-4 space-y-2">

          <NavLink
            to="/dashboard"
            className={menuClass}
          >
            <span className="text-lg">
              ⌂
            </span>

            Dashboard
          </NavLink>


          <NavLink
            to="/accounts"
            className={menuClass}
          >
            <span className="text-lg">
              ▣
            </span>

            Akun
          </NavLink>


          <NavLink
            to="/transactions"
            className={menuClass}
          >
            <span className="text-lg">
              ↕
            </span>

            Transaksi
          </NavLink>


          <NavLink
            to="/reports"
            className={menuClass}
          >
            <span className="text-lg">
              ▥
            </span>

            Laporan
          </NavLink>


          <NavLink
            to="/profile"
            className={menuClass}
          >
            <span className="text-lg">
              ○
            </span>

            Profil
          </NavLink>


          {/* ADMIN */}

          {isAdmin && (
            <>

              <div className="pt-3 pb-1 px-4">

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Administrator
                </p>

              </div>

              <NavLink
                to="/admin"
                className={menuClass}
              >

                <span className="text-lg">
                  ◈
                </span>

                Admin

              </NavLink>

            </>
          )}

        </nav>


        {/* USER */}

        <div className="mt-auto p-4">

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-3">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                {getInitial()}
              </div>

              <div className="min-w-0">

                <p className="text-sm font-semibold text-slate-800 truncate">
                  {profile?.full_name ||
                    'Pengguna Kasnivo'}
                </p>

                <p className="text-xs text-slate-400 truncate">
                  {email}
                </p>

                {isAdmin && (
                  <span className="inline-flex mt-2 px-2 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-white">
                    ADMIN
                  </span>
                )}

              </div>

            </div>

          </div>


          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-500 py-3 rounded-2xl text-sm font-semibold"
          >

            {loggingOut
              ? 'Keluar...'
              : 'Keluar'}

          </button>

        </div>

      </aside>


      {/* MAIN */}

      <div className="lg:ml-64 min-h-screen">

        <header className="sticky top-0 z-30 bg-slate-50/85 backdrop-blur-xl border-b border-slate-200/70">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

            <div className="flex lg:hidden items-center gap-3">

              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center">

                <img
                  src={logo}
                  alt="Kasnivo"
                  className="w-6 h-6 object-contain"
                />

              </div>

              <div>

                <p className="font-bold text-slate-900">
                  Kasnivo
                </p>

                <p className="text-[10px] text-slate-400">
                  Personal Finance
                </p>

              </div>

            </div>


            <div className="hidden lg:block">

              <p className="text-sm text-slate-400">
                Kelola keuangan pribadi
              </p>

            </div>


            <NavLink
              to="/profile"
              className="flex items-center gap-3"
            >

              <div className="hidden sm:block text-right">

                <p className="text-sm font-semibold text-slate-700">
                  {profile?.full_name ||
                    'Pengguna'}
                </p>

                <p className="text-xs text-slate-400">
                  {isAdmin
                    ? 'Administrator'
                    : 'Akun Kasnivo'}
                </p>

              </div>

              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold">
                {getInitial()}
              </div>

            </NavLink>

          </div>

        </header>


        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8">

          <Outlet />

        </main>

      </div>


      {/* MOBILE NAV */}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200">

        <div className="grid grid-cols-5 h-20 px-2">

          <NavLink
            to="/dashboard"
            className={mobileMenuClass}
          >

            <span className="text-xl">
              ⌂
            </span>

            Home

          </NavLink>


          <NavLink
            to="/accounts"
            className={mobileMenuClass}
          >

            <span className="text-xl">
              ▣
            </span>

            Akun

          </NavLink>


          <NavLink
            to="/transactions"
            className={mobileMenuClass}
          >

            <span className="text-xl">
              ↕
            </span>

            Transaksi

          </NavLink>


          <NavLink
            to="/reports"
            className={mobileMenuClass}
          >

            <span className="text-xl">
              ▥
            </span>

            Laporan

          </NavLink>


          <NavLink
            to={
              isAdmin
                ? '/admin'
                : '/profile'
            }
            className={mobileMenuClass}
          >

            <span className="text-xl">
              {isAdmin
                ? '◈'
                : '○'}
            </span>

            {isAdmin
              ? 'Admin'
              : 'Profil'}

          </NavLink>

        </div>

      </nav>

    </div>
  )
}

export default AppLayout