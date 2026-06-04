import './style.css'
import { SUBJECTS, type Question, type Subject } from './data/questions.ts'
import { loadAnatomySubjects } from './utils/questionLoader.ts'

type PageMode = 'home' | 'quiz' | 'result' | 'read'

type QuizState = {
  subject: Subject | null
  questions: Question[]
  currentIndex: number
  answers: Record<string, number>
  pageMode: PageMode
  quizTitle: string
}

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('找不到 #app 容器')
}
const root = app

const state: QuizState = {
  subject: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  pageMode: 'home',
  quizTitle: '',
}
let subjects: Subject[] = SUBJECTS
let isLoadingSubjects = true
let subjectLoadError: string | null = null

function shuffle<T>(arr: T[]): T[] {
  const cloned = [...arr]
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cloned[i], cloned[j]] = [cloned[j], cloned[i]]
  }
  return cloned
}

function startQuizWithQuestions(subjectId: string, questions: Question[], quizTitle: string): void {
  const subject = subjects.find((item) => item.id === subjectId)
  if (!subject) return

  state.subject = subject
  state.questions = questions
  state.currentIndex = 0
  state.answers = {}
  state.pageMode = 'quiz'
  state.quizTitle = quizTitle
  render()
}

function resetAll(): void {
  state.subject = null
  state.questions = []
  state.currentIndex = 0
  state.answers = {}
  state.pageMode = 'home'
  state.quizTitle = ''
  render()
}

function retryWrongOnly(): void {
  if (!state.subject) return
  const wrongQuestions = state.questions.filter((q) => state.answers[q.id] !== q.correctIndex)
  if (wrongQuestions.length === 0) {
    resetAll()
    return
  }

  state.questions = wrongQuestions
  state.currentIndex = 0
  state.answers = {}
  state.pageMode = 'quiz'
  state.quizTitle = `${state.subject.label} - 錯題重練`
  render()
}

function goNext(): void {
  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex += 1
  } else {
    state.pageMode = 'result'
  }
  render()
}

function goPrev(): void {
  if (state.currentIndex > 0) {
    state.currentIndex -= 1
  }
  render()
}

function chooseAnswer(answerIndex: number): void {
  const currentQuestion = state.questions[state.currentIndex]
  if (!currentQuestion) return
  state.answers[currentQuestion.id] = answerIndex
  render()
}

function getScoreSummary(): { correct: number; total: number; wrong: number } {
  const total = state.questions.length
  const correct = state.questions.filter((q) => state.answers[q.id] === q.correctIndex).length
  return { correct, total, wrong: total - correct }
}

function getQuestionNumber(question: Question): number {
  const match = question.id.match(/(\d+)$/)
  return match ? Number(match[1]) : Number(question.id)
}

function sortByQuestionNumber(questions: Question[]): Question[] {
  return [...questions].sort((a, b) => getQuestionNumber(a) - getQuestionNumber(b))
}

function getDisplayNumber(subject: Subject, question: Question): number {
  const ordered = sortByQuestionNumber(subject.questions)
  const idx = ordered.findIndex((item) => item.id === question.id)
  return idx === -1 ? 0 : idx + 1
}

function getQuarterRanges(questions: Question[]): Array<{ start: number; end: number; questions: Question[] }> {
  const sorted = sortByQuestionNumber(questions)
  const total = sorted.length
  const chunk = Math.ceil(total / 4)

  return Array.from({ length: 4 }, (_, idx) => {
    const start = idx * chunk + 1
    const end = Math.min((idx + 1) * chunk, total)
    const scoped = sorted.slice(start - 1, end)
    if (scoped.length === 0) return null
    return { start, end, questions: scoped }
  }).filter((range): range is { start: number; end: number; questions: Question[] } => range !== null)
}

function getChapterRanges(
  questions: Question[],
): Array<{ chapter: string; title: string; questions: Question[] }> {
  const sorted = sortByQuestionNumber(questions)
  const byChapter = new Map<string, { chapter: string; title: string; questions: Question[] }>()

  for (const question of sorted) {
    const chapter = question.chapter ?? ''
    if (!chapter) continue
    const existing = byChapter.get(chapter)
    if (existing) {
      existing.questions.push(question)
    } else {
      byChapter.set(chapter, {
        chapter,
        title: question.chapterTitle ?? '',
        questions: [question],
      })
    }
  }

  return [...byChapter.values()].sort((a, b) => Number(a.chapter) - Number(b.chapter))
}

function usesChapterQuiz(subject: Subject): boolean {
  return subject.id === 'anatomy-exam2'
}

function startReadMode(subjectId: string): void {
  const subject = subjects.find((item) => item.id === subjectId)
  if (!subject) return
  state.subject = subject
  state.pageMode = 'read'
  render()
}

function startRandom50(subjectId: string): void {
  const subject = subjects.find((item) => item.id === subjectId)
  if (!subject) return
  const sampled = shuffle(subject.questions).slice(0, Math.min(50, subject.questions.length))
  startQuizWithQuestions(subjectId, sampled, `${subject.label} - 隨機 50 題`)
}

