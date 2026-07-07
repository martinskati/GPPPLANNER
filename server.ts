import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const PORT = 3000;

// Log System in memory to audit requests (never storing API keys)
interface LogEntry {
  timestamp: string;
  responseTimeMs: number;
  success: boolean;
  model: string;
  errorType?: string;
  tokens?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
}

const memoryLogs: LogEntry[] = [];

function logServerEvent(entry: LogEntry) {
  memoryLogs.push(entry);
  console.log(
    `[SERVER LOG] ${entry.timestamp} | Success: ${entry.success} | Model: ${entry.model} | Latency: ${entry.responseTimeMs}ms | Error: ${entry.errorType || "None"}`
  );
}

// Lazy initialization of Gemini client
let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Error classification helper to map system failures into meaningful pedagogical feedback
function classifyError(err: any): { status: number; clientMessage: string; errorType: string } {
  const message = (err?.message || String(err)).toLowerCase();

  if (message.includes("gemini_api_key_missing")) {
    return {
      status: 500,
      clientMessage: "A chave de API do Gemini (GEMINI_API_KEY) não está configurada no servidor. Configure-a no menu Settings > Secrets.",
      errorType: "MISSING_KEY",
    };
  }

  if (
    message.includes("model not found") ||
    message.includes("model_not_found") ||
    message.includes("model name") ||
    (message.includes("not found") && message.includes("model"))
  ) {
    return {
      status: 404,
      clientMessage: "O modelo de IA estável (gemini-3.5-flash) não foi encontrado ou não está disponível para este projeto.",
      errorType: "MODEL_NOT_FOUND",
    };
  }

  if (
    message.includes("api key") ||
    message.includes("invalid key") ||
    message.includes("unauthorized") ||
    message.includes("api_key_invalid") ||
    err?.status === 401
  ) {
    return {
      status: 401,
      clientMessage: "Chave de API inválida, expirada ou não autorizada. Verifique suas credenciais em Settings > Secrets.",
      errorType: "INVALID_KEY",
    };
  }

  if (
    message.includes("suspended") ||
    message.includes("billing") ||
    message.includes("project_suspended") ||
    message.includes("disabled")
  ) {
    return {
      status: 403,
      clientMessage: "O seu projeto ou chave de API do Gemini foi suspenso no Google AI Studio. Verifique o status da conta e de faturamento.",
      errorType: "PROJECT_SUSPENDED",
    };
  }

  if (
    message.includes("quota") ||
    message.includes("limit") ||
    message.includes("exhausted") ||
    message.includes("rate") ||
    err?.status === 429
  ) {
    return {
      status: 429,
      clientMessage: "Limite de requisições (Rate Limit) excedido. Por favor, aguarde alguns instantes antes de enviar uma nova proposta.",
      errorType: "USAGE_LIMIT_EXCEEDED",
    };
  }

  if (
    message.includes("unavailable") ||
    message.includes("overloaded") ||
    message.includes("busy") ||
    err?.status === 503
  ) {
    return {
      status: 503,
      clientMessage: "O servidor da API do Gemini está temporariamente sobrecarregado ou indisponível. Tente novamente em instantes.",
      errorType: "API_UNAVAILABLE",
    };
  }

  if (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("econnreset") ||
    message.includes("enotfound") ||
    message.includes("etimedout")
  ) {
    return {
      status: 504,
      clientMessage: "Ocorreu um erro de rede ao tentar conectar com a API do Gemini. Verifique a conectividade do servidor.",
      errorType: "NETWORK_ERROR",
    };
  }

  if (message.includes("json") || message.includes("syntaxerror") || message.includes("parse")) {
    return {
      status: 422,
      clientMessage: "A resposta pedagógica gerada pela IA veio em formato corrompido. Tentativas de auto-reparação falharam.",
      errorType: "INVALID_JSON",
    };
  }

  if (message.includes("timeout_occurred")) {
    return {
      status: 504,
      clientMessage: "A geração do plano pedagógico excedeu o tempo limite de segurança de 60 segundos. Tente enviar uma proposta mais curta ou direta.",
      errorType: "TIMEOUT",
    };
  }

  return {
    status: 500,
    clientMessage: `Falha na coordenação do plano pedagógico: ${err?.message || "Erro desconhecido."}`,
    errorType: "UNKNOWN",
  };
}

// Retries with Exponential Backoff
async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  multiplier = 2
): Promise<T> {
  let attempt = 1;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxRetries) {
        throw error;
      }
      console.warn(`[RETRY] Tentativa ${attempt} falhou. Re-tentando em ${delayMs}ms...`, error);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt++;
      delayMs *= multiplier;
    }
  }
}

