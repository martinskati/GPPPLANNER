import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { generateLessonPlan } from './services/geminiService';
import { storageService } from './services/storageService';
import { LessonPlan, AppState, SavedLessonPlan } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import PlanResult from './components/PlanResult';
import HistoryDrawer from './components/HistoryDrawer';
import { BookOpen, Send, Loader2, ClipboardList, AlertCircle, MessageSquare, CheckCircle, Star } from 'lucide-react';

const LOADING_PHASES = [
  "Analisando perfil da turma e proposta bruta...",
  "Mapeando habilidades estruturantes SESI/BNCC...",
  "Alinhando objetivos de aprendizagem com a Taxonomia de Bloom...",
  "Estruturando a sequência didática (O que e Como)...",
  "Adaptando estratégias com Desenho Universal para Aprendizagem (DUA)...",
  "Consolidando e gerando o plano de aula final..."
];

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  
  const [state, setState] = useState<AppState>({
    isGenerating: false,
    plan: null,
    error: null,
    showHistory: false
  });
  
  const [history, setHistory] = useState<SavedLessonPlan[]>([]);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  // Load initial history safely
  useEffect(() => {
    setHistory(storageService.getHistory());
  }, []);

  // Sync history when drawer is opened
  useEffect(() => {
    if (state.showHistory) {
      setHistory(storageService.getHistory());
    }
  }, [state.showHistory]);

  // Handle stage-by-stage loading transitions
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (state.isGenerating) {
      setLoadingStep(0);
      intervalId = setInterval(() => {
        setLoadingStep((prev) => (prev < 5 ? prev + 1 : prev));
      }, 2500); // 2.5 seconds per stage transition
    } else {
      setLoadingStep(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [state.isGenerating]);

  // Handle plan generation form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setState((prev) => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      const generatedPlan = await generateLessonPlan(inputText);
      storageService.savePlan(generatedPlan);
      setHistory(storageService.getHistory());

      setState({
        isGenerating: false,
        plan: generatedPlan,
        error: null,
        showHistory: false
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }));
    }
  }, [inputText]);

  // Handle support feedback form submission
  const handleSendFeedback = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setFeedbackStatus('sending');
    setTimeout(() => {
      setFeedbackStatus('success');
      setFeedbackText('');
      setTimeout(() => setFeedbackStatus('idle'), 5000);
    }, 1500);
  }, [feedbackText]);

  // Reset to initial screen for a new plan
  const handleReset = useCallback(() => {
    setState({ isGenerating: false, plan: null, error: null, showHistory: false });
    setInputText('');
  }, []);

  // Select historical plan
  const handleSelectHistoryPlan = useCallback((savedPlan: SavedLessonPlan) => {
    setState((prev) => ({
      ...prev,
      plan: savedPlan,
      showHistory: false,
      error: null
    }));
  }, []);

  // Delete plan from history with secure confirmation
  const handleDeletePlan = useCallback((id: string) => {
    if (confirm('Tem certeza que deseja excluir este plano do histórico?')) {
      const updated = storageService.deletePlan(id);
      setHistory(updated);
    }
  }, []);

  // Duplicate plan from history
  const handleDuplicatePlan = useCallback((id: string) => {
    const updated = storageService.duplicatePlan(id);
    setHistory(updated);
  }, []);

  // Import backup history
  const handleImportBackup = useCallback((importedPlans: SavedLessonPlan[]) => {
    setHistory(importedPlans);
  }, []);

  // Memoize orientation guide list for performance
  const guideItems = useMemo(() => [
    { number: 1, title: "Conteúdo", desc: "Assunto principal da aula." },
    { number: 2, title: "Verbo Base BNCC", desc: "Ação cognitiva (Ex: Analisar, Criar, Identificar)." },
    { number: 3, title: "Dados da Turma", desc: "Quantidade de alunos e comportamento (Ex: agitada, heterogênea)." },
    { number: 4, title: "Perfil de Inclusão", desc: "TEA, TDAH, Baixa Visão, Dislexia ou sem especificidades." }
  ], []);

  // Memoize key feature cards
  const featureCards = useMemo(() => [
    { title: 'Banco de Dados', desc: 'Todo plano é arquivado automaticamente para consulta e edição futura.' },
    { title: 'Alinhamento Cognitivo', desc: 'Verbos de Bloom rigorosamente alinhados à habilidade informada.' },
    { title: 'Foco na Diversidade', desc: 'Estratégias de DUA desenhadas conforme o perfil de inclusão da turma.' }
  ], []);

  return (
    <div className="min-h-screen flex flex-col text-slate-800 relative bg-slate-50">
      <Header onOpenHistory={useCallback(() => setState((prev) => ({ ...prev, showHistory: true })), [])} />
      
      <HistoryDrawer 
        isOpen={state.showHistory}
        onClose={useCallback(() => setState((prev) => ({ ...prev, showHistory: false })), [])}
        history={history}
        onSelectPlan={handleSelectHistoryPlan}
        onDeletePlan={handleDeletePlan}
        onDuplicatePlan={handleDuplicatePlan}
        onImportBackup={handleImportBackup}
      />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        {state.isGenerating ? (
          /* Progressive Loading Screen Card */
          <div 
            role="status"
            aria-live="polite"
            className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12 text-center max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500"
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-800 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-800 animate-pulse" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-4">Sistematizando sua Proposta</h2>
              <p className="text-slate-500 text-sm">Aguarde enquanto estruturamos o seu plano pedagógico...</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 max-w-md mx-auto">
              {LOADING_PHASES.map((phase, idx) => {
                const isCompleted = loadingStep > idx;
                const isActive = loadingStep === idx;
                
                return (
                  <div key={idx} className="flex items-center space-x-3 transition-all duration-300">
                    {isCompleted ? (
                      <div className="bg-emerald-100 text-emerald-800 rounded-full p-1 shrink-0 animate-in zoom-in duration-300">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                    ) : isActive ? (
                      <div className="bg-emerald-800 text-white rounded-full p-1 shrink-0 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    ) : (
                      <div className="bg-slate-200 text-slate-400 rounded-full p-1 shrink-0">
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                      </div>
                    )}
                    <span className={`text-sm font-semibold transition-colors duration-300 ${
                      isCompleted ? "text-slate-700" : isActive ? "text-emerald-950 font-bold" : "text-slate-400"
                    }`}>
                      {phase}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : !state.plan ? (
          <div className="space-y-10 animate-in fade-in duration-500">
            
            {/* Bloco de Orientação - Dados Obrigatórios */}
            <section aria-labelledby="guide-title" className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <ClipboardList className="text-emerald-800 w-6 h-6" />
                <h2 id="guide-title" className="text-lg font-bold text-emerald-900">Guia de Sistematização</h2>
              </div>
              <p className="text-sm text-emerald-800/80 mb-6 font-medium">
                Para um plano qualificado e preciso, certifique-se de incluir as seguintes informações no campo abaixo:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {guideItems.map((item) => (
                  <div key={item.number} className="bg-white/60 p-3 rounded-xl border border-emerald-200/50 flex items-start space-x-3">
                    <div className="bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded mt-0.5">{item.number}</div>
                    <div className="text-xs">
                      <span className="font-bold text-emerald-900 block">{item.title}</span>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Card de Entrada Principal */}
            <section aria-labelledby="form-title" className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              
              <div className="flex items-start space-x-4 mb-6 relative z-10">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <BookOpen className="text-emerald-800 w-6 h-6" />
                </div>
                <div>
                  <h2 id="form-title" className="text-xl font-bold text-slate-900">Nova Proposta Pedagógica</h2>
                  <p className="text-slate-500 mt-1 text-sm">
                    Preencha os dados abaixo para que a ferramenta qualifique sua ideia autoral.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Dados obrigatórios para o plano:\n\nConteúdo: \nVerbo base (BNCC): \nQuantidade de alunos: \nCaracterística da turma: \nPerfil de inclusão:`}
                  aria-label="Dados obrigatórios para a proposta pedagógica"
                  className="w-full h-64 p-5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-800 focus:border-transparent transition-all outline-none resize-none text-slate-800 placeholder-slate-400 leading-relaxed text-sm font-medium focus-visible:ring-2 focus-visible:ring-emerald-800"
                  disabled={state.isGenerating}
                />
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 mr-2 text-emerald-700" />
                    O plano gerado respeita as diretrizes do SESI/BNCC
                  </div>
                  <button
                    type="submit"
                    disabled={state.isGenerating || !inputText.trim()}
                    aria-label="Gerar Plano de Aula"
                    className="w-full md:w-auto flex items-center justify-center space-x-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-800"
                  >
                    <Send className="w-5 h-5" />
                    <span>Gerar Plano de Aula</span>
                  </button>
                </div>
              </form>
            </section>

            {state.error && (
              <div 
                role="alert"
                className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center animate-in fade-in duration-300"
              >
                <span className="font-bold">Erro:</span>
                <span className="ml-2 font-semibold">{state.error}</span>
              </div>
            )}

            {/* Features Info */}
            <section className="grid md:grid-cols-3 gap-6" aria-label="Benefícios do assistente">
              {featureCards.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all group">
                  <h3 className="font-bold text-slate-900 mb-2 group-hover:text-emerald-800 transition-colors">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </section>

            {/* Seção de Feedback */}
            <section aria-labelledby="feedback-title" className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-800 p-2 rounded-lg">
                      <MessageSquare className="text-white w-5 h-5" />
                    </div>
                    <h2 id="feedback-title" className="text-xl font-bold text-slate-900">Escuta Docente</h2>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Sua sugestão qualifica nossa ferramenta. Ajude-nos a melhorar o apoio pedagógico institucional.
                  </p>
                </div>

                <div className="w-full md:w-96">
                  {feedbackStatus === 'success' ? (
                    <div 
                      role="status"
                      aria-live="polite"
                      className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl text-center animate-in zoom-in duration-300"
                    >
                      <CheckCircle className="w-10 h-10 text-emerald-800 mx-auto mb-3" />
                      <h3 className="font-bold text-emerald-900">Feedback Recebido!</h3>
                      <p className="text-xs text-emerald-700 mt-1">Obrigado por contribuir com nossa comunidade.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSendFeedback} className="space-y-3">
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Elogie ou sugira melhorias..."
                        aria-label="Texto do feedback"
                        className="w-full h-24 p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-800 outline-none transition-all resize-none focus-visible:ring-2 focus-visible:ring-emerald-800"
                        disabled={feedbackStatus === 'sending'}
                      />
                      <button
                        type="submit"
                        disabled={feedbackStatus === 'sending' || !feedbackText.trim()}
                        aria-label="Enviar Sugestão"
                        className="w-full flex items-center justify-center space-x-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-100 disabled:text-slate-400 text-white py-2 rounded-xl font-bold text-sm transition-all shadow-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-800"
                      >
                        {feedbackStatus === 'sending' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Star className="w-4 h-4" />
                            <span>Enviar Sugestão</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : (
          <PlanResult plan={state.plan} onReset={handleReset} />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
