import './style.css'
import { SUBJECTS, type Question, type Subject } from './data/questions.ts'

type QuizState = {
  subject: Subject | null
  questions: Question[]
  currentIndex: number
  answers: Record<string, number>
  finished: boolean
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
  finished: false,
}

function shuffle<T>(arr: T[]): T[] {
  const cloned = [...arr]
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cloned[i], cloned[j]] = [cloned[j], cloned[i]]
  }
  return cloned
}

function startQuiz(subjectId: string): void {
  const subject = SUBJECTS.find((item) => item.id === subjectId)
  if (!subject) return

  state.subject = subject
  state.questions = shuffle(subject.questions)
  state.currentIndex = 0
  state.answers = {}
  state.finished = false
  render()
}

function resetAll(): void {
  state.subject = null
  state.questions = []
  state.currentIndex = 0
  state.answers = {}
  state.finished = false
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
  state.finished = false
  render()
}

function goNext(): void {
  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex += 1
  } else {
    state.finished = true
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

function renderHome(): string {
  return `
    <main class="container">
      <header class="hero">
        <h1>複習網站</h1>
        <p>參考題庫練習網站概念，快速選科目、即時作答、看成績、重練錯題。</p>
      </header>
      <section class="card-list">
        ${SUBJECTS.map(
          (subject) => `
            <article class="card">
              <h2>${subject.label}</h2>
              <p>共 ${subject.questions.length} 題</p>
              <button class="btn primary" data-action="start" data-subject="${subject.id}">開始複習</button>
            </article>
          `,
        ).join('')}
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
          <h1>${state.subject.label}</h1>
          <p>進度 ${progress}</p>
        </div>
      </header>

      <section class="card question-card">
        <h2>Q${state.currentIndex + 1}. ${currentQuestion.prompt}</h2>
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
  const startButtons = document.querySelectorAll<HTMLButtonElement>('button[data-action="start"]')
  startButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const subjectId = button.dataset.subject
      if (subjectId) startQuiz(subjectId)
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
  if (!state.subject) {
    root.innerHTML = renderHome()
  } else if (state.finished) {
    root.innerHTML = renderResult()
  } else {
    root.innerHTML = renderQuiz()
  }

  bindEvents()
}

render()
