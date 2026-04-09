import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import {
  getAuthErrorMessage,
  getCurrentAdmin,
  signInAdmin,
  signOutAdmin,
} from '../lib/adminService.ts'
import type { AdminUser } from '../types.ts'

export type UseAdminAuthCallbacks = {
  onLoginSuccess: () => Promise<void>
  onSignOut: () => void
  onError: (message: string) => void
  clearMessages: () => void
}

export function useAdminAuth(callbacks: UseAdminAuthCallbacks) {
  const [booting, setBooting] = useState(true)
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginPending, setLoginPending] = useState(false)
  const [signOutPending, setSignOutPending] = useState(false)

  useEffect(() => {
    let isActive = true

    void (async () => {
      try {
        const nextAdmin = await getCurrentAdmin()

        if (!isActive) {
          return
        }

        setAdmin(nextAdmin)

        if (nextAdmin) {
          await callbacks.onLoginSuccess()
        }
      } catch (error) {
        if (isActive) {
          callbacks.onError(getAuthErrorMessage(error))
        }
      } finally {
        if (isActive) {
          setBooting(false)
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    callbacks.clearMessages()
    setLoginPending(true)

    try {
      const nextAdmin = await signInAdmin(email, password)
      setAdmin(nextAdmin)
      await callbacks.onLoginSuccess()
    } catch (error) {
      callbacks.onError(getAuthErrorMessage(error))
    } finally {
      setLoginPending(false)
    }
  }

  const handleSignOut = async () => {
    setSignOutPending(true)

    try {
      await signOutAdmin()
      setAdmin(null)
      callbacks.onSignOut()
    } catch (error) {
      callbacks.onError(getAuthErrorMessage(error))
    } finally {
      setSignOutPending(false)
    }
  }

  return {
    booting,
    admin,
    email,
    password,
    loginPending,
    signOutPending,
    setEmail,
    setPassword,
    handleLogin,
    handleSignOut,
  }
}
