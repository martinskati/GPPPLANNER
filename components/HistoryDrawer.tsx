import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SavedLessonPlan } from '../types';
import { 
  X, Trash2, Calendar, BookOpen, ChevronRight, Clock, 
  Search, Filter, ArrowUpDown, Copy, Download, Upload, 
  AlertCircle, CheckCircle2 
} from 'lucide-react';
import { storageService } from '../services/storageService';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SavedLessonPlan[];
  onSelectPlan: (plan: SavedLessonPlan) => void;
  onDeletePlan: (id: string) => void;
  onDuplicatePlan: (id: string) => void;
  onImportBackup: (imported: SavedLessonPlan[]) => void;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ 
  isOpen, 
  onClose, 
  history, 
  onSelectPlan, 
  onDeletePlan,
  onDuplicatePlan,
  onImportBackup
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clean status alerts after 4 seconds
  useEffect(() => {
    if (importStatus) {
      const timer = setTimeout(() => setImportStatus(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [importStatus]);

  // Extract unique disciplines for filtering options
  const uniqueDisciplines = useMemo(() => {
    const list = history.map(h => h.discipline);
    return ['ALL', ...Array.from(new Set(list))];
  }, [history]);

  // Process filters, searches and sorting
  const processedHistory = useMemo(() => {
    let result = [...history];

    // 1. Text Search Filter (matches content, discipline, context or skills)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(plan => 
        plan.content.toLowerCase().includes(term) ||
        plan.discipline.toLowerCase().includes(term) ||
        plan.context.toLowerCase().includes(term) ||
        (plan.justification && plan.justification.toLowerCase().includes(term))
      );
    }

    // 2. Discipline Filter
    if (selectedDiscipline !== 'ALL') {
      result = result.filter(plan => plan.discipline === selectedDiscipline);
    }

    // 3. Sorting (Chronological)
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [history, searchTerm, selectedDiscipline, sortOrder]);

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

  // Export entire history database to json file
  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `banco_de_planos_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setImportStatus({ type: 'success', message: 'Backup exportado com sucesso!' });
    } catch (e) {
      setImportStatus({ type: 'error', message: 'Falha ao exportar backup.' });
    }
  };

  // Import JSON backup file
  const handleImportBackupClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawJson = event.target?.result as string;
        const parsed = JSON.parse(rawJson);
        const result = storageService.importHistory(parsed);
        
        if (result.success) {
          setImportStatus({ 
            type: 'success', 
            message: `${result.count} novos planos importados com sucesso!` 
          });
          onImportBackup(storageService.getHistory());
        } else {
          setImportStatus({ 
            type: 'error', 
            message: result.error || 'Falha na validação do backup.' 
          });
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Arquivo JSON inválido ou corrompido.' });
      }
    };
    reader.readAsText(file);
    // Reset file input value to allow uploading same file again
    e.target.value = '';
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex justify-end no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer" 
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Drawer Content */}
      <div className="relative w-full max-w-md bg-white h-full border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 id="drawer-title" className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-800" />
              Banco de Planos
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-wide">Produções Qualificadas ({history.length})</p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Fechar banco de planos"
            className="p-2 hover:bg-emerald-50 rounded-full transition-colors text-slate-400 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-800 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search, Filter & Actions Bar */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por conteúdo ou componente..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-800 focus:border-transparent outline-none transition-all placeholder-slate-400 font-medium"
              aria-label="Campo de pesquisa rápida no histórico"
            />
          </div>

          <div className="flex gap-2">
            {/* Filter by discipline */}
            <div className="flex-1 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </span>
              <select
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-800 outline-none transition-all font-bold text-slate-700 cursor-pointer"
                aria-label="Filtrar por Componente Curricular"
              >
                {uniqueDisciplines.map(discipline => (
                  <option key={discipline} value={discipline}>
                    {discipline === 'ALL' ? 'Todos os Componentes' : discipline}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort order toggle */}
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-800"
              title={sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}
              aria-label="Inverter ordem cronológica"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>{sortOrder === 'desc' ? 'Recentes' : 'Antigos'}</span>
            </button>
          </div>

          {/* Backup Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleExportBackup}
              disabled={history.length === 0}
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-800"
              title="Exportar arquivo de backup .json contendo todo seu histórico"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>
            
            <button
              onClick={handleImportBackupClick}
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-800"
              title="Importar planos de um arquivo de backup .json externo"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar</span>
            </button>
            
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Status Alerts */}
        {importStatus && (
          <div className={`p-3 mx-4 mt-3 rounded-xl border flex items-center gap-2 animate-in fade-in duration-300 ${
            importStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-red-50 border-red-100 text-red-600'
          }`}>
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="text-xs font-bold">{importStatus.message}</span>
          </div>
        )}

        {/* Plans List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {processedHistory.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white rounded-2xl border border-slate-200">
              <Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-slate-900 font-bold">Sem registros</h3>
              <p className="text-slate-500 text-xs mt-2">
                {history.length === 0 
                  ? 'Os planos gerados aparecerão automaticamente aqui.'
                  : 'Nenhum plano corresponde aos filtros aplicados.'}
              </p>
            </div>
          ) : (
            processedHistory.map((plan) => (
              <div 
                key={plan.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-800/30 hover:shadow-md transition-all group relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="text-[9px] font-black text-emerald-900 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-widest truncate max-w-[60%]">
                      {plan.discipline}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" />
                      {formatDate(plan.createdAt)}
                    </span>
                  </div>
                  
                  <h3 className="text-slate-900 font-bold text-sm line-clamp-2 mb-3 pr-8 group-hover:text-emerald-800 transition-colors">
                    {plan.content}
                  </h3>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onSelectPlan(plan)}
                    className="flex items-center text-xs text-emerald-800 font-black hover:text-emerald-950 focus-visible:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-800 py-1 rounded"
                    aria-label={`Visualizar plano sobre ${plan.content}`}
                  >
                    <span>Carregar Plano</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Duplicate plan action button */}
                    <button
                      onClick={() => onDuplicatePlan(plan.id)}
                      className="p-1.5 text-slate-400 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-800"
                      title="Duplicar este plano de aula"
                      aria-label={`Duplicar plano sobre ${plan.content}`}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete plan action button */}
                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-800"
                      title="Excluir este plano de aula"
                      aria-label={`Excluir plano sobre ${plan.content}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
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
