import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const inputPath = process.argv[2] || join(root, 'public/data/anatomy-exam2-source.json')
const outputPath = join(root, 'public/data/anatomy-exam2.json')

const raw = JSON.parse(readFileSync(inputPath, 'utf8'))
const source = raw.even_questions || raw.questions

if (!Array.isArray(source) || source.length === 0) {
  throw new Error('找不到 even_questions 或 questions 陣列')
}

const questions = source.map((item, index) => ({
  id: index + 1,
  question: item.question,
  options: item.options,
  answer: item.answer,
}))

writeFileSync(outputPath, JSON.stringify({ questions }, null, 2) + '\n', 'utf8')
console.log(`已匯入 ${questions.length} 題 -> ${outputPath}`)
