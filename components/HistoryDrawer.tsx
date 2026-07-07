import React, { useState, useEffect } from "react";
import { SavedLessonPlan } from "../types";
import { StorageService } from "../services/storageService";
import { X, Search, FileText, Trash2, Copy, Eye, Calendar, BookOpen } from "lucide-react";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: SavedLessonPlan) => void;
  activePlanId?: string;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  activePlanId
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [plans, setPlans] = useState<SavedLessonPlan[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen, searchTerm]);

  const loadPlans = () => {
    const fetched = StorageService.searchPlans(searchTerm);
    // Sort plans by descending date (newest first)
    fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setPlans(fetched);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja realmente excluir este plano de aula permanentemente?")) {
      StorageService.deletePlan(id);
      loadPlans();
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated = StorageService.duplicatePlan(id);
    if (duplicated) {
      loadPlans();
      alert("Plano de aula duplicado com sucesso!");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end no-print" id="history-drawer">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-emerald-700" />
            <h2 className="text-md font-bold text-slate-900">Histórico de Planos Salvos</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition"
            id="close-history-drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por disciplina, conteúdo, NEE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              id="search-plans-input"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {plans.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">Nenhum plano de aula encontrado.</p>
              <p className="text-xs text-slate-400 mt-1">Gere novos planos de aula na tela principal para vê-los aqui.</p>
            </div>
          ) : (
            plans.map((p) => {
              const dateFormatted = new Date(p.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              const isActive = p.id === activePlanId;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPlan(p);
                    onClose();
                  }}
                  className={`group p-4 rounded-lg border text-left cursor-pointer transition-all ${
                    isActive 
                      ? "border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50" 
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                  id={`plan-card-${p.id}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-slate-800 text-sm group-hover:text-emerald-800 transition line-clamp-2 leading-tight">
                      {p.plan.discipline}: {p.plan.content}
                    </h3>
                    
                    {/* Action buttons */}
                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => handleDuplicate(p.id, e)}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-emerald-700 transition"
                        title="Duplicar Plano"
                        id={`btn-duplicate-${p.id}`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(p.id, e)}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-500 hover:text-red-600 transition"
                        title="Excluir Plano"
                        id={`btn-delete-${p.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata tags */}
                  <div className="mt-3 flex flex-wrap gap-1.5 items-center text-[11px] text-slate-500">
                    <div className="flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded">
                      <Calendar className="h-3 w-3" />
                      <span>{dateFormatted}</span>
                    </div>

                    {p.plan.methodologyName && (
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                        {p.plan.methodologyName}
                      </span>
                    )}

                    {p.plan.selectedProfiles && p.plan.selectedProfiles.length > 0 && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-semibold">
                        Adaptado: {p.plan.selectedProfiles.length} NEE
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
