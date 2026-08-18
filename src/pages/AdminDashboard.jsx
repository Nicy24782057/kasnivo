import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'

function AdminDashboard() {
  const [users, setUsers] = useState([])

  const [loading, setLoading] = useState(true)

  const [errorMessage, setErrorMessage] =
    useState('')

  const [search, setSearch] =
    useState('')

  const [filterRole, setFilterRole] =
    useState('all')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      setErrorMessage('')

      const {
        data,
        error,
      } = await supabase.rpc(
        'admin_user_overview'
      )

      if (error) {
        throw error
      }

      setUsers(data || [])

    } catch (error) {
      console.error(error)

      setErrorMessage(
        error.message ||
          'Gagal mengambil data pengguna.'
      )

    } finally {
      setLoading(false)
    }
  }

  function formatDate(value) {
    if (!value) {
      return '-'
    }

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    ).format(
      new Date(value)
    )
  }

  const totalUsers =
    users.length

  const totalAdmins =
    useMemo(() => {
      return users.filter(
        (user) =>
          user.role === 'admin'
      ).length
    }, [users])

  const totalAccounts =
    useMemo(() => {
      return users.reduce(
        (total, user) =>
          total +
          Number(
            user.account_count || 0
          ),
        0
      )
    }, [users])

  const totalTransactions =
    useMemo(() => {
      return users.reduce(
        (total, user) =>
          total +
          Number(
            user.transaction_count || 0
          ),
        0
      )
    }, [users])

  const filteredUsers =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase()

      return users.filter(
        (user) => {
          const matchSearch =
            !keyword ||
            user.full_name
              ?.toLowerCase()
              .includes(keyword) ||
            user.email
              ?.toLowerCase()
              .includes(keyword)

          const matchRole =
            filterRole === 'all' ||
            user.role ===
              filterRole

          return (
            matchSearch &&
            matchRole
          )
        }
      )
    }, [
      users,
      search,
      filterRole,
    ])

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />

          <p className="text-sm text-slate-500 mt-4">
            Memuat dashboard admin...
          </p>

        </div>

      </div>
    )
  }

  return (
    <div>

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">

        <div>

          <p className="text-sm font-semibold text-emerald-600">
            Administration
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Dashboard Admin
          </h1>

          <p className="text-slate-500 mt-2">
            Pantau pengguna dan aktivitas Kasnivo.
          </p>

        </div>

        <button
          type="button"
          onClick={loadUsers}
          className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-2xl font-semibold"
        >
          Refresh Data
        </button>

      </div>


      {/* ERROR */}

      {errorMessage && (
        <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm">
          {errorMessage}
        </div>
      )}


      {/* STAT CARDS */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">

        <div className="bg-white border border-slate-200 rounded-[26px] p-5">

          <p className="text-sm text-slate-500">
            Total Pengguna
          </p>

          <p className="text-3xl font-bold text-slate-900 mt-4">
            {totalUsers}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Akun terdaftar
          </p>

        </div>


        <div className="bg-slate-900 text-white rounded-[26px] p-5">

          <p className="text-sm text-slate-300">
            Administrator
          </p>

          <p className="text-3xl font-bold mt-4">
            {totalAdmins}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Akun dengan akses admin
          </p>

        </div>


        <div className="bg-white border border-slate-200 rounded-[26px] p-5">

          <p className="text-sm text-slate-500">
            Akun Keuangan
          </p>

          <p className="text-3xl font-bold text-emerald-600 mt-4">
            {totalAccounts}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Bank, e-wallet, tunai
          </p>

        </div>


        <div className="bg-white border border-slate-200 rounded-[26px] p-5">

          <p className="text-sm text-slate-500">
            Total Transaksi
          </p>

          <p className="text-3xl font-bold text-slate-900 mt-4">
            {totalTransactions}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Seluruh aktivitas user
          </p>

        </div>

      </div>


      {/* FILTER */}

      <div className="bg-white border border-slate-200 rounded-[26px] p-4 sm:p-5 mb-5">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Cari nama atau email..."
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />

          <select
            value={filterRole}
            onChange={(event) =>
              setFilterRole(
                event.target.value
              )
            }
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none"
          >

            <option value="all">
              Semua Role
            </option>

            <option value="user">
              User
            </option>

            <option value="admin">
              Admin
            </option>

          </select>

        </div>

      </div>


      {/* USER TABLE */}

      <div className="bg-white border border-slate-200 rounded-[28px] overflow-hidden">

        <div className="hidden lg:grid grid-cols-6 gap-4 bg-slate-50 px-6 py-4 text-xs font-semibold text-slate-500 uppercase">

          <div className="col-span-2">
            Pengguna
          </div>

          <div>
            Role
          </div>

          <div>
            Akun
          </div>

          <div>
            Transaksi
          </div>

          <div>
            Bergabung
          </div>

        </div>


        {filteredUsers.length === 0 ? (

          <div className="py-16 text-center">

            <p className="text-sm text-slate-400">
              Tidak ada pengguna ditemukan.
            </p>

          </div>

        ) : (

          filteredUsers.map(
            (user) => (

              <div
                key={user.user_id}
                className="grid grid-cols-1 lg:grid-cols-6 gap-3 lg:gap-4 px-5 lg:px-6 py-5 border-t border-slate-100 items-center"
              >

                <div className="lg:col-span-2 flex items-center gap-3">

                  <div className="w-11 h-11 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold">

                    {(
                      user.full_name ||
                      user.email ||
                      'U'
                    )
                      .charAt(0)
                      .toUpperCase()}

                  </div>

                  <div className="min-w-0">

                    <p className="font-semibold text-slate-800 truncate">
                      {user.full_name ||
                        'Tanpa Nama'}
                    </p>

                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {user.email}
                    </p>

                  </div>

                </div>


                <div>

                  <span
                    className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${
                      user.role ===
                      'admin'
                        ? 'bg-slate-900 text-white'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {user.role ===
                    'admin'
                      ? 'Admin'
                      : 'User'}
                  </span>

                </div>


                <div>

                  <p className="text-xs text-slate-400 lg:hidden">
                    Akun Keuangan
                  </p>

                  <p className="font-semibold text-slate-700">
                    {user.account_count}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-slate-400 lg:hidden">
                    Transaksi
                  </p>

                  <p className="font-semibold text-slate-700">
                    {user.transaction_count}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-slate-400 lg:hidden">
                    Bergabung
                  </p>

                  <p className="text-sm text-slate-500">
                    {formatDate(
                      user.created_at
                    )}
                  </p>

                </div>

              </div>

            )
          )

        )}

      </div>

    </div>
  )
}

export default AdminDashboard