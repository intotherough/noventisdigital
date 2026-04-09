import type { FormEvent } from 'react'

type AdminLoginScreenProps = {
  email: string
  password: string
  loginPending: boolean
  localError: string | null
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AdminLoginScreen({
  email,
  password,
  loginPending,
  localError,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: AdminLoginScreenProps) {
  return (
    <section className="portal-login-grid portal-login-grid--kinetic">
      <div className="portal-login-copy">
        <p className="eyebrow">Private admin access</p>
        <h1>Client accounts, private packs, audit visibility.</h1>
        <p>
          The admin console controls portal users, passwords, document uploads,
          and the live audit trail behind the client area.
        </p>
      </div>

      <div className="portal-login-card portal-login-card--kinetic">
        <div className="login-card-heading">
          <p className="eyebrow">Admin sign in</p>
          <h2>Open the console</h2>
        </div>

        {localError ? <div className="error-banner">{localError}</div> : null}

        <form className="login-form" onSubmit={onSubmit}>
          <label className="input-group">
            <span>Email address</span>
            <input
              autoComplete="email"
              className="text-input"
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="admin@noventisdigital.co.uk"
              type="email"
              value={email}
            />
          </label>

          <label className="input-group">
            <span>Password</span>
            <input
              autoComplete="current-password"
              className="text-input"
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Password"
              type="password"
              value={password}
            />
          </label>

          <button
            className="primary-button full-width-button"
            disabled={loginPending}
            type="submit"
          >
            {loginPending ? 'Signing in...' : 'Sign in to admin'}
          </button>
        </form>
      </div>

      <div className="portal-value-list">
        <article className="benefit-card benefit-card--kinetic">
          <h3>Client account management</h3>
          <p>Create, edit, reset and remove portal users without manual SQL work.</p>
        </article>
        <article className="benefit-card benefit-card--kinetic">
          <h3>Private pack uploads</h3>
          <p>PDF collateral is stored in the private bucket instead of the public site.</p>
        </article>
        <article className="benefit-card benefit-card--kinetic">
          <h3>Audit visibility</h3>
          <p>Recent portal sign-ins, quote views, document opens and admin changes.</p>
        </article>
      </div>
    </section>
  )
}
