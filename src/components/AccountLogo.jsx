import danaLogo from '../assets/icons/accounts/dana.png'
import seabankLogo from '../assets/icons/accounts/seabank.png'
import walletLogo from '../assets/icons/accounts/wallet.png'

function AccountLogo({
  name = '',
  type = '',
  size = 'normal',
}) {
  const normalizedName = String(name)
    .trim()
    .toLowerCase()

  let logo = null

  // DANA
  if (
    normalizedName.includes('dana')
  ) {
    logo = danaLogo
  }

  // SEABANK
  else if (
    normalizedName.includes('seabank') ||
    normalizedName.includes('sea bank')
  ) {
    logo = seabankLogo
  }

  // DOMPET / TUNAI
  else if (
    type === 'cash' ||
    normalizedName.includes('dompet') ||
    normalizedName.includes('tunai') ||
    normalizedName.includes('cash')
  ) {
    logo = walletLogo
  }

  const boxClass =
    size === 'small'
      ? 'w-10 h-10 rounded-xl'
      : 'w-14 h-14 rounded-2xl'

  const imageClass =
    size === 'small'
      ? 'w-7 h-7'
      : 'w-10 h-10'

  if (logo) {
    return (
      <div
        className={`${boxClass} bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0`}
      >
        <img
          src={logo}
          alt={name || 'Akun'}
          className={`${imageClass} object-contain`}
        />
      </div>
    )
  }

  // FALLBACK UNTUK AKUN YANG BELUM PUNYA LOGO
  const initial =
    name?.trim()?.charAt(0)?.toUpperCase() ||
    'A'

  return (
    <div
      className={`${boxClass} bg-slate-900 text-white flex items-center justify-center font-bold shrink-0`}
    >
      {initial}
    </div>
  )
}

export default AccountLogo