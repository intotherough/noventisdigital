import type { Dispatch, SetStateAction } from 'react'
import { startTransition, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { AdminPage } from './pages/AdminPage'
import { PortalPage } from './pages/PortalPage'
import {
  getCurrentClient,
  getQuotesForClient,
  portalMode,
  signInClient,
  signOutClient,
  subscribeToAuth,
} from './lib/portalService'
import type { PortalClient, QuoteDocument } from './types'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

async function loadQuotesForClient(
  clientId: string,
  setQuotesLoading: Dispatch<SetStateAction<boolean>>,
  setQuotes: Dispatch<SetStateAction<QuoteDocument[]>>,
  setPortalError: Dispatch<SetStateAction<string | null>>,
) {
  setQuotesLoading(true)

  try {
    const nextQuotes = await getQuotesForClient(clientId)

    startTransition(() => {
      setQuotes(nextQuotes)
      setPortalError(null)
    })
  } catch (error) {
    startTransition(() => {
      setQuotes([])
      setPortalError(getErrorMessage(error))
    })
  } finally {
    setQuotesLoading(false)
  }
}

function App() {
  const [client, setClient] = useState<PortalClient | null>(null)
  const [quotes, setQuotes] = useState<QuoteDocument[]>([])
  const [booting, setBooting] = useState(true)
  const [quotesLoading, setQuotesLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const initialise = async () => {
      try {
        const nextClient = await getCurrentClient()

        if (!isActive) {
          return
        }

        startTransition(() => {
          setClient(nextClient)
          setPortalError(null)
        })

        if (nextClient) {
          await loadQuotesForClient(
            nextClient.id,
            setQuotesLoading,
            setQuotes,
            setPortalError,
          )
        }
      } catch (error) {
        if (!isActive) {
          return
        }

        startTransition(() => {
          setClient(null)
          setQuotes([])
          setPortalError(getErrorMessage(error))
        })
      } finally {
        if (isActive) {
          setBooting(false)
        }
      }
    }

    void initialise()

    const unsubscribe = subscribeToAuth(async (nextClient) => {
      if (!isActive) {
        return
      }

      startTransition(() => {
        setClient(nextClient)
        setPortalError(null)
      })

      if (nextClient) {
        await loadQuotesForClient(
          nextClient.id,
          setQuotesLoading,
          setQuotes,
          setPortalError,
        )
      } else {
        startTransition(() => {
          setQuotes([])
        })
      }

      setBooting(false)
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  const handleLogin = async (email: string, password: string) => {
    const nextClient = await signInClient(email, password)

    if (portalMode === 'live') {
      return
    }

    startTransition(() => {
      setClient(nextClient)
      setPortalError(null)
    })

    await loadQuotesForClient(
      nextClient.id,
      setQuotesLoading,
      setQuotes,
      setPortalError,
    )
  }

  const handleLogout = async () => {
    await signOutClient()

    if (portalMode === 'live') {
      return
    }

    startTransition(() => {
      setClient(null)
      setQuotes([])
      setPortalError(null)
    })
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route
        path="/portal"
        element={
          <PortalPage
            client={client}
            quotes={quotes}
            booting={booting}
            portalMode={portalMode}
            quotesLoading={quotesLoading}
            portalError={portalError}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
