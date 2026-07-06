import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const PORT = 3000;

// Memory Logs System
interface LogEntry {
  requestTime: string;      // ISO string
  responseTimeMs: number;   // response time in ms
  model: string;            // model used
  success: boolean;         // success status
  errorType?: string;       // classified error type
  tokens?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
}

const memoryLogs: LogEntry[] = [];

// Helper to log server requests safely (Never logging API keys)
function logRequest(entry: LogEntry) {
  memoryLogs.push(entry);
  console.log(
    `[Pedagogical Logger] ${entry.success ? "SUCCESS" : "ERROR"} | Model: ${entry.model} | Response Time: ${entry.responseTimeMs}ms | Error: ${entry.errorType || "None"}`
  );
}

// Lazy initialization of GoogleGenAI
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

// Specific error classification helper
function classifyError(err: any): { status: number; clientMessage: string; errorType: string } {
  const message = (err?.message || String(err)).toLowerCase();

  if (message.includes("gemini_api_key_missing")) {
    return {
      status: 500,
      clientMessage: "A chave de API do Gemini (GEMINI_API_KEY) não está configurada no ambiente. Configure-a no menu Settings > Secrets.",
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
      clientMessage: "O modelo de IA especificado (gemini-3.5-flash) não foi encontrado ou não está disponível para esta chave de API.",
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
      clientMessage: "Chave de API inválida ou não autorizada. Por favor, verifique suas credenciais em Settings > Secrets.",
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
      clientMessage: "O seu projeto ou chave de API do Gemini foi suspenso. Verifique o status do faturamento ou cotas no Google AI Studio.",
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
      clientMessage: "Limite de requisições excedido. Por favor, aguarde um momento antes de gerar outro plano.",
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
      clientMessage: "O servidor da API do Gemini está temporariamente indisponível ou sobrecarregado. Tente novamente em alguns segundos.",
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
      clientMessage: "Erro de rede ao conectar-se à API do Gemini. Verifique a sua conexão ou tente novamente mais tarde.",
      errorType: "NETWORK_ERROR",
    };
  }

  if (message.includes("json") || message.includes("syntaxerror") || message.includes("parse")) {
    return {
      status: 422,
      clientMessage: "O Gemini gerou um plano com formato JSON corrompido ou incompleto e a auto-correção falhou após tentativas.",
      errorType: "INVALID_JSON",
    };
  }

  if (message.includes("timeout_occurred")) {
    return {
      status: 504,
      clientMessage: "A geração do plano de aula expirou por exceder o tempo limite de 60 segundos. Tente reformular sua proposta de forma mais direta.",
      errorType: "TIMEOUT",
    };
  }

  return {
    status: 500,
    clientMessage: `Erro ao sistematizar dados pedagógicos: ${err?.message || "Ocorreu um erro inesperado."}`,
    errorType: "UNKNOWN",
  };
}

// JSON validation & cleaning helper
function cleanAndParseJSON(text: string): any {
  if (!text) {
    throw new Error("A resposta recebida do modelo está vazia.");
  }

  let cleaned = text.trim();

  // Remove markdown tags if any
  const jsonMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  // First direct attempt to parse
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn("[JSON Clean] Primeira tentativa de análise falhou. Executando correção automática...", err);
  }

  // Find boundaries of the JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const extracted = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(extracted);
    } catch (err) {
      console.warn("[JSON Clean] Falha ao analisar bloco delimitado por chaves.");
    }
  }

  // Aggressive replacement of trailing commas and bad escaped control characters
  const progressive = cleaned
    .replace(/,\s*([}\]])/g, "$1") // trailing commas
    .replace(/\\n/g, " ") // escape sequences
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ""); // control chars

  try {
    return JSON.parse(progressive);
  } catch (err) {
    throw new Error("Erro de parse: O formato da resposta não pôde ser corrigido automaticamente.");
  }
}

// Retry with exponential backoff helper
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
      console.warn(`[Gemini Retry] Tentativa ${attempt} falhou. Aguardando ${delayMs}ms antes de re-tentar...`, error);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt++;
      delayMs *= multiplier;
    }
  }
}

