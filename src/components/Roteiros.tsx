import React from 'react';

const ROTEIROS = [
  ['Abertura da cerimônia', '"Boa tarde a todos. Em nome de [Nome1] e [Nome2], sejam muito bem-vindos a este momento tão especial. Pedimos, gentilmente, que mantenham os celulares no modo silencioso durante a cerimônia, para que possamos viver juntos cada instante com toda a emoção que ele merece. Em breve, nossa cerimônia terá início."'],
  ['Chamada para a entrada da noiva', '"Pedimos a todos que se levantem, por favor."'],
  ['Entrada triunfal na recepção', '"Senhoras e senhores, apresento a vocês, pela primeira vez como marido e mulher: [Nome1] e [Nome2]!"'],
  ['Primeira dança', '"Convidamos o casal para o seu primeiro momento como marido e mulher: a valsa. [Nome1] e [Nome2], o salão é de vocês."'],
  ['Corte do bolo', '"Um dos momentos mais especiais desta noite chegou. Convidamos [Nome1] e [Nome2] para o corte do bolo."'],
  ['Brinde oficial', '"Com os copos em mãos, brindemos juntos à nova família que se inicia aqui esta noite. Saúde, amor e vida longa para [Nome1] e [Nome2]."'],
  ['Jogar o bouquet', '"Solteiras, este momento é de vocês. Posicionem-se atrás da noiva — quem pegar o buquê será a próxima a celebrar o amor. [Nome da noiva], quando estiver pronta."'],
  ['Encerramento', '"É chegada a hora de encerrarmos nossa celebração. Em nome de [Nome1] e [Nome2], muito obrigado a cada um de vocês por fazerem parte deste dia único. Boa noite a todos."'],
];

export default function Roteiros() {
  return (
    <div className="animate-page-in">
      <div className="mb-8 pb-6 border-b border-divider">
        <h2 className="text-3xl font-display font-medium text-ink">Roteiros de Fala</h2>
        <p className="text-stone text-sm font-light mt-1">Textos de referência para cada momento da cerimônia</p>
      </div>

      <div className="space-y-4">
        {ROTEIROS.map(([title, text], idx) => (
          <div key={idx} className="bg-white border border-divider rounded-xl p-6 shadow-sm">
            <h4 className="font-display text-lg font-medium text-ink mb-3">{title}</h4>
            <div className="bg-champagne p-4 rounded-lg border-l-4 border-blush-mid text-ink-light font-light italic text-sm leading-relaxed">
              {text}
            </div>
            <p className="text-xs text-stone mt-3 font-light">
              Adapte substituindo os nomes e personalizando conforme o perfil do casal.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