// Clean response of any surrounding markdown formatting blocks
function cleanAndParseJSON(text: string): any {
  if (!text) {
    throw new Error("Resposta vazia da IA.");
  }
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn("[JSON PARSE] Falha na leitura inicial. Iniciando higienização de string...", err);
  }

  // Fallback regex boundaries
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const extracted = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(extracted);
    } catch (err) {
      console.warn("[JSON PARSE] Falha na leitura delimitada por chaves.");
    }
  }

  // Aggressive fix
  const repaired = cleaned
    .replace(/,\s*([}\]])/g, "$1") // trailing commas
    .replace(/\\n/g, " ") // loose escapes
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // control characters

  try {
    return JSON.parse(repaired);
  } catch (err) {
    throw new Error("Erro de parse: Resposta gerada não corresponde a um JSON legível.");
  }
}

// JSON Schema definition for @google/genai
const lessonPlanSchema = {
  type: Type.OBJECT,
  properties: {
    discipline: {
      type: Type.STRING,
      description: "Nome da disciplina ou área do conhecimento (ex: Matemática, Língua Portuguesa)."
    },
    content: {
      type: Type.STRING,
      description: "Conteúdo central ou objeto de conhecimento."
    },
    bnccSkill: {
      type: Type.STRING,
      description: "Código oficial da habilidade BNCC selecionada e descrição integral."
    },
    sesiSkill: {
      type: Type.STRING,
      description: "Código oficial da habilidade correspondente do Currículo SESI e descrição integral."
    },
    context: {
      type: Type.STRING,
      description: "Contextualização pedagógica geral da aula para a faixa etária."
    },
    learningObjectives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          objective: {
            type: Type.STRING,
            description: "Objetivo de aprendizagem claro e mensurável."
          },
          bloomLevel: {
            type: Type.STRING,
            description: "Nível cognitivo da Taxonomia de Bloom (Lembrar, Compreender, Aplicar, Analisar, Avaliar, Criar)."
          }
        },
        required: ["objective", "bloomLevel"]
      },
      description: "De 2 a 4 objetivos estruturados conforme a Taxonomia de Bloom."
    },
    methodologyName: {
      type: Type.STRING,
      description: "Nome da metodologia ativa selecionada (ex: Rotação por Estações, ABP, Gamificação)."
    },
    whyChosen: {
      type: Type.STRING,
      description: "Justificativa didática técnica para a escolha desta metodologia ativa específica."
    },
    howApplied: {
      type: Type.STRING,
      description: "Explicação prática e direta de como a metodologia ativa será conduzida na aula."
    },
    pedagogicalBenefits: {
      type: Type.STRING,
      description: "Benefícios de aprendizagem e vantagens pedagógicas da metodologia escolhida."
    },
    teacherRole: {
      type: Type.STRING,
      description: "Atuação, papel e comportamento esperado do professor durante a aula."
    },
    studentRole: {
      type: Type.STRING,
      description: "Atuação e papel ativo esperado do estudante durante a atividade."
    },
    developmentSteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepName: {
            type: Type.STRING,
            description: "Título da etapa (ex: Introdução, Desafio Principal, Fechamento)."
          },
          whatToTeach: {
            type: Type.STRING,
            description: "O que ensinar: conceitos teóricos ou científicos tratados nesta etapa."
          },
          howToTeach: {
            type: Type.STRING,
            description: "Como ensinar: mediação didática detalhada passo a passo cronológico."
          },
          resources: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de recursos e materiais físicos ou digitais necessários nesta etapa."
          },
          duration: {
            type: Type.STRING,
            description: "Tempo previsto para a etapa (ex: 15 minutos)."
          },
          classOrganization: {
            type: Type.STRING,
            description: "Forma de organização física e social da turma (ex: grupos de 4 alunos, círculo, individual)."
          }
        },
        required: ["stepName", "whatToTeach", "howToTeach", "resources", "duration", "classOrganization"]
      },
      description: "Roteiro de desenvolvimento detalhado em etapas sequenciais."
    },
    evidence: {
      type: Type.STRING,
      description: "Evidências empíricas e comportamentos observáveis que mostram que os objetivos foram atingidos."
    },
    instruments: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Instrumentos de avaliação formativa (ex: Rubrica de Autoavaliação, Diário de Bordo)."
    },
    criteria: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Critérios de avaliação claros para atribuir sucesso ao desempenho."
    },
    rubrics: {
      type: Type.STRING,
      description: "Descrição de rubricas de desempenho simplificadas organizadas por níveis de proficiência (ex: Iniciante, Intermediário, Avançado)."
    },
    formativeFeedback: {
      type: Type.STRING,
      description: "Orientações sobre como o professor fornecerá feedback ágil e formativo aos alunos."
    },
    duaRepresentation: {
      type: Type.STRING,
      description: "Estratégias de Apresentação (múltiplos meios para acessar a informação)."
    },
    duaExpression: {
      type: Type.STRING,
      description: "Estratégias de Ação e Expressão (múltiplos meios para demonstrar o aprendizado)."
    },
    duaEngagement: {
      type: Type.STRING,
      description: "Estratégias de Engajamento (múltiplos meios para motivar e reter a atenção)."
    },
    selectedProfiles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de perfis de NEE que foram considerados na adaptação."
    },
    neeAdaptations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          profile: {
            type: Type.STRING,
            description: "Nome do perfil NEE (ex: TEA, TDAH, Dislexia, Baixa Visão)."
          },
          adaptationObjective: {
            type: Type.STRING,
            description: "Objetivo principal da adaptação metodológica ou ambiental para este estudante."
          },
          potentialBarriers: {
            type: Type.STRING,
            description: "Barreiras físicas, sensoriais, metodológicas ou cognitivas que podem surgir na aula."
          },
          methodologyAdjustments: {
            type: Type.STRING,
            description: "Adequações específicas e detalhadas na metodologia da aula."
          },
          resourceAdjustments: {
            type: Type.STRING,
            description: "Adequações necessárias nos materiais de apoio e recursos."
          },
          communicationAdjustments: {
            type: Type.STRING,
            description: "Mudanças recomendadas nos canais e formas de comunicação e instrução."
          },
          evaluationAdjustments: {
            type: Type.STRING,
            description: "Adequações na forma de avaliar a aprendizagem deste estudante."
          },
          necessarySupports: {
            type: Type.STRING,
            description: "Apoios físicos, tecnológicos ou humanos necessários (ex: colega tutor, ledor)."
          },
          teacherMediation: {
            type: Type.STRING,
            description: "Estratégias diretas de mediação e manejo do professor frente ao aluno."
          },
          peerParticipation: {
            type: Type.STRING,
            description: "Estratégias para envolver positivamente os colegas no acolhimento e participação conjunta."
          },
          duaPrinciples: {
            type: Type.STRING,
            description: "Identificação dos princípios do DUA aplicados nesta adaptação."
          },
          assistiveTechnologies: {
            type: Type.STRING,
            description: "Tecnologias assistivas recomendadas para o perfil (ex: softwares leitores de tela, rotinas visuais)."
          },
          physicalSpace: {
            type: Type.STRING,
            description: "Organização física, ambiental ou sensorial da sala de aula."
          },
          cognitiveOverloadPrevention: {
            type: Type.STRING,
            description: "Táticas específicas para evitar sobrecarga de estímulos ou exaustão cognitiva."
          },
          activeParticipationSuggestions: {
            type: Type.STRING,
            description: "Sugestões de tarefas de responsabilidade ativa para que o estudante se sinta integrado e produtivo."
          }
        },
        required: [
          "profile",
          "adaptationObjective",
          "potentialBarriers",
          "methodologyAdjustments",
          "resourceAdjustments",
          "communicationAdjustments",
          "evaluationAdjustments",
          "necessarySupports",
          "teacherMediation",
          "peerParticipation",
          "duaPrinciples",
          "assistiveTechnologies",
          "physicalSpace",
          "cognitiveOverloadPrevention",
          "activeParticipationSuggestions"
        ]
      },
      description: "Adaptações metodológicas altamente individualizadas para cada perfil selecionado."
    },
    justificationBncc: {
      type: Type.STRING,
      description: "Justificativa técnico-pedagógica de por que esta habilidade BNCC é a mais adequada."
    },
    justificationMethodology: {
      type: Type.STRING,
      description: "Justificativa teórica de por que a metodologia ativa é eficiente para este tema e turma."
    },
    justificationAssessment: {
      type: Type.STRING,
      description: "Justificativa de por que a estratégia de avaliação é justa e pedagogicamente sólida."
    },
    justificationInclusion: {
      type: Type.STRING,
      description: "Justificativa de por que as adaptações de inclusão e DUA implementadas são fundamentais."
    }
  },
  required: [
    "discipline",
    "content",
    "bnccSkill",
    "sesiSkill",
    "context",
    "learningObjectives",
    "methodologyName",
    "whyChosen",
    "howApplied",
    "pedagogicalBenefits",
    "teacherRole",
    "studentRole",
    "developmentSteps",
    "evidence",
    "instruments",
    "criteria",
    "rubrics",
    "formativeFeedback",
    "duaRepresentation",
    "duaExpression",
    "duaEngagement",
    "selectedProfiles",
    "neeAdaptations",
    "justificationBncc",
    "justificationMethodology",
    "justificationAssessment",
    "justificationInclusion"
  ]
};

