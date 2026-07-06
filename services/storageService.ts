import { LessonPlan, SavedLessonPlan } from "../types";

const STORAGE_KEY = "pedagogical_assistant_history";
const BACKUP_KEY = "pedagogical_assistant_history_backup";
const SCHEMA_VERSION_KEY = "pedagogical_assistant_schema_version";
const CURRENT_SCHEMA_VERSION = 1;

// ID Generator
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Strongly-typed validation helper to avoid "any"
function isValidSavedLessonPlan(plan: unknown): plan is SavedLessonPlan {
  if (typeof plan !== "object" || plan === null) return false;
  
  const p = plan as Record<string, unknown>;
  
  return (
    typeof p.id === "string" &&
    typeof p.createdAt === "string" &&
    typeof p.discipline === "string" &&
    typeof p.content === "string" &&
    typeof p.context === "string" &&
    Array.isArray(p.learningObjectives) &&
    p.learningObjectives.every(item => typeof item === "string") &&
    Array.isArray(p.skills) &&
    p.skills.every(item => typeof item === "string") &&
    typeof p.methodology === "string" &&
    typeof p.development === "object" &&
    p.development !== null &&
    typeof (p.development as Record<string, unknown>).what === "string" &&
    typeof (p.development as Record<string, unknown>).how === "string" &&
    typeof p.inclusionStrategies === "string" &&
    typeof p.learningEvidence === "string" &&
    typeof p.assessmentInstruments === "string" &&
    (p.justification === undefined || typeof p.justification === "string")
  );
}

// Migration manager
function runMigrations(storedVersion: number, data: unknown[]): SavedLessonPlan[] {
  let migratedData = [...data];

  // If a future version needs changes, we can write sequential step transitions:
  // if (storedVersion < 2) { ... migrate to v2 ... }

  return migratedData as SavedLessonPlan[];
}

