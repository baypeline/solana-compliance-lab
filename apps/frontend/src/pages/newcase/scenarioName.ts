import { en } from '../../i18n/en'
import { lookup } from '../../i18n/hooks'

export function scenarioName(id: string): string {
  return lookup(en, `ui.scenario.${id}`) ?? id
}
