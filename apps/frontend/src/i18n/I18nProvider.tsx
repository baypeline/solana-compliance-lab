import type { ReactNode } from 'react'
import { MessagesContext } from './context'
import { en, type Messages } from './en'

export function I18nProvider({ messages = en, children }: { messages?: Messages; children: ReactNode }) {
  return <MessagesContext.Provider value={messages}>{children}</MessagesContext.Provider>
}
