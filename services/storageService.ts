
import { LessonPlan, SavedLessonPlan } from "../types";

const STORAGE_KEY = 'pedagogical_assistant_history';

// Gerador de ID simples e compatível com todos os ambientes
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const storageService = {
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
      
      // Tenta salvar no localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      
      return newSavedPlan;
    } catch (e) {
      console.error("Erro ao salvar plano no histórico:", e);
      // Retorna o plano mesmo se falhar o save, para não quebrar a UI
      return {
        ...plan,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
    }
  },

  getHistory: (): SavedLessonPlan[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      
      // Se não for array, considera corrompido e reseta
      if (!Array.isArray(parsed)) {
        console.warn("Histórico corrompido, resetando...");
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      
      return parsed;
    } catch (e) {
      console.error("Erro ao recuperar histórico:", e);
      return [];
    }
  },

  deletePlan: (id: string): SavedLessonPlan[] => {
    try {
      const history = storageService.getHistory();
      const updatedHistory = history.filter(plan => plan.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      return updatedHistory;
    } catch (e) {
      console.error("Erro ao excluir do histórico:", e);
      return [];
    }
  }
};
