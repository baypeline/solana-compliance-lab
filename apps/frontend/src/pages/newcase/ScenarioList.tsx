import type { Action } from '../../api/types'
import { DecisionTag } from '../../components/StatusTag'
import { currentApiMode, scenariosFor } from '../../app/apiMode'
import { expectedDecision } from '../../contracts/catalog'
import { useT } from '../../i18n/hooks'
import { scenarioName } from './scenarioName'

/** Quick picks: the common sender against each recipient fixture. The tag is what the fixture data says, not a prediction. */
export function ScenarioList({ current, onPick }: { current: string | null; onPick: (fixtureId: string) => void }) {
  const t = useT()
  return (
    <section className="scenarios" aria-labelledby="nc-scenarios">
      <h2 id="nc-scenarios">{t('ui.newcase.scenarios')}</h2>
      <p className="hint">{t('ui.newcase.expected')}</p>
      <div className="scenario-grid">
        {scenariosFor(currentApiMode())
          .filter((s) => s.fixtureId !== 'sender')
          .map((s) => {
            const expected = expectedDecision(s.fixtureId) as Action | undefined
            return (
              <button
                key={s.fixtureId}
                type="button"
                className={`scenario ${current === s.fixtureId ? 'on' : ''}`}
                aria-pressed={current === s.fixtureId}
                onClick={() => onPick(s.fixtureId)}
              >
                <span className="scenario-name">{scenarioName(s.fixtureId)}</span>
                {expected && <DecisionTag action={expected} />}
              </button>
            )
          })}
      </div>
    </section>
  )
}
