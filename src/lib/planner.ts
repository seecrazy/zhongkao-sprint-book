import type {
  DailyTask,
  KnowledgePoint,
  ProgressState,
  Question,
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
}: PlannerInput): DailyTask[] {
  const dueMistakes = getDueMistakes(progress, date);
  const tasks: DailyTask[] = [];
  const suffix = dateCode(date);

  if (dueMistakes.length > 0) {
    tasks.push({
      id: `review-${suffix}`,
      type: "review",
      title: `复习 ${dueMistakes.length} 道到期错题`,
      description: "优先清理到期间隔复习任务，连续答对可以推进复习阶段。",
      targetQuestionCount: dueMistakes.length,
      route: {
        page: "practice",
        query: { review: "1" },
      },
    });
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

  topicRanking.slice(0, 2).forEach((item, index) => {
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
      description: "用整卷模式检查当前速度和准确率，交卷后查看分考点报告。",
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
