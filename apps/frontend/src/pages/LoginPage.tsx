import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { signIn } from '../app/identity'
import { WordmarkGlyph } from '../app/Wordmark'
import { useT } from '../i18n/hooks'

export function LoginPage() {
  const navigate = useNavigate()
  const t = useT()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (name.trim() === '') {
      setError(t('ui.login.nameMissing'))
      return
    }
    signIn(name)
    navigate('/', { replace: true })
  }

  return (
    <main className="login">
      <form className="login-body" onSubmit={submit} noValidate>
        <span className="wordmark">
          <WordmarkGlyph size={24} />
          {t('ui.brand')}
        </span>
        <h1>{t('ui.login.title')}</h1>
        <p className="t2">{t('ui.login.lead')}</p>
        <div className="field">
          <label htmlFor="login-name">{t('ui.login.nameLabel')}</label>
          <input
            id="login-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="username"
            aria-invalid={error ? true : undefined}
          />
          {error && <span className="field-error">{error}</span>}
        </div>
        <button type="submit" className="btn btn-primary btn-lg">
          {t('ui.login.continue')}
        </button>
        <p className="login-notice">{t('ui.login.notice')}</p>
      </form>
    </main>
  )
}
