import React, { useState } from "react";
import { LessonPlan } from "../types";
import { 
  FileText, Printer, FileDown, Layers, Target, Compass, 
  MapPin, ClipboardCheck, Accessibility, HelpCircle, Users, CheckCircle, ChevronDown, Award
} from "lucide-react";

interface PlanResultProps {
  plan: LessonPlan;
  onSave?: () => void;
  isSaving?: boolean;
}

export const PlanResult: React.FC<PlanResultProps> = ({ plan, onSave, isSaving }) => {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [openNEEIndex, setOpenNEEIndex] = useState<number>(0);

  const tabs = [
    { id: 1, label: "Identificação", icon: FileText },
    { id: 2, label: "Objetivos (Bloom)", icon: Target },
    { id: 3, label: "Metodologia", icon: Compass },
    { id: 4, label: "Desenvolvimento", icon: Layers },
    { id: 5, label: "Avaliação", icon: ClipboardCheck },
    { id: 6, label: "Inclusão (DUA)", icon: Accessibility },
    { id: 7, label: "Adaptação para NEE", icon: Users },
    { id: 8, label: "Justificativa Pedagógica", icon: HelpCircle }
  ];

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Word (.doc) export function (Office HTML standard)
  const handleExportWord = () => {
    const filename = `Plano_de_Aula_${plan.discipline.replace(/\s+/g, "_")}_${plan.content.replace(/\s+/g, "_")}.doc`;
    
    // Build beautiful HTML for Word with full details
    let docHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${plan.discipline} - ${plan.content}</title>
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #1e293b; }
        h1 { color: #065f46; font-size: 24pt; margin-bottom: 5px; }
        h2 { color: #0f766e; font-size: 16pt; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px; }
        h3 { color: #0284c7; font-size: 13pt; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: top; }
        th { background-color: #f1f5f9; color: #334155; font-weight: bold; }
        .label { font-weight: bold; color: #475569; }
        .badge { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 4px; font-size: 9pt; }
        .badge-bloom { background-color: #dcfce7; border: 1px solid #bbf7d0; color: #15803d; }
        .card { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 10px; border-radius: 6px; }
        .footer { font-size: 9pt; color: #64748b; margin-top: 50px; text-align: center; border-top: 1px solid #cbd5e1; padding-top: 10px; }
      </style>
    </head>
    <body>
      <h1>PLANO DE AULA PEDAGÓGICO</h1>
      <p style="font-size: 11pt; color: #64748b; margin-top:0;">Gerado automaticamente via Assistente Pedagógico Institucional</p>
      
      <h2>1. Identificação</h2>
      <table>
        <tr>
          <td width="25%" class="label">Componente Curricular / Disciplina</td>
          <td>${plan.discipline}</td>
        </tr>
        <tr>
          <td class="label">Conteúdo / Objeto de Conhecimento</td>
          <td>${plan.content}</td>
        </tr>
        <tr>
          <td class="label">Habilidade BNCC</td>
          <td>${plan.bnccSkill}</td>
        </tr>
        <tr>
          <td class="label">Habilidade SESI</td>
          <td>${plan.sesiSkill}</td>
        </tr>
        <tr>
          <td class="label">Contextualização</td>
          <td>${plan.context}</td>
        </tr>
      </table>

      <h2>2. Objetivos de Aprendizagem (Taxonomia de Bloom)</h2>
      <table>
        <thead>
          <tr>
            <th width="70%">Objetivo de Aprendizagem</th>
            <th width="30%">Nível de Bloom</th>
          </tr>
        </thead>
        <tbody>
          ${plan.learningObjectives.map(obj => `
            <tr>
              <td>${obj.objective}</td>
              <td><span class="badge badge-bloom">${obj.bloomLevel}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>3. Metodologia Ativa</h2>
      <div class="card">
        <p><span class="label">Abordagem Adotada:</span> ${plan.methodologyName}</p>
        <p><span class="label">Por que foi escolhida:</span> ${plan.whyChosen}</p>
        <p><span class="label">Como será aplicada:</span> ${plan.howApplied}</p>
        <p><span class="label">Vantagens Pedagógicas:</span> ${plan.pedagogicalBenefits}</p>
        <p><span class="label">Papel do Professor:</span> ${plan.teacherRole}</p>
        <p><span class="label">Papel do Estudante:</span> ${plan.studentRole}</p>
      </div>

      <h2>4. Roteiro de Desenvolvimento (Passo a Passo)</h2>
      ${plan.developmentSteps.map((step, idx) => `
        <div class="card" style="margin-top: 10px;">
          <h3>Etapa ${idx + 1}: ${step.stepName} (${step.duration})</h3>
          <p><span class="label">Organização da Turma:</span> ${step.classOrganization}</p>
          <p><span class="label">O que ensinar (Fundamentação teórica):</span> ${step.whatToTeach}</p>
          <p><span class="label">Como ensinar (Metodologia prática):</span> ${step.howToTeach}</p>
          <p><span class="label">Recursos Necessários:</span> ${step.resources.join(', ')}</p>
        </div>
      `).join('')}

      <h2>5. Avaliação da Aprendizagem</h2>
      <div class="card">
        <p><span class="label">Evidências de Aprendizagem:</span> ${plan.evidence}</p>
        <p><span class="label">Instrumentos Avaliativos:</span> ${plan.instruments.join(', ')}</p>
        <p><span class="label">Critérios de Êxito:</span></p>
        <ul>
          ${plan.criteria.map(crit => `<li>${crit}</li>`).join('')}
        </ul>
        <p><span class="label">Rubricas de Desempenho:</span> ${plan.rubrics}</p>
        <p><span class="label">Feedback Formativo:</span> ${plan.formativeFeedback}</p>
      </div>

      <h2>6. Diretrizes de Inclusão - DUA</h2>
      <div class="card">
        <p><span class="label">Múltiplos Meios de Apresentação (DUA):</span> ${plan.duaRepresentation}</p>
        <p><span class="label">Múltiplos Meios de Ação e Expressão (DUA):</span> ${plan.duaExpression}</p>
        <p><span class="label">Múltiplos Meios de Engajamento (DUA):</span> ${plan.duaEngagement}</p>
      </div>

      <h2>7. Adaptações de Metodologia para NEE</h2>
      <p style="font-style: italic; color:#475569;">Geração de adequações altamente focalizadas nos perfis de inclusão selecionados.</p>
      ${plan.neeAdaptations.length === 0 ? `
        <p>Nenhum perfil específico de necessidade educacional especial foi indicado. Aplicação das diretrizes universais de DUA.</p>
      ` : plan.neeAdaptations.map(nee => `
        <div class="card" style="border-left: 4px solid #8b5cf6; margin-top: 15px;">
          <h3 style="color:#6d28d9; margin-top:0;">Adaptação de Metodologia para Estudante com: ${nee.profile}</h3>
          <p><span class="label">Objetivo da Adaptação:</span> ${nee.adaptationObjective}</p>
          <p><span class="label">Barreiras Identificadas na Aula:</span> ${nee.potentialBarriers}</p>
          <p><span class="label">Adequações na Metodologia:</span> ${nee.methodologyAdjustments}</p>
          <p><span class="label">Adequações de Recursos:</span> ${nee.resourceAdjustments}</p>
          <p><span class="label">Adequações de Comunicação:</span> ${nee.communicationAdjustments}</p>
          <p><span class="label">Adequações de Avaliação:</span> ${nee.evaluationAdjustments}</p>
          <p><span class="label">Apoios Necessários:</span> ${nee.necessarySupports}</p>
          <p><span class="label">Mediação do Professor:</span> ${nee.teacherMediation}</p>
          <p><span class="label">Participação dos Colegas:</span> ${nee.peerParticipation}</p>
          <p><span class="label">Princípios DUA Utilizados:</span> ${nee.duaPrinciples}</p>
          <p><span class="label">Tecnologias Assistivas Recomendadas:</span> ${nee.assistiveTechnologies}</p>
          <p><span class="label">Organização do Espaço Físico:</span> ${nee.physicalSpace}</p>
          <p><span class="label">Evitando Sobrecarga Cognitiva:</span> ${nee.cognitiveOverloadPrevention}</p>
          <p><span class="label">Sugestões de Participação Ativa:</span> ${nee.activeParticipationSuggestions}</p>
        </div>
      `).join('')}

      <h2>8. Justificativa Pedagógica do Planejamento Reverso</h2>
      <div class="card">
        <p><span class="label">Justificativa da Habilidade BNCC/SESI:</span> ${plan.justificationBncc}</p>
        <p><span class="label">Justificativa da Metodologia Ativa:</span> ${plan.justificationMethodology}</p>
        <p><span class="label">Justificativa das Estratégias de Avaliação:</span> ${plan.justificationAssessment}</p>
        <p><span class="label">Justificativa das Estratégias de Inclusão:</span> ${plan.justificationInclusion}</p>
      </div>

      <div class="footer">
        <p>Planejamento de Aula elaborado profissionalmente. Proibida cópia parcial sem autorização do docente.</p>
      </div>
    </body>
    </html>
    `;

    const blob = new Blob([docHTML], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 overflow-hidden print:shadow-none print:border-none" id="plan-result-container">
      
      {/* Action Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center space-x-2">
          <Layers className="h-5 w-5 text-emerald-700 animate-pulse" />
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Plano de Aula Sistematizado</h3>
            <p className="text-xs text-slate-500 font-medium">Use as abas para navegar pelas dimensões pedagógicas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 active:bg-emerald-800 text-white font-medium text-xs hover:bg-emerald-700 transition disabled:opacity-50 shadow-xs"
              id="btn-save-plan"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isSaving ? "Salvando..." : "Salvar no Histórico"}</span>
            </button>
          )}

          <button
            onClick={handleExportWord}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium text-xs border border-slate-200 transition shadow-xs"
            id="btn-export-word"
            title="Exportar para Microsoft Word (DOC)"
          >
            <FileDown className="h-4 w-4 text-sky-700" />
            <span>Exportar DOCX</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-medium text-xs border border-slate-200 transition shadow-xs"
            id="btn-print-pdf"
            title="Imprimir ou Salvar como PDF"
          >
            <Printer className="h-4 w-4 text-emerald-700" />
            <span>Imprimir PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-1 p-2 no-print overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 shrink-0 ${
                isActive
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              id={`tab-button-${tab.id}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.id === 7 && plan.selectedProfiles.length > 0 && (
                <span className={`h-2 w-2 rounded-full bg-purple-500 ${isActive ? "ring-2 ring-white" : ""}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Print Layout Header */}
      <div className="print-only p-8 text-center border-b-2 border-slate-200">
        <h1 className="text-3xl font-bold text-emerald-800">PLANO DE AULA PEDAGÓGICO</h1>
        <p className="text-sm text-slate-500 mt-1">Gerado através do Assistente Pedagógico Institucional</p>
      </div>

      {/* Main Panel Content */}
      <div className="p-6 sm:p-8 space-y-6">

        {/* Tab 1: Identificação */}
        {(activeTab === 1 || window.matchMedia("print").matches) && (
          <section className={`${activeTab === 1 ? "block" : "hidden print:block"} space-y-4`} id="section-identificacao">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-emerald-700 print:hidden" />
              <span>1. Identificação Geral da Aula</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="block text-xs text-slate-500 uppercase font-mono font-bold">Componente Curricular</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{plan.discipline}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="block text-xs text-slate-500 uppercase font-mono font-bold">Objeto de Conhecimento / Conteúdo</span>
                <span className="text-sm font-bold text-slate-800 mt-0.5 block">{plan.content}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg border-l-4 border-l-emerald-600">
                <span className="block text-xs text-slate-500 uppercase font-mono font-bold">Habilidade BNCC Selecionada</span>
                <span className="text-sm font-medium text-slate-800 mt-1 block leading-relaxed">{plan.bnccSkill}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg border-l-4 border-l-blue-600">
                <span className="block text-xs text-slate-500 uppercase font-mono font-bold">Habilidade SESI Correspondente</span>
                <span className="text-sm font-medium text-slate-800 mt-1 block leading-relaxed">{plan.sesiSkill}</span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="block text-xs text-slate-500 uppercase font-mono font-bold">Contextualização Pedagógica</span>
                <p className="text-sm text-slate-700 mt-1 block leading-relaxed text-justify whitespace-pre-wrap">{plan.context}</p>
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Objetivos de Aprendizagem */}
        {(activeTab === 2 || window.matchMedia("print").matches) && (
          <section className={`${activeTab === 2 ? "block" : "hidden print:block"} space-y-4`} id="section-objetivos">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center space-x-2">
              <Target className="h-5 w-5 text-emerald-700 print:hidden" />
              <span>2. Objetivos de Aprendizagem (Taxonomia de Bloom)</span>
            </h2>

            <p className="text-xs text-slate-500 font-medium">Os objetivos de aprendizagem descrevem as competências cognitivas estruturadas a serem consolidadas durante o percurso da aula:</p>

            <div className="grid grid-cols-1 gap-3">
              {plan.learningObjectives.map((obj, i) => (
                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-2.5">
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed">{obj.objective}</p>
                  </div>
                  <span className="inline-flex self-start sm:self-center items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Nível: {obj.bloomLevel}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 3: Metodologia Ativa */}
        {(activeTab === 3 || window.matchMedia("print").matches) && (
          <section className={`${activeTab === 3 ? "block" : "hidden print:block"} space-y-4`} id="section-metodologia">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center space-x-2">
              <Compass className="h-5 w-5 text-emerald-700 print:hidden" />
              <span>3. Metodologia de Ensino Ativa</span>
            </h2>

            <div className="p-5 bg-emerald-50/40 border border-emerald-100 rounded-lg">
              <span className="block text-xs text-slate-500 uppercase font-mono font-bold">Abordagem Didática Ativa</span>
              <h3 className="text-md font-bold text-emerald-800 mt-1">{plan.methodologyName}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                <span className="font-bold text-slate-800 text-xs block uppercase font-mono text-emerald-800">Por que foi escolhida?</span>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">{plan.whyChosen}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                <span className="font-bold text-slate-800 text-xs block uppercase font-mono text-emerald-800">Vantagens Pedagógicas</span>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">{plan.pedagogicalBenefits}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
              <span className="font-bold text-slate-800 text-xs block uppercase font-mono text-emerald-800">Como será aplicada na prática?</span>
              <p className="text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">{plan.howApplied}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1 border-t-2 border-t-amber-500">
                <span className="font-bold text-slate-800 text-xs block uppercase font-mono text-amber-700">Papel do Professor</span>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">{plan.teacherRole}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1 border-t-2 border-t-blue-500">
                <span className="font-bold text-slate-800 text-xs block uppercase font-mono text-blue-700">Papel do Estudante</span>
                <p className="text-sm text-slate-600 leading-relaxed text-justify">{plan.studentRole}</p>
              </div>
            </div>
          </section>
        )}

        {/* Tab 4: Desenvolvimento (Sequência Didática) */}
        {(activeTab === 4 || window.matchMedia("print").matches) && (
          <section className={`${activeTab === 4 ? "block" : "hidden print:block"} space-y-4`} id="section-desenvolvimento">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center space-x-2">
              <Layers className="h-5 w-5 text-emerald-700 print:hidden" />
              <span>4. Roteiro e Sequência Didática</span>
            </h2>

            <div className="space-y-4">
              {plan.developmentSteps.map((step, i) => (
                <div key={i} className="border border-slate-200/80 rounded-lg overflow-hidden shadow-xs">
                  <div className="bg-slate-50 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-700 text-white text-xs font-bold">
                        {i + 1}
                      </span>
                      <h3 className="font-bold text-sm text-slate-800">{step.stepName}</h3>
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                      <span className="bg-slate-200 px-2.5 py-0.5 rounded font-mono font-semibold text-slate-700">{step.duration}</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-medium">{step.classOrganization}</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="block text-[11px] uppercase font-mono text-emerald-800 font-bold">O que ensinar (Fundamentação Teórica)</span>
                        <p className="text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">{step.whatToTeach}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="block text-[11px] uppercase font-mono text-emerald-800 font-bold">Como ensinar (Intervenção Prática)</span>
                        <p className="text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">{step.howToTeach}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="block text-[11px] uppercase font-mono text-slate-500 font-bold mb-1.5">Recursos & Materiais</span>
                      <div className="flex flex-wrap gap-1">
                        {step.resources.map((res, rIdx) => (
                          <span key={rIdx} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded border border-slate-200">
                            {res}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 5: Avaliação */}
        {(activeTab === 5 || window.matchMedia("print").matches) && (
          <section className={`${activeTab === 5 ? "block" : "hidden print:block"} space-y-4`} id="section-avaliacao">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center space-x-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-700 print:hidden" />
              <span>5. Estrutura de Avaliação Formativa</span>
            </h2>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
              <span className="block text-xs uppercase font-mono text-emerald-800 font-bold">Evidências de Aprendizagem</span>
              <p className="text-sm text-slate-700 leading-relaxed text-justify whitespace-pre-wrap">{plan.evidence}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                <span className="block text-xs uppercase font-mono text-emerald-800 font-bold">Instrumentos de Avaliação</span>
                <div className="flex flex-wrap gap-1">
                  {plan.instruments.map((ins, iIdx) => (
                    <span key={iIdx} className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      {ins}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                <span className="block text-xs uppercase font-mono text-emerald-800 font-bold">Critérios Avaliativos</span>
                <ul className="text-sm text-slate-700 space-y-1.5 list-disc pl-4">
                  {plan.criteria.map((crit, cIdx) => (
                    <li key={cIdx}>{crit}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                <span className="block text-xs uppercase font-mono text-emerald-800 font-bold">Matriz de Rubricas Resumidas</span>
                <div className="text-sm text-slate-700 leading-relaxed text-justify whitespace-pre-wrap">{plan.rubrics}</div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1 border-t-4 border-t-emerald-600">
                <span className="block text-xs uppercase font-mono text-emerald-800 font-bold">Estratégias de Feedback Formativo</span>
                <p className="text-sm text-slate-700 leading-relaxed text-justify whitespace-pre-wrap">{plan.formativeFeedback}</p>
              </div>
            </div>
          </section>
        )}

        {/* Tab 6: Inclusão (DUA) */}
        {(activeTab === 6 || window.matchMedia("print").matches) && (
          <section className={`${activeTab === 6 ? "block" : "hidden print:block"} space-y-4`} id="section-dua">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center space-x-2">
              <Accessibility className="h-5 w-5 text-emerald-700 print:hidden" />
              <span>6. Estratégias do Desenho Universal para Aprendizagem (DUA)</span>
            </h2>

            <p className="text-xs text-slate-500 font-medium">O DUA assegura meios alternativos de acesso, manifestação e motivação, tornando a aula flexível e inclusiva para toda a heterogeneidade da classe:</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-lg space-y-1.5 border-t-4 border-t-emerald-700">
                <span className="font-bold text-emerald-900 text-xs uppercase font-mono block">Representação</span>
                <p className="text-xs text-emerald-700 italic font-medium">O que aprender: Variedade na forma de apresentar o conteúdo.</p>
                <p className="text-sm text-slate-700 leading-relaxed pt-1.5 border-t border-emerald-100 text-justify whitespace-pre-wrap">{plan.duaRepresentation}</p>
              </div>

              <div className="p-4 bg-sky-50/30 border border-sky-100 rounded-lg space-y-1.5 border-t-4 border-t-sky-700">
                <span className="font-bold text-sky-900 text-xs uppercase font-mono block">Ação & Expressão</span>
                <p className="text-xs text-sky-700 italic font-medium">Como aprender: Opções diversificadas para ação ativa dos alunos.</p>
                <p className="text-sm text-slate-700 leading-relaxed pt-1.5 border-t border-sky-100 text-justify whitespace-pre-wrap">{plan.duaExpression}</p>
              </div>

              <div className="p-4 bg-purple-50/30 border border-purple-100 rounded-lg space-y-1.5 border-t-4 border-t-purple-700">
                <span className="font-bold text-purple-900 text-xs uppercase font-mono block">Engajamento</span>
                <p className="text-xs text-purple-700 italic font-medium">Por que aprender: Estratégias para despertar relevância e autonomia.</p>
                <p className="text-sm text-slate-700 leading-relaxed pt-1.5 border-t border-purple-100 text-justify whitespace-pre-wrap">{plan.duaEngagement}</p>
              </div>
            </div>
          </section>
        )}

        {/* Tab 7: Adaptação da Metodologia para NEE */}
        {(activeTab === 7 || window.matchMedia("print").matches) && (
          <section className={`${activeTab === 7 ? "block" : "hidden print:block"} space-y-4`} id="section-nee">
            <h2 className="text-lg font-bold text-purple-950 border-b pb-1.5 border-purple-100 flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-700 print:hidden" />
              <span>7. Adaptação Metodológica Direcionada para NEE</span>
            </h2>

            {plan.neeAdaptations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                <Accessibility className="h-12 w-12 text-slate-300 mx-auto" />
                <h3 className="text-md font-bold text-slate-700">Acessibilidade Universal Aplicada</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Nenhum estudante com perfil NEE específico foi indicado para esta aula. O sistema estruturou a aula com base nas diretrizes gerais de DUA descritas na aba anterior.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-purple-900 text-sm">Adequações de Metodologia Ativadas</h3>
                    <p className="text-xs text-purple-700 font-medium">Adaptações exclusivas geradas para {plan.neeAdaptations.length} perfil(is) selecionado(s)</p>
                  </div>
                  
                  {/* Selector for profiles */}
                  <div className="flex flex-wrap gap-1">
                    {plan.neeAdaptations.map((nee, idx) => (
                      <button
                        key={idx}
                        onClick={() => setOpenNEEIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          openNEEIndex === idx
                            ? "bg-purple-700 text-white shadow-xs"
                            : "bg-purple-100 text-purple-950 hover:bg-purple-200"
                        }`}
                      >
                        {nee.profile}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Map adaptations directly in printable version, but show single selected tab in normal preview */}
                {plan.neeAdaptations.map((nee, idx) => {
                  const isVisibleInPreview = activeTab === 7 && openNEEIndex === idx;
                  return (
                    <div 
                      key={idx} 
                      className={`${isVisibleInPreview ? "block" : "hidden print:block"} border border-purple-200 bg-purple-50/10 rounded-xl overflow-hidden shadow-xs print:mt-6 print:border-slate-300`}
                    >
                      {/* Sub header */}
                      <div className="bg-purple-950 text-white px-5 py-3.5 flex items-center justify-between print:bg-slate-100 print:text-slate-900 print:border-b">
                        <div className="flex items-center space-x-2">
                          <span className="p-1 bg-purple-800 rounded-md text-purple-100 print:hidden">
                            <Accessibility className="h-4 w-4" />
                          </span>
                          <h4 className="font-bold text-sm">ESTUDANTE COM PERFIL: {nee.profile}</h4>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-800/80 text-purple-100 uppercase font-mono print:text-slate-700 print:bg-slate-200">
                          Adequações Específicas
                        </span>
                      </div>

                      <div className="p-5 sm:p-6 space-y-6">
                        
                        {/* Highlights row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-purple-50/40 border border-purple-100/60 rounded-lg space-y-1">
                            <span className="block text-[10px] font-mono font-bold uppercase text-purple-800">Objetivo da Adaptação</span>
                            <p className="text-sm text-slate-700 leading-relaxed font-semibold">{nee.adaptationObjective}</p>
                          </div>
                          <div className="p-4 bg-red-50/30 border border-red-100/60 rounded-lg space-y-1 border-l-4 border-l-red-500">
                            <span className="block text-[10px] font-mono font-bold uppercase text-red-800">Barreiras de Aprendizagem Estimadas</span>
                            <p className="text-sm text-slate-700 leading-relaxed">{nee.potentialBarriers}</p>
                          </div>
                        </div>

                        {/* Adapts details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                            <span className="block text-xs font-bold text-purple-900 uppercase font-mono">1. Adequações na Metodologia</span>
                            <p className="text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">{nee.methodologyAdjustments}</p>
                          </div>

                          <div className="space-y-1 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                            <span className="block text-xs font-bold text-purple-900 uppercase font-mono">2. Adequação dos Recursos</span>
                            <p className="text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">{nee.resourceAdjustments}</p>
                          </div>

                          <div className="space-y-1 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                            <span className="block text-xs font-bold text-purple-900 uppercase font-mono">3. Mudanças na Comunicação & Instrução</span>
                            <p className="text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">{nee.communicationAdjustments}</p>
                          </div>

                          <div className="space-y-1 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                            <span className="block text-xs font-bold text-purple-900 uppercase font-mono">4. Mudanças no Sistema de Avaliação</span>
                            <p className="text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">{nee.evaluationAdjustments}</p>
                          </div>
                        </div>

                        {/* Classroom handling */}
                        <div className="border-t border-purple-100/80 pt-5 space-y-4">
                          <h5 className="text-xs font-bold text-purple-950 uppercase font-mono tracking-wider">Manejo, Ambiente e Interação na Sala de Aula</h5>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-indigo-50/20 border border-indigo-100 rounded-lg space-y-1">
                              <span className="block text-[10px] font-bold text-indigo-900 uppercase font-mono">Mediação do Professor</span>
                              <p className="text-xs text-slate-600 leading-relaxed text-justify">{nee.teacherMediation}</p>
                            </div>
                            <div className="p-4 bg-teal-50/20 border border-teal-100 rounded-lg space-y-1">
                              <span className="block text-[10px] font-bold text-teal-900 uppercase font-mono">Participação dos Colegas</span>
                              <p className="text-xs text-slate-600 leading-relaxed text-justify">{nee.peerParticipation}</p>
                            </div>
                            <div className="p-4 bg-amber-50/20 border border-amber-100 rounded-lg space-y-1">
                              <span className="block text-[10px] font-bold text-amber-900 uppercase font-mono">Organização do Espaço Físico</span>
                              <p className="text-xs text-slate-600 leading-relaxed text-justify">{nee.physicalSpace}</p>
                            </div>
                          </div>
                        </div>

                        {/* Assistive supports */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-purple-100/80 pt-5">
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                            <span className="block text-xs font-bold text-purple-900 uppercase font-mono">Apoios Gerais & Tecnologias Assistivas</span>
                            <p className="text-xs text-slate-600 leading-relaxed text-justify"><strong className="text-slate-800">Apoios Necessários:</strong> {nee.necessarySupports}</p>
                            <p className="text-xs text-slate-600 leading-relaxed text-justify"><strong className="text-slate-800">Principais Tecnologias Assistivas:</strong> {nee.assistiveTechnologies}</p>
                          </div>

                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                            <span className="block text-xs font-bold text-purple-900 uppercase font-mono">DUA & Sobrecarga Cognitiva</span>
                            <p className="text-xs text-slate-600 leading-relaxed text-justify"><strong className="text-slate-800">Princípios DUA Ativados:</strong> {nee.duaPrinciples}</p>
                            <p className="text-xs text-slate-600 leading-relaxed text-justify"><strong className="text-slate-800">Prevenção de Sobrecarga:</strong> {nee.cognitiveOverloadPrevention}</p>
                          </div>
                        </div>

                        {/* Active Suggestion Banner */}
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center space-x-3">
                          <span className="p-1 bg-emerald-600 rounded-full text-white print:hidden">
                            <CheckCircle className="h-4 w-4" />
                          </span>
                          <div className="space-y-0.5">
                            <span className="block text-[10px] font-bold text-emerald-800 uppercase font-mono">Sugestão de Atuação e Protagonismo Ativo</span>
                            <p className="text-sm text-emerald-950 font-medium leading-relaxed">{nee.activeParticipationSuggestions}</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 8: Justificativa Pedagógica do Planejamento Reverso */}
        {(activeTab === 8 || window.matchMedia("print").matches) && (
          <section className={`${activeTab === 8 ? "block" : "hidden print:block"} space-y-4`} id="section-justificativa">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-1.5 border-slate-100 flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-emerald-700 print:hidden" />
              <span>8. Justificativa Pedagógica do Planejamento Reverso</span>
            </h2>

            <p className="text-xs text-slate-500 font-medium">Nesta dimensão, as escolhas do docente são fundamentadas à luz das ciências da educação e da consistência epistemológica:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5 border-l-4 border-l-emerald-700">
                <span className="font-bold text-slate-800 text-xs uppercase font-mono block text-emerald-800">Justificativa da Habilidade Curricular</span>
                <p className="text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">{plan.justificationBncc}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5 border-l-4 border-l-blue-700">
                <span className="font-bold text-slate-800 text-xs uppercase font-mono block text-blue-800">Justificativa da Metodologia Ativa</span>
                <p className="text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">{plan.justificationMethodology}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5 border-l-4 border-l-amber-700">
                <span className="font-bold text-slate-800 text-xs uppercase font-mono block text-amber-800">Justificativa da Estratégia de Avaliação</span>
                <p className="text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">{plan.justificationAssessment}</p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5 border-l-4 border-l-purple-700">
                <span className="font-bold text-slate-800 text-xs uppercase font-mono block text-purple-800">Justificativa da Acessibilidade & Adaptação</span>
                <p className="text-sm text-slate-600 leading-relaxed text-justify whitespace-pre-wrap">{plan.justificationInclusion}</p>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
