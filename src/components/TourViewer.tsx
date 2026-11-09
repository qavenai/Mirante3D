import { Footprints, Layers, Maximize2, Play } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Tour } from '../data/tours';

export type TourViewerApi = { irPara: (comodo: string) => void; maquete: () => void };

type Props = {
  tour: Tour;
  iniciar?: boolean;
  comodoInicial?: string | null;
  onComodo?: (id: string | null) => void;
  compacto?: boolean;
};

export const TourViewer = forwardRef<TourViewerApi, Props>(function TourViewer({ tour, iniciar = false, comodoInicial, onComodo, compacto }, ref) {
  const [ativo, setAtivo] = useState(iniciar);
  const [pronto, setPronto] = useState(false);
  const [modo, setModo] = useState<'maquete' | 'dentro'>('maquete');
  const frame = useRef<HTMLIFrameElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const pendente = useRef<string | null>(comodoInicial ?? null);

  const enviar = (msg: Record<string, unknown>) => frame.current?.contentWindow?.postMessage({ source: 'mirante-app', ...msg }, '*');

  useImperativeHandle(ref, () => ({
    irPara: (id) => {
      if (!ativo) setAtivo(true);
      if (!pronto) pendente.current = id;
      else enviar({ type: 'goRoom', id });
    },
    maquete: () => enviar({ type: 'aerial' }),
  }));

  useEffect(() => {
    const f = (e: MessageEvent) => {
      const d = e.data || {};
      if (d.source !== 'mirante-tour' || e.source !== frame.current?.contentWindow) return;
      if (d.type === 'ready') {
        setPronto(true);
        if (pendente.current) {
          const id = pendente.current;
          pendente.current = null;
          setTimeout(() => enviar({ type: 'goRoom', id }), 400);
        }
      }
      if (d.type === 'room') {
        setModo(d.id ? 'dentro' : 'maquete');
        onComodo?.(d.id ?? null);
      }
    };
    window.addEventListener('message', f);
    return () => window.removeEventListener('message', f);
  }, [onComodo]);

  useEffect(() => {
    if (comodoInicial && pronto) enviar({ type: 'goRoom', id: comodoInicial });
    else if (comodoInicial) pendente.current = comodoInicial;
  }, [comodoInicial]); // eslint-disable-line react-hooks/exhaustive-deps

  const telaCheia = () => {
    const el = caixa.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => window.open(tour.src.replace('?embed=1', ''), '_blank'));
    else window.open(tour.src.replace('?embed=1', ''), '_blank');
  };

  return (
    <div className={'viewer' + (compacto ? ' compacto' : '')} ref={caixa}>
      {ativo ? (
        <>
          <iframe ref={frame} src={tour.src} title={`Tour 3D: ${tour.titulo}`} allow="fullscreen" allowFullScreen />
          {!pronto && <div className="viewer-carregando"><span className="spinner" />Montando o apartamento…</div>}
          <div className="viewer-barra">
            <div className="seg" role="group" aria-label="Modo">
              <button aria-pressed={modo === 'maquete'} onClick={() => enviar({ type: 'aerial' })}><Layers size={16} /> Maquete</button>
              <button aria-pressed={modo === 'dentro'} onClick={() => enviar({ type: 'walk' })}><Footprints size={16} /> Por dentro</button>
            </div>
            <button className="viewer-icone" onClick={telaCheia} aria-label="Tela cheia" title="Tela cheia"><Maximize2 size={17} /></button>
          </div>
        </>
      ) : (
        <button className="viewer-poster" onClick={() => setAtivo(true)} aria-label={`Entrar no tour 3D: ${tour.titulo}`}>
          <img src={tour.capa} alt="" />
          <span className="viewer-play"><Play size={20} fill="currentColor" /> Entrar no tour 3D</span>
        </button>
      )}
    </div>
  );
});
