export interface BloomObjective {
  objective: string;
  bloomLevel: 'Lembrar' | 'Compreender' | 'Aplicar' | 'Analisar' | 'Avaliar' | 'Criar';
}

export interface DevelopmentStep {
  stepName: string;
  whatToTeach: string;
  howToTeach: string;
  resources: string[];
  duration: string;
  classOrganization: string;
}

export interface NeeAdaptation {
  profile: string;
  adaptationObjective: string;
  potentialBarriers: string;
  methodologyAdjustments: string;
  resourceAdjustments: string;
  communicationAdjustments: string;
  evaluationAdjustments: string;
  necessarySupports: string;
  teacherMediation: string;
  peerParticipation: string;
  duaPrinciples: string;
  assistiveTechnologies: string;
  physicalSpace: string;
  cognitiveOverloadPrevention: string;
  activeParticipationSuggestions: string;
}

export interface LessonPlan {
  // Tab 1: Identificação
  discipline: string;
  content: string;
  bnccSkill: string;
  sesiSkill: string;
  context: string;

  // Tab 2: Objetivos
  learningObjectives: BloomObjective[];

  // Tab 3: Metodologia Ativa
  methodologyName: string;
  whyChosen: string;
  howApplied: string;
  pedagogicalBenefits: string;
  teacherRole: string;
  studentRole: string;

  // Tab 4: Desenvolvimento
  developmentSteps: DevelopmentStep[];

  // Tab 5: Avaliação
  evidence: string;
  instruments: string[];
  criteria: string[];
  rubrics: string; // Tabela textua ou descrição estruturada de rubricas
  formativeFeedback: string;

  // Tab 6: Inclusão (DUA)
  duaRepresentation: string;
  duaExpression: string;
  duaEngagement: string;

  // Tab 7: Adaptação da Metodologia para NEE
  selectedProfiles: string[];
  neeAdaptations: NeeAdaptation[];

  // Tab 8: Justificativa Pedagógica
  justificationBncc: string;
  justificationMethodology: string;
  justificationAssessment: string;
  justificationInclusion: string;
}

export interface SavedLessonPlan {
  id: string;
  createdAt: string; // ISO date string
  title: string;
  plan: LessonPlan;
}

export interface GenerationRequest {
  teacherText: string;
  content: string;
  verbBase: string;
  studentCount: number;
  classCharacteristics: string;
  selectedNeeProfiles: string[];
}