function startQuarterQuiz(subjectId: string, quarterIndex: number): void {
  const subject = subjects.find((item) => item.id === subjectId)
  if (!subject) return
  const ranges = getQuarterRanges(subject.questions)
  const selectedRange = ranges[quarterIndex]
  if (!selectedRange) return

  startQuizWithQuestions(
    subjectId,
    selectedRange.questions,
    `${subject.label} - ${selectedRange.start}-${selectedRange.end} 題`,
  )
}

function startChapterQuiz(subjectId: string, chapterIndex: number): void {
  const subject = subjects.find((item) => item.id === subjectId)
  if (!subject) return
  const ranges = getChapterRanges(subject.questions)
  const selectedRange = ranges[chapterIndex]
  if (!selectedRange) return

  const chapterLabel = selectedRange.title
    ? `第 ${selectedRange.chapter} 章 ${selectedRange.title}`
    : `第 ${selectedRange.chapter} 章`

  startQuizWithQuestions(subjectId, selectedRange.questions, `${subject.label} - ${chapterLabel}`)
}

function renderSegmentQuizButtons(subject: Subject): string {
  if (usesChapterQuiz(subject)) {
    const chapters = getChapterRanges(subject.questions)
    return `
              <p class="subtle">章節測驗（依序出題）</p>
              <div class="actions">
                ${chapters
                  .map(
                    (ch, idx) => `
                    <button class="btn" data-action="chapter" data-subject="${subject.id}" data-chapter="${idx}">
                      第 ${ch.chapter} 章 ${ch.title}（${ch.questions.length} 題）
                    </button>
                  `,
                  )
                  .join('')}
              </div>
              `
  }

  return `
              <p class="subtle">四等分測驗（依序出題）</p>
              <div class="actions">
                ${getQuarterRanges(subject.questions)
                  .map(
                    (range, idx) => `
                    <button class="btn" data-action="quarter" data-subject="${subject.id}" data-quarter="${idx}">
                      ${range.start}-${range.end} 題
                    </button>
                  `,
                  )
                  .join('')}
              </div>
              `
}

function renderHome(): string {
  if (isLoadingSubjects) {
    return `
      <main class="container">
        <header class="hero">
          <h1>複習網站</h1>
          <p>題庫載入中...</p>
        </header>
      </main>
    `
  }

  if (subjectLoadError) {
    return `
      <main class="container">
        <header class="hero">
          <h1>複習網站</h1>
          <p>題庫載入失敗：${subjectLoadError}</p>
        </header>
      </main>
    `
  }

  return `
    <main class="container">
      <header class="hero">
        <h1>複習網站</h1>
        <p>選擇考試範圍後可題庫閱讀、隨機 50 題；第一次範圍為四等分測驗，第二次範圍為章節測驗（題號為該範圍內 Q1 起算）。</p>
      </header>
      <section class="card-list">
        ${subjects.map((subject) => {
          const empty = subject.questions.length === 0
          return `
            <article class="card">
              <h2>${subject.label}</h2>
              <p>共 ${subject.questions.length} 題</p>
              ${
                empty
                  ? '<p class="subtle">題庫尚無題目，請匯入題目到 public/data/anatomy-exam2.json</p>'
                  : `
              <div class="actions">
                <button class="btn ghost" data-action="read" data-subject="${subject.id}">題庫閱讀</button>
                <button class="btn primary" data-action="random-50" data-subject="${subject.id}">隨機 50 題</button>
              </div>
              ${renderSegmentQuizButtons(subject)}
              `
              }
            </article>
          `
        }).join('')}
      </section>
    </main>
  `
}

function renderRead(): string {
  if (!state.subject) return renderHome()
  const orderedQuestions = sortByQuestionNumber(state.subject.questions)
  return `
    <main class="container">
      <header class="quiz-header">
        <button class="btn ghost" data-action="home">返回首頁</button>
        <div>
          <h1>${state.subject.label} - 題庫閱讀</h1>
          <p>共 ${state.subject.questions.length} 題，含答案</p>
        </div>
      </header>
      <section class="read-list">
        ${orderedQuestions
          .map(
            (q, idx) => `
            <article class="card read-item">
              <h2>Q${idx + 1}. ${q.prompt}</h2>
              <ul>
                ${q.options
                  .map(
                    (option, optionIdx) => `
                    <li class="${q.correctIndex === optionIdx ? 'correct-option' : ''}">
                      ${String.fromCharCode(65 + optionIdx)}. ${option}
                    </li>
                  `,
                  )
                  .join('')}
              </ul>
              <p class="hint">答案：${String.fromCharCode(65 + q.correctIndex)}</p>
            </article>
          `,
          )
          .join('')}
      </section>
    </main>
  `
}

