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
    const stored = JSON.parse(localStorage.getItem('pendingVerificationEmail') || 'null')
    if (stored && Date.now() - stored.timestamp > 3600000) {
      localStorage.removeItem('pendingVerificationEmail')
    } else if (stored && stored.email) {
      setPendingEmail(stored.email)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      // Cross-platform: exchange code from URL if present
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error } = await client.auth.exchangeCodeForSession(code)
        if (error) console.error('Code exchange failed:', error)
      }

      const { data: { session } } = await client.auth.getSession()
      setUser(session?.user || null)
      setLoading(false)
    }

    init()

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
        localStorage.removeItem('pendingVerificationEmail')
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

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#313131] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#3d3d3d] border border-white/10 rounded-xl p-8 text-center">
        {children}
      </div>
    </div>
  )

  if (loading) {
    return (
      <Wrapper>
        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5 text-2xl">⏳</div>
        <p className="text-[#f0ede8] font-medium text-base">Loading session...</p>
      </Wrapper>
    )
  }

  if (!user) {
    return (
      <Wrapper>
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-xl text-[#f0ede8]">✉</div>
        {pendingEmail ? (
          <>
            <p className="text-[#f0ede8] font-medium text-base mb-2">Check your inbox</p>
            <p className="text-[#a09d99] text-sm mb-1">We sent a verification link to</p>
            <p className="text-[#d4d1cc] text-sm font-medium mb-3">{pendingEmail}</p>
            <p className="text-[#7a7773] text-xs mb-6">Didn't receive it? Check your spam folder or resend below.</p>
            <button
              onClick={resendEmail}
              disabled={resendCooldown > 0}
              className="w-full py-2.5 bg-[#f0ede8] text-[#313131] font-medium rounded-lg text-sm disabled:opacity-50 hover:bg-white transition-colors"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
            </button>
          </>
        ) : (
          <>
            <p className="text-[#f0ede8] font-medium text-base mb-2">No session found</p>
            <p className="text-[#a09d99] text-sm mb-6">Please sign up first.</p>
            <button
              onClick={() => router.push('/registration')}
              className="w-full py-2.5 bg-[#f0ede8] text-[#313131] font-medium rounded-lg text-sm hover:bg-white transition-colors"
            >
              Go to sign up
            </button>
          </>
        )}
      </Wrapper>
    )
  }

  const isVerified = !!user.email_confirmed_at

  if (!isVerified) {
    return (
      <Wrapper>
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-5 text-2xl text-[#f0ede8]">✉</div>
        <p className="text-[#f0ede8] font-medium text-lg mb-2">Check your inbox</p>
        <p className="text-[#a09d99] text-sm mb-1">We sent a verification link to</p>
        <p className="text-[#d4d1cc] text-sm font-medium mb-3">{user.email}</p>
        <p className="text-[#7a7773] text-xs mb-6">Open the link on this device, then press "Check status" below.</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={checkStatus}
            className="w-full py-2.5 bg-[#f0ede8] text-[#313131] font-medium rounded-lg text-sm hover:bg-white transition-colors"
          >
            Check status
          </button>
          <button
            onClick={resendEmail}
            disabled={resendCooldown > 0}
            className="w-full py-2.5 bg-transparent text-[#a09d99] border border-white/15 rounded-lg text-sm disabled:opacity-50 hover:bg-white/5 transition-colors"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
          </button>
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 text-2xl text-[#f0ede8]">✓</div>
      <p className="text-[#f0ede8] font-medium text-lg mb-2">Email verified!</p>
      <p className="text-[#a09d99] text-sm">
        {checkingProfile && 'Setting up your profile...'}
        {profileCreated && 'Redirecting to dashboard...'}
        {!checkingProfile && !profileCreated && 'Preparing your account...'}
      </p>
    </Wrapper>
  )
}