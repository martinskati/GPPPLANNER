
import React from 'react';
import { GraduationCap, History } from 'lucide-react';

interface HeaderProps {
  onOpenHistory?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenHistory }) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-800 p-2 rounded-lg shadow-md">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-none">Assistente Pedagógico</h1>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Institucional</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={onOpenHistory}
            className="flex items-center space-x-2 text-sm font-bold text-slate-600 hover:text-emerald-800 transition-colors px-3 py-2 rounded-lg hover:bg-emerald-50"
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">Banco de Planos</span>
          </button>

          <nav className="hidden md:flex items-center space-x-4">
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <span className="text-sm text-slate-400 font-bold">SISTEMA BNCC</span>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