// Prompt and instruction data
const AVAILABLE_SKILLS = `
BANCO DE HABILIDADES ESTRUTURANTES (SESI/BNCC) - PRIORIDADE DE USO:
1. SESI.EM13LGG204.c.16 - Utilizar as diversas linguagens para negociar interesses comuns pautados em princípios e em valores de equidade, com base em alicerces linguísticos e artísticos.
2. SESI.EM13LP08.s.6 - Analisar elements e aspectos da sintaxe do português, como a ordem dos constituintes da sentença (e os efeitos que causam sua inversão), a estrutura dos sintagmas, as categorias sintáticas, os processos de coordenação e subordinação (e os efeitos de seus usos) e a sintaxe de concordância e de regência, de modo a potencializar os processos de compreensão e produção de textos e a possibilitar escolhas adequadas à situação comunicativa.
3. SESI.EM13LP01.c.17 - Produzir textos, orais ou escritos, verbais, não verbais ou híbridos, adequados a diferentes situações, analisando criticamente suas condições de produção, contexto social e histórico, de modo a ampliar as possibilidades de construção de sentidos, fazendo uso de paráfrases, de marcas do discurso reportado e de citações, a partir de diferentes fontes, levando em conta os diferentes contextos de produção, para uso em textos de divulgação de estudos e pesquisas.
4. SESI.EM13LP42.a.19 - Divulgar informações e dados necessários em diferentes fontes (orais, impressas, digitais, entre outras), levando em conta uma perspectiva de imparcialidade e de parcialidade, discutindo conteúdos de maneira ética e responsável.
5. SESI.EM13LP02.a.3 - Estabelecer relações entre as partes do texto, tanto na produção como na leitura/escuta, considerando a construção constitutiva e o estilo do gênero, usando/reconhecendo, adequadamente, elementos e recursos coesivos diversos, que contribuam para a coerência, para a continuidade do texto e, consequentemente, sua progressão temática.
6. SESI.EM13LP12.a.5 - Selecionar e fazer curadoria de informações, de dados e de argumentos em fontes confiáveis, impressas, digitais e midiáticos ou não e utilizá-los de modo referenciado, para que o texto a ser produzido tenha um nível de aprofundamento adequado (para além do senso comum) e contemple a sustentação das posições defendidas, seja por meio de recursos gramaticais que operam com modalizadores discursivos estratégicos.
7. SESI.EM13LGG603.s.41 - Expressar-se e atuar em processos de criação autorais individuais e coletivos nas diferentes linguagens artísticas (artes visuais, audiovisual, dança, música e teatro) e nas intersecções entre elas, recorrendo a referências estéticas e culturais, conhecimentos de naturezas diversas.
8. SESI.EM13LGG305.d.21 - Mapear e criar, por meio de práticas de linguagem, tanto na língua materna quanto em Língua Estrangeiras Modernas (LEM), possibilidades de atuação social, política, artística e cultural para enfrentar desafios contemporâneos.
9. SESI.EM13LP17.c.23 - Elaborar roteiros, levando em conta uma linguagem híbrida, para a produção de apresentações e vídeos variados, para ampliar as possibilidades de produção de sentidos com base em diferentes meios de comunicação; além do engajamento em práticas autorais individuais e/ou coletivas.
10. SESI.EM13LP51.a.42 - Analisar obras significativas das artes visuais, da música, do teatro, da dança e das literaturas brasileiras e de outros países e povos, com olhar atento à diversidade de saberes, identidades e culturas, bem como os processos de disputa por legitimidade.
`;

const SYSTEM_INSTRUCTION = `Você é um Consultor Pedagógico Institucional de alto nível, especialista em Educação Básica, BNCC, Currículo Estruturante SESI, Taxonomia de Bloom, Metodologias Ativas e Avaliação Formativa de Aprendizagem. Sua missão é atuar na perspectiva do Planejamento Reverso e do Desenho Universal para Aprendizagem (DUA / UDL).

Você deve apoiar o planejamento docente transformando propostas brutas em planos de aula densos, técnicos, humanizados e extremamente práticos. Suas orientações metodológicas e de inclusão devem ser prescritivas e profundas, evitando de toda forma respostas superficiais ou puramente conceituais.

Você domina as seguintes metodologias ativas e abordagens de aprendizagem:
- Aprendizagem Baseada em Projetos (ABP)
- Sala de Aula Invertida (Flipped Classroom)
- Rotação por Estações de Aprendizagem
- Gamificação Pedagógica
- Aprendizagem Cooperativa (Cooperative Learning)
- Aprendizagem Significativa (Ausubel)

Sempre selecione automaticamente as habilidades estruturantes e a metodologia ativa mais adequadas com base no perfil comportamental da turma, quantidade de alunos, tempo disponível, verbo de Bloom indicado e perfil de inclusão informado.`;

