import { useLayoutEffect, useState } from 'react'
import { TransferRows } from '../pages/case/WhyChain'
import { ResultCard } from '../pages/case/simulation/NetworkResult'
import { useCopy } from '../i18n/hooks'
import { formatUtc } from '../lib/format'
import type { OfflineRecords } from './records'

type CaseKey = 'sender' | 'pattern' | 'recipient'
type View = 'result' | 'evidence' | 'gateway' | 'network'
const CASES: { key: CaseKey; name: string; description: string }[] = [
  { key: 'sender', name: '정상 기준', description: '위험 신호 없는 비교 지갑' },
  { key: 'pattern', name: '분산 송금', description: '짧은 시간에 여러 수신자로 전송' },
  { key: 'recipient', name: '제재 주소 일치', description: '제재 목록과 주소 직접 일치' },
]
const VIEWS: { key: View; name: string }[] = [{ key: 'result', name: '탐지 결과' }, { key: 'evidence', name: '거래 근거' }, { key: 'gateway', name: '제출 경로' }, { key: 'network', name: 'Constellation' }]
const SCENARIOS: Record<string, string> = { no_path: '전원 거절', below: '39.99% · 포함 기준 미달', boundary: '40% · 포함 의무', fifty: '50% · 포함 의무', skipped: '59.99% · 전체 참여 미달' }