const SYSTEM_INSTRUCTION = `Você é um Consultor Pedagógico e Coordenador Institucional de altíssimo nível, especialista em Educação Básica, BNCC, Currículo Estruturante, Taxonomia de Bloom, Metodologias Ativas e Avaliação Formativa de Aprendizagem. Sua missão é atuar na perspectiva do Planejamento Reverso e do Desenho Universal para Aprendizagem (DUA).

Você deve apoiar o planejamento docente transformando propostas brutas em planos de aula densos, técnicos, humanizados e extremamente práticos. Suas orientações metodológicas e de inclusão devem ser prescritivas, profundas e extremamente detalhadas, evitando respostas genéricas ou superficiais.

Você domina as seguintes metodologias ativas e abordagens de aprendizagem:
- Aprendizagem Baseada em Projetos (ABP)
- Sala de Aula Invertida (Flipped Classroom)
- Rotação por Estações de Aprendizagem
- Gamificação Pedagógica
- Aprendizagem Cooperativa (Cooperative Learning)
- Aprendizagem Significativa (Ausubel)

A sua resposta deve ser um JSON válido que respeite exatamente o esquema fornecido. Não adicione textos fora do JSON.`;

const PROMPT_TEMPLATE = `
[CONTEXTO E OBJETIVO]
Sistematize a proposta pedagógica do professor em um plano de aula de alta qualidade institucional. Garanta perfeita coerência teórica e metodológica em todo o documento, aplicando o Planejamento Reverso de forma rigorosa.

[DADOS DE ENTRADA DO PROFESSOR]
- Disciplina/Conteúdo sugerido: \${content}
- Proposta/Ideia do professor: "\${teacherText}"
- Verbo base de Bloom selecionado: "\${verbBase}"
- Quantidade de estudantes: \${studentCount}
- Características da turma: "\${classCharacteristics}"
- Perfis de Necessidades Educacionais Especiais (NEE) selecionados para adaptação obrigatória: \${neeProfilesText}

[DIRETRIZES DA TAXONOMIA DE BLOOM]
Use o verbo base "\${verbBase}" como guia principal para formular os objetivos em "learningObjectives". Os objetivos devem iniciar com verbos de ação mensuráveis correspondentes ao nível de complexidade cognitiva deste verbo base.

[BANCO DE HABILIDADES BNCC E SESI]
Selecione e insira uma habilidade BNCC oficial compatível com a proposta e o tema (ex: "EF05MA03 - Analisar, interpretar e resolver problemas..."). 
Selecione também uma habilidade correspondente do currículo SESI relacionada ao tema.

[DIRETRIZES DA ABA DE ADAPTAÇÃO NEE - CRÍTICO]
Esta é a aba mais importante do sistema! Para os perfis de inclusão informados (\${neeProfilesText}), gere recomendações extremamente ricas e detalhadas para apoiar o professor no dia a dia.
Os perfis que o sistema reconhece e que devem receber tratamento caso informados são: TEA (Transtorno do Espectro Autista), TDAH (Transtorno do Déficit de Atenção com Hiperatividade), Dislexia, Baixa Visão, Cegueira, Deficiência Intelectual, Deficiência Física, Surdez, Altas Habilidades, Síndrome de Down, Transtorno de Linguagem, Deficiência Múltipla.
Se mais de um perfil estiver selecionado, crie adaptações individuais para cada um deles no array "neeAdaptations". As adaptações devem contemplar:
- Objetivo de adaptação específico
- Barreiras pedagógicas, ambientais e comunicacionais possíveis de surgir
- Adequações na metodologia aplicada
- Adequações nos materiais e recursos didáticos
- Formas facilitadoras de comunicação e instrução
- Adequações no processo avaliativo formativo
- Apoios físicos, humanos e tecnológicos necessários
- Estratégias de mediação do professor e de integração ativa com os colegas
- Tecnologias assistivas apropriadas
- Cuidados para prevenir fadiga mental ou sobrecarga cognitiva
- Uma tarefa de protagonismo ativo para o aluno

[FORMATO DE SAÍDA]
Escreva a resposta exclusivamente no formato JSON especificado no esquema estrutural. Não abrevie informações.
`;

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "15mb" }));

  // API Endpoint to Generate Lesson Plan
  app.post("/api/generate-plan", async (req, res) => {
    const { teacherText, content, verbBase, studentCount, classCharacteristics, selectedNeeProfiles } = req.body;

    if (!teacherText || typeof teacherText !== "string" || !teacherText.trim()) {
      res.status(400).json({ error: "O texto da proposta do professor é obrigatório." });
      return;
    }

    const timestamp = new Date().toISOString();
    const startTimeMs = Date.now();
    const targetModel = "gemini-3.5-flash";

    console.log(`[SERVER] Nova requisição de geração recebida. Perfis de inclusão: ${JSON.stringify(selectedNeeProfiles || [])}`);

    try {
      // 60-second execution safety timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout_occurred")), 60000)
      );

      const apiCallPromise = retryWithExponentialBackoff(async () => {
        const ai = getGeminiClient();

        const neeProfilesText = selectedNeeProfiles && selectedNeeProfiles.length > 0 
          ? selectedNeeProfiles.join(", ") 
          : "Nenhum perfil específico (Gere recomendações de acessibilidade universal)";

        const filledPrompt = PROMPT_TEMPLATE
          .replace(/\${content}/g, content || "Inferred from description")
          .replace(/\${teacherText}/g, teacherText)
          .replace(/\${verbBase}/g, verbBase || "Compreender")
          .replace(/\${studentCount}/g, String(studentCount || 30))
          .replace(/\${classCharacteristics}/g, classCharacteristics || "Heterogênea")
          .replace(/\${neeProfilesText}/g, neeProfilesText);

        const response = await ai.models.generateContent({
          model: targetModel,
          contents: filledPrompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: lessonPlanSchema,
            temperature: 0.35,
          }
        });

        const rawText = response.text || "";
        const parsedData = cleanAndParseJSON(rawText);

        // Sanitize check: ensure essential structures are present
        const fallbackCheckFields = [
          "discipline",
          "content",
          "bnccSkill",
          "sesiSkill",
          "context",
          "learningObjectives",
          "methodologyName",
          "whyChosen",
          "howApplied",
          "pedagogicalBenefits",
          "teacherRole",
          "studentRole",
          "developmentSteps",
          "evidence",
          "instruments",
          "criteria",
          "rubrics",
          "formativeFeedback",
          "duaRepresentation",
          "duaExpression",
          "duaEngagement",
          "selectedProfiles",
          "neeAdaptations",
          "justificationBncc",
          "justificationMethodology",
          "justificationAssessment",
          "justificationInclusion"
        ];

        for (const field of fallbackCheckFields) {
          if (parsedData[field] === undefined || parsedData[field] === null) {
            throw new Error(`JSON incompleto: campo pedagógico essencial '${field}' ausente na resposta.`);
          }
        }

        return {
          parsedData,
          usage: response.usageMetadata
        };
      });

      const result = (await Promise.race([apiCallPromise, timeoutPromise])) as {
        parsedData: any;
        usage?: any;
      };

      const responseTimeMs = Date.now() - startTimeMs;

      logServerEvent({
        timestamp,
        responseTimeMs,
        success: true,
        model: targetModel,
        tokens: result.usage
          ? {
              promptTokens: result.usage.promptTokenCount,
              candidatesTokens: result.usage.candidatesTokenCount,
              totalTokens: result.usage.totalTokenCount,
            }
          : undefined,
      });

      res.json(result.parsedData);
    } catch (err: any) {
      const responseTimeMs = Date.now() - startTimeMs;
      const errorDetails = classifyError(err);

      logServerEvent({
        timestamp,
        responseTimeMs,
        success: false,
        model: targetModel,
        errorType: errorDetails.errorType,
      });

      res.status(errorDetails.status).json({
        error: errorDetails.clientMessage,
        errorType: errorDetails.errorType,
      });
    }
  });

  // Logs audit endpoint
  app.get("/api/logs", (req, res) => {
    res.json(memoryLogs);
  });

  // Client Static Files and Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Rodando com sucesso em http://0.0.0.0:${PORT} sob o ambiente NODE_ENV=${process.env.NODE_ENV}`);
  });
}

startServer();
