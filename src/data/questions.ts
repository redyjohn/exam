export type Question = {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
}

export type Subject = {
  id: string
  label: string
  questions: Question[]
}

export const SUBJECTS: Subject[] = [
]
