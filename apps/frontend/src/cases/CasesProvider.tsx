import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CasesContext, type CasesValue } from './context'
import { closeInterruptedRuns, type CaseRecord } from './model'
import { createIdbCaseStore, validateCaseRecord, type CaseStore } from './store'
import { exportCases, mergeImported, parseCaseExport } from './transfer'

const byNewest = (a: CaseRecord, b: CaseRecord) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : b.id.localeCompare(a.id))

export function CasesProvider({ store: injected, children }: { store?: CaseStore; children: ReactNode }) {
  const store = useMemo(() => injected ?? createIdbCaseStore(), [injected])
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [unreadable, setUnreadable] = useState<CasesValue['unreadable']>([])
  const [ready, setReady] = useState(false)
  const latest = useRef<CaseRecord[]>([])

  useEffect(() => {
    let cancelled = false
    store
      .list()
      .then((all) => {
        if (cancelled) return
        const good: CaseRecord[] = []
        const bad: CasesValue['unreadable'] = []
        for (const c of all) {
          const errors = validateCaseRecord(c)
          if (errors.length === 0) good.push(closeInterruptedRuns(c))
          else bad.push({ id: (c as { id?: string }).id ?? '(no id)', errors })
        }
        good.sort(byNewest)
        latest.current = good
        setCases(good)
        setUnreadable(bad)
      })
      .catch(() => {
        // storage unreadable: start with no cases rather than failing the app
      })
      .finally(() => !cancelled && setReady(true))
    return () => {
      cancelled = true
    }
  }, [store])

  const save = useCallback(
    async (r: CaseRecord) => {
      await store.put(r)
      const next = [r, ...latest.current.filter((c) => c.id !== r.id)].sort(byNewest)
      latest.current = next
      setCases(next)
    },
    [store],
  )

  const update = useCallback(
    async (id: string, change: (c: CaseRecord) => CaseRecord) => {
      const current = latest.current.find((c) => c.id === id)
      if (!current) return
      const changed = change(current)
      // memory first: a second update that starts before this write finishes must see this change
      const next = [changed, ...latest.current.filter((c) => c.id !== id)].sort(byNewest)
      latest.current = next
      setCases(next)
      await store.put(changed)
    },
    [store],
  )

  const remove = useCallback(
    async (id: string) => {
      await store.remove(id)
      const next = latest.current.filter((c) => c.id !== id)
      latest.current = next
      setCases(next)
    },
    [store],
  )

  const importText = useCallback(
    async (text: string) => {
      const parsed = parseCaseExport(text)
      if (!parsed.ok) return { error: parsed.error }
      const merged = mergeImported(latest.current, parsed.cases)
      const added = merged.slice(latest.current.length)
      for (const c of added) await store.put(c)
      const next = merged.sort(byNewest)
      latest.current = next
      setCases(next)
      return { added: added.length }
    },
    [store],
  )

  const exportText = useCallback(() => exportCases(latest.current), [])

  const value = useMemo<CasesValue>(
    () => ({ cases, unreadable, ready, save, update, remove, importText, exportText }),
    [cases, unreadable, ready, save, update, remove, importText, exportText],
  )
  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>
}
