import { createRoot } from 'react-dom/client'
import { I18nProvider } from '../i18n/I18nProvider'
import { DemoWorkbench } from './DemoWorkbench'
import { readOfflineRecords } from './records'
import '../styles/tokens.css'
import '../styles/base.css'
import '../components/components.css'
import '../pages/pages.css'
import './offline.css'

createRoot(document.getElementById('root')!).render(
  <I18nProvider locale="ko"><DemoWorkbench records={readOfflineRecords()} /></I18nProvider>,
)
