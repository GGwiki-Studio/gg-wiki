'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { client } from '@/api/client'
import { toast } from 'sonner'

export default function VerifyPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [profileCreated, setProfileCreated] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('pendingVerificationEmail')
    if (stored) setPendingEmail(stored)
  }, [])

  useEffect(() => {
    client.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const checkAndCreateProfile = async () => {
      if (!user || profileCreated || checkingProfile) return
      if (!user.email_confirmed_at) return

      setCheckingProfile(true)
      try {
        const username = user.user_metadata?.username

        const { data: existingProfile, error: fetchError } = await client
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (fetchError) throw fetchError

        if (!existingProfile) {
          const { error: insertError } = await client
            .from('profiles')
            .insert({ id: user.id, username })
          if (insertError) throw insertError
        }

        setProfileCreated(true)
        localStorage.removeItem('pendingVerificationEmail')
        toast.success('Email verified! Redirecting to dashboard...')
        setTimeout(() => router.push(`/dashboard/${user.id}`), 2000)
      } catch (error) {
        console.error('Profile creation error:', error)
        toast.error('Error setting up your profile. Please contact support.')
      } finally {
        setCheckingProfile(false)
      }
    }

    checkAndCreateProfile()
  }, [user, profileCreated, checkingProfile, router])

  const resendEmail = async () => {
    const emailToUse = user?.email || pendingEmail
    if (!emailToUse || resendCooldown > 0) return

    try {
      await client.auth.resend({
        type: 'signup',
        email: emailToUse,
        options: { emailRedirectTo: `${window.location.origin}/verify` }
      })
      toast.success('Verification email resent!')
      setResendCooldown(60)
    } catch (err) {
      toast.error('Error resending verification email.')
    }
  }

  const checkStatus = async () => {
    setLoading(true)
    const { data, error } = await client.auth.refreshSession()
    if (error || !data.session) {
      toast.info('Could not refresh session.')
      setLoading(false)
      return
    }
    setUser(data.session.user)
    setLoading(false)
    if (!data.session.user.email_confirmed_at) {
      toast.info('Email not verified yet. Please check your inbox.')
    }
  }

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  if (loading) {
    return (
      <div className="p-4 max-w-md mx-auto text-center">
        <p>Loading session...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-4 max-w-md mx-auto text-center">
        {pendingEmail ? (
          <div>
            <p className="text-gray-600 mb-4">
              We sent a verification link to <strong>{pendingEmail}</strong>
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Didn't receive it? Check your spam folder or resend below.
            </p>
            <button
              onClick={resendEmail}
              disabled={resendCooldown > 0}
              className="bg-[#313131] hover:bg-[#444444] text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-red-600 mb-4">No user found. Please sign up first.</p>
            <button
              onClick={() => router.push('/registration')}
              className="bg-[#313131] hover:bg-[#444444] text-white font-bold py-2 px-4 rounded w-full"
            >
              Go to Sign Up
            </button>
          </div>
        )}
      </div>
    )
  }

  const isVerified = !!user.email_confirmed_at

  return (
    <div className="p-4 max-w-md mx-auto text-center">
      {isVerified ? (
        <div>
          <p className="text-green-600 font-bold text-lg mb-4">✅ Email verified!</p>
          {checkingProfile && <p className="text-gray-600">Setting up your profile...</p>}
          {profileCreated && <p className="text-gray-600">Redirecting to dashboard...</p>}
          {!checkingProfile && !profileCreated && <p className="text-gray-600">Preparing your account...</p>}
        </div>
      ) : (
        <div>
          <p className="text-red-600 font-bold mb-4">❌ Your email is not verified yet.</p>
          <p className="text-gray-600 mb-4">
            We sent a verification link to <strong>{user.email}</strong>
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Click the link in the email, then come back here and press "Check Status".
          </p>
          <div className="space-y-3">
            <button
              onClick={checkStatus}
              className="bg-[#313131] hover:bg-[#444444] text-white font-bold py-2 px-4 rounded w-full"
            >
              Check Status
            </button>
            <button
              onClick={resendEmail}
              disabled={resendCooldown > 0}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded w-full disabled:opacity-50"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}