import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { AuthInput, AuthShell } from './SignIn'

const BUSINESS_TYPES = [
  'Kirana Store',
  'Grocery Store',
  'Pharmacy',
  'Bakery',
  'Electronics',
  'Clothing',
  'Restaurant',
  'Hardware',
  'Stationery',
  'Other',
]

export default function SignUp({ onShowSignIn }: { onShowSignIn: () => void }) {
  const { signUp } = useAuth()
  const [workerMode, setWorkerMode] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    phone: '',
    businessType: 'Kirana Store',
    invitationCode: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    // Validations
    if (!form.name.trim()) return setError('Full name is required')
    if (!form.email.trim()) return setError('Email is required')
    if (form.password.length < 8) return setError('Password must be at least 8 characters')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match')

    if (workerMode) {
      if (!form.invitationCode.trim()) return setError('Invitation code is required')
    } else {
      if (!form.shopName.trim()) return setError('Shop name is required')
      if (!form.phone.trim()) return setError('Phone number is required')
      if (!form.businessType.trim()) return setError('Business type is required')
    }

    setLoading(true)
    try {
      await signUp({
        name: form.name,
        email: form.email,
        password: form.password,
        ...(workerMode
          ? { invitationCode: form.invitationCode }
          : {
              shopName: form.shopName,
              phone: form.phone,
              businessType: form.businessType,
            }),
      })
      window.history.replaceState(null, '', '/')
    } catch (requestError) {
      setError(
        axios.isAxiosError(requestError)
          ? requestError.response?.data?.message || 'Unable to create account.'
          : 'Unable to create account.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        workerMode
          ? 'Join your team with a store invitation.'
          : 'Register your shop and owner account.'
      }
    >
      {/* Segmented Control with animated transition */}
      <div className="relative flex bg-surface-container-high rounded-full p-1 mb-6 border border-outline-variant select-none">
        <div
          className="absolute top-1 bottom-1 rounded-full bg-primary transition-all duration-300 ease-out"
          style={{
            left: workerMode ? '50%' : '4px',
            right: workerMode ? '4px' : '50%',
          }}
        />
        <button
          type="button"
          onClick={() => {
            setWorkerMode(false)
            setError('')
          }}
          className={`relative z-10 w-1/2 py-2 rounded-full text-sm font-semibold transition-colors duration-300 text-center ${
            !workerMode ? 'text-white' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Shop Owner
        </button>
        <button
          type="button"
          onClick={() => {
            setWorkerMode(true)
            setError('')
          }}
          className={`relative z-10 w-1/2 py-2 rounded-full text-sm font-semibold transition-colors duration-300 text-center ${
            workerMode ? 'text-white' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Worker
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4 max-h-[50vh] overflow-y-auto px-1 no-scrollbar">
        <AuthInput
          label="Full name"
          value={form.name}
          onChange={set('name')}
          autoComplete="name"
        />

        <AuthInput
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          autoComplete="email"
        />

        {!workerMode ? (
          <>
            <AuthInput
              label="Shop name"
              value={form.shopName}
              onChange={set('shopName')}
            />

            <AuthInput
              label="Phone number"
              type="tel"
              value={form.phone}
              onChange={set('phone')}
            />

            <label className="block">
              <span className="block text-sm font-semibold text-on-surface mb-1.5">
                Business Type
              </span>
              <select
                value={form.businessType}
                onChange={(e) => set('businessType')(e.target.value)}
                className="w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors duration-150 text-sm"
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <AuthInput
            label="Invitation code"
            value={form.invitationCode}
            onChange={set('invitationCode')}
          />
        )}

        <AuthInput
          label="Password (min 8 characters)"
          type="password"
          value={form.password}
          onChange={set('password')}
          autoComplete="new-password"
        />

        <AuthInput
          label="Confirm password"
          type="password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          autoComplete="new-password"
        />

        {error && <p className="text-sm text-error font-medium">{error}</p>}

        <button
          disabled={loading}
          className="w-full h-12 rounded-lg bg-primary hover:bg-brand-maroon text-white font-semibold shadow-sm hover:shadow-md disabled:opacity-60 transition-all duration-200 active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-xl">sync</span>
              Creating account…
            </>
          ) : workerMode ? (
            'Join shop'
          ) : (
            'Create shop'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-5">
        Already registered?{' '}
        <button onClick={onShowSignIn} className="text-primary font-bold hover:underline">
          Sign in
        </button>
      </p>
    </AuthShell>
  )
}