/** Presentation controls select recorded results; the display never runs risk or protocol rules. */
export function DemoWorkbench({ records }: { records: OfflineRecords }) {
  const copy = useCopy()
  const [selected, setSelected] = useState<CaseKey>('pattern')
  const [view, setView] = useState<View>('result')
  const [opened, setOpened] = useState(false)
  const [scenarioKey, setScenarioKey] = useState('boundary')
  const [routeKey, setRouteKey] = useState('enforced')
  const [allEvidence, setAllEvidence] = useState(false)
  const analysis = records.analyses[selected]
  const review = selected === 'recipient' ? records.compliance : records.comparisonReviews[selected]
  const result = analysis.result
  const decision = review.result.decision
  const evaluation = result.evaluation!
  const coverage = result.coverage!
  const evidences = evaluation.evidences
  const ids = new Set(evidences.flatMap(e => e.transferIds))
  const transfers = analysis.transfers.filter(t => ids.has(t.id)).sort((a, b) => (a.timestamp ?? '').localeCompare(b.timestamp ?? '') || a.id.localeCompare(b.id))
  const scenario = records.scenarios.find(s => s.key === scenarioKey)!
  const route = records.gateway[routeKey]
  useLayoutEffect(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0 }, [selected, view, opened])
  const choose = (key: CaseKey) => { setSelected(key); setView('result'); setOpened(false); setAllEvidence(false); setRouteKey('enforced'); setScenarioKey('boundary') }
  const tab = (key: View) => { setOpened(true); setView(key) }
  const block = () => { setSelected('recipient'); setOpened(true); setAllEvidence(false); setRouteKey('enforced'); setScenarioKey('boundary') }

  return <main className="demo-workbench">
    <div className="demo-chrome"><header className="demo-header"><strong>이상거래 분석실</strong><span>메인넷 저장 기록 · 오프라인 시연</span><button className="btn" onClick={() => choose('pattern')}>시연 처음으로</button></header>
    <div className="demo-cases" role="group" aria-label="시연 사례">
      {CASES.map(c => <button key={c.key} aria-pressed={selected === c.key} onClick={() => choose(c.key)}><strong>{c.name}</strong></button>)}
    </div>
    <div className="demo-fixed"><span>가상 요청 <strong>1 SOL</strong></span><span>정책 <strong>{decision.policyVersion}</strong></span><span>데이터 <strong>{coverage.transactionCount}거래 · {coverage.transferCount}전송</strong></span></div>
    <nav className="demo-tabs" role="tablist" aria-label="데모 보기" onKeyDown={event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return
      event.preventDefault()
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? VIEWS.length - 1 : (VIEWS.findIndex(v => v.key === view) + (event.key === 'ArrowRight' ? 1 : -1) + VIEWS.length) % VIEWS.length
      tab(VIEWS[index].key)
      event.currentTarget.querySelectorAll('button')[index].focus()
    }}>{VIEWS.map(v => <button key={v.key} role="tab" tabIndex={view === v.key ? 0 : -1} id={'tab-'+v.key} aria-selected={view === v.key} aria-controls="demo-panel" onClick={() => tab(v.key)}>{v.name}</button>)}</nav></div>
    <section id="demo-panel" role="tabpanel" aria-labelledby={'tab-'+view} key={selected+view}>
      {view === 'result' && !opened && <div className="demo-launch">
        <div><p>선택한 사례</p><h1>{CASES.find(c => c.key === selected)!.name}</h1><p>{selected === 'sender' ? '동일한 정상 지갑을 양쪽에 둔 비교 기준입니다.' : '정상 송신자에서 선택한 지갑으로 보내는 가상 요청입니다.'}</p></div>
        <button className="btn btn-primary" onClick={() => setOpened(true)}>분석 결과 열기</button>
        <p className="demo-disclosure">HTML에 저장된 분석·정책 결과를 불러옵니다. 새 수집이나 재계산은 하지 않습니다.</p>
      </div>}
      {view === 'result' && opened && <div className={'demo-verdict tone-'+decision.action.toLowerCase()}>
        <div className="demo-score"><span>위험도</span><strong>{decision.riskScore}</strong><span>{decision.riskLevel} · 규칙 기반 점수</span></div>
        <div className="demo-verdict-copy"><span className="demo-action">{decision.action}</span><h1>{copy.decision(decision.action).headline}</h1><p>{evaluation.detectedRules.length ? evaluation.detectedRules.map(r => copy.rule(r.ruleId).title).join(' · ') : '이번 조회 범위에서 정의된 위험 신호가 탐지되지 않았습니다.'}</p>
          <div className="demo-actions"><button className="btn btn-primary" onClick={() => tab('evidence')}>판단 근거 확인</button><button className="btn" onClick={() => tab('gateway')}>{selected === 'recipient' ? '제출 경로 비교' : '차단 사례와 통제 비교'}</button></div>
        </div>
      </div>}
      {view === 'evidence' && <div className="demo-evidence">
        <h2>판단에 사용한 근거</h2>
        {selected === 'sender' && <p className="demo-reading">탐지된 규칙이 없습니다. 정상 확정이나 불법성 판단을 뜻하지 않습니다.</p>}
        {selected === 'recipient' && <><p className="demo-reading">분석 주소 자체가 OFAC SDN 레이블과 일치합니다.</p><p>조회 범위의 자금 전송은 0건입니다. 실제 불법 송금을 탐지한 사례가 아닙니다.</p></>}
        {selected === 'pattern' && <><p className="demo-reading">앞선 네 전송은 111초 안에 서로 다른 수신자에게 이어집니다.</p><p>전체 근거 {transfers.length}건은 여러 유효 시간 창의 합집합입니다.</p><TransferRows transfers={allEvidence ? transfers : transfers.slice(0, 4)} provenance={result.dataProvenance} /><button className="btn" onClick={() => setAllEvidence(v => !v)}>{allEvidence ? '앞선 4건만 보기' : `전체 근거 ${transfers.length}건 펼치기`}</button></>}
        <details className="demo-source"><summary>수집 범위와 원본 근거</summary><p>{formatUtc(coverage.fromTime)} ~ {formatUtc(coverage.toTime)} 직전 · {coverage.status}</p><p className="demo-address">{result.address}</p>{evidences.map(e => <div key={e.evidenceId}><strong>{e.type}</strong><pre>{JSON.stringify(e, null, 2)}</pre></div>)}</details>
      </div>}
      {(view === 'gateway' || view === 'network') && selected !== 'recipient' && <div className="demo-bridge"><h2>차단을 결정하면 어디까지 막힐까?</h2><p>이 사례의 정책 결과는 {decision.action}입니다. 제출 통제 기록은 별도의 제재 주소 BLOCK 사례로 준비했습니다.</p><button className="btn btn-primary" onClick={block}>BLOCK 사례로 통제 비교</button></div>}
      {view === 'gateway' && selected === 'recipient' && <div className="demo-control">
        <h2>같은 BLOCK 요청의 두 제출 경로</h2><div className="demo-options" role="group" aria-label="제출 경로">{Object.entries(records.gateway).map(([key, g]) => <button key={key} aria-pressed={routeKey === key} onClick={() => setRouteKey(key)}>{g.request.route.policyEnforced ? '정책 적용 경로' : '정책 미적용 경로'}</button>)}</div>
        <div className={'demo-route '+(route.result.policyApplied ? 'route-blocked' : 'route-open')} key={routeKey}><span>가상 송금</span><i/><span>{route.result.policyApplied ? '정책 적용 · BLOCK' : '다른 제출 경로'}</span><i/><strong>{copy.gatewayOutcomeShort(route.result.outcome)}</strong></div>
        <p className="demo-reading">{route.result.reasonCodes.map(c => copy.gatewayReason(c)).join(' ')}</p><p>저장된 Gateway 결과입니다. 실제 거래는 전송하지 않습니다.</p><button className="btn" onClick={() => tab('network')}>다른 경로 이후의 포함 조건 비교</button>
      </div>}
      {view === 'network' && selected === 'recipient' && <div className="demo-network"><h2>같은 요청의 조건별 포함 비교</h2><div className="demo-options" role="group" aria-label="저장된 실험 조건">{records.scenarios.map(s => <button key={s.key} aria-pressed={scenarioKey === s.key} onClick={() => setScenarioKey(s.key)}>{SCENARIOS[s.key]}</button>)}</div><p>묶음 증명률 {scenario.scenario.attestationPercent}% · 전체 참여율 {scenario.scenario.attesterParticipationPercent}% · 제안자 {scenario.scenario.proposerCount}명 중 {scenario.scenario.rejectingProposerCount}명 거절</p><div className="demo-models" key={scenarioKey}>{[scenario.research.result, scenario.baseline.result].map(r => <ResultCard key={r.protocolModelVersion} animated={false} rec={{ key: scenarioKey+r.protocolModelVersion, at: records.compliance.result.intent.requestedAt, batch: scenarioKey, purpose: 'compare', version: r.protocolModelVersion, scenario: scenario.scenario, result: r, error: null }} />)}</div></div>}
    </section>
    <footer className="demo-foot">저장된 결과의 상호작용 재생 · 새 분석·정책 계산·서버 연결 없음</footer>
  </main>
}
