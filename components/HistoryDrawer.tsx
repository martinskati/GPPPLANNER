
import React from 'react';
import { SavedLessonPlan } from '../types';
import { X, Trash2, Calendar, BookOpen, ChevronRight, Clock } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SavedLessonPlan[];
  onSelectPlan: (plan: SavedLessonPlan) => void;
  onDeletePlan: (id: string) => void;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ 
  isOpen, 
  onClose, 
  history, 
  onSelectPlan, 
  onDeletePlan 
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end no-print">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Drawer Content */}
      <div className="relative w-full max-w-md bg-white h-full border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-800" />
              Banco de Planos
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-bold">Produções Qualificadas</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-emerald-50 rounded-full transition-colors text-slate-400 hover:text-emerald-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-12 px-6">
              <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-slate-900 font-bold">Sem registros</h3>
              <p className="text-slate-500 text-sm mt-2">Os planos gerados aparecerão automaticamente aqui.</p>
            </div>
          ) : (
            history.map((plan) => (
              <div 
                key={plan.id}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-800/30 hover:shadow-md transition-all group relative"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => onSelectPlan(plan)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-emerald-900 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                      {plan.discipline}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(plan.createdAt)}
                    </span>
                  </div>
                  
                  <h3 className="text-slate-900 font-bold text-sm line-clamp-2 mb-2 group-hover:text-emerald-800 transition-colors">
                    {plan.content}
                  </h3>

                  <div className="flex items-center text-xs text-emerald-800 font-bold">
                    Recuperar Plano <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePlan(plan.id);
                  }}
                  className="absolute bottom-3 right-3 p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-center text-slate-400 font-bold tracking-widest uppercase">
          Base de Conhecimento Individual
        </div>
      </div>
    </div>
  );
};

export default HistoryDrawer;
