import { Box, CircleHelp, House, Menu, MessageCircle, PanelLeftClose, PanelLeftOpen, Route, Search, X, type LucideIcon } from 'lucide-react';
import { TOURS } from '../data/tours';
import { WHATSAPP_EXIBICAO, linkWhatsApp } from '../data/conteudo';
import { href } from '../lib/router';
import { Logo, Simbolo } from './Logo';

type Item = { id: string; rotulo: string; destino: string; icone: LucideIcon };

export const ITENS: Item[] = [
  { id: 'inicio', rotulo: 'Início', destino: 'inicio', icone: House },
  { id: 'tours', rotulo: 'Tours', destino: 'tours', icone: Box },
  { id: 'como-funciona', rotulo: 'Como funciona', destino: 'como-funciona', icone: Route },
  { id: 'duvidas', rotulo: 'Dúvidas', destino: 'duvidas', icone: CircleHelp },
  { id: 'orcamento', rotulo: 'Orçamento', destino: 'orcamento', icone: MessageCircle },
];

type SidebarProps = { ativo: string; recolhida: boolean; alternar: () => void; gaveta: boolean; aberta: boolean; fechar: () => void };

export function Sidebar({ ativo, recolhida: recolhidaPref, alternar, gaveta, aberta, fechar }: SidebarProps) {
  // no celular o menu vira uma gaveta: fica escondido e desliza da esquerda
  const recolhida = recolhidaPref && !gaveta;
  return (
    <aside
      id="menu-lateral"
      className={'sidebar' + (recolhida ? ' recolhida' : '') + (gaveta ? ' gaveta' : '') + (aberta ? ' aberta' : '')}
      aria-label="Menu principal"
      aria-hidden={gaveta && !aberta ? true : undefined}
    >
      <div className="sb-topo">
        <a href={href('inicio')} className="sb-logo" aria-label="Mirante, início">
          {recolhida ? <Simbolo className="sb-simbolo" /> : <Logo className="sb-marca" />}
        </a>
        {gaveta && (
          <button className="sb-fechar" onClick={fechar} aria-label="Fechar menu">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sb-nav">
        <span className="sb-titulo">Menu</span>
        {ITENS.map(({ id, rotulo, destino, icone: Icone }) => (
          <a key={id} href={href(destino)} className={'sb-item' + (ativo === id ? ' ativo' : '')} aria-current={ativo === id ? 'page' : undefined} title={recolhida ? rotulo : undefined}>
            <Icone size={20} strokeWidth={1.9} />
            <span>{rotulo}</span>
          </a>
        ))}

        <span className="sb-titulo">Tours publicados</span>
        {TOURS.map((t) => (
          <a key={t.slug} href={href('tours/' + t.slug)} className={'sb-tour' + (ativo === 'tour:' + t.slug ? ' ativo' : '')} title={recolhida ? t.titulo : undefined}>
            <img src={t.capaPequena} alt="" width={40} height={40} />
            <span>
              <b>{t.titulo}</b>
              <small>{t.local}</small>
            </span>
          </a>
        ))}
      </nav>

      <div className="sb-rodape">
        <div className="sb-cta">
          <b>Quer o tour do seu imóvel?</b>
          <p>Mande a planta e receba o orçamento.</p>
          <a className="btn btn-coral btn-p" href={linkWhatsApp()} target="_blank" rel="noopener">
            <MessageCircle size={17} /> {WHATSAPP_EXIBICAO}
          </a>
        </div>
        <button className="sb-recolher" onClick={alternar} aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'} title={recolhida ? 'Expandir menu' : 'Recolher menu'}>
          {recolhida ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          <span>Recolher menu</span>
        </button>
      </div>
    </aside>
  );
}

export function Topbar({ titulo, abrirBusca, abrirMenu, menuAberto }: { titulo: string; abrirBusca: () => void; abrirMenu: () => void; menuAberto: boolean }) {
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  return (
    <header className="topbar">
      <button className="tb-menu" onClick={abrirMenu} aria-label="Abrir menu" aria-expanded={menuAberto} aria-controls="menu-lateral">
        <Menu size={22} />
      </button>
      <a href={href('inicio')} className="tb-logo" aria-label="Mirante, início">
        <Logo className="tb-marca" />
      </a>
      <h1 className="tb-titulo">{titulo}</h1>
      <button className="busca-gatilho" onClick={abrirBusca} aria-label="Buscar cômodos, móveis e dúvidas">
        <Search size={18} />
        <span>Buscar cômodos, móveis, dúvidas…</span>
        <kbd>{mac ? '⌘' : 'Ctrl'} K</kbd>
      </button>
      <button className="tb-icone" onClick={abrirBusca} aria-label="Buscar">
        <Search size={21} />
      </button>
      <a className="btn btn-coral tb-cta" href={linkWhatsApp()} target="_blank" rel="noopener">
        <MessageCircle size={18} /> Pedir orçamento
      </a>
    </header>
  );
}
