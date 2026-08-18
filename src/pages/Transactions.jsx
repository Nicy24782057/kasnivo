import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'

function Transactions() {
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const [showTransactionModal, setShowTransactionModal] =
    useState(false)

  const [showTransferModal, setShowTransferModal] =
    useState(false)

  // ==============================
  // TRANSAKSI
  // ==============================

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [category, setCategory] = useState(
    'Makanan & Minuman'
  )
  const [description, setDescription] = useState('')
  const [transactionDate, setTransactionDate] =
    useState(getToday())

  // ==============================
  // TRANSFER
  // ==============================

  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferDate, setTransferDate] =
    useState(getToday())
  const [transferDescription, setTransferDescription] =
    useState('')

  // ==============================
  // FILTER
  // ==============================

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterAccount, setFilterAccount] =
    useState('all')

  const expenseCategories = [
    'Makanan & Minuman',
    'Transportasi',
    'Belanja',
    'Tagihan',
    'Tempat Tinggal',
    'Pendidikan',
    'Kesehatan',
    'Hiburan',
    'Lainnya',
  ]

  const incomeCategories = [
    'Gaji',
    'Bonus',
    'Usaha',
    'Investasi',
    'Hadiah',
    'Lainnya',
  ]

  useEffect(() => {
    loadData()
  }, [])

  function getToday() {
    const date = new Date()

    const year = date.getFullYear()

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0')

    const day = String(
      date.getDate()
    ).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  async function getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      throw error
    }

    if (!user) {
      throw new Error(
        'Sesi login tidak ditemukan.'
      )
    }

    return user
  }

  async function loadData() {
    try {
      setLoading(true)

      const user = await getCurrentUser()

      const [
        accountResult,
        transactionResult,
      ] = await Promise.all([
        supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: true,
          }),

        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', {
            ascending: false,
          })
          .order('created_at', {
            ascending: false,
          }),
      ])

      if (accountResult.error) {
        throw accountResult.error
      }

      if (transactionResult.error) {
        throw transactionResult.error
      }

      const accountData =
        accountResult.data || []

      const transactionData =
        transactionResult.data || []

      setAccounts(accountData)
      setTransactions(transactionData)

      if (accountData.length > 0) {
        setAccountId(
          (current) =>
            current ||
            String(accountData[0].id)
        )
      }

    } catch (error) {
      console.error(error)

      setMessage(
        error.message ||
          'Gagal mengambil data transaksi.'
      )

      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // SALDO AKUN
  // ==============================

  function getAccountBalance(selectedAccountId) {
    const account = accounts.find(
      (item) =>
        String(item.id) ===
        String(selectedAccountId)
    )

    if (!account) {
      return 0
    }

    let balance = Number(
      account.initial_balance || 0
    )

    transactions.forEach(
      (transaction) => {
        if (
          String(
            transaction.account_id
          ) !==
          String(selectedAccountId)
        ) {
          return
        }

        if (
          transaction.type === 'income'
        ) {
          balance += Number(
            transaction.amount
          )
        }

        if (
          transaction.type === 'expense'
        ) {
          balance -= Number(
            transaction.amount
          )
        }
      }
    )

    return balance
  }

  // ==============================
  // FORMAT
  // ==============================

  function formatRupiah(value) {
    return new Intl.NumberFormat(
      'id-ID',
      {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }
    ).format(Number(value || 0))
  }

  function formatDate(date) {
    if (!date) return '-'

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    ).format(
      new Date(`${date}T00:00:00`)
    )
  }

  function getAccountName(id) {
    const account = accounts.find(
      (item) =>
        String(item.id) === String(id)
    )

    return account
      ? account.name
      : 'Akun'
  }

  // ==============================
  // MODAL TRANSAKSI
  // ==============================

  function openTransactionModal() {
    if (accounts.length === 0) {
      setMessage(
        'Tambahkan akun keuangan terlebih dahulu.'
      )

      setIsError(true)
      return
    }

    setMessage('')
    setIsError(false)

    setType('expense')
    setAmount('')
    setAccountId(
      String(accounts[0].id)
    )

    setCategory(
      expenseCategories[0]
    )

    setDescription('')
    setTransactionDate(getToday())

    setShowTransactionModal(true)
  }

  async function handleAddTransaction(
    event
  ) {
    event.preventDefault()

    setMessage('')
    setIsError(false)

    const numericAmount =
      Number(amount)

    if (!accountId) {
      setMessage(
        'Pilih akun terlebih dahulu.'
      )

      setIsError(true)
      return
    }

    if (
      Number.isNaN(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setMessage(
        'Nominal harus lebih dari Rp0.'
      )

      setIsError(true)
      return
    }

    if (type === 'expense') {
      const availableBalance =
        getAccountBalance(accountId)

      if (
        numericAmount >
        availableBalance
      ) {
        setMessage(
          `Saldo tidak cukup. Saldo tersedia ${formatRupiah(
            availableBalance
          )}.`
        )

        setIsError(true)
        return
      }
    }

    try {
      setSaving(true)

      const user =
        await getCurrentUser()

      const { error } =
        await supabase
          .from('transactions')
          .insert({
            user_id: user.id,

            account_id:
              Number(accountId),

            type,

            amount:
              numericAmount,

            category,

            description:
              description.trim() ||
              null,

            transaction_date:
              transactionDate,
          })

      if (error) {
        throw error
      }

      setShowTransactionModal(false)

      await loadData()

      setMessage(
        'Transaksi berhasil disimpan.'
      )

      setIsError(false)

    } catch (error) {
      console.error(error)

      setMessage(
        error.message ||
          'Transaksi gagal disimpan.'
      )

      setIsError(true)

    } finally {
      setSaving(false)
    }
  }

  // ==============================
  // MODAL TRANSFER
  // ==============================

  function openTransferModal() {
    setMessage('')
    setIsError(false)

    if (accounts.length < 2) {
      setMessage(
        'Transfer membutuhkan minimal dua akun.'
      )

      setIsError(true)
      return
    }

    setFromAccountId(
      String(accounts[0].id)
    )

    setToAccountId(
      String(accounts[1].id)
    )

    setTransferAmount('')
    setTransferDate(getToday())
    setTransferDescription('')

    setShowTransferModal(true)
  }

  async function handleTransfer(event) {
    event.preventDefault()

    setMessage('')
    setIsError(false)

    if (
      !fromAccountId ||
      !toAccountId
    ) {
      setMessage(
        'Pilih akun sumber dan tujuan.'
      )

      setIsError(true)
      return
    }

    if (
      fromAccountId ===
      toAccountId
    ) {
      setMessage(
        'Akun sumber dan tujuan tidak boleh sama.'
      )

      setIsError(true)
      return
    }

    const numericAmount =
      Number(transferAmount)

    if (
      Number.isNaN(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setMessage(
        'Nominal transfer tidak valid.'
      )

      setIsError(true)
      return
    }

    const availableBalance =
      getAccountBalance(
        fromAccountId
      )

    if (
      numericAmount >
      availableBalance
    ) {
      setMessage(
        `Saldo sumber tidak cukup. Tersedia ${formatRupiah(
          availableBalance
        )}.`
      )

      setIsError(true)
      return
    }

    try {
      setSaving(true)

      const { error } =
        await supabase.rpc(
          'create_transfer',
          {
            p_from_account_id:
              Number(
                fromAccountId
              ),

            p_to_account_id:
              Number(
                toAccountId
              ),

            p_amount:
              numericAmount,

            p_transaction_date:
              transferDate,

            p_description:
              transferDescription.trim() ||
              null,
          }
        )

      if (error) {
        throw error
      }

      setShowTransferModal(false)

      await loadData()

      setMessage(
        'Transfer berhasil.'
      )

      setIsError(false)

    } catch (error) {
      console.error(error)

      setMessage(
        error.message ||
          'Transfer gagal.'
      )

      setIsError(true)

    } finally {
      setSaving(false)
    }
  }

  // ==============================
  // HAPUS TRANSAKSI NORMAL
  // ==============================

  async function handleDelete(
    transaction
  ) {
    if (
      transaction.transfer_group_id
    ) {
      setMessage(
        'Transaksi transfer tidak dapat dihapus satu per satu.'
      )

      setIsError(true)
      return
    }

    const confirmation =
      window.confirm(
        'Hapus transaksi ini?'
      )

    if (!confirmation) {
      return
    }

    try {
      const user =
        await getCurrentUser()

      const { error } =
        await supabase
          .from('transactions')
          .delete()
          .eq(
            'id',
            transaction.id
          )
          .eq(
            'user_id',
            user.id
          )

      if (error) {
        throw error
      }

      await loadData()

      setMessage(
        'Transaksi berhasil dihapus.'
      )

      setIsError(false)

    } catch (error) {
      console.error(error)

      setMessage(
        error.message ||
          'Gagal menghapus transaksi.'
      )

      setIsError(true)
    }
  }

  // ==============================
  // FILTER
  // ==============================

  const filteredTransactions =
    useMemo(() => {
      return transactions.filter(
        (transaction) => {
          const keyword =
            search
              .trim()
              .toLowerCase()

          const accountName =
            getAccountName(
              transaction.account_id
            ).toLowerCase()

          const relatedName =
            transaction.related_account_id
              ? getAccountName(
                  transaction.related_account_id
                ).toLowerCase()
              : ''

          const matchesSearch =
            !keyword ||
            transaction.category
              ?.toLowerCase()
              .includes(keyword) ||
            transaction.description
              ?.toLowerCase()
              .includes(keyword) ||
            accountName.includes(
              keyword
            ) ||
            relatedName.includes(
              keyword
            )

          let matchesType = true

          if (
            filterType === 'income'
          ) {
            matchesType =
              transaction.type ===
                'income' &&
              !transaction.transfer_group_id
          }

          if (
            filterType ===
            'expense'
          ) {
            matchesType =
              transaction.type ===
                'expense' &&
              !transaction.transfer_group_id
          }

          if (
            filterType ===
            'transfer'
          ) {
            matchesType =
              Boolean(
                transaction.transfer_group_id
              )
          }

          const matchesAccount =
            filterAccount ===
              'all' ||
            String(
              transaction.account_id
            ) ===
              String(
                filterAccount
              )

          return (
            matchesSearch &&
            matchesType &&
            matchesAccount
          )
        }
      )
    }, [
      transactions,
      accounts,
      search,
      filterType,
      filterAccount,
    ])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">

        <p className="text-slate-500">
          Memuat transaksi...
        </p>

      </div>
    )
  }

  return (
    <div>

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">

        <div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Transaksi
          </h1>

          <p className="text-slate-500 mt-2">
            Kelola pemasukan, pengeluaran, dan transfer antar akun.
          </p>

        </div>

        <div className="flex flex-col sm:flex-row gap-3">

          <button
            type="button"
            onClick={
              openTransferModal
            }
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-5 py-3 rounded-2xl font-semibold"
          >
            Transfer
          </button>

          <button
            type="button"
            onClick={
              openTransactionModal
            }
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-semibold"
          >
            + Tambah Transaksi
          </button>

        </div>

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

      {/* FILTER */}

      <div className="bg-white border border-slate-200 rounded-[28px] p-4 sm:p-5 mb-5">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Cari transaksi..."
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500"
          />

          <select
            value={filterType}
            onChange={(event) =>
              setFilterType(
                event.target.value
              )
            }
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl"
          >

            <option value="all">
              Semua jenis
            </option>

            <option value="income">
              Pemasukan
            </option>

            <option value="expense">
              Pengeluaran
            </option>

            <option value="transfer">
              Transfer
            </option>

          </select>

          <select
            value={filterAccount}
            onChange={(event) =>
              setFilterAccount(
                event.target.value
              )
            }
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl"
          >

            <option value="all">
              Semua akun
            </option>

            {accounts.map(
              (account) => (
                <option
                  key={account.id}
                  value={account.id}
                >
                  {account.name}
                </option>
              )
            )}

          </select>

        </div>

      </div>

      {/* TRANSACTION LIST */}

      {filteredTransactions.length ===
      0 ? (

        <div className="bg-white border border-slate-200 rounded-[28px] py-16 px-6 text-center">

          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-2xl">
            ↕
          </div>

          <h2 className="font-bold text-slate-900 mt-5">
            Belum ada transaksi
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Catat pemasukan atau pengeluaran pertamamu.
          </p>

        </div>

      ) : (

        <div className="bg-white border border-slate-200 rounded-[28px] overflow-hidden">

          <div className="hidden lg:grid grid-cols-6 gap-4 px-6 py-4 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">

            <div>
              Transaksi
            </div>

            <div>
              Akun
            </div>

            <div>
              Kategori
            </div>

            <div>
              Tanggal
            </div>

            <div className="text-right">
              Nominal
            </div>

            <div className="text-right">
              Aksi
            </div>

          </div>

          {filteredTransactions.map(
            (transaction) => {
              const isTransfer =
                Boolean(
                  transaction.transfer_group_id
                )

              const relatedAccount =
                transaction.related_account_id
                  ? getAccountName(
                      transaction.related_account_id
                    )
                  : ''

              return (
                <div
                  key={
                    transaction.id
                  }
                  className="grid grid-cols-1 lg:grid-cols-6 gap-3 lg:gap-4 px-5 lg:px-6 py-5 border-t border-slate-100 items-center"
                >

                  <div>

                    <p className="font-semibold text-slate-800">

                      {transaction.description ||
                        transaction.category}

                    </p>

                    {isTransfer && (
                      <p className="text-xs text-slate-400 mt-1">

                        {transaction.type ===
                        'expense'
                          ? `Ke ${relatedAccount}`
                          : `Dari ${relatedAccount}`}

                      </p>
                    )}

                  </div>

                  <div className="text-sm text-slate-500">
                    {getAccountName(
                      transaction.account_id
                    )}
                  </div>

                  <div className="text-sm text-slate-500">

                    {isTransfer
                      ? 'Transfer'
                      : transaction.category}

                  </div>

                  <div className="text-sm text-slate-400">

                    {formatDate(
                      transaction.transaction_date
                    )}

                  </div>

                  <div
                    className={`font-bold lg:text-right ${
                      transaction.type ===
                      'income'
                        ? 'text-emerald-600'
                        : 'text-rose-500'
                    }`}
                  >

                    {transaction.type ===
                    'income'
                      ? '+'
                      : '-'}

                    {formatRupiah(
                      transaction.amount
                    )}

                  </div>

                  <div className="flex lg:justify-end">

                    {isTransfer ? (

                      <span className="text-xs bg-slate-100 text-slate-500 px-3 py-2 rounded-xl">
                        Transfer
                      </span>

                    ) : (

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            transaction
                          )
                        }
                        className="text-xs bg-rose-50 border border-rose-100 text-rose-500 px-3 py-2 rounded-xl"
                      >
                        Hapus
                      </button>

                    )}

                  </div>

                </div>
              )
            }
          )}

        </div>
      )}

      {/* =============================
          MODAL TRANSAKSI
      ============================== */}

      {showTransactionModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4 py-6 overflow-y-auto">

          <div className="bg-white rounded-[28px] w-full max-w-lg p-6 sm:p-7">

            <div className="flex justify-between mb-6">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Tambah Transaksi
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Tambahkan pemasukan atau pengeluaran.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowTransactionModal(
                    false
                  )
                }
                className="w-9 h-9 rounded-full bg-slate-100"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleAddTransaction
              }
              className="space-y-5"
            >

              <div className="grid grid-cols-2 gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setType(
                      'expense'
                    )

                    setCategory(
                      expenseCategories[0]
                    )
                  }}
                  className={`py-3 rounded-2xl border font-semibold ${
                    type === 'expense'
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  Pengeluaran
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType(
                      'income'
                    )

                    setCategory(
                      incomeCategories[0]
                    )
                  }}
                  className={`py-3 rounded-2xl border font-semibold ${
                    type === 'income'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  Pemasukan
                </button>

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nominal
                </label>

                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  placeholder="50000"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3"
                />

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Akun
                </label>

                <select
                  value={accountId}
                  onChange={(event) =>
                    setAccountId(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3"
                >

                  {accounts.map(
                    (account) => (
                      <option
                        key={account.id}
                        value={account.id}
                      >
                        {account.name}
                        {' - '}
                        {formatRupiah(
                          getAccountBalance(
                            account.id
                          )
                        )}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Kategori
                </label>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3"
                >

                  {(type === 'expense'
                    ? expenseCategories
                    : incomeCategories
                  ).map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}

                </select>

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tanggal
                </label>

                <input
                  type="date"
                  value={transactionDate}
                  onChange={(event) =>
                    setTransactionDate(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3"
                />

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Keterangan
                </label>

                <textarea
                  rows="3"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Contoh: Makan siang"
                  className="w-full resize-none border border-slate-200 rounded-2xl px-4 py-3"
                />

              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowTransactionModal(
                      false
                    )
                  }
                  className="flex-1 border border-slate-200 py-3 rounded-2xl font-semibold"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-500 text-white py-3 rounded-2xl font-semibold"
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

      {/* =============================
          MODAL TRANSFER
      ============================== */}

      {showTransferModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">

          <div className="bg-white rounded-[28px] w-full max-w-lg p-6 sm:p-7">

            <div className="flex justify-between mb-6">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Transfer Antar Akun
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Pindahkan saldo dari satu akun ke akun lainnya.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowTransferModal(
                    false
                  )
                }
                className="w-9 h-9 rounded-full bg-slate-100"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleTransfer
              }
              className="space-y-5"
            >

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Dari Akun
                </label>

                <select
                  value={fromAccountId}
                  onChange={(event) =>
                    setFromAccountId(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3"
                >

                  {accounts.map(
                    (account) => (
                      <option
                        key={account.id}
                        value={account.id}
                      >
                        {account.name}
                        {' - '}
                        {formatRupiah(
                          getAccountBalance(
                            account.id
                          )
                        )}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ke Akun
                </label>

                <select
                  value={toAccountId}
                  onChange={(event) =>
                    setToAccountId(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3"
                >

                  {accounts.map(
                    (account) => (
                      <option
                        key={account.id}
                        value={account.id}
                      >
                        {account.name}
                      </option>
                    )
                  )}

                </select>

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nominal
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    transferAmount
                  }
                  onChange={(event) =>
                    setTransferAmount(
                      event.target.value
                    )
                  }
                  placeholder="100000"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3"
                />

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tanggal
                </label>

                <input
                  type="date"
                  value={transferDate}
                  onChange={(event) =>
                    setTransferDate(
                      event.target.value
                    )
                  }
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3"
                />

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Catatan
                </label>

                <textarea
                  rows="3"
                  value={
                    transferDescription
                  }
                  onChange={(event) =>
                    setTransferDescription(
                      event.target.value
                    )
                  }
                  placeholder="Contoh: Isi saldo GoPay"
                  className="w-full resize-none border border-slate-200 rounded-2xl px-4 py-3"
                />

              </div>

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowTransferModal(
                      false
                    )
                  }
                  className="flex-1 border border-slate-200 py-3 rounded-2xl font-semibold"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-semibold"
                >
                  {saving
                    ? 'Memproses...'
                    : 'Transfer'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  )
}

export default Transactions