export const storageService = {
  /**
   * Salva um plano de aula no histórico com validação, backup e geração de ID.
   */
  savePlan: (plan: LessonPlan): SavedLessonPlan => {
    try {
      const history = storageService.getHistory();

      const newSavedPlan: SavedLessonPlan = {
        ...plan,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      // Adiciona no início da lista (mais recente primeiro)
      const updatedHistory = [newSavedPlan, ...history];

      // Salva principal e backup
      const serialized = JSON.stringify(updatedHistory);
      localStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem(BACKUP_KEY, serialized);
      localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));

      return newSavedPlan;
    } catch (e) {
      console.error("Erro ao salvar plano no histórico:", e);
      // Retorna o plano mesmo se falhar o save, para não interromper a usabilidade
      return {
        ...plan,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Duplica um plano de aula existente no histórico para iteração rápida.
   */
  duplicatePlan: (id: string): SavedLessonPlan[] => {
    try {
      const history = storageService.getHistory();
      const planToDuplicate = history.find((plan) => plan.id === id);
      if (!planToDuplicate) {
        return history;
      }

      const clone: SavedLessonPlan = {
        ...planToDuplicate,
        id: generateId(),
        createdAt: new Date().toISOString(),
        content: `${planToDuplicate.content} (Cópia)`,
      };

      const updatedHistory = [clone, ...history];
      const serialized = JSON.stringify(updatedHistory);
      localStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem(BACKUP_KEY, serialized);

      return updatedHistory;
    } catch (e) {
      console.error("Erro ao duplicar plano:", e);
      return [];
    }
  },

  /**
   * Importa múltiplos planos no histórico a partir de um backup externo validando todos os dados.
   */
  importHistory: (importedPlans: unknown[]): { success: boolean; count: number; error?: string } => {
    try {
      if (!Array.isArray(importedPlans)) {
        return { success: false, count: 0, error: "O arquivo de backup deve conter um array de planos de aula." };
      }

      const validImported = importedPlans.filter(isValidSavedLessonPlan);
      if (validImported.length === 0) {
        return { success: false, count: 0, error: "Nenhum plano válido encontrado no arquivo de backup." };
      }

      const currentHistory = storageService.getHistory();
      
      // Evitar duplicados comparando IDs (se já houver o mesmo ID, mantém o atual ou atualiza)
      const currentIds = new Set(currentHistory.map(p => p.id));
      const newItems = validImported.filter(p => !currentIds.has(p.id));

      const updatedHistory = [...newItems, ...currentHistory];
      const serialized = JSON.stringify(updatedHistory);
      localStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem(BACKUP_KEY, serialized);

      return { success: true, count: newItems.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e?.message || "Erro desconhecido durante a importação." };
    }
  },

  /**
   * Obtém o histórico com validação profunda, recuperação de corrupção via backup e execução de migrações.
   */
  getHistory: (): SavedLessonPlan[] => {
    try {
      let stored = localStorage.getItem(STORAGE_KEY);
      let usedBackup = false;

      // 1. Tratamento de corrupção: tenta ler o principal. Se falhar, recorre ao backup
      if (!stored) {
        const backup = localStorage.getItem(BACKUP_KEY);
        if (backup) {
          console.warn("[Storage] Principal ausente. Restaurando histórico a partir do backup de segurança.");
          stored = backup;
          localStorage.setItem(STORAGE_KEY, backup);
          usedBackup = true;
        }
      }

      if (!stored) {
        return [];
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(stored);
      } catch (parseError) {
        console.error("[Storage] Falha crítica de parse no armazenamento principal. Tentando backup...");
        
        if (!usedBackup) {
          const backup = localStorage.getItem(BACKUP_KEY);
          if (backup) {
            try {
              parsed = JSON.parse(backup);
              localStorage.setItem(STORAGE_KEY, backup);
              console.log("[Storage] Backup de segurança restaurado e parsed com sucesso.");
            } catch (backupParseError) {
              console.error("[Storage] Backup também está corrompido.");
            }
          }
        }
      }

      // Se tudo estiver corrompido, retorna lista vazia de forma segura
      if (!Array.isArray(parsed)) {
        console.warn("[Storage] Histórico corrompido irrecuperável, resetando de forma segura.");
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(BACKUP_KEY);
        return [];
      }

      // 2. Validação profunda dos itens carregados
      const validPlans = parsed.filter(isValidSavedLessonPlan);

      if (validPlans.length !== parsed.length) {
        console.warn(`[Storage] Filtrados ${parsed.length - validPlans.length} planos corrompidos ou inválidos do histórico.`);
        // Atualiza armazenamento com itens higienizados
        const serializedClean = JSON.stringify(validPlans);
        localStorage.setItem(STORAGE_KEY, serializedClean);
        localStorage.setItem(BACKUP_KEY, serializedClean);
      }

      // 3. Executa migrações futuras se a versão armazenada for diferente
      const storedVersion = Number(localStorage.getItem(SCHEMA_VERSION_KEY) || "1");
      if (storedVersion < CURRENT_SCHEMA_VERSION) {
        const migratedPlans = runMigrations(storedVersion, validPlans);
        localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
        
        const serializedMigrated = JSON.stringify(migratedPlans);
        localStorage.setItem(STORAGE_KEY, serializedMigrated);
        localStorage.setItem(BACKUP_KEY, serializedMigrated);
        return migratedPlans;
      }

      return validPlans;
    } catch (e) {
      console.error("Erro crítico ao carregar histórico:", e);
      return [];
    }
  },

  /**
   * Exclui um plano de aula do histórico mantendo o backup sincronizado.
   */
  deletePlan: (id: string): SavedLessonPlan[] => {
    try {
      const history = storageService.getHistory();
      const updatedHistory = history.filter((plan) => plan.id !== id);
      
      const serialized = JSON.stringify(updatedHistory);
      localStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem(BACKUP_KEY, serialized);
      
      return updatedHistory;
    } catch (e) {
      console.error("Erro ao excluir do histórico:", e);
      return [];
    }
  },
};
