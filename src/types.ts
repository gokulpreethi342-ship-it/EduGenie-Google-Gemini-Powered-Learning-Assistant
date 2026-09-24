export type GradeLevel = 'elementary' | 'middle_school' | 'high_school' | 'undergrad' | 'graduate';

export type ExplanationStyle = 'step_by_step' | 'eli5' | 'deep_dive' | 'concise';

export type Subject =
  | 'General'
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Computer Science'
  | 'History'
  | 'Literature & Language'
  | 'Economics & Business';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  subject?: Subject;
  gradeLevel?: GradeLevel;
  style?: ExplanationStyle;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  hint: string;
  explanation: string;
}

export interface QuizData {
  quizTitle: string;
  topic: string;
  gradeLevel: string;
  questions: QuizQuestion[];
}

export interface ParallelMapping {
  analogyPart: string;
  realConceptPart: string;
  explanation: string;
}

export interface IntuitionStep {
  stepNumber: number;
  title: string;
  detail: string;
}

export interface SimplifiedConcept {
  conceptTitle: string;
  oneSentenceSummary: string;
  everydayAnalogy: {
    title: string;
    story: string;
    parallelMapping: ParallelMapping[];
  };
  stepStepIntuition?: IntuitionStep[];
  stepByStepIntuition?: IntuitionStep[];
  whyItMatters: string;
  miniCheckQuestion: {
    question: string;
    answer: string;
  };
}

export interface SavedItem {
  id: string;
  type: 'note' | 'qa' | 'summary' | 'concept' | 'quiz_score';
  title: string;
  content: string;
  subject: Subject;
  gradeLevel: GradeLevel;
  date: string;
  metadata?: any;
}
