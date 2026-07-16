import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { AuthInput, AuthShell } from './SignIn'

export default function SignUp({ onShowSignIn }: { onShowSignIn: () => void }) {
  const { signUp } = useAuth()
  const [workerMode, setWorkerMode] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', shopName: '', invitationCode: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp({
        name: form.name, email: form.email, password: form.password,
        ...(workerMode ? { invitationCode: form.invitationCode } : { shopName: form.shopName }),
      })
      window.history.replaceState(null, '', '/')
    } catch (requestError) {
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.message || 'Unable to create account.' : 'Unable to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle={workerMode ? 'Join your team with an owner invitation.' : 'Create your shop and owner account.'}>
      <div className="grid grid-cols-2 bg-surface-container-low rounded-lg p-1 mb-5">
        {([[false, 'Shop owner'], [true, 'Worker']] as const).map(([mode, label]) => (
          <button key={label} type="button" onClick={() => setWorkerMode(mode)}
            className={`py-2 rounded-md text-sm font-semibold ${workerMode === mode ? 'bg-primary text-white' : 'text-on-surface-variant'}`}>
            {label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <AuthInput label="Full name" value={form.name} onChange={set('name')} autoComplete="name" />
        <AuthInput label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
        {workerMode
          ? <AuthInput label="Invitation code" value={form.invitationCode} onChange={set('invitationCode')} />
          : <AuthInput label="Shop name" value={form.shopName} onChange={set('shopName')} />}
        <AuthInput label="Password (minimum 8 characters)" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
        {error && <p className="text-sm text-error">{error}</p>}
        <button disabled={loading} className="w-full h-12 rounded-lg bg-primary text-white font-semibold disabled:opacity-60">
          {loading ? 'Creating account…' : workerMode ? 'Join shop' : 'Create shop'}
        </button>
      </form>
      <p className="text-center text-sm text-on-surface-variant mt-5">
        Already registered? <button onClick={onShowSignIn} className="text-primary font-semibold underline">Sign in</button>
      </p>
    </AuthShell>
  )
}
