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

// ==============================
// NAVIGATION ICONS
// ==============================

import dashboardIcon from '../assets/icons/navigations/dashboard.png'
import accountsIcon from '../assets/icons/navigations/accounts.png'
import transactionsIcon from '../assets/icons/navigations/transactions.png'
import reportsIcon from '../assets/icons/navigations/reports.png'
import profileIcon from '../assets/icons/navigations/profile.png'
import adminIcon from '../assets/icons/navigations/admin.png'
import logoutIcon from '../assets/icons/navigations/logout.png'

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
      `group flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
        isActive
          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`

  const mobileMenuClass =
    ({ isActive }) =>
      `group flex flex-col items-center justify-center gap-1.5 text-[11px] font-medium transition ${
        isActive
          ? 'text-emerald-600'
          : 'text-slate-400'
      }`

  function NavigationIcon({
    src,
    alt,
    mobile = false,
  }) {
    return (
      <div
        className={
          mobile
            ? 'w-6 h-6 flex items-center justify-center'
            : 'w-6 h-6 flex items-center justify-center shrink-0'
        }
      >
        <img
          src={src}
          alt={alt}
          className={
            mobile
              ? 'w-5 h-5 object-contain'
              : 'w-5 h-5 object-contain'
          }
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ========================= */}
      {/* SIDEBAR DESKTOP */}
      {/* ========================= */}

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col z-40">

        {/* BRAND */}
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


        {/* ========================= */}
        {/* MENU */}
        {/* ========================= */}

        <nav className="px-4 space-y-2">

          {/* DASHBOARD */}
          <NavLink
            to="/dashboard"
            className={menuClass}
          >

            <NavigationIcon
              src={dashboardIcon}
              alt="Dashboard"
            />

            <span>
              Dashboard
            </span>

          </NavLink>


          {/* AKUN */}
          <NavLink
            to="/accounts"
            className={menuClass}
          >

            <NavigationIcon
              src={accountsIcon}
              alt="Akun"
            />

            <span>
              Akun
            </span>

          </NavLink>


          {/* TRANSAKSI */}
          <NavLink
            to="/transactions"
            className={menuClass}
          >

            <NavigationIcon
              src={transactionsIcon}
              alt="Transaksi"
            />

            <span>
              Transaksi
            </span>

          </NavLink>


          {/* LAPORAN */}
          <NavLink
            to="/reports"
            className={menuClass}
          >

            <NavigationIcon
              src={reportsIcon}
              alt="Laporan"
            />

            <span>
              Laporan
            </span>

          </NavLink>


          {/* PROFIL */}
          <NavLink
            to="/profile"
            className={menuClass}
          >

            <NavigationIcon
              src={profileIcon}
              alt="Profil"
            />

            <span>
              Profil
            </span>

          </NavLink>


          {/* ========================= */}
          {/* ADMIN */}
          {/* ========================= */}

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

                <NavigationIcon
                  src={adminIcon}
                  alt="Admin"
                />

                <span>
                  Admin
                </span>

              </NavLink>

            </>
          )}

        </nav>


        {/* ========================= */}
        {/* USER AREA */}
        {/* ========================= */}

        <div className="mt-auto p-4">

          <NavLink
            to="/profile"
            className="block"
          >

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-3 hover:bg-slate-100 transition">

              <div className="flex items-center gap-3">

                {/* NANTI FOTO PROFIL MASUK DI SINI */}
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">

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

          </NavLink>


          {/* LOGOUT */}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 border border-rose-100 bg-rose-50 hover:bg-rose-100 disabled:opacity-60 text-rose-500 py-3 rounded-2xl text-sm font-semibold transition"
          >

            <img
              src={logoutIcon}
              alt="Keluar"
              className="w-5 h-5 object-contain"
            />

            <span>
              {loggingOut
                ? 'Keluar...'
                : 'Keluar'}
            </span>

          </button>

        </div>

      </aside>


      {/* ========================= */}
      {/* MAIN CONTENT */}
      {/* ========================= */}

      <div className="lg:ml-64 min-h-screen">


        {/* ========================= */}
        {/* HEADER */}
        {/* ========================= */}

        <header className="sticky top-0 z-30 bg-slate-50/85 backdrop-blur-xl border-b border-slate-200/70">

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

            {/* MOBILE BRAND */}

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


            {/* DESKTOP DESCRIPTION */}

            <div className="hidden lg:block">

              <p className="text-sm text-slate-400">
                Kelola keuangan pribadi
              </p>

            </div>


            {/* USER HEADER */}

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

              {/* NANTI FOTO PROFIL JUGA MASUK DI SINI */}

              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold">

                {getInitial()}

              </div>

            </NavLink>

          </div>

        </header>


        {/* PAGE CONTENT */}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-8">

          <Outlet />

        </main>

      </div>


      {/* ========================= */}
      {/* MOBILE BOTTOM NAV */}
      {/* ========================= */}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200">

        <div className="grid grid-cols-5 h-20 px-2">

          {/* HOME */}

          <NavLink
            to="/dashboard"
            className={mobileMenuClass}
          >

            <NavigationIcon
              src={dashboardIcon}
              alt="Dashboard"
              mobile
            />

            <span>
              Home
            </span>

          </NavLink>


          {/* AKUN */}

          <NavLink
            to="/accounts"
            className={mobileMenuClass}
          >

            <NavigationIcon
              src={accountsIcon}
              alt="Akun"
              mobile
            />

            <span>
              Akun
            </span>

          </NavLink>


          {/* TRANSAKSI */}

          <NavLink
            to="/transactions"
            className={mobileMenuClass}
          >

            <NavigationIcon
              src={transactionsIcon}
              alt="Transaksi"
              mobile
            />

            <span>
              Transaksi
            </span>

          </NavLink>


          {/* LAPORAN */}

          <NavLink
            to="/reports"
            className={mobileMenuClass}
          >

            <NavigationIcon
              src={reportsIcon}
              alt="Laporan"
              mobile
            />

            <span>
              Laporan
            </span>

          </NavLink>


          {/* ADMIN / PROFIL */}

          <NavLink
            to={
              isAdmin
                ? '/admin'
                : '/profile'
            }
            className={mobileMenuClass}
          >

            <NavigationIcon
              src={
                isAdmin
                  ? adminIcon
                  : profileIcon
              }
              alt={
                isAdmin
                  ? 'Admin'
                  : 'Profil'
              }
              mobile
            />

            <span>
              {isAdmin
                ? 'Admin'
                : 'Profil'}
            </span>

          </NavLink>

        </div>

      </nav>

    </div>
  )
}

export default AppLayout