import { ChevronRight, Copy, DoorOpen, Layers, MapPin, MessageCircle, Ruler, Search, Sofa } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { TourViewer, type TourViewerApi } from '../components/TourViewer';
import { linkWhatsApp } from '../data/conteudo';
import { fmtArea, type Tour } from '../data/tours';
import { href } from '../lib/router';

type Aba = 'comodos' | 'moveis' | 'ficha';

export function TourDetalhe({ tour, comodo, avisar }: { tour: Tour; comodo: string | null; avisar: (t: string) => void }) {
  const viewer = useRef<TourViewerApi>(null);
  const [atual, setAtual] = useState<string | null>(comodo);
  const [aba, setAba] = useState<Aba>('comodos');
  const [q, setQ] = useState('');
  const totalItens = tour.comodos.reduce((s, c) => s + c.moveis.length, 0);
  const onComodo = useCallback((id: string | null) => setAtual(id), []);

  const ir = (id: string) => {
    setAtual(id);
    viewer.current?.irPara(id);
    if (window.matchMedia('(max-width: 1100px)').matches) document.querySelector('.viewer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const moveis = useMemo(() => {
    const n = q.trim().toLowerCase();
    return tour.comodos
      .map((c) => ({ c, itens: c.moveis.filter((m) => !n || m.toLowerCase().includes(n) || c.nome.toLowerCase().includes(n)) }))
      .filter((g) => g.itens.length);
  }, [q, tour]);

  const copiar = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      avisar('Link do tour copiado');
    } catch {
      avisar('Não deu para copiar. Copie o endereço da barra do navegador.');
    }
  };

  return (
    <div className="pagina larga">
      <nav className="migalhas" aria-label="Você está em">
        <a href={href('tours')}>Tours</a>
        <ChevronRight size={15} />
        <span>{tour.titulo}</span>
      </nav>
      <div className="td-cab">
        <div>
          <h2>{tour.titulo}</h2>
          <div className="chips">
            <span><MapPin size={15} /> {tour.local}</span>
            <span><Ruler size={15} /> {tour.area} m² úteis</span>
            <span><DoorOpen size={15} /> {tour.comodos.length} ambientes</span>
            <span><Sofa size={15} /> {totalItens} móveis e objetos</span>
          </div>
        </div>
        <div className="td-acoes">
          <button className="btn btn-linha btn-p" onClick={copiar}><Copy size={16} /> Copiar link</button>
          <a className="btn btn-coral btn-p" href={linkWhatsApp('Olá! Vi o tour de exemplo da Mirante e quero um igual para o meu imóvel.')} target="_blank" rel="noopener"><MessageCircle size={16} /> Quero um igual</a>
        </div>
      </div>

      <div className="td-grade">
        <TourViewer ref={viewer} tour={tour} iniciar comodoInicial={comodo} onComodo={onComodo} />

        <aside className="td-painel" aria-label="Detalhes do tour">
          <div className="abas" role="tablist">
            {(['comodos', 'moveis', 'ficha'] as Aba[]).map((a) => (
              <button key={a} role="tab" aria-selected={aba === a} className={aba === a ? 'sel' : ''} onClick={() => setAba(a)}>
                {a === 'comodos' ? 'Cômodos' : a === 'moveis' ? 'Móveis' : 'Ficha'}
              </button>
            ))}
          </div>

          {aba === 'comodos' && (
            <div className="td-lista" role="tabpanel">
              <button className={'td-item' + (atual === null ? ' ativo' : '')} onClick={() => { setAtual(null); viewer.current?.maquete(); }}>
                <span className="td-ic"><Layers size={17} /></span>
                <span className="td-txt"><b>Maquete completa</b><small>Vista de cima, sem teto</small></span>
              </button>
              {tour.comodos.map((c) => (
                <button key={c.id} className={'td-item' + (atual === c.id ? ' ativo' : '')} onClick={() => ir(c.id)}>
                  <span className="td-ic"><DoorOpen size={17} /></span>
                  <span className="td-txt"><b>{c.nome}</b><small>{c.moveis.length} itens</small></span>
                  <span className="td-area">{fmtArea(c.area)}</span>
                </button>
              ))}
            </div>
          )}

          {aba === 'moveis' && (
            <div className="td-lista" role="tabpanel">
              <label className="campo-busca pequeno">
                <Search size={16} />
                <input id="filtro-moveis" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar móveis" />
              </label>
              {moveis.map(({ c, itens }) => (
                <div key={c.id} className="td-grupo">
                  <button className="td-grupo-cab" onClick={() => ir(c.id)}>{c.nome}<span>Ir ao cômodo <ChevronRight size={14} /></span></button>
                  {itens.map((m) => (
                    <button key={m} className="td-movel" onClick={() => ir(c.id)}><Sofa size={15} /> {m}</button>
                  ))}
                </div>
              ))}
              {moveis.length === 0 && <p className="vazio">Nenhum móvel com “{q}”.</p>}
            </div>
          )}

          {aba === 'ficha' && (
            <div className="td-ficha" role="tabpanel">
              <p>{tour.descricao}</p>
              <dl>
                <div><dt>Local</dt><dd>{tour.local}</dd></div>
                <div><dt>Tipologia</dt><dd>{tour.tipologia}</dd></div>
                <div><dt>Área útil</dt><dd>{tour.area} m² (soma dos ambientes)</dd></div>
                <div><dt>Ambientes</dt><dd>{tour.comodos.length}</dd></div>
                <div><dt>Itens modelados</dt><dd>{totalItens} móveis e objetos</dd></div>
                <div><dt>Origem</dt><dd>{tour.origem}</dd></div>
              </dl>
              <div className="dicas-nav">
                <b>Como navegar</b>
                <ul>
                  <li>Arraste para girar ou olhar em volta</li>
                  <li>Toque no chão para andar até o ponto</li>
                  <li>Toque num móvel para ver medidas e materiais</li>
                  <li>No computador, use W A S D para caminhar</li>
                </ul>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
