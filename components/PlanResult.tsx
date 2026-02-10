
import React from 'react';
import { LessonPlan } from '../types';
import { Printer, RefreshCw, CheckCircle2, ListChecks, Target, Presentation, ClipboardCheck, Layers, HeartHandshake } from 'lucide-react';

interface PlanResultProps {
  plan: LessonPlan;
  onReset: () => void;
}

const PlanResult: React.FC<PlanResultProps> = ({ plan, onReset }) => {
  const handlePrint = () => window.print();

  const renderTextContent = (content: string | string[]) => {
    if (Array.isArray(content)) return content.join(', ');
    return content;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Barra de Ações Superior */}
      <div className="flex items-center justify-between no-print px-2">
        <button
          onClick={onReset}
          className="flex items-center space-x-2 text-slate-500 hover:text-emerald-800 transition-colors text-sm font-bold group"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span>Criar Outra Versão</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir para Diário</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden relative">
        
        {/* Cabeçalho do Plano */}
        <div className="bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 p-10 md:p-14 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-900 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border border-emerald-200">
                <Layers className="w-3.5 h-3.5" />
                <span>Padrão BNCC Qualificado</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight text-slate-900">{plan.discipline}</h1>
              <div className="flex items-center space-x-3 text-slate-500">
                <div className="w-12 h-[2px] bg-emerald-800"></div>
                <p className="text-xl font-bold text-slate-700">{plan.content}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hidden md:block text-right">
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Documento Técnico</p>
              <p className="text-lg font-bold text-slate-800">Modelo Pedagógico</p>
            </div>
          </div>
        </div>

        {/* Corpo do Plano */}
        <div className="p-8 md:p-14 space-y-16 bg-white text-slate-600">
          
          {/* Metodologia */}
          <section className="relative">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-emerald-800 p-2.5 rounded-xl shadow-lg">
                <Presentation className="text-white w-6 h-6" />
              </div>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">▸ Metodologia de Ensino</h2>
            </div>
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
              <p className="text-slate-800 leading-relaxed font-bold text-lg italic">
                {plan.methodology}
              </p>
            </div>
          </section>

          {/* Objetivos */}
          <section>
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-emerald-800 p-2.5 rounded-xl shadow-lg">
                <Target className="text-white w-6 h-6" />
              </div>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">▸ Objetivos de Aprendizagem (Bloom)</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {plan.learningObjectives.map((obj, i) => (
                <div key={i} className="flex items-start space-x-4 bg-white p-5 rounded-2xl border border-slate-100 group hover:border-emerald-300 transition-all shadow-sm">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-700 shrink-0" />
                  <span className="text-slate-700 font-bold text-sm leading-relaxed">{obj}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Sequência Didática */}
          <section className="space-y-8">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-800 p-2.5 rounded-xl shadow-lg">
                <ListChecks className="text-white w-6 h-6" />
              </div>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">▸ Sequência Didática</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-2">Objeto de Conhecimento</h3>
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 h-full">
                  <div className="text-sm leading-relaxed font-semibold text-slate-700">
                    {plan.development.what}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-2">Ações e Mediação</h3>
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 h-full">
                  <div className="text-sm leading-relaxed font-semibold text-slate-700">
                    {plan.development.how}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Inclusão */}
          {plan.inclusionStrategies && (
            <section className="relative">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-emerald-900 p-2.5 rounded-xl shadow-lg">
                  <HeartHandshake className="text-white w-6 h-6" />
                </div>
                <h2 className="text-xs font-black text-emerald-800 tracking-widest uppercase">▸ Estratégias de Inclusão e DUA</h2>
              </div>
              <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100">
                <p className="text-emerald-900 leading-relaxed font-bold text-lg italic">
                  {renderTextContent(plan.inclusionStrategies)}
                </p>
              </div>
            </section>
          )}

          {/* Avaliação */}
          <div className="grid md:grid-cols-2 gap-10 pt-8 border-t border-slate-100">
            <section className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="text-emerald-800 w-5 h-5" />
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidências de Aprendizagem</h2>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm text-slate-700 font-bold">
                {renderTextContent(plan.learningEvidence)}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center space-x-2">
                <ClipboardCheck className="text-emerald-800 w-5 h-5" />
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instrumentos de Avaliação</h2>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm text-slate-700 font-bold">
                {renderTextContent(plan.assessmentInstruments)}
              </div>
            </section>
          </div>
        </div>

        {/* Rodapé */}
        <div className="bg-slate-50 p-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Sistematização Pedagógica Autorizada
          </p>
          <p className="text-xs text-slate-500 font-bold italic bg-white px-6 py-2 rounded-full border border-slate-200">
            "A prática docente qualificada transforma o futuro."
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanResult;
