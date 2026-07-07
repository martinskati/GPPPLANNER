import React from "react";
import { BookOpen, HelpCircle, History } from "lucide-react";

interface HeaderProps {
  onShowHistory: () => void;
  onShowGuide: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onShowHistory, onShowGuide, historyCount }) => {
  return (
    <header className="bg-emerald-800 text-white shadow-md border-b border-emerald-950 no-print" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-800 shadow-inner flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg leading-tight tracking-tight sm:text-xl">
              Planner Pedagógico Institucional
            </h1>
            <p className="text-xs text-emerald-200 font-medium">
              Sistematização de Planos de Aula e Adaptações Metodológicas Integradas
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onShowGuide}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-emerald-100 hover:text-white hover:bg-emerald-700 transition font-medium text-sm border border-emerald-700/50"
            title="Ver Guia de Preenchimento"
            id="btn-show-guide"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Guia de Preenchimento</span>
          </button>

          <button
            onClick={onShowHistory}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-900 text-white transition font-medium text-sm shadow-sm border border-emerald-600"
            id="btn-show-history"
          >
            <History className="h-4 w-4" />
            <span>Meus Planos</span>
            {historyCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse border border-white">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
