import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { PlanResult } from "./components/PlanResult";
import { SavedLessonPlan, LessonPlan, GenerationRequest } from "./types";
import { GeminiService } from "./services/geminiService";
import { StorageService } from "./services/storageService";
import { 
  FileText, Sparkles, AlertTriangle, Info, BookOpen, 
  HelpCircle, Check, HelpCircle as HelpIcon, ArrowRight, Brain, Clock, PlusCircle
} from "lucide-react";

const NEE_PROFILES = [
  { id: "TEA", label: "TEA", description: "Transtorno do Espectro Autista" },
  { id: "TDAH", label: "TDAH", description: "Transtorno do Déficit de Atenção" },
  { id: "Dislexia", label: "Dislexia", description: "Dificuldade na leitura e escrita" },
  { id: "Baixa Visão", label: "Baixa Visão", description: "Comprometimento visual moderado/grave" },
  { id: "Cegueira", label: "Cegueira", description: "Perda total da acuidade visual" },
  { id: "Deficiência Intelectual", label: "Deficiência Intelectual", description: "Limitações no funcionamento cognitivo" },
  { id: "Deficiência Física", label: "Deficiência Física", description: "Limitações motoras ou locomotoras" },
  { id: "Surdez", label: "Surdez", description: "Perda auditiva severa ou profunda" },
  { id: "Altas Habilidades", label: "Altas Habilidades", description: "Superdotação cognitiva ou acadêmica" },
  { id: "Síndrome de Down", label: "Síndrome de Down", description: "Alteração genética cromossomo 21" },
  { id: "Transtorno de Linguagem", label: "Transtorno de Linguagem", description: "Atrasos ou desvios na fala/compreensão" },
  { id: "Deficiência Múltipla", label: "Deficiência Múltipla", description: "Associação de duas ou mais deficiências" }
];

const BLOOM_VERBS = [
  { verb: "Lembrar", level: "Lembrar", desc: "Reconhecer, listar, descrever fatos" },
  { verb: "Compreender", level: "Compreender", desc: "Explicar ideias ou conceitos" },
  { verb: "Aplicar", level: "Aplicar", desc: "Usar informações em novas situações" },
  { verb: "Analisar", level: "Analisar", desc: "Diferenciar, organizar partes" },
  { verb: "Avaliar", level: "Avaliar", desc: "Justificar uma decisão ou posição" },
  { verb: "Criar", level: "Criar", desc: "Produzir um trabalho novo ou original" }
];

