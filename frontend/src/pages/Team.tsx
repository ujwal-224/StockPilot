import { useEffect, useState } from 'react'
import axios from 'axios'
import { getTeam, inviteWorker, updateMember, type Invitation, type TeamMember } from '../services/teamService'

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'MANAGER' | 'WORKER'>('WORKER')
  const [newCode, setNewCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => getTeam()
    .then((data) => { setMembers(data.members); setInvitations(data.invitations) })
    .catch(() => setError('Unable to load your team.'))
    .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const invite = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setNewCode('')
    try {
      const invitation = await inviteWorker(email, role)
      setNewCode(invitation.code)
      setEmail('')
      await load()
    } catch (requestError) {
      setError(axios.isAxiosError(requestError) ? requestError.response?.data?.message || 'Unable to invite worker.' : 'Unable to invite worker.')
    }
  }

  const toggleStatus = async (member: TeamMember) => {
    await updateMember(member._id, { status: member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })
    await load()
  }

  return (
    <main className="flex-grow p-5 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-4xl mx-auto w-full space-y-7">
      <section className="ledger-card p-5 md:p-6">
        <h2 className="font-headline-md text-xl text-on-surface">Invite a worker</h2>
        <p className="text-sm text-on-surface-variant mt-1 mb-4">The invitation code expires after seven days and works only for this email.</p>
        <form onSubmit={invite} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="worker@example.com"
            className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant focus:outline-none focus:border-primary" />
          <select value={role} onChange={(event) => setRole(event.target.value as typeof role)}
            className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant">
            <option value="WORKER">Worker</option><option value="MANAGER">Manager</option>
          </select>
          <button className="h-11 px-5 rounded-lg bg-primary text-white font-semibold">Create invitation</button>
        </form>
        {newCode && (
          <div className="mt-4 p-4 bg-tertiary-fixed rounded-lg">
            <p className="text-sm text-on-tertiary-fixed">Share this one-time code with the worker:</p>
            <p className="font-number-data text-2xl font-bold tracking-widest text-primary mt-1">{newCode}</p>
          </div>
        )}
        {error && <p className="text-error text-sm mt-3">{error}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-headline-md text-xl text-on-surface">Team members</h2>
        <div className="bg-ledger-surface hairline-border rounded-card overflow-hidden divide-y divide-ledger-divider">
          {loading ? <p className="p-6 text-on-surface-variant">Loading team…</p> : members.map((member) => (
            <div key={member._id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center font-bold">{member.user.name.charAt(0)}</div>
              <div className="flex-grow min-w-0">
                <p className="font-semibold text-on-surface truncate">{member.user.name}</p>
                <p className="text-xs text-on-surface-variant truncate">{member.user.email} · {member.role}</p>
              </div>
              {member.role !== 'OWNER' && (
                <button onClick={() => toggleStatus(member)} className={`text-sm font-semibold ${member.status === 'ACTIVE' ? 'text-error' : 'text-primary'}`}>
                  {member.status === 'ACTIVE' ? 'Remove access' : 'Restore access'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {invitations.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-headline-md text-xl text-on-surface">Pending invitations</h2>
          <div className="bg-ledger-surface hairline-border rounded-card divide-y divide-ledger-divider">
            {invitations.map((invitation) => (
              <div key={invitation._id} className="p-4 flex justify-between gap-4">
                <span>{invitation.email}</span><span className="text-sm text-on-surface-variant">{invitation.role}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
