import type { RunStep, StoredError } from '../cases/model'
import { useCopy, useT } from '../i18n/hooks'

export function ErrorNotice({ error, step, onRetry }: { error: StoredError; step?: RunStep; onRetry?: () => void }) {
  const copy = useCopy()
  const t = useT()
  const text = copy.error(error.code)
  return (
    <div className="notice notice-error" role="alert">
      {step && <span className="caption t2">{t('ui.errorNotice.stoppedAt', { step: t(`ui.step.${step}`) })}</span>}
      <strong>{text.title}</strong>
      <span className="t2">{text.detail}</span>
      <span className="caption muted">
        {t('ui.errorNotice.code', { code: error.code })}
        {error.status !== null && ` · HTTP ${error.status}`}
        {error.requestId && ` · ${t('ui.errorNotice.request', { id: error.requestId })}`}
      </span>
      {error.message && error.message !== text.title && <span className="caption muted">{error.message}</span>}
      {onRetry && error.retryable && (
        <div>
          <button type="button" className="btn" onClick={onRetry}>
            {t('ui.errorNotice.retry')}
          </button>
        </div>
      )}
    </div>
  )
}
