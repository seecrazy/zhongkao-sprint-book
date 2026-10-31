import mathContent from "./math.json";
import type { KnowledgePoint, Question } from "../types";

export const mathContentVersion: string = mathContent.version;

export const knowledgePoints = mathContent.knowledgePoints as KnowledgePoint[];

export const sampleQuestions = mathContent.questions as Question[];
