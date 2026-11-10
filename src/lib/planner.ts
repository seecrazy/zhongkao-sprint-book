import type {
  DailyTask,
  KnowledgePoint,
  ProgressState,
  Question,
  SprintPhase,
} from "../types";
import { calculateTopicStats, getLocalDateString } from "./mastery";
import { getDueMistakes } from "./storage";

interface PlannerInput {
  date?: Date;
  subjectLabel?: string;
  topics: KnowledgePoint[];
  questions: Question[];
  progress: ProgressState;
  examsAvailable?: boolean;
  sprintPhase?: SprintPhase;
  daysLeft?: number | null;
}

function dateCode(date: Date): string {
  return getLocalDateString(date).replace(/-/g, "");
}

export function buildDailyTasks({
  date = new Date(),
  subjectLabel = "数学",
  topics,
  questions,
  progress,
  examsAvailable = true,
  sprintPhase = "specialized",
  daysLeft = null,
}: PlannerInput): DailyTask[] {
  const dueMistakes = getDueMistakes(progress, date);
  const tasks: DailyTask[] = [];
  const suffix = dateCode(date);

  const countdownNote =
    typeof daysLeft === "number" && daysLeft >= 0 ? `距中考 ${daysLeft} 天 · ` : "";

  if (dueMistakes.length > 0) {
    tasks.push({
      id: `review-${suffix}`,
      type: "review",
      title: `复习 ${dueMistakes.length} 道到期错题`,
      description:
        sprintPhase === "sprint"
          ? `${countdownNote}冲刺期错题必须逐日清零，连续答对可以推进复习阶段。`
          : "优先清理到期间隔复习任务，连续答对可以推进复习阶段。",
      targetQuestionCount: dueMistakes.length,
      route: {
        page: "practice",
        query: { review: "1" },
      },
    });
  }

  // 一轮基础期：把未读的考点讲解作为首要任务，先懂再练。
  if (sprintPhase === "foundation") {
    const unreadTopic = topics.find(
      (topic) =>
        topic.lesson && !progress.readLessonIds.includes(topic.id)
    );
    if (unreadTopic) {
      tasks.push({
        id: `lesson-${unreadTopic.id}-${suffix}`,
        type: "topic",
        title: `通读讲解：${unreadTopic.name}`,
        description:
          "基础期先读讲解再做题：过一遍概念、公式、例题和易错点，再进入练习。",
        targetTopicId: unreadTopic.id,
        route: {
          page: "practice",
          query: { topic: unreadTopic.id },
        },
      });
    }
  }

  const topicRanking = topics
    .map((topic) => ({
      topic,
      stats: calculateTopicStats(topic.id, questions, progress.attempts),
    }))
    .filter((item) => item.stats.totalQuestions > 0)
    .sort((left, right) => {
      if (left.stats.mastery !== right.stats.mastery) {
        return left.stats.mastery - right.stats.mastery;
      }

      const weightOrder = { high: 0, medium: 1, low: 2 } as const;
      return weightOrder[left.topic.examWeight] - weightOrder[right.topic.examWeight];
    });

  // 冲刺期聚焦整卷和错题，专项训练收敛为 1 个最薄弱考点。
  const topicTaskCount = sprintPhase === "sprint" ? 1 : 2;

  topicRanking.slice(0, topicTaskCount).forEach((item, index) => {
    const targetQuestionCount = Math.min(
      5,
      Math.max(3, item.stats.totalQuestions)
    );

    tasks.push({
      id: `topic-${item.topic.id}-${suffix}-${index + 1}`,
      type: "topic",
      title: `专项训练：${item.topic.name}`,
      description: `掌握度 ${item.stats.mastery}%。建议完成 ${targetQuestionCount} 道题，优先纠正概念和方法。`,
      targetTopicId: item.topic.id,
      targetQuestionCount,
      route: {
        page: "practice",
        query: { topic: item.topic.id },
      },
    });
  });

  if (examsAvailable && questions.length >= 10) {
    tasks.push({
      id: `exam-${suffix}`,
      type: "exam",
      title: `完成一次${subjectLabel}限时摸底`,
      description:
        sprintPhase === "sprint"
          ? `${countdownNote}冲刺期以整卷节奏训练为主，按中考时间要求完成并复盘。`
          : "用整卷模式检查当前速度和准确率，交卷后查看分考点报告。",
      route: {
        page: "exam",
      },
    });
  }

  tasks.push({
    id: `summary-${suffix}`,
    type: "summary",
    title: "复盘今日答案解析",
    description: "重点看错因、更优方法和同类题思路，不要求刷新题量。",
  });

  return tasks;
}

export function isDailyTaskCompleted(
  progress: ProgressState,
  date: Date,
  taskId: string
): boolean {
  return progress.dailyPlans[getLocalDateString(date)]?.completedTaskIds.includes(taskId) ?? false;
}
