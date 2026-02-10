
export interface LessonPlan {
  discipline: string;
  content: string;
  context: string;
  learningObjectives: string[];
  skills: string[]; // Novo campo para Habilidades BNCC/SESI
  methodology: string;
  development: {
    what: string;
    how: string;
  };
  inclusionStrategies: string; // Novo campo para Adaptações Inclusivas
  learningEvidence: string;
  assessmentInstruments: string;
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
