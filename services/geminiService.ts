import { LessonPlan, GenerationRequest } from "../types";

export class GeminiService {
  /**
   * Envia uma requisição ao backend em Express para gerar o plano de aula estruturado
   */
  static async generateLessonPlan(request: GenerationRequest): Promise<LessonPlan> {
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          throw new Error("Erro na resposta do servidor pedagógico (Formato não JSON).");
        }

        const errorMessage = errorData?.error || "Erro desconhecido ao processar proposta.";
        throw new Error(errorMessage);
      }

      const plan: LessonPlan = await response.json();
      return plan;
    } catch (error: any) {
      console.error("[GeminiService Client Error]", error);
      // Retorna a mensagem de erro amigável classificada pelo backend
      throw new Error(error.message || "Não foi possível conectar ao servidor pedagógico de IA.");
    }
  }
}
