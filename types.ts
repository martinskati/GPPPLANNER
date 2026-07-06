
export interface LessonPlan {
  discipline: string;
  content: string;
  context: string;
  learningObjectives: string[];
  skills: string[]; // Habilidades BNCC/SESI
  methodology: string;
  development: {
    what: string;
    how: string;
  };
  inclusionStrategies: string; // Adaptações Inclusivas / DUA
  learningEvidence: string;
  assessmentInstruments: string;
  justification?: string; // Justificativa pedagógica interna do plano
}

export interface SavedLessonPlan extends LessonPlan {
  id: string;
  createdAt: string; // ISO Date string
}

export interface AppState {
  isGenerating: boolean;
  plan: LessonPlan | null;
  error: string | null;
  showHistory: boolean;
}

