import { SavedLessonPlan, LessonPlan } from "../types";

const STORAGE_KEY = "pedagogical_lesson_plans_v2";

export class StorageService {
  /**
   * Retorna todos os planos de aula salvos
   */
  static getPlans(): SavedLessonPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error("[StorageService] Falha ao ler planos salvos", e);
      return [];
    }
  }

  /**
   * Salva ou atualiza um plano de aula
   */
  static savePlan(plan: LessonPlan, existingId?: string): SavedLessonPlan {
    const plans = this.getPlans();
    const id = existingId || crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    // Define a title based on discipline and content
    const title = `${plan.discipline || "Sem Disciplina"} - ${plan.content || "Sem Conteúdo"}`;

    const newSavedPlan: SavedLessonPlan = {
      id,
      createdAt,
      title,
      plan,
    };

    if (existingId) {
      const index = plans.findIndex(p => p.id === existingId);
      if (index !== -1) {
        plans[index] = newSavedPlan;
      } else {
        plans.push(newSavedPlan);
      }
    } else {
      plans.push(newSavedPlan);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return newSavedPlan;
  }

  /**
   * Duplica um plano de aula existente
   */
  static duplicatePlan(id: string): SavedLessonPlan | null {
    const plans = this.getPlans();
    const planToDuplicate = plans.find(p => p.id === id);
    if (!planToDuplicate) return null;

    const duplicatedPlan: LessonPlan = JSON.parse(JSON.stringify(planToDuplicate.plan));
    duplicatedPlan.content = `${duplicatedPlan.content} (Cópia)`;

    return this.savePlan(duplicatedPlan);
  }

  /**
   * Exclui um plano de aula
   */
  static deletePlan(id: string): void {
    const plans = this.getPlans();
    const filtered = plans.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * Pesquisa planos com base em um termo de busca
   */
  static searchPlans(query: string): SavedLessonPlan[] {
    const plans = this.getPlans();
    if (!query || !query.trim()) return plans;

    const lowerQuery = query.toLowerCase().trim();

    return plans.filter(p => {
      const plan = p.plan;
      return (
        p.title.toLowerCase().includes(lowerQuery) ||
        (plan.discipline && plan.discipline.toLowerCase().includes(lowerQuery)) ||
        (plan.content && plan.content.toLowerCase().includes(lowerQuery)) ||
        (plan.methodologyName && plan.methodologyName.toLowerCase().includes(lowerQuery)) ||
        (plan.bnccSkill && plan.bnccSkill.toLowerCase().includes(lowerQuery)) ||
        (plan.selectedProfiles && plan.selectedProfiles.some(prof => prof.toLowerCase().includes(lowerQuery)))
      );
    });
  }
}
