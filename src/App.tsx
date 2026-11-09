import { useCallback, useEffect, useState } from 'react';
import { Busca } from './components/Busca';
import { Sidebar, Topbar } from './components/Navegacao';
import { tourPorSlug } from './data/tours';
import { lerPreferencia, salvarPreferencia, useRota } from './lib/router';
import { ComoFunciona, Duvidas, Inicio, Orcamento, Tours } from './pages/Paginas';
import { TourDetalhe } from './pages/TourDetalhe';

const TITULOS: Record<string, string> = { inicio: 'Início', tours: 'Tours', 'como-funciona': 'Como funciona', duvidas: 'Dúvidas', orcamento: 'Orçamento' };

export default function App() {
  const rota = useRota();
  const [busca, setBusca] = useState(false);
  const [recolhida, setRecolhida] = useState(() => lerPreferencia('mirante:menu', 'aberto') === 'recolhido');
  const [aviso, setAviso] = useState<string | null>(null);
  const [gaveta, setGaveta] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const f = () => { setGaveta(mq.matches); if (!mq.matches) setMenuAberto(false); };
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  const [secao, sub] = rota.caminho;
  const pagina = secao || 'inicio';
  const tour = pagina === 'tours' && sub ? tourPorSlug(sub) : undefined;
  const ativo = tour ? 'tour:' + tour.slug : pagina;
  const titulo = tour ? tour.titulo : TITULOS[pagina] ?? 'Início';

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setBusca((b) => !b); }
      else if (e.key === '/' && !busca && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); setBusca(true); }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [busca]);

  useEffect(() => setMenuAberto(false), [pagina, sub, rota.query.toString()]);

  useEffect(() => {
    if (!menuAberto) return;
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuAberto(false); };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [menuAberto]);

  useEffect(() => {
    document.title = `${titulo} · Mirante`;
    if (!rota.query.get('d')) document.querySelector('.conteudo')?.scrollTo({ top: 0 });
  }, [pagina, sub]); // eslint-disable-line react-hooks/exhaustive-deps

  const avisar = useCallback((t: string) => {
    setAviso(t);
    window.setTimeout(() => setAviso(null), 2600);
  }, []);

  const alternarMenu = () => {
    setRecolhida((r) => { salvarPreferencia('mirante:menu', r ? 'aberto' : 'recolhido'); return !r; });
  };

  let conteudo;
  if (tour) conteudo = <TourDetalhe key={tour.slug} tour={tour} comodo={rota.query.get('comodo')} avisar={avisar} />;
  else if (pagina === 'tours') conteudo = <Tours />;
  else if (pagina === 'como-funciona') conteudo = <ComoFunciona />;
  else if (pagina === 'duvidas') conteudo = <Duvidas aberta={rota.query.get('d') !== null ? Number(rota.query.get('d')) : null} />;
  else if (pagina === 'orcamento') conteudo = <Orcamento />;
  else conteudo = <Inicio />;

  return (
    <div className={'app' + (recolhida ? ' menu-recolhido' : '')}>
      <Sidebar ativo={ativo} recolhida={recolhida} alternar={alternarMenu} gaveta={gaveta} aberta={menuAberto} fechar={() => setMenuAberto(false)} />
      {gaveta && <div className={'gaveta-fundo' + (menuAberto ? ' visivel' : '')} onClick={() => setMenuAberto(false)} aria-hidden="true" />}
      <div className="principal">
        <Topbar titulo={titulo} abrirBusca={() => setBusca(true)} abrirMenu={() => setMenuAberto(true)} menuAberto={menuAberto} />
        <main className="conteudo" id="conteudo">
          {conteudo}
          <footer className="rodape">
            <span>© {new Date().getFullYear()} Mirante · Tour 3D de imóveis · Salvador, BA</span>
          </footer>
        </main>
      </div>
      <Busca aberta={busca} fechar={() => setBusca(false)} />
      <div className={'aviso' + (aviso ? ' visivel' : '')} role="status" aria-live="polite">{aviso}</div>
    </div>
  );
}
