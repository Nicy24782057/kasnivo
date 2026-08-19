import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { supabase } from '../services/supabase'

import AccountLogo from '../components/AccountLogo'

import incomeIcon from '../assets/icons/dashboard/income.png'
import expenseIcon from '../assets/icons/dashboard/expense.png'
import transactionIcon from '../assets/icons/dashboard/transaction.png'
import transferIcon from '../assets/icons/dashboard/transfer.png'
import aiIcon from '../assets/icons/dashboard/ai.png'
import checkIcon from '../assets/icons/dashboard/check.png'

const AI_API_URL =
  import.meta.env.VITE_AI_API_URL ||
  'http://127.0.0.1:8000'

function Dashboard() {
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSaving, setAiSaving] = useState(false)

  const [aiResult, setAiResult] = useState(null)
  const [aiError, setAiError] = useState('')
  const [aiSuccess, setAiSuccess] = useState('')

  const [aiSelectedAccountId, setAiSelectedAccountId] =
    useState('')

  const [aiFromAccountId, setAiFromAccountId] =
    useState('')

  const [aiToAccountId, setAiToAccountId] =
    useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      setLoading(true)
      setErrorMessage('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error(
          'Sesi login tidak ditemukan.'
        )
      }

      const [
        profileResult,
        accountsResult,
        transactionsResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single(),

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

      if (profileResult.error) {
        throw profileResult.error
      }

      if (accountsResult.error) {
        throw accountsResult.error
      }

      if (transactionsResult.error) {
        throw transactionsResult.error
      }

      setProfile(profileResult.data)
      setAccounts(accountsResult.data || [])
      setTransactions(transactionsResult.data || [])

    } catch (error) {
      console.error(error)

      setErrorMessage(
        error.message ||
          'Gagal mengambil data dashboard.'
      )

    } finally {
      setLoading(false)
    }
  }

  function getToday() {
    const now = new Date()

    const year =
      now.getFullYear()

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, '0')

    const day =
      String(
        now.getDate()
      ).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  function formatRupiah(value) {
    return new Intl.NumberFormat(
      'id-ID',
      {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value || 0)
    )
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
      new Date(
        `${value}T00:00:00`
      )
    )
  }

  function getAccountName(id) {
    const account =
      accounts.find(
        (item) =>
          String(item.id) ===
          String(id)
      )

    return account
      ? account.name
      : 'Akun'
  }

  function getAccountTypeName(type) {
    if (type === 'bank') {
      return 'Bank'
    }

    if (type === 'ewallet') {
      return 'E-Wallet'
    }

    return 'Tunai'
  }

  function getAccountBalance(account) {
    let balance =
      Number(
        account.initial_balance || 0
      )

    transactions.forEach(
      (transaction) => {

        if (
          String(transaction.account_id) !==
          String(account.id)
        ) {
          return
        }

        if (
          transaction.type ===
          'income'
        ) {
          balance += Number(
            transaction.amount
          )
        }

        if (
          transaction.type ===
          'expense'
        ) {
          balance -= Number(
            transaction.amount
          )
        }

      }
    )

    return balance
  }

  function getAccountBalanceById(id) {
    const account =
      accounts.find(
        (item) =>
          String(item.id) ===
          String(id)
      )

    if (!account) {
      return 0
    }

    return getAccountBalance(
      account
    )
  }

  const totalBalance =
    useMemo(() => {

      return accounts.reduce(
        (total, account) =>
          total +
          getAccountBalance(
            account
          ),
        0
      )

    }, [
      accounts,
      transactions,
    ])

  const currentMonthTransactions =
    useMemo(() => {

      const now = new Date()

      const year =
        now.getFullYear()

      const month =
        now.getMonth()

      return transactions.filter(
        (transaction) => {

          const date =
            new Date(
              `${transaction.transaction_date}T00:00:00`
            )

          return (
            date.getFullYear() ===
              year &&
            date.getMonth() ===
              month
          )
        }
      )

    }, [transactions])

  const realMonthTransactions =
    useMemo(() => {

      return currentMonthTransactions.filter(
        (transaction) =>
          !transaction.transfer_group_id
      )

    }, [
      currentMonthTransactions,
    ])

  const totalIncome =
    useMemo(() => {

      return realMonthTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            'income'
        )
        .reduce(
          (total, transaction) =>
            total +
            Number(
              transaction.amount
            ),
          0
        )

    }, [
      realMonthTransactions,
    ])

  const totalExpense =
    useMemo(() => {

      return realMonthTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            'expense'
        )
        .reduce(
          (total, transaction) =>
            total +
            Number(
              transaction.amount
            ),
          0
        )

    }, [
      realMonthTransactions,
    ])

  const totalTransfers =
    useMemo(() => {

      const groups =
        new Set()

      currentMonthTransactions.forEach(
        (transaction) => {

          if (
            transaction.transfer_group_id
          ) {
            groups.add(
              transaction.transfer_group_id
            )
          }

        }
      )

      return groups.size

    }, [
      currentMonthTransactions,
    ])

  const latestTransactions =
    useMemo(() => {

      return transactions.slice(
        0,
        5
      )

    }, [transactions])

  const expenseByCategory =
    useMemo(() => {

      const map = {}

      realMonthTransactions
        .filter(
          (transaction) =>
            transaction.type ===
            'expense'
        )
        .forEach(
          (transaction) => {

            const category =
              transaction.category ||
              'Lainnya'

            if (!map[category]) {
              map[category] = 0
            }

            map[category] +=
              Number(
                transaction.amount
              )

          }
        )

      return Object.entries(map)
        .map(
          ([name, amount]) => ({
            name,
            amount,
          })
        )
        .sort(
          (a, b) =>
            b.amount -
            a.amount
        )
        .slice(0, 4)

    }, [
      realMonthTransactions,
    ])

  const largestExpense =
    expenseByCategory.length > 0
      ? expenseByCategory[0].amount
      : 0

  function findAccountIdByName(name) {
    if (!name) {
      return ''
    }

    const normalizedName =
      String(name)
        .trim()
        .toLowerCase()

    const account =
      accounts.find(
        (item) =>
          item.name
            .trim()
            .toLowerCase() ===
          normalizedName
      )

    return account
      ? String(account.id)
      : ''
  }

  async function handleAnalyzeAI() {
    const text =
      aiText.trim()

    setAiError('')
    setAiSuccess('')
    setAiResult(null)

    setAiSelectedAccountId('')
    setAiFromAccountId('')
    setAiToAccountId('')

    if (!text) {
      setAiError(
        'Tulis transaksi terlebih dahulu.'
      )
      return
    }

    if (
      accounts.length === 0
    ) {
      setAiError(
        'Tambahkan akun keuangan terlebih dahulu.'
      )
      return
    }

    try {
      setAiLoading(true)

      const response =
        await fetch(
          `${AI_API_URL}/analyze`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                text,

                accounts:
                  accounts.map(
                    (account) =>
                      account.name
                  ),

                current_date:
                  getToday(),
              }),
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.error ||
            'AI gagal menganalisis transaksi.'
        )
      }

      if (!data.success) {
        throw new Error(
          data.error ||
            'Analisis AI gagal.'
        )
      }

      setAiResult(data)

      if (
        data.kind ===
        'transaction'
      ) {
        setAiSelectedAccountId(
          findAccountIdByName(
            data.account_name
          )
        )
      }

      if (
        data.kind ===
        'transfer'
      ) {
        setAiFromAccountId(
          findAccountIdByName(
            data.from_account_name
          )
        )

        setAiToAccountId(
          findAccountIdByName(
            data.to_account_name
          )
        )
      }

    } catch (error) {
      console.error(error)

      if (
        error instanceof
        TypeError
      ) {
        setAiError(
          'Tidak dapat terhubung ke Kasnivo AI.'
        )
      } else {
        setAiError(
          error.message ||
            'AI gagal menganalisis transaksi.'
        )
      }

    } finally {
      setAiLoading(false)
    }
  }

  async function handleSaveAIResult() {
    if (!aiResult) {
      return
    }

    setAiError('')
    setAiSuccess('')

    const amount =
      Number(
        aiResult.amount || 0
      )

    if (amount <= 0) {
      setAiError(
        'Nominal transaksi belum valid.'
      )
      return
    }

    try {
      setAiSaving(true)

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error(
          'Sesi login tidak ditemukan.'
        )
      }

      if (
        aiResult.kind ===
        'transaction'
      ) {

        if (
          !aiSelectedAccountId
        ) {
          setAiError(
            'Pilih akun untuk transaksi ini.'
          )
          return
        }

        if (
          aiResult.transaction_type ===
          'expense'
        ) {

          const availableBalance =
            getAccountBalanceById(
              aiSelectedAccountId
            )

          if (
            amount >
            availableBalance
          ) {
            setAiError(
              `Saldo akun tidak cukup. Saldo tersedia ${formatRupiah(
                availableBalance
              )}.`
            )
            return
          }

        }

        const { error } =
          await supabase
            .from(
              'transactions'
            )
            .insert({
              user_id:
                user.id,

              account_id:
                Number(
                  aiSelectedAccountId
                ),

              type:
                aiResult.transaction_type,

              amount,

              category:
                aiResult.category,

              description:
                aiResult.description ||
                aiText.trim(),

              transaction_date:
                aiResult.transaction_date ||
                getToday(),
            })

        if (error) {
          throw error
        }

      } else if (
        aiResult.kind ===
        'transfer'
      ) {

        if (
          !aiFromAccountId ||
          !aiToAccountId
        ) {
          setAiError(
            'Pilih akun sumber dan tujuan transfer.'
          )
          return
        }

        if (
          aiFromAccountId ===
          aiToAccountId
        ) {
          setAiError(
            'Akun sumber dan tujuan tidak boleh sama.'
          )
          return
        }

        const sourceBalance =
          getAccountBalanceById(
            aiFromAccountId
          )

        if (
          amount >
          sourceBalance
        ) {
          setAiError(
            `Saldo akun sumber tidak cukup. Saldo tersedia ${formatRupiah(
              sourceBalance
            )}.`
          )
          return
        }

        const { error } =
          await supabase.rpc(
            'create_transfer',
            {
              p_from_account_id:
                Number(
                  aiFromAccountId
                ),

              p_to_account_id:
                Number(
                  aiToAccountId
                ),

              p_amount:
                amount,

              p_transaction_date:
                aiResult.transaction_date ||
                getToday(),

              p_description:
                aiResult.description ||
                aiText.trim(),
            }
          )

        if (error) {
          throw error
        }

      } else {
        setAiError(
          'Jenis transaksi AI tidak dikenali.'
        )
        return
      }

      await loadDashboard()

      setAiSuccess(
        aiResult.kind ===
          'transfer'
          ? 'Transfer dari AI berhasil disimpan.'
          : 'Transaksi dari AI berhasil disimpan.'
      )

      setAiText('')
      setAiResult(null)

      setAiSelectedAccountId('')
      setAiFromAccountId('')
      setAiToAccountId('')

    } catch (error) {
      console.error(error)

      setAiError(
        error.message ||
          'Gagal menyimpan hasil AI.'
      )

    } finally {
      setAiSaving(false)
    }
  }

  function resetAI() {
    setAiText('')
    setAiResult(null)
    setAiError('')
    setAiSuccess('')

    setAiSelectedAccountId('')
    setAiFromAccountId('')
    setAiToAccountId('')
  }

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />

          <p className="text-sm text-slate-500 mt-4">
            Memuat dashboard Kasnivo...
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

          <p className="text-sm font-medium text-emerald-600">
            Ringkasan Keuangan
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Halo, {profile?.full_name || 'Pengguna'} 👋
          </h1>

          <p className="text-slate-500 mt-2">
            Berikut kondisi keuanganmu saat ini.
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            navigate('/transactions')
          }
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-semibold transition"
        >
          + Tambah Transaksi
        </button>

      </div>

      {errorMessage && (
        <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm">

          {errorMessage}

        </div>
      )}

      {/* TOTAL SALDO */}

      <div className="relative overflow-hidden bg-slate-900 rounded-[30px] p-6 sm:p-8 text-white mb-6">

        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />

        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl" />

        <div className="relative">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">

            <div>

              <p className="text-sm text-slate-300">
                Total Saldo
              </p>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-2">

                {formatRupiah(
                  totalBalance
                )}

              </h2>

              <p className="text-sm text-slate-400 mt-3">
                Gabungan seluruh akun keuangan
              </p>

            </div>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={() =>
                  navigate('/accounts')
                }
                className="bg-white/10 hover:bg-white/15 border border-white/10 text-white px-4 py-3 rounded-2xl text-sm font-semibold"
              >
                Kelola Akun
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate('/transactions')
                }
                className="bg-emerald-500 hover:bg-emerald-400 px-4 py-3 rounded-2xl text-sm font-semibold"
              >
                Transaksi
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">

        <div className="bg-white border border-slate-200 rounded-[26px] p-5">

          <div className="flex items-center justify-between">

            <p className="text-sm text-slate-500">
              Pemasukan
            </p>

            <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center">

              <img
                src={incomeIcon}
                alt="Pemasukan"
                className="w-6 h-6 object-contain"
              />

            </div>

          </div>

          <p className="text-2xl font-bold text-emerald-600 mt-5">

            {formatRupiah(
              totalIncome
            )}

          </p>

          <p className="text-xs text-slate-400 mt-2">
            Bulan ini
          </p>

        </div>

        <div className="bg-white border border-slate-200 rounded-[26px] p-5">

          <div className="flex items-center justify-between">

            <p className="text-sm text-slate-500">
              Pengeluaran
            </p>

            <div className="w-11 h-11 bg-rose-50 rounded-2xl flex items-center justify-center">

              <img
                src={expenseIcon}
                alt="Pengeluaran"
                className="w-6 h-6 object-contain"
              />

            </div>

          </div>

          <p className="text-2xl font-bold text-slate-900 mt-5">

            {formatRupiah(
              totalExpense
            )}

          </p>

          <p className="text-xs text-slate-400 mt-2">
            Bulan ini
          </p>

        </div>

        <div className="bg-white border border-slate-200 rounded-[26px] p-5">

          <div className="flex items-center justify-between">

            <p className="text-sm text-slate-500">
              Transaksi
            </p>

            <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center">

              <img
                src={transactionIcon}
                alt="Transaksi"
                className="w-6 h-6 object-contain"
              />

            </div>

          </div>

          <p className="text-2xl font-bold text-slate-900 mt-5">
            {realMonthTransactions.length}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Bulan ini
          </p>

        </div>

        <div className="bg-white border border-slate-200 rounded-[26px] p-5">

          <div className="flex items-center justify-between">

            <p className="text-sm text-slate-500">
              Transfer
            </p>

            <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center">

              <img
                src={transferIcon}
                alt="Transfer"
                className="w-6 h-6 object-contain"
              />

            </div>

          </div>

          <p className="text-2xl font-bold text-slate-900 mt-5">
            {totalTransfers}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Antar akun bulan ini
          </p>

        </div>

      </div>

      {/* KASNIVO AI */}

      <div className="mb-7 bg-gradient-to-br from-emerald-50 via-white to-white border border-emerald-100 rounded-[30px] p-5 sm:p-7">

        <div className="flex items-start gap-4">

          <div className="hidden sm:flex w-14 h-14 shrink-0 rounded-2xl bg-white border border-emerald-100 shadow-sm items-center justify-center">

            <img
              src={aiIcon}
              alt="Kasnivo AI"
              className="w-8 h-8 object-contain"
            />

          </div>

          <div className="flex-1 min-w-0">

            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Kasnivo AI
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Catat Cepat
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Ceritakan transaksi menggunakan bahasa sehari-hari.
            </p>

            <div className="flex flex-col md:flex-row gap-3 mt-5">

              <input
                type="text"
                value={aiText}
                onChange={(event) =>
                  setAiText(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {

                  if (
                    event.key ===
                    'Enter'
                  ) {
                    handleAnalyzeAI()
                  }

                }}
                placeholder="Contoh: tadi beli kopi 20rb pakai GoPay"
                disabled={aiLoading}
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3.5 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-50"
              />

              <button
                type="button"
                onClick={handleAnalyzeAI}
                disabled={
                  aiLoading ||
                  !aiText.trim()
                }
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-6 py-3.5 rounded-2xl font-semibold min-w-32"
              >

                {aiLoading
                  ? 'Menganalisis...'
                  : 'Analisis'}

              </button>

            </div>

            {!aiResult && (
              <div className="flex flex-wrap gap-2 mt-3">

                {[
                  'beli kopi 20rb pakai GoPay',
                  'gaji 5 juta masuk BCA',
                  'transfer 100rb dari BCA ke DANA',
                ].map(
                  (example) => (

                    <button
                      key={example}
                      type="button"
                      onClick={() =>
                        setAiText(
                          example
                        )
                      }
                      className="text-xs bg-white border border-slate-200 text-slate-500 px-3 py-2 rounded-full hover:border-emerald-300 hover:text-emerald-600"
                    >
                      {example}
                    </button>

                  )
                )}

              </div>
            )}

            {aiError && (
              <div className="mt-5 bg-rose-50 border border-rose-100 rounded-2xl p-4 text-sm text-rose-600">
                {aiError}
              </div>
            )}

            {aiSuccess && (
              <div className="mt-5 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">

                <div className="flex items-center gap-3">

                  <img
                    src={checkIcon}
                    alt="Berhasil"
                    className="w-6 h-6 object-contain"
                  />

                  <p className="text-sm text-emerald-700">
                    {aiSuccess}
                  </p>

                </div>

              </div>
            )}

            {aiResult && (
              <div className="mt-6 bg-white border border-slate-200 rounded-[26px] overflow-hidden">

                <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  <div>

                    <p className="text-xs text-slate-400">
                      Hasil Analisis
                    </p>

                    <h3 className="font-bold text-slate-900 mt-1">

                      {aiResult.kind === 'transfer'
                        ? 'Transfer Antar Akun'
                        : aiResult.transaction_type === 'income'
                        ? 'Pemasukan'
                        : 'Pengeluaran'}

                    </h3>

                  </div>

                  <span
                    className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold ${
                      aiResult.confidence >=
                      0.75
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >

                    Keyakinan{' '}

                    {(
                      Number(
                        aiResult.confidence ||
                          0
                      ) * 100
                    ).toFixed(0)}

                    %

                  </span>

                </div>

                <div className="p-5">

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    <div className="bg-slate-50 rounded-2xl p-4">

                      <p className="text-xs text-slate-400">
                        Nominal
                      </p>

                      <p className="font-bold text-lg text-slate-900 mt-1">
                        {formatRupiah(
                          aiResult.amount
                        )}
                      </p>

                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4">

                      <p className="text-xs text-slate-400">
                        Kategori
                      </p>

                      <p className="font-semibold text-slate-800 mt-1">
                        {aiResult.category}
                      </p>

                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4">

                      <p className="text-xs text-slate-400">
                        Tanggal
                      </p>

                      <p className="font-semibold text-slate-800 mt-1">
                        {formatDate(
                          aiResult.transaction_date
                        )}
                      </p>

                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4">

                      <p className="text-xs text-slate-400">
                        Status AI
                      </p>

                      <div className="flex items-center gap-2 mt-1">

                        {!aiResult.needs_review && (

                          <img
                            src={checkIcon}
                            alt="Siap"
                            className="w-4 h-4 object-contain"
                          />

                        )}

                        <p
                          className={`font-semibold ${
                            aiResult.needs_review
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >

                          {aiResult.needs_review
                            ? 'Perlu dicek'
                            : 'Siap disimpan'}

                        </p>

                      </div>

                    </div>

                  </div>

                  {aiResult.kind ===
                    'transaction' && (

                    <div className="mt-5">

                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Akun
                      </label>

                      <select
                        value={
                          aiSelectedAccountId
                        }
                        onChange={(event) =>
                          setAiSelectedAccountId(
                            event.target.value
                          )
                        }
                        className="w-full border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-emerald-500"
                      >

                        <option value="">
                          Pilih akun
                        </option>

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
                                  account
                                )
                              )}

                            </option>

                          )
                        )}

                      </select>

                    </div>

                  )}

                  {aiResult.kind ===
                    'transfer' && (

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">

                      <div>

                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Dari Akun
                        </label>

                        <select
                          value={aiFromAccountId}
                          onChange={(event) =>
                            setAiFromAccountId(
                              event.target.value
                            )
                          }
                          className="w-full border border-slate-200 rounded-2xl px-4 py-3"
                        >

                          <option value="">
                            Pilih akun sumber
                          </option>

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
                                    account
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
                          value={aiToAccountId}
                          onChange={(event) =>
                            setAiToAccountId(
                              event.target.value
                            )
                          }
                          className="w-full border border-slate-200 rounded-2xl px-4 py-3"
                        >

                          <option value="">
                            Pilih akun tujuan
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

                  )}

                  <div className="mt-5 bg-slate-50 rounded-2xl p-4">

                    <p className="text-xs text-slate-400">
                      Kalimat asli
                    </p>

                    <p className="text-sm text-slate-700 mt-1">

                      {aiResult.description ||
                        aiText}

                    </p>

                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-5">

                    <button
                      type="button"
                      onClick={resetAI}
                      disabled={aiSaving}
                      className="sm:w-40 border border-slate-200 text-slate-600 py-3 rounded-2xl font-semibold"
                    >
                      Batal
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAIResult}
                      disabled={aiSaving}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white py-3 rounded-2xl font-semibold"
                    >

                      {aiSaving
                        ? 'Menyimpan...'
                        : aiResult.kind ===
                          'transfer'
                        ? 'Simpan Transfer'
                        : 'Simpan Transaksi'}

                    </button>

                  </div>

                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* AKUN KEUANGAN */}

      <div className="mb-7">

        <div className="flex items-center justify-between mb-4">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              Akun Keuangan
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Saldo aktual setiap tempat penyimpanan uang.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/accounts')
            }
            className="text-sm font-semibold text-emerald-600"
          >
            Kelola
          </button>

        </div>

        {accounts.length === 0 ? (

          <div className="bg-white border border-dashed border-slate-300 rounded-[26px] p-8 text-center">

            <p className="font-semibold text-slate-800">
              Belum ada akun keuangan
            </p>

            <p className="text-sm text-slate-500 mt-2">
              Tambahkan Bank, E-Wallet, atau Dompet Tunai.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate('/accounts')
              }
              className="mt-5 bg-emerald-500 text-white px-5 py-3 rounded-2xl font-semibold"
            >
              Tambah Akun
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

            {accounts.map(
              (account) => (

                <div
                  key={account.id}
                  className="bg-white border border-slate-200 rounded-[26px] p-5 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 transition"
                >

                  <div className="flex items-start justify-between">

                    <AccountLogo
                      name={account.name}
                      type={account.type}
                    />

                    <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">

                      {getAccountTypeName(
                        account.type
                      )}

                    </span>

                  </div>

                  <p className="text-sm font-medium text-slate-500 mt-5">
                    {account.name}
                  </p>

                  <p className="text-2xl font-bold text-slate-900 mt-2">

                    {formatRupiah(
                      getAccountBalance(
                        account
                      )
                    )}

                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Saldo saat ini
                  </p>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* BOTTOM */}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-[28px] p-5 sm:p-6">

          <h2 className="font-bold text-slate-900">
            Pengeluaran Terbesar
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Berdasarkan kategori bulan ini
          </p>

          {expenseByCategory.length ===
          0 ? (

            <div className="py-12 text-center">

              <img
                src={expenseIcon}
                alt="Belum ada pengeluaran"
                className="w-10 h-10 object-contain mx-auto opacity-40"
              />

              <p className="text-sm text-slate-400 mt-3">
                Belum ada pengeluaran bulan ini.
              </p>

            </div>

          ) : (

            <div className="space-y-5 mt-6">

              {expenseByCategory.map(
                (item) => {

                  const percentage =
                    largestExpense > 0
                      ? Math.round(
                          (item.amount /
                            largestExpense) *
                            100
                        )
                      : 0

                  return (

                    <div
                      key={item.name}
                    >

                      <div className="flex items-center justify-between gap-4 mb-2">

                        <span className="text-sm font-medium text-slate-600 truncate">
                          {item.name}
                        </span>

                        <span className="text-sm font-semibold text-slate-800">

                          {formatRupiah(
                            item.amount
                          )}

                        </span>

                      </div>

                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">

                        <div
                          style={{
                            width: `${percentage}%`,
                          }}
                          className="h-full bg-emerald-500 rounded-full"
                        />

                      </div>

                    </div>

                  )
                }
              )}

            </div>

          )}

        </div>

        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-[28px] p-5 sm:p-6">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="font-bold text-slate-900">
                Transaksi Terbaru
              </h2>

              <p className="text-sm text-slate-400 mt-1">
                Aktivitas keuangan terakhir
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate('/transactions')
              }
              className="text-sm font-semibold text-emerald-600"
            >
              Lihat Semua
            </button>

          </div>

          {latestTransactions.length ===
          0 ? (

            <div className="py-12 text-center">

              <img
                src={transactionIcon}
                alt="Belum ada transaksi"
                className="w-10 h-10 object-contain mx-auto opacity-40"
              />

              <p className="text-sm text-slate-400 mt-3">
                Belum ada transaksi.
              </p>

            </div>

          ) : (

            <div className="mt-5">

              {latestTransactions.map(
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
                      key={transaction.id}
                      className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-0"
                    >

                      <div className="min-w-0">

                        <p className="font-semibold text-sm text-slate-800 truncate">

                          {transaction.description ||
                            transaction.category}

                        </p>

                        <p className="text-xs text-slate-400 mt-1">

                          {getAccountName(
                            transaction.account_id
                          )}

                          {' • '}

                          {isTransfer
                            ? transaction.type ===
                              'expense'
                              ? `Transfer ke ${relatedAccount}`
                              : `Transfer dari ${relatedAccount}`
                            : transaction.category}

                          {' • '}

                          {formatDate(
                            transaction.transaction_date
                          )}

                        </p>

                      </div>

                      <p
                        className={`font-bold text-sm whitespace-nowrap ${
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

                      </p>

                    </div>

                  )
                }
              )}

            </div>

          )}

        </div>

      </div>

    </div>
  )
}

export default Dashboard