import React, { useState } from 'react';
import { LessonPlan } from '../types';
import { 
  Printer, RefreshCw, CheckCircle2, ListChecks, Target, 
  Presentation, ClipboardCheck, Layers, HeartHandshake,
  Copy, Download, FileText, Check, Award, BookOpen
} from 'lucide-react';

interface PlanResultProps {
  plan: LessonPlan;
  onReset: () => void;
}

const PlanResult: React.FC<PlanResultProps> = ({ plan, onReset }) => {
  const [copiedType, setCopiedType] = useState<'text' | 'word' | null>(null);

  const handlePrint = () => window.print();

  const renderTextContent = (content: string | string[]) => {
    if (Array.isArray(content)) return content.join(', ');
    return content;
  };

  // Helper to generate formatted HTML output for Microsoft Word pasting/exporting
  const getStyledHtml = (p: LessonPlan) => {
    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Plano de Aula - ${p.discipline}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 30px; }
          h1 { color: #065f46; font-size: 24pt; margin-bottom: 5px; font-weight: bold; }
          h2 { color: #0f172a; font-size: 14pt; border-bottom: 2px solid #065f46; padding-bottom: 5px; margin-top: 25px; font-weight: bold; }
          h3 { color: #065f46; font-size: 11pt; text-transform: uppercase; margin-top: 15px; font-weight: bold; }
          .badge { background-color: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 9pt; display: inline-block; text-transform: uppercase; }
          .meta-box { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background-color: #f8fafc; margin-bottom: 20px; }
          .methodology-box { background-color: #f8fafc; border-left: 4px solid #065f46; padding: 15px; border-radius: 4px; font-style: italic; font-weight: bold; font-size: 11pt; margin-bottom: 20px; }
          .list-item { margin-bottom: 8px; }
          .evidence-box, .assess-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-top: 10px; }
          .justification-box { background-color: #ecfdf5; border: 1px solid #d1fae5; padding: 15px; border-radius: 8px; color: #064e3b; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="badge">Currículo SESI / BNCC Qualificado</div>
        <h1>${p.discipline}</h1>
        <p style="font-size: 14pt; font-weight: bold; color: #475569; margin-top: 5px; margin-bottom: 25px;">${p.content}</p>
        
        <div class="meta-box">
          <strong>Contextualização da Aula:</strong><br/>
          ${p.context}
        </div>

        <h2>▸ Justificativa Técnico-Pedagógica</h2>
        <div class="justification-box">
          ${p.justification || 'Escolha articulada e justificada conforme diretrizes curriculares nacionais.'}
        </div>

        <h2>▸ Metodologia Ativa de Ensino</h2>
        <div class="methodology-box">
          ${p.methodology}
        </div>

        <h2>▸ Habilidades Estruturantes (SESI / BNCC)</h2>
        <ul>
          ${p.skills.map(skill => `<li class="list-item"><strong>${skill}</strong></li>`).join('')}
        </ul>

        <h2>▸ Objetivos de Aprendizagem (Cognição de Bloom)</h2>
        <ul>
          ${p.learningObjectives.map(obj => `<li class="list-item">${obj}</li>`).join('')}
        </ul>

        <h2>▸ Sequência Didática (Desenvolvimento)</h2>
        <div style="margin-bottom: 20px;">
          <h3>Objeto de Conhecimento (O Que será abordado)</h3>
          <p>${p.development.what}</p>
        </div>
        <div>
          <h3>Ações e Mediação (Como será abordado)</h3>
          <p>${p.development.how}</p>
        </div>

        <h2>▸ Estratégias de Inclusão e DUA</h2>
        <div class="justification-box" style="background-color: #f0fdf4; border-color: #bbf7d0;">
          ${p.inclusionStrategies}
        </div>

        <table width="100%" style="margin-top: 30px; border-collapse: collapse;">
          <tr>
            <td width="48%" style="vertical-align: top; padding-right: 4%;">
              <h2>▸ Evidências de Aprendizagem</h2>
              <div class="evidence-box">${p.learningEvidence}</div>
            </td>
            <td width="48%" style="vertical-align: top;">
              <h2>▸ Instrumentos de Avaliação</h2>
              <div class="assess-box">${p.assessmentInstruments}</div>
            </td>
          </tr>
        </table>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 40px; margin-bottom: 20px;" />
        <p style="font-size: 8pt; color: #94a3b8; text-align: center; text-transform: uppercase; letter-spacing: 1px;">Sistematização Pedagógica - Documento Técnico</p>
      </body>
      </html>
    `;
  };

  // Helper to generate plain text format
  const getPlainText = (p: LessonPlan) => {
    return `=== PLANO DE AULA CURRÍCULO SESI / BNCC ===\n` +
      `DISCIPLINA: ${p.discipline}\n` +
      `CONTEÚDO: ${p.content}\n\n` +
      `[CONTEXTUALIZAÇÃO]\n${p.context}\n\n` +
      `[JUSTIFICATIVA PEDAGÓGICA]\n${p.justification || 'Escolha articulada e justificada conforme as diretrizes.'}\n\n` +
      `[METODOLOGIA ATIVA]\n${p.methodology}\n\n` +
      `[HABILIDADES ESTRUTURANTES SESI / BNCC]\n${p.skills.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}\n\n` +
      `[OBJETIVOS DE APRENDIZAGEM (BLOOM)]\n${p.learningObjectives.map((o, idx) => `${idx + 1}. ${o}`).join('\n')}\n\n` +
      `[SEQUÊNCIA DIDÁTICA (DESENVOLVIMENTO)]\n` +
      `* O QUE (Objeto de conhecimento):\n${p.development.what}\n\n` +
      `* COMO (Ações e Mediação):\n${p.development.how}\n\n` +
      `[ESTRATÉGIAS DE INCLUSÃO E DUA]\n${p.inclusionStrategies}\n\n` +
      `[EVIDÊNCIAS DE APRENDIZAGEM]\n${p.learningEvidence}\n\n` +
      `[INSTRUMENTOS DE AVALIAÇÃO]\n${p.assessmentInstruments}\n\n` +
      `Sistematização realizada por Assistente Pedagógico Docente Inteligente.`;
  };

  // Copy standard plain text to clipboard
  const handleCopyText = async () => {
    const text = getPlainText(plan);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType('text');
      setTimeout(() => setCopiedType(null), 3000);
    } catch (e) {
      console.error("Failed to copy plain text:", e);
    }
  };

  // Copy fully styled HTML content allowing users to paste with exact design in Word
  const handleCopyForWord = async () => {
    const html = getStyledHtml(plan);
    const text = getPlainText(plan);

    try {
      const clipboardItem = new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" })
      });
      await navigator.clipboard.write([clipboardItem]);
      setCopiedType('word');
      setTimeout(() => setCopiedType(null), 3000);
    } catch (e) {
      // Fallback
      try {
        await navigator.clipboard.writeText(text);
        setCopiedType('word');
        setTimeout(() => setCopiedType(null), 3000);
      } catch (fallbackError) {
        console.error("Clipboard copy failed:", fallbackError);
      }
    }
  };

  // Export and Download .doc file directly
  const handleExportWord = () => {
    try {
      const htmlContent = getStyledHtml(plan);
      const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `plano_de_aula_${plan.discipline.toLowerCase().replace(/\s+/g, '_')}.doc`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOCX download error:", err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      
      {/* Upper Action Bar (Hides on print automatically) */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print px-2 bg-white/60 p-4 rounded-2xl border border-slate-200 shadow-sm backdrop-blur-md">
        <button
          onClick={onReset}
          className="flex items-center space-x-2 text-slate-500 hover:text-emerald-800 transition-colors text-sm font-bold group focus-visible:ring-2 focus-visible:ring-emerald-800 focus:outline-none rounded-lg p-1"
          aria-label="Criar nova proposta ou versão"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span>Nova Proposta</span>
        </button>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Plain Text */}
          <button
            onClick={handleCopyText}
            className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:border-emerald-800/30 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-900 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-800 focus:outline-none"
            title="Copiar plano formatado como texto simples"
            aria-label="Copiar texto simples"
          >
            {copiedType === 'text' ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" />
                <span className="text-emerald-800">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Texto</span>
              </>
            )}
          </button>

          {/* Copy for MS Word (Clipboard Rich Paste) */}
          <button
            onClick={handleCopyForWord}
            className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:border-emerald-800/30 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-900 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-800 focus:outline-none"
            title="Copiar com formatação de cores e tabelas para colar diretamente no Microsoft Word"
            aria-label="Copiar formatado para Word"
          >
            {copiedType === 'word' ? (
              <>
                <Check className="w-4 h-4 text-emerald-700" />
                <span className="text-emerald-800">Formatado!</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Copiar para Word</span>
              </>
            )}
          </button>

          {/* Export and download Word file */}
          <button
            onClick={handleExportWord}
            className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-200 hover:border-emerald-800/30 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-900 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-800 focus:outline-none"
            title="Exportar plano de aula como arquivo .doc do Microsoft Word"
            aria-label="Download arquivo Word"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Word</span>
          </button>

          {/* Print/Save to PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-800 focus:outline-none"
            title="Imprimir documento ou salvar como PDF pelo navegador"
            aria-label="Imprimir plano ou salvar como PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printed Canvas Frame */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden relative print-canvas">
        
        {/* Banner Pedagógico do Topo */}
        <div className="bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 p-8 md:p-12 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Planejamento Reverso Qualificado</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-slate-900">{plan.discipline}</h1>
              <div className="flex items-center space-x-3 text-slate-500">
                <div className="w-12 h-[2px] bg-emerald-800 shrink-0"></div>
                <p className="text-lg md:text-xl font-bold text-slate-700 leading-snug">{plan.content}</p>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hidden md:block text-right shrink-0">
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                <Award className="w-3.5 h-3.5" />
                Diretrizes BNCC / SESI
              </p>
              <p className="text-base font-bold text-slate-800">Sistematização Pedagógica</p>
            </div>
          </div>
        </div>

        {/* Corpo estruturado do documento */}
        <div className="p-8 md:p-12 space-y-12 bg-white text-slate-600">
          
          {/* Contexto da proposta */}
          <section className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-800 p-2 rounded-xl shadow-md no-print shrink-0">
                <BookOpen className="text-white w-4 h-4" />
              </div>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">▸ Contextualização da Aula</h2>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <p className="text-slate-700 leading-relaxed font-semibold text-sm">
                {plan.context}
              </p>
            </div>
          </section>

          {/* Justificativa Pedagógica (New Core Requirement) */}
          {plan.justification && (
            <section className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-800 p-2 rounded-xl shadow-md no-print shrink-0">
                  <Award className="text-white w-4 h-4" />
                </div>
                <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">▸ Justificativa Técnico-Pedagógica</h2>
              </div>
              <div className="bg-emerald-50/60 p-6 rounded-2xl border border-emerald-100 text-emerald-950 font-bold text-sm leading-relaxed italic">
                {plan.justification}
              </div>
            </section>
          )}

          {/* Metodologia Ativa Selecionada */}
          <section className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-800 p-2 rounded-xl shadow-md no-print shrink-0">
                <Presentation className="text-white w-4 h-4" />
              </div>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">▸ Metodologia de Ensino</h2>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <p className="text-slate-800 leading-relaxed font-bold text-base italic">
                {plan.methodology}
              </p>
            </div>
          </section>

          {/* Habilidades Estruturantes do SESI/BNCC */}
          <section className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-800 p-2 rounded-xl shadow-md no-print shrink-0">
                <Layers className="text-white w-4 h-4" />
              </div>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">▸ Habilidades Estruturantes (SESI / BNCC)</h2>
            </div>
            <div className="space-y-2.5">
              {plan.skills.map((skill, index) => (
                <div key={index} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm group hover:border-emerald-300 transition-all">
                  <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-black text-[9px]">
                    {index + 1}
                  </div>
                  <span className="text-slate-700 font-bold text-xs leading-relaxed">{skill}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Objetivos de Aprendizagem alinhados a Bloom */}
          <section className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-800 p-2 rounded-xl shadow-md no-print shrink-0">
                <Target className="text-white w-4 h-4" />
              </div>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">▸ Objetivos de Aprendizagem (Cognição de Bloom)</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {plan.learningObjectives.map((obj, i) => (
                <div key={i} className="flex items-start space-x-3 bg-white p-4 rounded-xl border border-slate-100 group hover:border-emerald-300 transition-all shadow-sm">
                  <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-emerald-700 shrink-0" />
                  <span className="text-slate-700 font-bold text-xs leading-relaxed">{obj}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Sequência Didática (O que e Como) */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-800 p-2 rounded-xl shadow-md no-print shrink-0">
                <ListChecks className="text-white w-4 h-4" />
              </div>
              <h2 className="text-xs font-black text-slate-400 tracking-widest uppercase">▸ Sequência Didática (Desenvolvimento)</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-800"></span>
                  Objeto de Conhecimento (O quê)
                </h3>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-full">
                  <div className="text-xs leading-relaxed font-semibold text-slate-700">
                    {plan.development.what}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-800"></span>
                  Ações e Mediação (Como)
                </h3>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-full">
                  <div className="text-xs leading-relaxed font-semibold text-slate-700">
                    {plan.development.how}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Estratégias de Inclusão e DUA */}
          {plan.inclusionStrategies && (
            <section className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-900 p-2 rounded-xl shadow-md no-print shrink-0">
                  <HeartHandshake className="text-white w-4 h-4" />
                </div>
                <h2 className="text-xs font-black text-emerald-800 tracking-widest uppercase">▸ Estratégias de Inclusão e DUA</h2>
              </div>
              <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-100">
                <p className="text-emerald-900 leading-relaxed font-bold text-sm">
                  {renderTextContent(plan.inclusionStrategies)}
                </p>
              </div>
            </section>
          )}

          {/* Evidências e Instrumentos de Avaliação */}
          <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="text-emerald-800 w-4 h-4 shrink-0" />
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidências de Aprendizagem</h2>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold leading-relaxed">
                {renderTextContent(plan.learningEvidence)}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <ClipboardCheck className="text-emerald-800 w-4 h-4 shrink-0" />
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instrumentos de Avaliação</h2>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs text-slate-700 font-bold leading-relaxed">
                {renderTextContent(plan.assessmentInstruments)}
              </div>
            </section>
          </div>
        </div>

        {/* Rodapé institucional */}
        <div className="bg-slate-50 p-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Sistematização Pedagógica Autorizada
          </p>
          <p className="text-[11px] text-slate-500 font-bold italic bg-white px-5 py-2 rounded-full border border-slate-200 shadow-sm text-center">
            "A prática docente qualificada transforma o futuro."
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlanResult;
