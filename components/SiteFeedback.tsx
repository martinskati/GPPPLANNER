import React, { useState, useEffect } from "react";
import { 
  Star, MessageSquare, Send, Trash2, Edit2, Check, Sparkles, 
  MessageCircle, Heart, User, ClipboardList, CheckCircle2, RotateCcw
} from "lucide-react";

export interface FeedbackItem {
  id: string;
  rating: number;
  userName: string;
  category: string;
  comment: string;
  createdAt: string;
  likes: number;
  likedByUser?: boolean;
}

const CATEGORIES = [
  { value: "Sugestão de Recurso", label: "Sugestão de Recurso", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "Facilidade de Uso", label: "Facilidade de Uso", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "Melhoria de Design", label: "Melhoria de Design", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "Reportar Bug", label: "Reportar Bug", color: "bg-red-50 text-red-700 border-red-200" },
  { value: "Outro", label: "Outro", color: "bg-slate-50 text-slate-700 border-slate-200" },
];

export function SiteFeedback() {
  const STORAGE_KEY = "pedagogical_site_feedback";

  // Feedbacks state
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  
  // Form states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [category, setCategory] = useState<string>("Sugestão de Recurso");
  const [comment, setComment] = useState<string>("");
  
  // UI States
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(true);

  // Load and pre-seed initial example feedback
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFeedbacks(JSON.parse(stored));
      } catch (e) {
        console.error("Erro ao ler feedbacks", e);
      }
    } else {
      // Pre-seed mock feedbacks for visual layout polish
      const initialSeed: FeedbackItem[] = [
        {
          id: "seed-1",
          rating: 5,
          userName: "Profa. Eliane Souza",
          category: "Facilidade de Uso",
          comment: "Adorei a facilidade de gerar planos detalhados com foco em NEE! Economiza horas de planejamento para aulas inclusivas.",
          createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), // 2 days ago
          likes: 5,
          likedByUser: false
        },
        {
          id: "seed-2",
          rating: 4,
          userName: "Prof. Marcos Andrade",
          category: "Sugestão de Recurso",
          comment: "Seria excelente poder baixar o plano de aula diretamente em formato PDF com uma formatação oficial da escola.",
          createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
          likes: 3,
          likedByUser: false
        }
      ];
      setFeedbacks(initialSeed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSeed));
    }
  }, []);

  const saveToStorage = (updatedList: FeedbackItem[]) => {
    setFeedbacks(updatedList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const currentUserName = userName.trim() || "Professor Anônimo";

    if (editingId) {
      // Editing Mode
      const updated = feedbacks.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            rating,
            userName: currentUserName,
            category,
            comment: comment.trim(),
            createdAt: new Date().toISOString()
          };
        }
        return item;
      });
      saveToStorage(updated);
      setEditingId(null);
      setIsSuccess(true);
    } else {
      // Create Mode
      const newFeedback: FeedbackItem = {
        id: Math.random().toString(36).substr(2, 9),
        rating,
        userName: currentUserName,
        category,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
        likes: 0,
        likedByUser: false
      };
      saveToStorage([newFeedback, ...feedbacks]);
      setIsSuccess(true);
    }

    // Reset fields
    setRating(5);
    setUserName("");
    setCategory("Sugestão de Recurso");
    setComment("");

    // Temporary success message
    setTimeout(() => {
      setIsSuccess(false);
    }, 4000);
  };

  const handleEdit = (item: FeedbackItem) => {
    setEditingId(item.id);
    setRating(item.rating);
    setUserName(item.userName === "Professor Anônimo" ? "" : item.userName);
    setCategory(item.category);
    setComment(item.comment);
    // Scroll smoothly to feedback form
    const formElement = document.getElementById("feedback-form-container");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Deseja realmente remover esta avaliação?")) {
      const filtered = feedbacks.filter(item => item.id !== id);
      saveToStorage(filtered);
      if (editingId === id) {
        setEditingId(null);
        setRating(5);
        setUserName("");
        setComment("");
      }
    }
  };

  const handleLike = (id: string) => {
    const updated = feedbacks.map(item => {
      if (item.id === id) {
        const liked = !item.likedByUser;
        return {
          ...item,
          likedByUser: liked,
          likes: liked ? item.likes + 1 : Math.max(0, item.likes - 1)
        };
      }
      return item;
    });
    saveToStorage(updated);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setRating(5);
    setUserName("");
    setCategory("Sugestão de Recurso");
    setComment("");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-6 no-print" id="feedback-form-container">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-emerald-600 fill-emerald-100" />
          <h2 className="text-sm font-bold text-slate-800">Avaliação do Site & Sugestões</h2>
        </div>
        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
          Sua opinião importa!
        </span>
      </div>

      {/* Success Notification Alert */}
      {isSuccess && (
        <div className="bg-emerald-50 border-l-4 border-l-emerald-500 p-3 rounded-lg flex items-center space-x-3 animate-fade-in" id="feedback-success-banner">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-emerald-900 text-xs">Obrigado pela sua contribuição!</h4>
            <p className="text-[10px] text-emerald-700">Sua avaliação e sugestão foram registradas com sucesso no histórico.</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Selection Area */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            O que você achou do nosso assistente pedagógico? <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-1.5 py-1">
            {[1, 2, 3, 4, 5].map((starValue) => {
              const currentDisplay = hoverRating !== null ? hoverRating : rating;
              const isFilled = starValue <= currentDisplay;
              return (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 focus:outline-hidden transform hover:scale-110 transition-transform"
                  title={`Avaliar com ${starValue} estrela(s)`}
                >
                  <Star 
                    className={`h-7 w-7 transition-colors ${
                      isFilled 
                        ? "fill-amber-400 text-amber-500" 
                        : "text-slate-300 hover:text-slate-400"
                    }`}
                  />
                </button>
              );
            })}
            <span className="text-xs font-bold text-slate-500 ml-2 font-mono">
              {rating === 5 && "Excelente! ⭐⭐⭐⭐⭐"}
              {rating === 4 && "Muito Bom! ⭐⭐⭐⭐"}
              {rating === 3 && "Bom / Razoável ⭐⭐⭐"}
              {rating === 2 && "Precisa de Ajustes ⭐⭐"}
              {rating === 1 && "Muito Fraco ⭐"}
            </span>
          </div>
        </div>

        {/* Name input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="feedback-username-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1">
              <User className="h-3 w-3 text-slate-500" />
              <span>Seu Nome (Opcional)</span>
            </label>
            <input
              type="text"
              id="feedback-username-input"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ex: Profa. Letícia ou Anônimo"
              maxLength={40}
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Category choices selection */}
          <div className="space-y-1.5">
            <label htmlFor="feedback-category-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Categoria do Feedback
            </label>
            <select
              id="feedback-category-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs border border-slate-200 bg-white rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-semibold text-slate-700"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Suggestion Comments input */}
        <div className="space-y-1.5">
          <label htmlFor="feedback-comments-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1">
            <MessageSquare className="h-3 w-3 text-slate-500" />
            <span>Sua sugestão ou crítica construtiva <span className="text-red-500">*</span></span>
          </label>
          <textarea
            id="feedback-comments-input"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Qual recurso você gostaria que adicionássemos? O que podemos melhorar no processo de planejamento ou na acessibilidade?"
            maxLength={400}
            required
            className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-400"
          />
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
            <span>Seja específico(a) para nos ajudar a evoluir.</span>
            <span>{comment.length}/400 caracteres</span>
          </div>
        </div>

        {/* Actions Submit / Cancel buttons */}
        <div className="flex items-center space-x-3 pt-1">
          <button
            type="submit"
            className="flex-1 py-2 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs transition shadow-xs flex items-center justify-center space-x-1.5 border border-emerald-800"
            id="submit-feedback-btn"
          >
            <Send className="h-3 w-3" />
            <span>{editingId ? "Salvar Alterações" : "Enviar Avaliação & Sugestão"}</span>
          </button>
          
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition flex items-center space-x-1"
              id="cancel-feedback-btn"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Cancelar</span>
            </button>
          )}
        </div>
      </form>

      {/* Submitted suggestions list */}
      {feedbacks.length > 0 && (
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center space-x-1.5 focus:outline-hidden"
              id="toggle-feedback-history-btn"
            >
              <ClipboardList className="h-4 w-4 text-emerald-700" />
              <span>Feedbacks & Sugestões Compartilhadas ({feedbacks.length})</span>
            </button>
            <span className="text-[10px] font-medium text-slate-400">Salvo localmente</span>
          </div>

          {showHistory && (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {feedbacks.map((item) => {
                const categoryColor = CATEGORIES.find(c => c.value === item.category)?.color || "bg-slate-100 text-slate-700";
                return (
                  <div 
                    key={item.id} 
                    className={`p-3 rounded-lg border transition-all text-xs space-y-2 ${
                      editingId === item.id 
                        ? "bg-emerald-50/50 border-emerald-400 ring-1 ring-emerald-500/10 scale-[0.98]" 
                        : "bg-slate-50/75 border-slate-200/60 hover:bg-slate-50"
                    }`}
                    id={`feedback-item-${item.id}`}
                  >
                    {/* Top Row: User details and Star display */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">{item.userName}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${categoryColor} font-semibold font-mono`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`h-3.5 w-3.5 ${
                              s <= item.rating ? "fill-amber-400 text-amber-500" : "text-slate-200"
                            }`} 
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment text */}
                    <p className="text-slate-600 leading-relaxed font-medium italic break-words">
                      "{item.comment}"
                    </p>

                    {/* Bottom Row: Timestamp & Interactive actions */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/40">
                      <span>{new Date(item.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      
                      <div className="flex items-center space-x-3 font-semibold">
                        {/* Likes button */}
                        <button
                          type="button"
                          onClick={() => handleLike(item.id)}
                          className={`flex items-center space-x-1 hover:text-red-500 transition-colors focus:outline-hidden ${
                            item.likedByUser ? "text-red-500 font-bold" : ""
                          }`}
                          title={item.likedByUser ? "Remover curtida" : "Curtir sugestão"}
                        >
                          <Heart className={`h-3 w-3 ${item.likedByUser ? "fill-red-500 text-red-500" : ""}`} />
                          <span>{item.likes}</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="hover:text-emerald-700 transition-colors flex items-center space-x-0.5 focus:outline-hidden"
                          title="Editar avaliação"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Editar</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="hover:text-red-600 transition-colors flex items-center space-x-0.5 focus:outline-hidden"
                          title="Excluir avaliação"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
