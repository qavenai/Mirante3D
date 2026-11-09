import { Box, CircleHelp, CornerDownLeft, DoorOpen, FileText, Search, Sofa, X, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DUVIDAS } from '../data/conteudo';
import { TOURS, fmtArea } from '../data/tours';
import { ir } from '../lib/router';

type Resultado = { grupo: string; titulo: string; detalhe: string; icone: LucideIcon; destino: string; termos: string };

const ORDEM = ['Cômodos', 'Móveis', 'Tours', 'Páginas', 'Dúvidas'];
const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function montarIndice(): Resultado[] {
  const r: Resultado[] = [
    { grupo: 'Páginas', titulo: 'Início', detalhe: 'Visão geral da Mirante', icone: FileText, destino: 'inicio', termos: 'inicio home' },
    { grupo: 'Páginas', titulo: 'Tours', detalhe: 'Todos os tours publicados', icone: Box, destino: 'tours', termos: 'tours exemplos galeria' },
    { grupo: 'Páginas', titulo: 'Como funciona', detalhe: 'Da planta ao link pronto', icone: FileText, destino: 'como-funciona', termos: 'como funciona etapas processo planta' },
    { grupo: 'Páginas', titulo: 'Dúvidas', detalhe: 'Perguntas frequentes', icone: CircleHelp, destino: 'duvidas', termos: 'duvidas perguntas faq' },
    { grupo: 'Páginas', titulo: 'Orçamento', detalhe: 'Pedir orçamento pelo WhatsApp', icone: FileText, destino: 'orcamento', termos: 'orcamento preco valor quanto custa whatsapp contato' },
  ];
  for (const t of TOURS) {
    r.push({ grupo: 'Tours', titulo: t.titulo, detalhe: `${t.local} · ${t.area} m²`, icone: Box, destino: 'tours/' + t.slug, termos: t.tipologia });
    for (const c of t.comodos) {
      r.push({ grupo: 'Cômodos', titulo: c.nome, detalhe: `${t.titulo} · ${fmtArea(c.area)}`, icone: DoorOpen, destino: `tours/${t.slug}?comodo=${c.id}`, termos: c.moveis.join(' ') });
      for (const m of c.moveis) r.push({ grupo: 'Móveis', titulo: m, detalhe: `${c.nome} · ${t.titulo}`, icone: Sofa, destino: `tours/${t.slug}?comodo=${c.id}`, termos: c.nome });
    }
  }
  DUVIDAS.forEach((d, i) => r.push({ grupo: 'Dúvidas', titulo: d.p, detalhe: d.r, icone: CircleHelp, destino: `duvidas?d=${i}`, termos: '' }));
  return r;
}

export function Busca({ aberta, fechar }: { aberta: boolean; fechar: () => void }) {
  const indice = useMemo(montarIndice, []);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  const resultados = useMemo(() => {
    const n = normalizar(q.trim());
    if (!n) return indice.filter((r) => r.grupo === 'Cômodos').concat(indice.filter((r) => r.grupo === 'Páginas'));
    const palavras = n.split(/\s+/);
    return indice
      .map((r) => {
        const alvo = normalizar(r.titulo);
        const extra = normalizar(r.termos + ' ' + r.detalhe);
        let pts = 0;
        for (const p of palavras) {
          if (alvo.startsWith(p)) pts += 4;
          else if (alvo.includes(p)) pts += 3;
          else if (extra.includes(p)) pts += 1;
          else return null;
        }
        return { r, pts };
      })
      .filter((x): x is { r: Resultado; pts: number } => !!x)
      .sort((a, b) => ORDEM.indexOf(a.r.grupo) - ORDEM.indexOf(b.r.grupo) || b.pts - a.pts)
      .slice(0, 30)
      .map((x) => x.r);
  }, [q, indice]);

  useEffect(() => {
    if (aberta) {
      setQ('');
      setSel(0);
    }
  }, [aberta]);
  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    lista.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!aberta) return null;

  const escolher = (r: Resultado) => {
    fechar();
    ir(r.destino);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, resultados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter' && resultados[sel]) { e.preventDefault(); escolher(resultados[sel]); }
    else if (e.key === 'Escape') fechar();
  };

  let ultimoGrupo = '';
  return (
    <div className="busca-fundo" onMouseDown={fechar}>
      <div className="busca" role="dialog" aria-modal="true" aria-label="Buscar" onMouseDown={(e) => e.stopPropagation()}>
        <div className="busca-campo">
          <Search size={20} />
          <input ref={entrada} autoFocus id="busca-geral" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Busque um cômodo, móvel ou dúvida" autoComplete="off" aria-controls="busca-lista" />
          <button onClick={fechar} aria-label="Fechar busca" className="busca-fechar"><X size={18} /></button>
        </div>
        <div className="busca-lista" id="busca-lista" ref={lista} role="listbox">
          {resultados.length === 0 && (
            <div className="busca-vazio">
              <b>Nada encontrado para “{q}”.</b>
              <p>Tente “varanda”, “cama”, “planta” ou “preço”.</p>
            </div>
          )}
          {resultados.map((r, i) => {
            const cab = r.grupo !== ultimoGrupo ? <div className="busca-grupo" key={'g' + i}>{q || r.grupo !== 'Cômodos' ? r.grupo : 'Cômodos do tour de exemplo'}</div> : null;
            ultimoGrupo = r.grupo;
            const Icone = r.icone;
            return (
              <div key={i}>
                {cab}
                <button data-i={i} role="option" aria-selected={i === sel} className={'busca-item' + (i === sel ? ' sel' : '')} onMouseMove={() => setSel(i)} onClick={() => escolher(r)}>
                  <span className="bi-icone"><Icone size={18} /></span>
                  <span className="bi-texto"><b>{r.titulo}</b><small>{r.detalhe}</small></span>
                  {i === sel && <CornerDownLeft size={16} className="bi-enter" />}
                </button>
              </div>
            );
          })}
        </div>
        <div className="busca-rodape"><span><kbd>↑</kbd><kbd>↓</kbd> navegar</span><span><kbd>Enter</kbd> abrir</span><span><kbd>Esc</kbd> fechar</span></div>
      </div>
    </div>
  );
}
