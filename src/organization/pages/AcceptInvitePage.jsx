import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAcceptInviteByToken } from '@/organization'
import { Spinner } from '@/shared/ui/Spinner'
import { Heading, Text } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Icons } from '@/shared/ui/Icons'

/**
 * Organization invite accept page -- finite state machine.
 *
 * States (exactly one visible at any time):
 *   accepting -> spinner + "joining..." copy
 *   success   -> confirmation, auto-navigates into the organization
 *   error     -> backend reason + Try again / Go to workspace actions
 *   invalid   -> link reached without a token (never spins)
 *
 * Why not drive the UI off useMutation flags alone: React Query mutation
 * observers are per-mount, so HMR/StrictMode remounts reset them to `idle`
 * while a request is still in flight -- that combination rendered an endless
 * spinner before. Local explicit state cannot flap between renders.
 */
export function AcceptInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const acceptMutation = useAcceptInviteByToken()

  const [phase, setPhase] = useState('accepting') // 'accepting' | 'success' | 'error'
  const [accepted, setAccepted] = useState(null) // OrganizationInviteDTO
  const [failure, setFailure] = useState(null) // Error
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (!token || attemptedRef.current) return
    attemptedRef.current = true

    acceptMutation.mutateAsync(token)
      .then((data) => {
        setAccepted(data || null)
        setPhase('success')
      })
      .catch((err) => {
        setFailure(err)
        setPhase('error')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Success: give the confirmation screen one beat, then enter the organization.
  useEffect(() => {
    if (phase !== 'success') return
    const orgId = accepted?.organizationId || accepted?.organization?.id
    const timer = setTimeout(() => {
      navigate(orgId ? `/app/organizations/${orgId}` : '/app/organizations', { replace: true })
    }, 1200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const errorMessage =
    failure?.response?.data?.message ||
    failure?.message ||
    'Failed to accept the invitation. The link may be expired, revoked, or already used.'

  const handleRetry = () => {
    setFailure(null)
    setPhase('accepting')
    acceptMutation.mutateAsync(token)
      .then((data) => {
        setAccepted(data || null)
        setPhase('success')
      })
      .catch((err) => {
        setFailure(err)
        setPhase('error')
      })
  }

  const goWorkspace = () => {
    const orgId = accepted?.organizationId || accepted?.organization?.id
    navigate(orgId ? `/app/organizations/${orgId}` : '/app/organizations')
  }

  // No token in the URL at all -> this is not an invitation link. Show a
  // definite outcome instead of spinning forever.
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--danger-soft)] text-[var(--danger)] flex items-center justify-center mx-auto">
            <Icons.alertCircle className="w-6 h-6" />
          </div>
          <Heading level={3}>Organization invitation</Heading>
          <Text variant="muted">This invitation link is invalid ? the invite token is missing.</Text>
          <Button variant="primary" onClick={() => navigate('/app/organizations')}>
            Go to workspace
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] p-4">
      <Card className="max-w-md w-full p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mx-auto">
          <Icons.users className="w-6 h-6" />
        </div>

        <Heading level={3}>Organization invitation</Heading>

        {phase === 'accepting' && (
          <div className="space-y-3 py-4">
            <Spinner size="lg" className="mx-auto" />
            <Text variant="muted">Accepting invitation and joining organization...</Text>
          </div>
        )}

        {phase === 'success' && (
          <div className="space-y-3 py-4 text-[var(--success)]">
            <Text className="font-medium text-base">
              You have successfully joined{accepted?.organizationName ? ` ${accepted.organizationName}` : ' the organization'}!
            </Text>
            <Text variant="muted" className="text-sm">Redirecting to your workspace...</Text>
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-4 py-2">
            <div className="p-3 bg-[var(--danger-soft)] text-[var(--danger)] rounded-md text-sm">
              {errorMessage}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" onClick={handleRetry}>
                Try again
              </Button>
              <Button variant="primary" onClick={goWorkspace}>
                Go to workspace
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