export default function App() {
  // Navigation & Drawer states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  // Storage lists
  const [savedPlansCount, setSavedPlansCount] = useState(0);
  const [currentSavedPlan, setCurrentSavedPlan] = useState<SavedLessonPlan | null>(null);

  // Form input states
  const [teacherText, setTeacherText] = useState("");
  const [content, setContent] = useState("");
  const [verbBase, setVerbBase] = useState("Compreender");
  const [studentCount, setStudentCount] = useState<number>(30);
  const [classCharacteristics, setClassCharacteristics] = useState("");
  const [selectedNeeProfiles, setSelectedNeeProfiles] = useState<string[]>([]);

  // Generation status states
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePlan, setActivePlan] = useState<LessonPlan | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [serverLogs, setServerLogs] = useState<any[]>([]);

  // Initial load
  useEffect(() => {
    updatePlansCount();
    loadServerLogs();
  }, []);

  const updatePlansCount = () => {
    const plans = StorageService.getPlans();
    setSavedPlansCount(plans.length);
  };

  const loadServerLogs = async () => {
    try {
      const response = await fetch("/api/logs");
      if (response.ok) {
        const logs = await response.json();
        setServerLogs(logs);
      }
    } catch (e) {
      console.warn("Could not retrieve server logs", e);
    }
  };

  // Profile toggling helper
  const handleToggleNeeProfile = (profileId: string) => {
    setSelectedNeeProfiles(prev => {
      if (prev.includes(profileId)) {
        return prev.filter(p => p !== profileId);
      } else {
        return [...prev, profileId];
      }
    });
  };

  // Submit trigger to generate the plan
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherText.trim()) {
      setErrorMsg("Por favor, descreva a proposta pedagógica inicial no campo indicado.");
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setActivePlan(null);
    setCurrentSavedPlan(null);

    const request: GenerationRequest = {
      teacherText,
      content,
      verbBase,
      studentCount,
      classCharacteristics,
      selectedNeeProfiles
    };

    try {
      const resultPlan = await GeminiService.generateLessonPlan(request);
      setActivePlan(resultPlan);
      setSuccessMsg("Plano de aula gerado com absoluto sucesso e coerência curricular!");
      loadServerLogs();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro inesperado ao gerar o plano pedagógico.");
      loadServerLogs();
    } finally {
      setIsGenerating(false);
    }
  };

  // Save current active plan to localStorage
  const handleSaveActivePlan = () => {
    if (!activePlan) return;
    try {
      const existingId = currentSavedPlan?.id;
      const saved = StorageService.savePlan(activePlan, existingId);
      setCurrentSavedPlan(saved);
      updatePlansCount();
      alert("Plano de aula salvo com sucesso no seu histórico local!");
    } catch (e) {
      alert("Erro ao salvar o plano de aula localmente.");
    }
  };

  // Select plan from history list
  const handleSelectPlan = (saved: SavedLessonPlan) => {
    setActivePlan(saved.plan);
    setCurrentSavedPlan(saved);
    // Populate form so the teacher can edit or see what prompted it
    setTeacherText(saved.plan.context || "");
    setContent(saved.plan.content || "");
    setVerbBase(saved.plan.learningObjectives[0]?.bloomLevel || "Compreender");
    setSelectedNeeProfiles(saved.plan.selectedProfiles || []);
  };

  const handleStartNew = () => {
    setActivePlan(null);
    setCurrentSavedPlan(null);
    setTeacherText("");
    setContent("");
    setVerbBase("Compreender");
    setStudentCount(30);
    setClassCharacteristics("");
    setSelectedNeeProfiles([]);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app-root">
      
      {/* Header */}
      <Header 
        onShowHistory={() => setIsHistoryOpen(true)}
        onShowGuide={() => setIsGuideOpen(true)}
        historyCount={savedPlansCount}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Alerts Banner */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-l-red-500 p-4 rounded-lg flex items-start space-x-3 no-print" id="alert-error">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-red-900 text-sm">Falha Pedagógica Detectada</h4>
              <p className="text-xs text-red-700 leading-relaxed font-medium">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border-l-4 border-l-emerald-500 p-4 rounded-lg flex items-start space-x-3 no-print animate-fade-in" id="alert-success">
            <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-emerald-900 text-sm">Sistematização Concluída</h4>
              <p className="text-xs text-emerald-700 leading-relaxed font-medium">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Inputs form */}
          <div className="lg:col-span-5 space-y-6 no-print">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-sm font-bold text-slate-800">Parâmetros de Planejamento</h2>
                </div>
                {activePlan && (
                  <button
                    onClick={handleStartNew}
                    className="text-xs text-emerald-700 hover:text-emerald-950 font-bold flex items-center space-x-1"
                    id="btn-new-plan"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Criar Novo</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleGenerate} className="space-y-5">
                
                {/* Proposed Text */}
                <div className="space-y-1.5">
                  <label htmlFor="teacher-text-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Descrição da Proposta Pedagógica <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="teacher-text-input"
                    rows={4}
                    value={teacherText}
                    onChange={(e) => setTeacherText(e.target.value)}
                    placeholder="Descreva a ideia bruta da aula (ex: 'Quero dar uma aula prática de frações utilizando fatias de pizza de papelão para alunos do 5º ano...')"
                    className="w-full text-sm border border-slate-200 rounded-lg p-3 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-400"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block font-medium">O consultor irá lapidar e detalhar esta ideia bruta transformando-a em uma aula completa.</span>
                </div>

                {/* Content name */}
                <div className="space-y-1.5">
                  <label htmlFor="content-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Conteúdo / Objeto de Conhecimento
                  </label>
                  <input
                    type="text"
                    id="content-input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Ex: Frações equivalentes, Reações Químicas, Revolução Francesa"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Bloom cognitive base verb */}
                <div className="space-y-1.5">
                  <label htmlFor="verb-base-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Verbo Base de Ação (Taxonomia de Bloom)
                  </label>
                  <select
                    id="verb-base-input"
                    value={verbBase}
                    onChange={(e) => setVerbBase(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all font-semibold text-slate-700"
                  >
                    {BLOOM_VERBS.map((v) => (
                      <option key={v.verb} value={v.verb}>
                        {v.verb} ({v.level})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    {BLOOM_VERBS.find(v => v.verb === verbBase)?.desc}
                  </span>
                </div>

                {/* Student count & Class info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="student-count-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Qtd. de Alunos
                    </label>
                    <input
                      type="number"
                      id="student-count-input"
                      min={1}
                      max={150}
                      value={studentCount}
                      onChange={(e) => setStudentCount(Number(e.target.value))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="characteristics-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Perfil da Turma
                    </label>
                    <input
                      type="text"
                      id="characteristics-input"
                      value={classCharacteristics}
                      onChange={(e) => setClassCharacteristics(e.target.value)}
                      placeholder="Ex: agitada, cooperativa"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Multiple NEE profiles selection checkbox block */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Estudantes com Necessidades Especiais (NEE) <span className="text-purple-600 font-extrabold">*</span>
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium pb-1.5">Marque todos os perfis presentes para que o consultor gere adequações metodológicas personalizadas:</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {NEE_PROFILES.map((p) => {
                      const isSelected = selectedNeeProfiles.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleToggleNeeProfile(p.id)}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "bg-purple-50 border-purple-500 text-purple-900 ring-1 ring-purple-500/20"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                          }`}
                          title={`${p.label}: ${p.description}`}
                        >
                          <div className="flex items-center space-x-1.5 justify-between">
                            <span className="text-xs font-bold font-mono">{p.label}</span>
                            {isSelected && <Check className="h-3 w-3 text-purple-600 shrink-0" />}
                          </div>
                          <span className="text-[9px] text-slate-400 block truncate font-medium">{p.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-2 border border-emerald-800"
                  id="submit-generate-plan"
                >
                  <Sparkles className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                  <span>{isGenerating ? "Lapidando Plano de Aula..." : "Sistematizar Plano de Aula"}</span>
                </button>

              </form>
            </div>

            {/* Quick Fill-in Guide */}
            <div className="bg-slate-900 text-slate-300 rounded-xl p-5 space-y-3 shadow-inner">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
                <Info className="h-4 w-4" />
                <span>Guia Rápido de Preenchimento</span>
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Para obter uma sistematização pedagógica de alta qualidade institucional, certifique-se de indicar na descrição da proposta:
              </p>
              <ul className="text-xs space-y-1.5 pl-4 list-disc text-slate-400 font-medium">
                <li><strong className="text-slate-200">Conteúdo Temático:</strong> O foco científico principal do objeto de aprendizagem.</li>
                <li><strong className="text-slate-200">Verbo Base de Ação:</strong> Nível de complexidade cognitiva esperado baseado no verbo.</li>
                <li><strong className="text-slate-200">Quantidade de Alunos:</strong> Tamanho estimado da classe.</li>
                <li><strong className="text-slate-200">Características da Turma:</strong> Nível de autonomia, foco, engajamento ou agitação.</li>
                <li><strong className="text-slate-200">Perfil de Inclusão:</strong> Quaisquer necessidades educacionais adicionais dos estudantes.</li>
              </ul>
            </div>

            {/* Internal logs system to demonstrate stability and error logging */}
            {serverLogs.length > 0 && (
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                  <Clock className="h-4 w-4 text-emerald-700" />
                  <span>Auditoria de Logs Pedagógicos</span>
                </h3>
                <div className="max-h-40 overflow-y-auto space-y-2 text-[10px] font-mono bg-slate-50 p-2.5 rounded border border-slate-100">
                  {serverLogs.map((log, index) => (
                    <div key={index} className={`pb-1 border-b border-slate-100 last:border-b-0 flex items-center justify-between ${log.success ? "text-emerald-700" : "text-red-700"}`}>
                      <span>{log.model} [{log.success ? "OK" : "ERRO"}]</span>
                      <span>{log.responseTimeMs}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Active Result or Loading Placeholders */}
          <div className="lg:col-span-7 space-y-6">
            {isGenerating ? (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center space-y-6 no-print" id="loading-placeholder">
                <div className="relative h-16 w-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-emerald-700 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-md font-bold text-slate-800">Sistematizando Diretrizes Pedagógicas</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    A IA está cruzando suas ideias originais com a Taxonomia de Bloom, Currículo Estruturante, Desenho Universal para Aprendizagem (DUA) e estruturando adaptações focalizadas em NEE...
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 max-w-xs mx-auto space-y-1 text-left text-[11px] text-emerald-800 font-mono">
                  <div className="flex items-center space-x-1.5">
                    <Check className="h-3 w-3 animate-pulse" />
                    <span>Conectando à API estável do Gemini...</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Check className="h-3 w-3 animate-pulse" />
                    <span>Mapeando habilidades SESI/BNCC...</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Check className="h-3 w-3 animate-pulse" />
                    <span>Calculando estratégias de acessibilidade...</span>
                  </div>
                </div>
              </div>
            ) : activePlan ? (
              <PlanResult 
                plan={activePlan} 
                onSave={handleSaveActivePlan}
                isSaving={false}
              />
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-4 no-print" id="empty-state">
                <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-800">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-md font-bold text-slate-800">Seu Espaço de Planejamento Ativo</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Descreva a ideia inicial da sua aula e selecione os perfis de inclusão. O assistente gerará um plano estruturado completo em 8 dimensões pronto para exportar ou imprimir.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTeacherText("Quero planejar uma aula experimental de magnetismo, aproximando imãs de diversos objetos metálicos e não-metálicos na sala. A turma do 6º ano é bastante ativa e possui um aluno com TEA e outro com TDAH.");
                    setSelectedNeeProfiles(["TEA", "TDAH"]);
                    setContent("Magnetismo e Materiais Condutores");
                    setVerbBase("Analisar");
                  }}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs border border-emerald-200 transition"
                  id="btn-demo-input"
                >
                  <span>Carregar Proposta Exemplo</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

        </div>

      </main>

      {/* Footer */}
      <Footer />

      {/* History drawer overlay */}
      <HistoryDrawer 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectPlan={handleSelectPlan}
        activePlanId={currentSavedPlan?.id}
      />

      {/* Comprehensive Fill-in guide modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs no-print" id="guide-modal">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-emerald-700" />
                <h3 className="text-md font-bold text-slate-900">Guia de Preenchimento do Professor</h3>
              </div>
              <button 
                onClick={() => setIsGuideOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                id="close-guide-modal"
              >
                Fechar
              </button>
            </div>

            {/* Scrollable contents */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 leading-relaxed">
              <section className="space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-700 rounded-full" />
                  <span>Descrição da Proposta Pedagógica</span>
                </h4>
                <p className="text-xs text-justify">
                  Este é o campo principal onde você deve descrever sua ideia bruta para a aula. Pode ser uma descrição livre e sem formalidades técnicas. Conte o que você quer fazer, quais materiais pretende usar, ou qual desafio deseja propor. O assistente usará estas informações para estruturar as etapas da aula.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-700 rounded-full" />
                  <span>Habilidades Curriculares Autônomas</span>
                </h4>
                <p className="text-xs text-justify">
                  O sistema de inteligência artificial analisa o tema inserido e seleciona de forma autônoma a habilidade da BNCC (Base Nacional Comum Curricular) e do Currículo Estruturante do SESI que melhor justificam pedagogicamente o seu conteúdo de ensino.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-700 rounded-full" />
                  <span>Taxonomia de Bloom Aplicada</span>
                </h4>
                <p className="text-xs text-justify">
                  Ao escolher um verbo de ação (ex: Lembrar, Analisar, Criar), você define o nível de esforço e maturidade cognitiva da aula. Os objetivos gerados serão totalmente orientados por este verbo, garantindo que as atividades propostas desafiem os estudantes na medida correta.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center space-x-1.5 text-purple-900">
                  <span className="h-1.5 w-1.5 bg-purple-700 rounded-full" />
                  <span>Inclusão e Adaptação Metodológica NEE</span>
                </h4>
                <p className="text-xs text-justify">
                  Este assistente foca no atendimento de estudantes com necessidades educacionais especiais. Marcar os perfis NEE (como TEA, TDAH ou Baixa Visão) fará com que o consultor pedagógico gere adaptações extremamente detalhadas na metodologia, recursos e sistemas avaliativos da aula, promovendo a integração verdadeira do aluno sem sobrecarga cognitiva.
                </p>
              </section>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsGuideOpen(false)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-sm"
                id="btn-confirm-guide"
              >
                Entendi as Diretrizes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
