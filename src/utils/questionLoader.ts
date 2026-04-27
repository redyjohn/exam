import type { Question, Subject } from '../data/questions.ts'

type Letter = 'A' | 'B' | 'C' | 'D' | 'E'

type RawQuestion = {
  id: number
  question: string
  options: Partial<Record<Letter, string>>
  answer: Letter
}

type RawBank = {
  questions: RawQuestion[]
}

const OPTION_ORDER: Letter[] = ['A', 'B', 'C', 'D', 'E']

function toQuestion(raw: RawQuestion): Question {
  const optionEntries = OPTION_ORDER
    .filter((letter) => Boolean(raw.options[letter]))
    .map((letter) => [letter, raw.options[letter] as string] as const)

  const options = optionEntries.map(([, text]) => text)
  const correctIndex = optionEntries.findIndex(([letter]) => letter === raw.answer)

  if (correctIndex === -1) {
    throw new Error(`題目 ${raw.id} 的答案 ${raw.answer} 不在選項中`)
  }

  return {
    id: `an-${raw.id}`,
    prompt: raw.question,
    options,
    correctIndex,
    explanation: '題庫匯入題目。',
  }
}

export async function loadAnatomySubject(): Promise<Subject> {
  const url = `${import.meta.env.BASE_URL}data/anatomy.json`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`載入題庫失敗：${response.status}`)
  }

  const raw = (await response.json()) as RawBank
  return {
    id: 'anatomy',
    label: '解剖與組織學',
    questions: raw.questions.map(toQuestion),
  }
}
