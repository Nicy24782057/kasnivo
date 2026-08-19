import { useEffect, useState } from 'react'

import { supabase } from '../services/supabase'

import AccountLogo from '../components/AccountLogo'

function Accounts() {
  const [accounts, setAccounts] =
    useState([])

  // ==========================================
  // TAMBAH
  // ==========================================

  const [name, setName] =
    useState('')

  const [type, setType] =
    useState('bank')

  const [
    initialBalance,
    setInitialBalance,
  ] = useState('')

  // ==========================================
  // EDIT
  // ==========================================

  const [editId, setEditId] =
    useState(null)

  const [editName, setEditName] =
    useState('')

  const [editType, setEditType] =
    useState('bank')

  const [
    editInitialBalance,
    setEditInitialBalance,
  ] = useState('')

  // ==========================================
  // STATUS
  // ==========================================

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [isError, setIsError] =
    useState(false)

  const [
    showAddModal,
    setShowAddModal,
  ] = useState(false)

  const [
    showEditModal,
    setShowEditModal,
  ] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  // ==========================================
  // CURRENT USER
  // ==========================================

  async function getCurrentUser() {
    const {
      data: { user },
      error,
    } =
      await supabase.auth.getUser()

    if (error) {
      throw error
    }

    if (!user) {
      throw new Error(
        'User belum login.'
      )
    }

    return user
  }

  // ==========================================
  // LOAD ACCOUNT
  // ==========================================

  async function loadAccounts() {
    try {
      setLoading(true)

      const user =
        await getCurrentUser()

      const {
        data,
        error,
      } = await supabase
        .from('accounts')
        .select('*')
        .eq(
          'user_id',
          user.id
        )
        .order(
          'created_at',
          {
            ascending: true,
          }
        )

      if (error) {
        throw error
      }

      setAccounts(
        data || []
      )

    } catch (error) {
      console.error(error)

      setMessage(
        error.message ||
          'Gagal mengambil akun keuangan.'
      )

      setIsError(true)

    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // TAMBAH ACCOUNT
  // ==========================================

  async function handleAddAccount(
    event
  ) {
    event.preventDefault()

    setMessage('')
    setIsError(false)

    if (!name.trim()) {
      setMessage(
        'Nama akun wajib diisi.'
      )

      setIsError(true)

      return
    }

    const balance =
      Number(
        initialBalance || 0
      )

    if (
      Number.isNaN(balance) ||
      balance < 0
    ) {
      setMessage(
        'Saldo awal tidak valid.'
      )

      setIsError(true)

      return
    }

    try {
      setSaving(true)

      const user =
        await getCurrentUser()

      const { error } =
        await supabase
          .from('accounts')
          .insert({
            user_id:
              user.id,

            name:
              name.trim(),

            type,

            initial_balance:
              balance,
          })

      if (error) {
        throw error
      }

      setName('')
      setType('bank')
      setInitialBalance('')

      setShowAddModal(false)

      await loadAccounts()

      setMessage(
        'Akun keuangan berhasil ditambahkan.'
      )

      setIsError(false)

    } catch (error) {
      console.error(error)

      if (
        error.code ===
        '23505'
      ) {
        setMessage(
          'Nama akun tersebut sudah digunakan.'
        )
      } else {
        setMessage(
          error.message ||
            'Gagal menambahkan akun.'
        )
      }

      setIsError(true)

    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // OPEN EDIT
  // ==========================================

  function openEditModal(
    account
  ) {
    setEditId(
      account.id
    )

    setEditName(
      account.name
    )

    setEditType(
      account.type
    )

    setEditInitialBalance(
      String(
        account.initial_balance ??
          0
      )
    )

    setMessage('')
    setIsError(false)

    setShowEditModal(true)
  }

  // ==========================================
  // CLOSE EDIT
  // ==========================================

  function closeEditModal() {
    setShowEditModal(false)

    setEditId(null)

    setEditName('')

    setEditType('bank')

    setEditInitialBalance('')
  }

  // ==========================================
  // EDIT ACCOUNT
  // ==========================================

  async function handleEditAccount(
    event
  ) {
    event.preventDefault()

    setMessage('')
    setIsError(false)

    if (!editId) {
      setMessage(
        'Akun tidak ditemukan.'
      )

      setIsError(true)

      return
    }

    if (!editName.trim()) {
      setMessage(
        'Nama akun wajib diisi.'
      )

      setIsError(true)

      return
    }

    const balance =
      Number(
        editInitialBalance ||
          0
      )

    if (
      Number.isNaN(balance) ||
      balance < 0
    ) {
      setMessage(
        'Saldo awal tidak valid.'
      )

      setIsError(true)

      return
    }

    try {
      setSaving(true)

      const user =
        await getCurrentUser()

      const { error } =
        await supabase
          .from('accounts')
          .update({
            name:
              editName.trim(),

            type:
              editType,

            initial_balance:
              balance,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            editId
          )
          .eq(
            'user_id',
            user.id
          )

      if (error) {
        throw error
      }

      closeEditModal()

      await loadAccounts()

      setMessage(
        'Akun berhasil diperbarui.'
      )

      setIsError(false)

    } catch (error) {
      console.error(error)

      if (
        error.code ===
        '23505'
      ) {
        setMessage(
          'Nama akun tersebut sudah digunakan.'
        )
      } else {
        setMessage(
          error.message ||
            'Gagal memperbarui akun.'
        )
      }

      setIsError(true)

    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // DELETE ACCOUNT
  // ==========================================

  async function handleDelete(
    account
  ) {
    const confirmation =
      window.confirm(
        `Apakah kamu yakin ingin menghapus akun "${account.name}"?`
      )

    if (!confirmation) {
      return
    }

    try {
      setMessage('')
      setIsError(false)

      const user =
        await getCurrentUser()

      const { error } =
        await supabase
          .from('accounts')
          .delete()
          .eq(
            'id',
            account.id
          )
          .eq(
            'user_id',
            user.id
          )

      if (error) {
        throw error
      }

      await loadAccounts()

      setMessage(
        'Akun berhasil dihapus.'
      )

      setIsError(false)

    } catch (error) {
      console.error(error)

      setMessage(
        'Akun tidak dapat dihapus. Kemungkinan akun sudah memiliki transaksi.'
      )

      setIsError(true)
    }
  }

  // ==========================================
  // FORMAT
  // ==========================================

  function formatRupiah(
    value
  ) {
    return new Intl.NumberFormat(
      'id-ID',
      {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits:
          0,
      }
    ).format(
      Number(value || 0)
    )
  }

  function getTypeName(
    accountType
  ) {
    if (
      accountType ===
      'bank'
    ) {
      return 'Bank'
    }

    if (
      accountType ===
      'ewallet'
    ) {
      return 'E-Wallet'
    }

    return 'Tunai'
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />

          <p className="text-slate-500 mt-4">
            Memuat akun keuangan...
          </p>

        </div>

      </div>
    )
  }

  return (
    <div>

      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">

        <div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Akun Keuangan
          </h1>

          <p className="text-slate-500 mt-2">
            Kelola bank, e-wallet, dan uang tunai milikmu.
          </p>

        </div>

        <button
          type="button"
          onClick={() => {
            setMessage('')
            setIsError(false)
            setShowAddModal(true)
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-semibold transition"
        >
          + Tambah Akun
        </button>

      </div>

      {/* ===================================== */}
      {/* MESSAGE */}
      {/* ===================================== */}

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

      {/* ===================================== */}
      {/* ACCOUNT LIST */}
      {/* ===================================== */}

      {accounts.length === 0 ? (

        <div className="bg-white border border-slate-200 rounded-[28px] py-16 px-6 text-center">

          <AccountLogo
            name="Dompet"
            type="cash"
          />

          <h2 className="font-bold text-slate-900 mt-5">
            Belum ada akun keuangan
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Tambahkan bank, e-wallet, atau dompet tunai.
          </p>

          <button
            type="button"
            onClick={() =>
              setShowAddModal(true)
            }
            className="mt-6 bg-emerald-500 text-white px-5 py-3 rounded-2xl font-semibold"
          >
            Tambah Akun
          </button>

        </div>

      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

          {accounts.map(
            (account) => (

              <div
                key={account.id}
                className="bg-white border border-slate-200 rounded-[28px] p-6 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 transition"
              >

                {/* TOP */}

                <div className="flex items-start justify-between gap-4">

                  <AccountLogo
                    name={
                      account.name
                    }
                    type={
                      account.type
                    }
                  />

                  <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">

                    {getTypeName(
                      account.type
                    )}

                  </span>

                </div>

                {/* INFO */}

                <div className="mt-6">

                  <p className="text-sm font-medium text-slate-500">
                    {account.name}
                  </p>

                  <p className="text-2xl font-bold text-slate-900 mt-2">

                    {formatRupiah(
                      account.initial_balance
                    )}

                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Saldo awal
                  </p>

                </div>

                {/* BUTTON */}

                <div className="flex gap-2 mt-6 pt-5 border-t border-slate-100">

                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(
                        account
                      )
                    }
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-2.5 rounded-xl text-sm font-medium transition"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(
                        account
                      )
                    }
                    className="flex-1 border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-500 py-2.5 rounded-xl text-sm font-medium transition"
                  >
                    Hapus
                  </button>

                </div>

              </div>

            )
          )}

        </div>

      )}

      {/* ===================================== */}
      {/* MODAL TAMBAH */}
      {/* ===================================== */}

      {showAddModal && (

        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">

          <div className="bg-white rounded-[28px] w-full max-w-md p-6 sm:p-7 shadow-2xl">

            <div className="flex items-start justify-between mb-6">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Tambah Akun
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Tambahkan tempat penyimpanan uang.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddModal(
                    false
                  )
                }
                className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleAddAccount
              }
              className="space-y-5"
            >

              {/* NAMA */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nama Akun
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Contoh: DANA, SeaBank, Dompet"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />

                <p className="text-xs text-slate-400 mt-2">
                  Logo DANA dan SeaBank akan muncul otomatis sesuai nama akun.
                </p>

              </div>

              {/* TYPE */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Jenis Akun
                </label>

                <select
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
                >

                  <option value="bank">
                    Bank
                  </option>

                  <option value="ewallet">
                    E-Wallet
                  </option>

                  <option value="cash">
                    Dompet Tunai
                  </option>

                </select>

              </div>

              {/* SALDO */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Saldo Awal
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    initialBalance
                  }
                  onChange={(event) =>
                    setInitialBalance(
                      event.target.value
                    )
                  }
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />

                <p className="text-xs text-slate-400 mt-2">
                  Isi 0 jika akun belum memiliki saldo.
                </p>

              </div>

              {/* ACTION */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddModal(
                      false
                    )
                  }
                  className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-2xl font-semibold"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white py-3 rounded-2xl font-semibold"
                >

                  {saving
                    ? 'Menyimpan...'
                    : 'Simpan'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ===================================== */}
      {/* MODAL EDIT */}
      {/* ===================================== */}

      {showEditModal && (

        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">

          <div className="bg-white rounded-[28px] w-full max-w-md p-6 sm:p-7 shadow-2xl">

            <div className="flex items-start justify-between mb-6">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Edit Akun
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Perbarui informasi akun keuangan.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeEditModal
                }
                className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
              >
                ×
              </button>

            </div>

            {/* PREVIEW LOGO */}

            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5">

              <AccountLogo
                name={editName}
                type={editType}
                size="small"
              />

              <div>

                <p className="text-sm font-semibold text-slate-800">
                  {editName ||
                    'Nama Akun'}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Preview ikon akun
                </p>

              </div>

            </div>

            <form
              onSubmit={
                handleEditAccount
              }
              className="space-y-5"
            >

              {/* NAMA */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nama Akun
                </label>

                <input
                  type="text"
                  value={editName}
                  onChange={(event) =>
                    setEditName(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />

              </div>

              {/* TYPE */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Jenis Akun
                </label>

                <select
                  value={editType}
                  onChange={(event) =>
                    setEditType(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
                >

                  <option value="bank">
                    Bank
                  </option>

                  <option value="ewallet">
                    E-Wallet
                  </option>

                  <option value="cash">
                    Dompet Tunai
                  </option>

                </select>

              </div>

              {/* SALDO */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Saldo Awal
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    editInitialBalance
                  }
                  onChange={(event) =>
                    setEditInitialBalance(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />

              </div>

              {/* ACTION */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={
                    closeEditModal
                  }
                  className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-2xl font-semibold"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white py-3 rounded-2xl font-semibold"
                >

                  {saving
                    ? 'Menyimpan...'
                    : 'Simpan Perubahan'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}

export default Accounts