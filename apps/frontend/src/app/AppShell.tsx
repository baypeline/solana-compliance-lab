import { NavLink, Outlet } from 'react-router'
import { useT } from '../i18n/hooks'
import { backendLabel, currentApiMode } from './apiMode'
import { getIdentity } from './identity'
import { SettingsMenu } from './SettingsMenu'
import { WordmarkGlyph } from './Wordmark'

export function AppShell() {
  const t = useT()
  const identity = getIdentity()
  const mode = currentApiMode()
  return (
    <>
      <header className="topbar">
        <NavLink to="/" className="wordmark">
          <WordmarkGlyph />
          {t('ui.brand')}
        </NavLink>
        <nav className="topnav" aria-label={t('ui.nav.main')}>
          <NavLink to="/" end>
            {t('ui.nav.cases')}
          </NavLink>
        </nav>
        <div className="topbar-side">
          <span className={`mode mode-${mode}`} title={mode === 'backend' ? backendLabel() : undefined}>
            <i aria-hidden="true" />
            {mode === 'mock' ? t('ui.settings.modeMock') : `${t('ui.settings.modeBackend')} · ${backendLabel()}`}
          </span>
          <span className="t2 who">{identity?.name}</span>
          <SettingsMenu />
        </div>
      </header>
      <Outlet />
    </>
  )
}