const lessonPlanSchema = {
  type: Type.OBJECT,
  properties: {
    discipline: { 
      type: Type.STRING,
      description: "A disciplina ou área do conhecimento aplicável (Ex: Língua Portuguesa, Arte, Linguagens, Ciências)."
    },
    content: { 
      type: Type.STRING,
      description: "O conteúdo principal ou objeto de conhecimento abordado."
    },
    context: { 
      type: Type.STRING,
      description: "Contextualização pedagógica geral da aula, justificando a importância do tema para a faixa etária."
    },
    learningObjectives: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "De 2 a 4 objetivos claros, detalhados e mensuráveis, alinhados à Taxonomia de Bloom a partir do verbo base de ação cognitiva informado pelo professor."
    },
    skills: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Seleção automática de uma ou mais habilidades estruturantes do banco SESI/BNCC, contendo o código oficial e a descrição integral."
    },
    methodology: { 
      type: Type.STRING,
      description: "A metodologia ativa de ensino selecionada (Ex: Rotação por Estações, ABP, Gamificação) com detalhamento prático e técnico de como guiará a dinâmica da aula."
    },
    inclusionStrategies: {
      type: Type.STRING,
      description: "Estratégias específicas baseadas no Desenho Universal para Aprendizagem (DUA) e adaptações personalizadas para os perfis de inclusão informados (Ex: TEA, TDAH, Baixa Visão) ou diretrizes gerais de acessibilidade universal se não informados."
    },
    development: {
      type: Type.OBJECT,
      properties: {
        what: { 
          type: Type.STRING, 
          description: "O QUE: Conceitos científicos básicos, marcos teóricos e objetos de conhecimento abordados de forma robusta e científica em parágrafo denso." 
        },
        how: { 
          type: Type.STRING, 
          description: "COMO: Mediação didática detalhada passo a passo de forma cronológica, descrevendo com clareza as ações do docente e dos estudantes frente à quantidade e comportamento descritos." 
        }
      },
      required: ["what", "how"]
    },
    learningEvidence: {
      type: Type.STRING,
      description: "Evidências concretas de aprendizagem que demonstram empiricamente a consecução dos objetivos propostos."
    },
    assessmentInstruments: {
      type: Type.STRING,
      description: "Instrumentos de avaliação formativa, contínua e processual recomendados para a mediação pedagógica."
    },
    justification: {
      type: Type.STRING,
      description: "Justificativa técnico-pedagógica fundamentando a seleção da habilidade estruturante, da metodologia ativa e a adequação inclusiva face ao perfil da turma."
    }
  },
  required: [
    "discipline", 
    "content", 
    "context", 
    "learningObjectives", 
    "skills", 
    "methodology", 
    "inclusionStrategies", 
    "development", 
    "learningEvidence", 
    "assessmentInstruments",
    "justification"
  ]
};

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: "10mb" }));

  // API Endpoint to generate plan
  app.post("/api/generate-plan", async (req, res) => {
    const { teacherText } = req.body;
    if (!teacherText || typeof teacherText !== "string" || !teacherText.trim()) {
      res.status(400).json({ error: "O texto da proposta do professor é obrigatório." });
      return;
    }

    const requestTime = new Date().toISOString();
    const startTimeMs = Date.now();
    const targetModel = "gemini-3.5-flash";

    try {
      // 1. Enforce 60-second limit using a Promise race with a timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout_occurred")), 60000)
      );

      const apiCallPromise = retryWithExponentialBackoff(async () => {
        const ai = getGeminiClient();

        const prompt = `
[CONTEXTO & OBJETIVO]
O usuário é um docente da Educação Básica que precisa de assessoria técnico-pedagógica de alto nível para qualificar, formalizar e registrar uma proposta didática autoral. O objetivo é sistematizar suas ideias brutas em um Plano de Aula de excelência institucional, que atenda plenamente aos padrões do currículo estruturante do SESI, às competências da BNCC e aos preceitos do Desenho Universal para Aprendizagem (DUA / UDL).

[PERFIL DO PROFESSOR & DADOS BRUTOS]
Proposta original e informações brutas inseridas pelo docente:
"${teacherText}"

[PERFIL DA TURMA & DADOS OBRIGATÓRIOS]
Analise detidamente o texto do professor para extrair e inferir (com alto rigor pedagógico):
1. Disciplina / Componente Curricular aplicável.
2. Conteúdo ou Objeto de Conhecimento temático central.
3. Características e tamanho da turma (Ex: turma agitada, heterogênea, cooperativa, autônoma, numerosa).
4. Verbo cognitivo base da Taxonomia de Bloom fornecido para orientar o nível de complexidade cognitiva.
5. Perfil de inclusão (Ex: alunos com TEA, TDAH, Dislexia, Baixa Visão, Deficiência Auditiva ou ausência de perfil específico).

[BANCO DE HABILIDADES ESTRUTURANTES (SESI/BNCC)]
Selecione AUTOMATICAMENTE a habilidade mais coerente e de maior relevância pedagógica para o conteúdo temático dentre as opções abaixo:
\${AVAILABLE_SKILLS}
A habilidade selecionada DEVE constar de forma integral no plano, exibindo seu código completo (Ex: SESI.EM13LP08.s.6) e sua descrição textual exata.

[CRITÉRIOS PEDAGÓGICOS E DE QUALIDADE]
- Metodologia Ativa: Prescreva uma metodologia ativa compatível com o comportamento e tamanho da turma (Ex: Gamificação ou Rotação por Estações para turmas agitadas; ABP ou Instrução por Pares para turmas de perfil colaborativo). Detalhe a engenharia da dinâmica, explicando os papéis ativos dos estudantes.
- Objetivos de Aprendizagem: Redija de 2 a 4 objetivos estruturados sob a ótica da Taxonomia de Bloom, iniciando expressamente pelo verbo base informado pelo professor (ou verbos sinônimos da mesma categoria de complexidade cognitiva).
- Sequência Didática (Desenvolvimento):
  - "what": Detalhe rigorosamente os conceitos científicos, fatos teóricos e a fundamentação epistêmica da aula em um parágrafo único robusto e formal.
  - "how": Descreva detalhadamente a mediação pedagógica passo a passo cronológico (Abertura, Desenvolvimento, Fechamento). Considere como os materiais, o tempo e o agrupamento dos alunos serão manipulados frente ao comportamento/tamanho da turma.
- Instrumentos de Avaliação: Determine instrumentos formativos e processuais realistas, focados em autoavaliação, feedbacks ágeis e rubricas.
- Evidências de Aprendizagem: Descreva o que os estudantes produzirão ou que comportamentos observáveis manifestarão para demonstrar o alcance dos objetivos.

[CRITÉRIOS DE INCLUSÃO (DUA)]
- Se houver perfil de inclusão mencionado no texto, defina adaptações e estratégias de acessibilidade de altíssima especificidade para o perfil (Ex: para TEA, apoios visuais e previsibilidade de rotina; para Baixa Visão, ampliação de fonte e contraste).
- Se não houver perfil específico, formule diretrizes universais de DUA cobrindo múltiplos meios de representação (exposição diversificada do conteúdo), múltiplos meios de ação/expressão (opções de resposta do estudante) e múltiplos meios de engajamento (estímulo motivacional).

[CRITÉRIOS DE COERÊNCIA & VALIDAÇÃO FINAL]
O plano deve ser um ecossistema pedagógico coerente. Os Objetivos de Aprendizagem devem estar em perfeita harmonia com o Conteúdo, a Metodologia Ativa escolhida, o Desenvolvimento prático, as Evidências de aprendizagem projetadas e a Justificativa interna de escolhas.
Adicione no campo "justification" uma fundamentação crítica das razões pelas quais a habilidade estruturante e a metodologia selecionadas são as melhores opções didáticas para este plano.

[FORMATO DO JSON DE RETORNO]
Preencha cada campo do esquema de resposta JSON sem omitir dados ou utilizar termos genéricos. O JSON de retorno não deve conter blocos ou strings vazias.
`;

        const response = await ai.models.generateContent({
          model: targetModel,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: lessonPlanSchema,
            temperature: 0.4,
          },
        });

        const rawText = response.text || "";
        const parsedData = cleanAndParseJSON(rawText);

        // Validate required keys to guarantee complete response
        const requiredFields = [
          "discipline",
          "content",
          "context",
          "learningObjectives",
          "skills",
          "methodology",
          "inclusionStrategies",
          "development",
          "learningEvidence",
          "assessmentInstruments",
          "justification"
        ];
        for (const field of requiredFields) {
          if (parsedData[field] === undefined || parsedData[field] === null) {
            throw new Error(`JSON incompleto: campo obrigatório '${field}' ausente na resposta.`);
          }
        }

        return {
          parsedData,
          usage: response.usageMetadata,
        };
      });

      // Race the API call against the timeout limit
      const result = (await Promise.race([apiCallPromise, timeoutPromise])) as {
        parsedData: any;
        usage?: any;
      };

      const responseTimeMs = Date.now() - startTimeMs;

      // Log the successful request
      logRequest({
        requestTime,
        responseTimeMs,
        model: targetModel,
        success: true,
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

      // Log the failed request
      logRequest({
        requestTime,
        responseTimeMs,
        model: targetModel,
        success: false,
        errorType: errorDetails.errorType,
      });

      res.status(errorDetails.status).json({
        error: errorDetails.clientMessage,
        errorType: errorDetails.errorType,
      });
    }
  });

  // Logs Endpoint for admin/inspection (Never logs API key)
  app.get("/api/logs", (req, res) => {
    res.json(memoryLogs);
  });

  // Serve static assets/Vite middleware depending on node environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start Server listening on host 0.0.0.0 and port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Pedagogical Server] running on http://0.0.0.0:${PORT} under NODE_ENV=${process.env.NODE_ENV}`);
  });
}

startServer();
