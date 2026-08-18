import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'

function Reports() {
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])

  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const [selectedMonth, setSelectedMonth] = useState(
    getCurrentMonthKey()
  )

  useEffect(() => {
    loadReports()
  }, [])

  // =========================================
  // CURRENT MONTH
  // =========================================

  function getCurrentMonthKey() {
    const now = new Date()

    const year = now.getFullYear()

    const month = String(
      now.getMonth() + 1
    ).padStart(2, '0')

    return `${year}-${month}`
  }

  // =========================================
  // LOAD DATA
  // =========================================

  async function loadReports() {
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
        accountsResult,
        transactionsResult,
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

      if (accountsResult.error) {
        throw accountsResult.error
      }

      if (transactionsResult.error) {
        throw transactionsResult.error
      }

      setAccounts(
        accountsResult.data || []
      )

      setTransactions(
        transactionsResult.data || []
      )

    } catch (error) {
      console.error(error)

      setErrorMessage(
        error.message ||
          'Gagal mengambil data laporan.'
      )

    } finally {
      setLoading(false)
    }
  }

  // =========================================
  // FORMAT
  // =========================================

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

  function formatMonth(monthKey) {
    if (!monthKey) {
      return '-'
    }

    const [year, month] =
      monthKey.split('-')

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        month: 'long',
        year: 'numeric',
      }
    ).format(
      new Date(
        Number(year),
        Number(month) - 1,
        1
      )
    )
  }

  function formatShortMonth(monthKey) {
    const [year, month] =
      monthKey.split('-')

    return new Intl.DateTimeFormat(
      'id-ID',
      {
        month: 'short',
      }
    ).format(
      new Date(
        Number(year),
        Number(month) - 1,
        1
      )
    )
  }

  function getTransactionMonth(
    transaction
  ) {
    if (
      !transaction.transaction_date
    ) {
      return ''
    }

    return transaction.transaction_date.slice(
      0,
      7
    )
  }

  function getAccountName(id) {
    const account = accounts.find(
      (item) =>
        String(item.id) ===
        String(id)
    )

    return account
      ? account.name
      : 'Akun'
  }

  // =========================================
  // PILIHAN BULAN
  // =========================================

  const monthOptions =
    useMemo(() => {
      const months = new Set()

      months.add(
        getCurrentMonthKey()
      )

      transactions.forEach(
        (transaction) => {
          const key =
            getTransactionMonth(
              transaction
            )

          if (key) {
            months.add(key)
          }
        }
      )

      return Array.from(months)
        .sort()
        .reverse()

    }, [transactions])

  // =========================================
  // TRANSAKSI BULAN TERPILIH
  // =========================================

  const monthTransactions =
    useMemo(() => {
      return transactions.filter(
        (transaction) =>
          getTransactionMonth(
            transaction
          ) === selectedMonth
      )
    }, [
      transactions,
      selectedMonth,
    ])

  // =========================================
  // TRANSAKSI ASLI
  // TRANSFER TIDAK DIHITUNG
  // =========================================

  const realTransactions =
    useMemo(() => {
      return monthTransactions.filter(
        (transaction) =>
          !transaction.transfer_group_id
      )
    }, [monthTransactions])

  // =========================================
  // PEMASUKAN
  // =========================================

  const totalIncome =
    useMemo(() => {
      return realTransactions
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
    }, [realTransactions])

  // =========================================
  // PENGELUARAN
  // =========================================

  const totalExpense =
    useMemo(() => {
      return realTransactions
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
    }, [realTransactions])

  // =========================================
  // SELISIH / NET
  // =========================================

  const netIncome =
    totalIncome -
    totalExpense

  // =========================================
  // SAVING RATE
  // =========================================

  const savingRate =
    totalIncome > 0
      ? (
          (
            netIncome /
            totalIncome
          ) *
          100
        )
      : 0

  // =========================================
  // JUMLAH TRANSFER
  // =========================================

  const transferCount =
    useMemo(() => {
      const groups = new Set()

      monthTransactions.forEach(
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

    }, [monthTransactions])

  // =========================================
  // PENGELUARAN PER KATEGORI
  // =========================================

  const expenseByCategory =
    useMemo(() => {
      const result = {}

      realTransactions
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

            if (!result[category]) {
              result[category] = 0
            }

            result[category] +=
              Number(
                transaction.amount
              )
          }
        )

      return Object.entries(result)
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

    }, [realTransactions])

  // =========================================
  // AKTIVITAS PER AKUN
  // =========================================

  const activityByAccount =
    useMemo(() => {
      return accounts.map(
        (account) => {
          const accountTransactions =
            realTransactions.filter(
              (transaction) =>
                String(
                  transaction.account_id
                ) ===
                String(account.id)
            )

          const income =
            accountTransactions
              .filter(
                (transaction) =>
                  transaction.type ===
                  'income'
              )
              .reduce(
                (
                  total,
                  transaction
                ) =>
                  total +
                  Number(
                    transaction.amount
                  ),
                0
              )

          const expense =
            accountTransactions
              .filter(
                (transaction) =>
                  transaction.type ===
                  'expense'
              )
              .reduce(
                (
                  total,
                  transaction
                ) =>
                  total +
                  Number(
                    transaction.amount
                  ),
                0
              )

          return {
            id: account.id,
            name: account.name,
            type: account.type,
            income,
            expense,
            activity:
              income + expense,
          }
        }
      )
        .filter(
          (account) =>
            account.activity > 0
        )
        .sort(
          (a, b) =>
            b.activity -
            a.activity
        )

    }, [
      accounts,
      realTransactions,
    ])

  // =========================================
  // TREND 6 BULAN
  // =========================================

  const sixMonthTrend =
    useMemo(() => {
      const result = []

      const now = new Date()

      for (
        let offset = 5;
        offset >= 0;
        offset--
      ) {
        const date = new Date(
          now.getFullYear(),
          now.getMonth() - offset,
          1
        )

        const year =
          date.getFullYear()

        const month =
          String(
            date.getMonth() + 1
          ).padStart(2, '0')

        const key =
          `${year}-${month}`

        const monthData =
          transactions.filter(
            (transaction) =>
              !transaction.transfer_group_id &&
              getTransactionMonth(
                transaction
              ) === key
          )

        const income =
          monthData
            .filter(
              (transaction) =>
                transaction.type ===
                'income'
            )
            .reduce(
              (
                total,
                transaction
              ) =>
                total +
                Number(
                  transaction.amount
                ),
              0
            )

        const expense =
          monthData
            .filter(
              (transaction) =>
                transaction.type ===
                'expense'
            )
            .reduce(
              (
                total,
                transaction
              ) =>
                total +
                Number(
                  transaction.amount
                ),
              0
            )

        result.push({
          key,
          income,
          expense,
        })
      }

      return result

    }, [transactions])

  const maxTrendValue =
    useMemo(() => {
      const values =
        sixMonthTrend.flatMap(
          (item) => [
            item.income,
            item.expense,
          ]
        )

      const maxValue =
        Math.max(
          ...values,
          1
        )

      return maxValue

    }, [sixMonthTrend])

  // =========================================
  // INSIGHT SEDERHANA
  // =========================================

  const topExpenseCategory =
    expenseByCategory.length > 0
      ? expenseByCategory[0]
      : null

  const averageDailyExpense =
    useMemo(() => {
      if (
        totalExpense <= 0
      ) {
        return 0
      }

      const [year, month] =
        selectedMonth.split('-')

      const daysInMonth =
        new Date(
          Number(year),
          Number(month),
          0
        ).getDate()

      return (
        totalExpense /
        daysInMonth
      )

    }, [
      totalExpense,
      selectedMonth,
    ])

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">

        <div className="text-center">

          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto" />

          <p className="text-sm text-slate-500 mt-4">
            Memuat laporan...
          </p>

        </div>

      </div>
    )
  }

  return (
    <div>

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-7">

        <div>

          <p className="text-sm font-semibold text-emerald-600">
            Analisis Keuangan
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Laporan
          </h1>

          <p className="text-slate-500 mt-2">
            Pantau pemasukan, pengeluaran, dan pola penggunaan uangmu.
          </p>

        </div>

        <div>

          <label className="block text-xs font-semibold text-slate-500 mb-2">
            Periode Laporan
          </label>

          <select
            value={selectedMonth}
            onChange={(event) =>
              setSelectedMonth(
                event.target.value
              )
            }
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 outline-none min-w-52 focus:border-emerald-500"
          >

            {monthOptions.map(
              (month) => (
                <option
                  key={month}
                  value={month}
                >
                  {formatMonth(
                    month
                  )}
                </option>
              )
            )}

          </select>

        </div>

      </div>

      {/* ERROR */}

      {errorMessage && (
        <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm">
          {errorMessage}
        </div>
      )}

      {/* =========================================
          SUMMARY
      ========================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

        <div className="bg-white border border-slate-200 rounded-[26px] p-5">

          <p className="text-sm text-slate-500">
            Pemasukan
          </p>

          <p className="text-2xl font-bold text-emerald-600 mt-4">
            {formatRupiah(
              totalIncome
            )}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            {formatMonth(
              selectedMonth
            )}
          </p>

        </div>

        <div className="bg-white border border-slate-200 rounded-[26px] p-5">

          <p className="text-sm text-slate-500">
            Pengeluaran
          </p>

          <p className="text-2xl font-bold text-rose-500 mt-4">
            {formatRupiah(
              totalExpense
            )}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            {formatMonth(
              selectedMonth
            )}
          </p>

        </div>

        <div className="bg-slate-900 text-white rounded-[26px] p-5">

          <p className="text-sm text-slate-300">
            Selisih
          </p>

          <p
            className={`text-2xl font-bold mt-4 ${
              netIncome >= 0
                ? 'text-white'
                : 'text-rose-400'
            }`}
          >
            {formatRupiah(
              netIncome
            )}
          </p>

          <p className="text-xs text-slate-400 mt-2">
            Pemasukan - Pengeluaran
          </p>

        </div>

        <div className="bg-white border border-slate-200 rounded-[26px] p-5">

          <p className="text-sm text-slate-500">
            Rasio Tabungan
          </p>

          <p className="text-2xl font-bold text-slate-900 mt-4">

            {savingRate.toFixed(
              1
            )}
            %

          </p>

          <p className="text-xs text-slate-400 mt-2">
            Transfer: {transferCount}
          </p>

        </div>

      </div>

      {/* =========================================
          TREND 6 BULAN
      ========================================= */}

      <div className="bg-white border border-slate-200 rounded-[28px] p-5 sm:p-6 mb-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-7">

          <div>

            <h2 className="font-bold text-slate-900">
              Tren 6 Bulan
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Perbandingan pemasukan dan pengeluaran.
            </p>

          </div>

          <div className="flex gap-4 text-xs">

            <div className="flex items-center gap-2">

              <span className="w-3 h-3 rounded-full bg-emerald-500" />

              <span className="text-slate-500">
                Pemasukan
              </span>

            </div>

            <div className="flex items-center gap-2">

              <span className="w-3 h-3 rounded-full bg-rose-400" />

              <span className="text-slate-500">
                Pengeluaran
              </span>

            </div>

          </div>

        </div>

        <div className="h-64 flex items-end gap-3 sm:gap-6">

          {sixMonthTrend.map(
            (item) => {

              const incomeHeight =
                Math.max(
                  (
                    item.income /
                    maxTrendValue
                  ) *
                    100,
                  item.income > 0
                    ? 4
                    : 0
                )

              const expenseHeight =
                Math.max(
                  (
                    item.expense /
                    maxTrendValue
                  ) *
                    100,
                  item.expense > 0
                    ? 4
                    : 0
                )

              return (
                <div
                  key={item.key}
                  className="flex-1 h-full flex flex-col justify-end"
                >

                  <div className="flex items-end justify-center gap-1 sm:gap-2 flex-1">

                    <div
                      title={`Pemasukan ${formatRupiah(
                        item.income
                      )}`}
                      style={{
                        height:
                          `${incomeHeight}%`,
                      }}
                      className="w-1/2 max-w-8 bg-emerald-500 rounded-t-lg transition-all"
                    />

                    <div
                      title={`Pengeluaran ${formatRupiah(
                        item.expense
                      )}`}
                      style={{
                        height:
                          `${expenseHeight}%`,
                      }}
                      className="w-1/2 max-w-8 bg-rose-400 rounded-t-lg transition-all"
                    />

                  </div>

                  <p className="text-[10px] sm:text-xs text-center text-slate-400 mt-3">
                    {formatShortMonth(
                      item.key
                    )}
                  </p>

                </div>
              )
            }
          )}

        </div>

      </div>

      {/* =========================================
          DETAIL GRID
      ========================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        {/* KATEGORI */}

        <div className="bg-white border border-slate-200 rounded-[28px] p-5 sm:p-6">

          <div>

            <h2 className="font-bold text-slate-900">
              Pengeluaran per Kategori
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              {formatMonth(
                selectedMonth
              )}
            </p>

          </div>

          {expenseByCategory.length ===
          0 ? (

            <div className="py-14 text-center">

              <p className="text-sm text-slate-400">
                Belum ada pengeluaran pada periode ini.
              </p>

            </div>

          ) : (

            <div className="space-y-5 mt-7">

              {expenseByCategory.map(
                (item) => {

                  const percentage =
                    totalExpense > 0
                      ? (
                          item.amount /
                          totalExpense
                        ) *
                        100
                      : 0

                  return (
                    <div
                      key={
                        item.name
                      }
                    >

                      <div className="flex items-center justify-between gap-4 mb-2">

                        <div className="min-w-0">

                          <p className="text-sm font-semibold text-slate-700 truncate">
                            {item.name}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">

                            {percentage.toFixed(
                              1
                            )}
                            % dari pengeluaran

                          </p>

                        </div>

                        <p className="text-sm font-bold text-slate-900 whitespace-nowrap">
                          {formatRupiah(
                            item.amount
                          )}
                        </p>

                      </div>

                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">

                        <div
                          style={{
                            width:
                              `${percentage}%`,
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

        {/* AKUN */}

        <div className="bg-white border border-slate-200 rounded-[28px] p-5 sm:p-6">

          <h2 className="font-bold text-slate-900">
            Aktivitas per Akun
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Pemasukan dan pengeluaran per akun.
          </p>

          {activityByAccount.length ===
          0 ? (

            <div className="py-14 text-center">

              <p className="text-sm text-slate-400">
                Belum ada aktivitas akun pada periode ini.
              </p>

            </div>

          ) : (

            <div className="space-y-4 mt-6">

              {activityByAccount.map(
                (account) => (
                  <div
                    key={
                      account.id
                    }
                    className="border border-slate-100 rounded-2xl p-4"
                  >

                    <div className="flex items-center justify-between">

                      <p className="font-semibold text-slate-800">
                        {account.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        {formatRupiah(
                          account.activity
                        )}
                        {' '}aktivitas
                      </p>

                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">

                      <div className="bg-emerald-50 rounded-xl p-3">

                        <p className="text-xs text-emerald-600">
                          Masuk
                        </p>

                        <p className="font-bold text-emerald-700 mt-1">
                          {formatRupiah(
                            account.income
                          )}
                        </p>

                      </div>

                      <div className="bg-rose-50 rounded-xl p-3">

                        <p className="text-xs text-rose-500">
                          Keluar
                        </p>

                        <p className="font-bold text-rose-600 mt-1">
                          {formatRupiah(
                            account.expense
                          )}
                        </p>

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>

          )}

        </div>

      </div>

      {/* =========================================
          INSIGHT
      ========================================= */}

      <div className="bg-gradient-to-br from-emerald-50 via-white to-white border border-emerald-100 rounded-[28px] p-5 sm:p-6">

        <div className="flex items-start gap-4">

          <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold">
            ✦
          </div>

          <div className="flex-1">

            <p className="text-sm font-semibold text-emerald-600">
              Ringkasan
            </p>

            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {formatMonth(
                selectedMonth
              )}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">

              <div className="bg-white border border-slate-100 rounded-2xl p-4">

                <p className="text-xs text-slate-400">
                  Kategori terbesar
                </p>

                <p className="font-semibold text-slate-800 mt-2">

                  {topExpenseCategory
                    ? topExpenseCategory.name
                    : 'Belum ada'}

                </p>

                <p className="text-sm text-slate-500 mt-1">

                  {topExpenseCategory
                    ? formatRupiah(
                        topExpenseCategory.amount
                      )
                    : formatRupiah(
                        0
                      )}

                </p>

              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-4">

                <p className="text-xs text-slate-400">
                  Rata-rata pengeluaran
                </p>

                <p className="font-semibold text-slate-800 mt-2">
                  {formatRupiah(
                    averageDailyExpense
                  )}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  Per hari
                </p>

              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-4">

                <p className="text-xs text-slate-400">
                  Kondisi bulan
                </p>

                <p
                  className={`font-semibold mt-2 ${
                    netIncome >= 0
                      ? 'text-emerald-600'
                      : 'text-rose-500'
                  }`}
                >

                  {netIncome > 0
                    ? 'Surplus'
                    : netIncome < 0
                    ? 'Defisit'
                    : 'Seimbang'}

                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {formatRupiah(
                    Math.abs(
                      netIncome
                    )
                  )}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

export default Reports