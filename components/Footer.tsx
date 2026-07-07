import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 text-slate-400 text-sm no-print" id="app-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
        <p className="font-medium text-slate-300">
          Planner Pedagógico Institucional v2.0
        </p>
        <p className="text-xs text-slate-500 max-w-2xl mx-auto">
          Sistema profissional voltado ao planejamento reverso de aula alinhado às diretrizes da BNCC, Currículo Estruturante SESI e preceitos do Desenho Universal para Aprendizagem (DUA).
        </p>
        <div className="text-[11px] text-emerald-500/80 font-mono pt-2">
          [Pedagogical VM Status: Operational]
        </div>
      </div>
    </footer>
  );
};
