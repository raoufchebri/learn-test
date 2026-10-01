import { useState } from "react";
import type { LearnLesson } from "./learn-content";

export function LessonQuizCard({ lesson, answers, onAnswer, completed, onBack, next }: {
  lesson: LearnLesson; answers: number[]; onAnswer: (index: number, answer: number) => void;
  completed: boolean; onBack: () => void; next?: { title: string; onClick: () => void };
}) {
  const [index, setIndex] = useState(0);
  const question = lesson.quiz[index];
  const correct = answers[index] === question.answer;
  return <section className="lesson-quiz-card" aria-label="Lesson quiz">
    <header><button type="button" onClick={onBack}>← Back to lesson</button><span>Question {index + 1} of {lesson.quiz.length}</span></header>
    <h2>{question.prompt}</h2>
    <div className="quiz-card-choices">{question.choices.map((choice, i) => <button type="button" key={choice}
      aria-pressed={answers[index] === i} className={answers[index] === i ? (correct ? "is-correct" : "is-selected") : ""}
      onClick={() => onAnswer(index, i)}><span>{String.fromCharCode(65 + i)}</span>{choice}</button>)}</div>
    <p className="quiz-card-feedback" role="status">{answers[index] === undefined ? "Choose an answer to continue." : correct ? question.feedback ?? "Correct. Nice work." : "Not quite. Try another answer, or revisit the lesson."}</p>
    <footer>
      {index > 0 && <button type="button" onClick={() => setIndex(index - 1)}>Previous question</button>}
      {index < lesson.quiz.length - 1 ? <button type="button" disabled={!correct} onClick={() => setIndex(index + 1)}>Next question →</button> :
        <button type="button" disabled={!completed} onClick={next?.onClick ?? (() => window.location.assign('/'))}>
          {completed ? next ? `Continue to ${next.title} →` : "Course section complete →" : correct ? "Checking completion…" : "Answer correctly to unlock"}
        </button>}
    </footer>
  </section>;
}