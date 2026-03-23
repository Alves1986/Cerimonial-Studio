import React from 'react';

const EMERGENCIAS = [
  ['Atraso da noiva', 'Informe ao DJ para manter música ambiente. Nunca comente o atraso ao público. Acione padrinhos discretamente para entreter convidados. Comunique o celebrante sobre o novo horário estimado.'],
  ['Microfone com problema', 'Sempre teste antes do evento. Tenha segundo microfone reserva. Se falhar durante a cerimônia, projete a voz naturalmente e acione o técnico por sinal discreto sem interromper.'],
  ['DJ toca música errada', 'Utilize o sinal combinado no briefing. Roteiro impresso com o nome exato de cada música. Normalize para o público sem demonstrar que houve erro.'],
  ['Criança chora ou para no cortejo', 'Nunca demonstre impaciência. Sorria. Sinalizar para o familiar responsável retirar a criança com leveza. O público entende — aproveite o momento.'],
  ['Alianças esquecidas', 'Kit de alianças simbólicas reserva na sua bolsa. Resolva discretamente sem parar a cerimônia de forma dramática.'],
  ['Chuva em evento ao ar livre', 'Plano B definido antecipadamente com o casal. Local alternativo confirmado. Comunique a decisão com calma e naturalidade.'],
  ['Fornecedor atrasa', 'Contatos de emergência confirmados antes. Comunique os noivos com discrição. Reorganize o cronograma internamente sem expor a situação.'],
  ['Noivo ou noiva passa mal', 'Água, ventilação, acomodação. Chame acompanhante de confiança. Pause a cerimônia com naturalidade: "Vamos dar um momento especial ao casal."'],
  ['Conflito entre familiares', 'Não se envolva diretamente. Acione o familiar mediador pré-definido no briefing. Isole a situação longe da cerimônia.'],
  ['Queda de energia', 'Confirme a existência de gerador antes do evento. Se não houver, velas de emergência podem criar atmosfera acolhedora. Comunique com leveza e humor discreto.'],
];

export default function Emergencias() {
  return (
    <div className="animate-page-in">
      <div className="mb-8 pb-6 border-b border-divider">
        <h2 className="text-3xl font-display font-medium text-ink">Guia de Imprevistos</h2>
        <p className="text-stone text-sm font-light mt-1">Como conduzir situações inesperadas com serenidade</p>
      </div>

      <div className="space-y-3">
        {EMERGENCIAS.map(([problem, solution], idx) => (
          <div key={idx} className="bg-white border border-divider rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row">
            <div className="bg-linen p-5 md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-divider flex items-center">
              <h4 className="font-display text-base font-medium text-ink">{problem}</h4>
            </div>
            <div className="p-5 flex items-center">
              <p className="text-sm text-ink-light font-light leading-relaxed">
                {solution}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
