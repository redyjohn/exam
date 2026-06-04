import type { Question, Subject } from '../data/questions.ts'

type Letter = 'A' | 'B' | 'C' | 'D' | 'E'

type RawQuestion = {
  id: number
  question: string
  options: Partial<Record<Letter, string>>
  answer: Letter
}

type RawEvenQuestion = {
  chapter?: string
  title?: string
  number?: number
  question: string
  options: Partial<Record<Letter, string>>
  answer: Letter
}

type RawBank = {
  questions?: RawQuestion[]
  even_questions?: RawEvenQuestion[]
  odd_questions?: RawEvenQuestion[]
}

type RawQuestionWithMeta = RawQuestion & {
  chapter?: string
  chapterTitle?: string
}

function normalizeRawQuestions(bank: RawBank): RawQuestionWithMeta[] {
  if (bank.questions?.length) {
    return bank.questions
  }

  const imported = [...(bank.even_questions ?? []), ...(bank.odd_questions ?? [])]
  if (imported.length > 0) {
    return imported.map((item, index) => ({
      id: index + 1,
      question: item.question,
      options: item.options,
      answer: item.answer,
      chapter: item.chapter,
      chapterTitle: item.title,
    }))
  }

  return []
}

type ExamScopeConfig = {
  id: string
  label: string
  bankFile: string
  idPrefix: string
}

type ExamScopesFile = {
  scopes: ExamScopeConfig[]
}

const OPTION_ORDER: Letter[] = ['A', 'B', 'C', 'D', 'E']

function toQuestion(raw: RawQuestionWithMeta, idPrefix: string): Question {
  const optionEntries = OPTION_ORDER
    .filter((letter) => Boolean(raw.options[letter]))
    .map((letter) => [letter, raw.options[letter] as string] as const)

  const options = optionEntries.map(([, text]) => text)
  const correctIndex = optionEntries.findIndex(([letter]) => letter === raw.answer)

  if (correctIndex === -1) {
    throw new Error(`題目 ${raw.id} 的答案 ${raw.answer} 不在選項中`)
  }

  return {
    id: `${idPrefix}-${raw.id}`,
    prompt: raw.question,
    options,
    correctIndex,
    explanation: '題庫匯入題目。',
    chapter: raw.chapter,
    chapterTitle: raw.chapterTitle,
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${import.meta.env.BASE_URL}${path}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`載入失敗：${path}（${response.status}）`)
  }
  return (await response.json()) as T
}

function sortByBankId(questions: Question[]): Question[] {
  return [...questions].sort((a, b) => {
    const na = Number(a.id.match(/(\d+)$/)?.[1] ?? 0)
    const nb = Number(b.id.match(/(\d+)$/)?.[1] ?? 0)
    return na - nb
  })
}

export async function loadAnatomySubjects(): Promise<Subject[]> {
  const scopesFile = await fetchJson<ExamScopesFile>('data/exam-scopes.json')

  const subjects = await Promise.all(
    scopesFile.scopes.map(async (scope) => {
      const rawBank = await fetchJson<RawBank>(scope.bankFile)
      const questions = sortByBankId(
        normalizeRawQuestions(rawBank).map((raw) => toQuestion(raw, scope.idPrefix)),
      )

      return {
        id: `anatomy-${scope.id}`,
        label: `解剖與組織學 · ${scope.label}`,
        questions,
      }
    }),
  )

  return subjects
}
