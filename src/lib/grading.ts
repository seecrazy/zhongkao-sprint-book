import type { Question, QuestionResult, UserResponse } from "../types";

export function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/，/g, ",")
    .replace(/或/g, "or")
    .replace(/±/g, "+-");
}

export function gradeQuestion(
  question: Question,
  response: UserResponse | undefined
): QuestionResult {
  const userAnswer = response?.value?.trim() ?? "";
  const base = {
    questionId: question.id,
    userAnswer,
    score: 0,
    maxScore: 1,
  };

  if (!userAnswer) {
    return {
      ...base,
      status: "skipped",
      correctAnswer: getCorrectAnswerText(question),
      errorType: "blank",
    };
  }

  if (question.type === "single-choice") {
    const status = userAnswer.toUpperCase() === question.answer ? "correct" : "wrong";
    return {
      ...base,
      status,
      correctAnswer: question.answer,
      errorType: status === "correct" ? "none" : "concept",
    };
  }

  if (question.type === "numeric") {
    const numeric = Number(userAnswer.replace(/[^\d.+-]/g, ""));
    const tolerance = question.tolerance ?? 0.0001;
    const status =
      Number.isFinite(numeric) && Math.abs(numeric - question.answer) <= tolerance
        ? "correct"
        : "wrong";
    return {
      ...base,
      status,
      correctAnswer: String(question.answer),
      errorType: status === "correct" ? "none" : "calculation",
    };
  }

  const normalizedUser = normalizeText(userAnswer);
  const matched = question.acceptedAnswers.some((answer) => {
    const normalizedAnswer = normalizeText(answer);
    return normalizedUser === normalizedAnswer;
  });

  return {
    ...base,
    status: matched ? "correct" : "wrong",
    correctAnswer: question.acceptedAnswers[0],
    errorType: matched ? "none" : "concept",
  };
}

export function gradeQuestions(
  questions: Question[],
  responses: Record<string, string>
): QuestionResult[] {
  return questions.map((question) =>
    gradeQuestion(question, {
      questionId: question.id,
      value: responses[question.id] ?? "",
    })
  );
}

export function getCorrectAnswerText(question: Question): string {
  if (question.type === "single-choice") return question.answer;
  if (question.type === "numeric") return String(question.answer);
  return question.acceptedAnswers[0];
}
