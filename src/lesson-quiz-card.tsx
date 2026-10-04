import { useState } from "react";
import type { LearnLesson } from "./learn-content";

// All questions on one card. Each answer shows its result right away: green if right; red if wrong, with the
// right answer highlighted. The lesson completes once every question has its right answer selected.
export function LessonQuizCard({ lesson, answers, onAnswer, completed, next }: {
  lesson: LearnLesson; answers: number[]; onAnswer: (index: number, answer: number) => void;
  completed: boolean; next?: { title: string; onClick: () => void };
}) {
  const [selected, setSelected] = useState<(number | undefined)[]>(() => lesson.quiz.map((_, i) => answers[i]));
  const allCorrect = lesson.quiz.every((question, i) => selected[i] === question.answer);
  const choose = (index: number, choice: number) => {
    if (selected[index] === lesson.quiz[index].answer) return; // Already right: keep it.
    setSelected((current) => { const nextSelected = [...current]; nextSelected[index] = choice; return nextSelected; });
    onAnswer(index, choice);
  };
  const count = lesson.quiz.length;
  return <section className="lesson-quiz-card" aria-label="Lesson quiz">
    <header><span>Quiz · {count === 1 ? "1 question" : `${count} questions`}</span></header>
    {lesson.quiz.map((question, index) => {
      const picked = selected[index];
      const answered = picked !== undefined;
      const right = picked === question.answer;
      return <fieldset className="quiz-card-question" key={question.prompt}>
        <legend><h2>{count > 1 ? `${index + 1}. ` : ""}{question.prompt}</h2></legend>
        <div className="quiz-card-choices">{question.choices.map((choice, i) => {
          const isPicked = picked === i;
          const isAnswer = i === question.answer;
          const state = isPicked ? (right ? "is-correct" : "is-wrong") : answered && !right && isAnswer ? "is-answer" : "";
          return <button type="button" key={choice} aria-pressed={isPicked} className={state} disabled={right && !isPicked}
            onClick={() => choose(index, i)}><span>{String.fromCharCode(65 + i)}</span>{choice}</button>;
        })}</div>
        {answered && <p className={`quiz-card-feedback ${right ? "is-right" : "is-wrong"}`} role="status">{right
          ? question.feedback ?? "Correct. Nice work."
          : <>Not quite. The right answer is <strong>{String.fromCharCode(65 + question.answer)}. {question.choices[question.answer]}</strong> Select it to continue.</>}</p>}
      </fieldset>;
    })}
    <div className={`recipe-unlock-action quiz-check-action ${completed ? "is-open" : ""}`}>
      <button type="button" className="recipe-create-button quiz-primary-button" disabled={!completed} onClick={next?.onClick ?? (() => window.location.assign('/'))}>
        {completed ? next ? `Continue to ${next.title} →` : "Course section complete →" : allCorrect ? "Saving your progress…" : "Continue"}
      </button>
      <small aria-live="polite">{allCorrect ? "" : "Answer every question correctly to continue."}</small>
    </div>
  </section>;
}
