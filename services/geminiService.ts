import { LessonPlan } from "../types";

/**
 * Envia a proposta autoral do professor para sistematização no servidor full-stack,
 * utilizando AbortController para limitar a requisição a 60 segundos.
 * 
 * @param teacherText Proposta inserida pelo professor
 * @returns Promessa com o plano de aula estruturado
 */
export async function generateLessonPlan(teacherText: string): Promise<LessonPlan> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch("/api/generate-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ teacherText }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = "Erro na resposta do servidor pedagógico.";
      try {
        const errData = await response.json();
        errorMessage = errData.error || errorMessage;
      } catch (e) {
        // Fallback para erros genéricos de status HTTP
        if (response.status === 401) {
          errorMessage = "Credenciais do Gemini não configuradas ou inválidas.";
        } else if (response.status === 429) {
          errorMessage = "Limite de requisições excedido. Por favor, aguarde um instante.";
        } else if (response.status === 503) {
          errorMessage = "O serviço de inteligência artificial está temporariamente sobrecarregado. Tente de novo em instantes.";
        }
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data as LessonPlan;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("A sistematização do plano de aula excedeu o limite de 60 segundos. Por favor, simplifique ou reformule sua proposta.");
    }
    throw error;
  }
}
