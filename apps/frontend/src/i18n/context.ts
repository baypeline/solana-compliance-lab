import { createContext } from 'react'
import { en, type Messages } from './en'

// English is the default, so components work without a provider (tests, isolated renders).
export const MessagesContext = createContext<Messages>(en)
