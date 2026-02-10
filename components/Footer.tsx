
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-100 border-t border-slate-200 py-8 no-print mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left space-y-4 md:space-y-0">
          <div className="max-w-md">
            <p className="text-xs text-slate-500 leading-relaxed italic">
              "O professor é o autor do plano. A plataforma é uma ferramenta de mediação pedagógica, organização do pensamento e apoio ao ensino."
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            © 2024 Ferramenta de Apoio Docente • Padrão BNCC
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