function renderQuiz(): string {
  const currentQuestion = state.questions[state.currentIndex]
  if (!currentQuestion || !state.subject) return renderHome()

  const selected = state.answers[currentQuestion.id]
  const progress = `${state.currentIndex + 1} / ${state.questions.length}`

  return `
    <main class="container">
      <header class="quiz-header">
        <button class="btn ghost" data-action="home">返回科目選擇</button>
        <div>
          <h1>${state.quizTitle || state.subject.label}</h1>
          <p>進度 ${progress}</p>
        </div>
      </header>

      <section class="card question-card">
        <h2>Q${getDisplayNumber(state.subject, currentQuestion)}. ${currentQuestion.prompt}</h2>
        <div class="options">
          ${currentQuestion.options
            .map(
              (option, idx) => `
                <button class="option ${selected === idx ? 'selected' : ''}" data-action="answer" data-index="${idx}">
                  ${String.fromCharCode(65 + idx)}. ${option}
                </button>
              `,
            )
            .join('')}
        </div>
        <div class="actions">
          <button class="btn" data-action="prev" ${state.currentIndex === 0 ? 'disabled' : ''}>上一題</button>
          <button class="btn primary" data-action="next" ${selected === undefined ? 'disabled' : ''}>
            ${state.currentIndex === state.questions.length - 1 ? '完成測驗' : '下一題'}
          </button>
        </div>
      </section>
    </main>
  `
}

function renderResult(): string {
  const summary = getScoreSummary()
  const score = summary.total > 0 ? Math.round((summary.correct / summary.total) * 100) : 0
  const wrongList = state.questions.filter((q) => state.answers[q.id] !== q.correctIndex)

  return `
    <main class="container">
      <header class="hero">
        <h1>測驗結果</h1>
        <p>答對 ${summary.correct} / ${summary.total} 題（${score} 分）</p>
      </header>

      <section class="card result">
        <p>答錯 ${summary.wrong} 題</p>
        <div class="actions">
          <button class="btn primary" data-action="retry-wrong">只重練錯題</button>
          <button class="btn" data-action="restart">回到首頁</button>
        </div>
      </section>

      ${
        wrongList.length > 0
          ? `
        <section class="card-list">
          ${wrongList
            .map(
              (q) => `
              <article class="card wrong-item">
                <h2>${q.prompt}</h2>
                <p>你的答案：${
                  state.answers[q.id] === undefined
                    ? '未作答'
                    : q.options[state.answers[q.id]]
                }</p>
                <p>正確答案：${q.options[q.correctIndex]}</p>
                <p class="hint">${q.explanation}</p>
              </article>
            `,
            )
            .join('')}
        </section>
      `
          : ''
      }
    </main>
  `
}

function bindEvents(): void {
  const readButtons = document.querySelectorAll<HTMLButtonElement>('button[data-action="read"]')
  readButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const subjectId = button.dataset.subject
      if (subjectId) startReadMode(subjectId)
    })
  })

  const randomButtons = document.querySelectorAll<HTMLButtonElement>('button[data-action="random-50"]')
  randomButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const subjectId = button.dataset.subject
      if (subjectId) startRandom50(subjectId)
    })
  })

  const quarterButtons = document.querySelectorAll<HTMLButtonElement>('button[data-action="quarter"]')
  quarterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const subjectId = button.dataset.subject
      const rawQuarter = button.dataset.quarter
      if (!subjectId || rawQuarter === undefined) return
      startQuarterQuiz(subjectId, Number(rawQuarter))
    })
  })

  const chapterButtons = document.querySelectorAll<HTMLButtonElement>('button[data-action="chapter"]')
  chapterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const subjectId = button.dataset.subject
      const rawChapter = button.dataset.chapter
      if (!subjectId || rawChapter === undefined) return
      startChapterQuiz(subjectId, Number(rawChapter))
    })
  })

  document.querySelector<HTMLButtonElement>('button[data-action="home"]')?.addEventListener('click', resetAll)
  document.querySelector<HTMLButtonElement>('button[data-action="prev"]')?.addEventListener('click', goPrev)
  document.querySelector<HTMLButtonElement>('button[data-action="next"]')?.addEventListener('click', goNext)
  document.querySelector<HTMLButtonElement>('button[data-action="restart"]')?.addEventListener('click', resetAll)
  document
    .querySelector<HTMLButtonElement>('button[data-action="retry-wrong"]')
    ?.addEventListener('click', retryWrongOnly)

  const answerButtons = document.querySelectorAll<HTMLButtonElement>('button[data-action="answer"]')
  answerButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const rawIndex = button.dataset.index
      if (rawIndex === undefined) return
      chooseAnswer(Number(rawIndex))
    })
  })
}

function render(): void {
  if (state.pageMode === 'home' || !state.subject) {
    root.innerHTML = renderHome()
  } else if (state.pageMode === 'read') {
    root.innerHTML = renderRead()
  } else if (state.pageMode === 'result') {
    root.innerHTML = renderResult()
  } else {
    root.innerHTML = renderQuiz()
  }

  bindEvents()
}

async function init(): Promise<void> {
  try {
    const anatomySubjects = await loadAnatomySubjects()
    subjects = subjects.filter((item) => !item.id.startsWith('anatomy-')).concat(anatomySubjects)
  } catch (error) {
    subjectLoadError = error instanceof Error ? error.message : '未知錯誤'
  } finally {
    isLoadingSubjects = false
    render()
  }
}

render()
void init()
