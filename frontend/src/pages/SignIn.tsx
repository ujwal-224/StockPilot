import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

export default function SignIn({ onShowSignUp }: { onShowSignUp: () => void }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      window.history.replaceState(null, '', '/')
    } catch (requestError) {
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.message || 'Unable to sign in.' : 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your shop inventory.">
      <form onSubmit={submit} className="space-y-4">
        <AuthInput label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <AuthInput label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error && <p className="text-sm text-error font-medium">{error}</p>}
        <button disabled={loading} className="w-full h-12 rounded-lg bg-primary hover:bg-brand-maroon text-white font-semibold shadow-sm hover:shadow-md disabled:opacity-60 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2">
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-xl">sync</span>
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
      <p className="text-center text-sm text-on-surface-variant mt-5">
        New to StockPilot?{' '}
        <button onClick={onShowSignUp} className="text-primary font-bold hover:underline">Create an account</button>
      </p>
    </AuthShell>
  )
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-ledger-paper flex items-center justify-center p-5 select-none transition-colors duration-300">
      <section className="w-full max-w-md bg-ledger-surface border border-ledger-hairline bahi-spine rounded-card p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="text-center mb-4">
          {/* Enhanced Branding Section with Cropped Icon and Large Name */}
          <div className="flex flex-col items-center mb-4">
            <div
              className="relative group transition-transform duration-500 ease-out transform hover:scale-105"
              style={{
                width: 60,
                height: 60,
                backgroundImage: 'url(/stockpilot-logo.png)',
                backgroundSize: '410% auto',
                backgroundPosition: '5% 50%',
                backgroundRepeat: 'no-repeat',
              }}
              aria-hidden="true"
            />
            <span
              className="mt-2.5 tracking-wide select-none"
              style={{
                color: '#7B1D2A',
                fontFamily: 'Georgia, serif',
                fontWeight: 700,
                fontSize: '28px',
                lineHeight: 1,
              }}
            >
              StockPilot
            </span>
          </div>

          <h1 className="font-headline-md text-xl text-primary font-bold">{title}</h1>
          <p className="font-body-sm text-sm text-on-surface-variant mt-1 leading-relaxed">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  )
}

export function AuthInput({ label, value, onChange, ...props }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string; required?: boolean
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = props.type === 'password'

  return (
    <label className="block">
      <span className="block text-sm font-semibold text-on-surface mb-1.5">{label}</span>
      <div className="relative">
        <input {...props} type={isPassword && showPassword ? 'text' : props.type} required={props.required !== false} value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full h-12 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none transition-colors duration-150 ${isPassword ? 'pr-12' : ''}`} />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
    </label>
  )
}
