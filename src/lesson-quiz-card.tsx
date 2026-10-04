import { useState } from "react";
import type { LearnLesson } from "./learn-content";

// All questions on one card. Answers are only recorded (and the lesson completed) after "Check my answers".
export function LessonQuizCard({ lesson, answers, onAnswer, completed, next }: {
  lesson: LearnLesson; answers: number[]; onAnswer: (index: number, answer: number) => void;
  completed: boolean; next?: { title: string; onClick: () => void };
}) {
  const [selected, setSelected] = useState<(number | undefined)[]>(() => lesson.quiz.map((_, i) => answers[i]));
  const [checked, setChecked] = useState(() => lesson.quiz.every((_, i) => answers[i] !== undefined));
  const allAnswered = lesson.quiz.every((_, i) => selected[i] !== undefined);
  const allCorrect = lesson.quiz.every((question, i) => selected[i] === question.answer);
  const passed = checked && allCorrect;
  const choose = (index: number, choice: number) => {
    if (passed) return;
    setSelected((current) => { const nextSelected = [...current]; nextSelected[index] = choice; return nextSelected; });
    setChecked(false);
  };
  const check = () => {
    lesson.quiz.forEach((_, i) => { if (selected[i] !== undefined) onAnswer(i, selected[i] as number); });
    setChecked(true);
  };
  const count = lesson.quiz.length;
  return <section className="lesson-quiz-card" aria-label="Lesson quiz">
    <header><span>Quiz · {count === 1 ? "1 question" : `${count} questions`}</span></header>
    {lesson.quiz.map((question, index) => {
      const right = checked && selected[index] === question.answer;
      return <fieldset className="quiz-card-question" key={question.prompt}>
        <legend><h2>{count > 1 ? `${index + 1}. ` : ""}{question.prompt}</h2></legend>
        <div className="quiz-card-choices">{question.choices.map((choice, i) => {
          const isSelected = selected[index] === i;
          const state = isSelected ? (checked ? (right ? "is-correct" : "is-wrong") : "is-selected") : "";
          return <button type="button" key={choice} aria-pressed={isSelected} className={state} disabled={passed && !isSelected}
            onClick={() => choose(index, i)}><span>{String.fromCharCode(65 + i)}</span>{choice}</button>;
        })}</div>
        {checked && <p className="quiz-card-feedback" role="status">{right ? question.feedback ?? "Correct. Nice work." : "Not quite. Choose another answer, then check again."}</p>}
      </fieldset>;
    })}
    <div className="recipe-unlock-action quiz-check-action">
      {!passed
        ? <button type="button" className="recipe-create-button quiz-primary-button" disabled={!allAnswered || checked} onClick={check}>Check my answers</button>
        : <button type="button" className="recipe-create-button quiz-primary-button" disabled={!completed} onClick={next?.onClick ?? (() => window.location.assign('/'))}>
          {completed ? next ? `Continue to ${next.title} →` : "Course section complete →" : "Saving your progress…"}
        </button>}
      <small aria-live="polite">{!allAnswered ? "Answer every question to check your answers." : checked && !allCorrect ? "Some answers aren’t right yet." : ""}</small>
    </div>
  </section>;
}
