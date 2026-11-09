import { ArrowRight, Check, ChevronDown, CircleHelp, Eye, FileText, Link2, MessageCircle, Monitor, Ruler, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { TourViewer } from '../components/TourViewer';
import { BENEFICIOS, DUVIDAS, PASSOS, WHATSAPP_EXIBICAO, linkWhatsApp } from '../data/conteudo';
import { TOURS } from '../data/tours';
import { href } from '../lib/router';

const ICONES_BENEFICIO = [MessageCircle, Ruler, Eye, Monitor];

function Cabecalho({ rotulo, titulo, texto, acao }: { rotulo?: string; titulo: string; texto?: string; acao?: React.ReactNode }) {
  return (
    <div className="pg-cab">
      <div>
        {rotulo && <span className="eyebrow">{rotulo}</span>}
        <h2>{titulo}</h2>
        {texto && <p>{texto}</p>}
      </div>
      {acao}
    </div>
  );
}

export function TourCard({ slug }: { slug: string }) {
  const t = TOURS.find((x) => x.slug === slug)!;
  return (
    <a className="tour-card" href={href('tours/' + t.slug)}>
      <div className="tc-capa">
        <img src={t.capaPequena} alt={`Maquete 3D: ${t.titulo}`} loading="lazy" />
        <span className="tc-selo">Tour de exemplo</span>
      </div>
      <div className="tc-corpo">
        <div>
          <b>{t.titulo}</b>
          <small>{t.local}</small>
        </div>
        <div className="tc-meta">
          <span>{t.area} m²</span>
          <span>{t.comodos.length} ambientes</span>
          <span>{t.comodos.reduce((s, c) => s + c.moveis.length, 0)} itens</span>
        </div>
        <span className="tc-abrir">Abrir tour <ArrowRight size={16} /></span>
      </div>
    </a>
  );
}

function CtaCard() {
  return (
    <a className="tour-card tc-novo" href={href('orcamento')}>
      <div className="tc-novo-arco" aria-hidden="true" />
      <div className="tc-corpo">
        <div>
          <b>O próximo pode ser o seu imóvel</b>
          <small>Mande a planta e receba o orçamento pelo WhatsApp.</small>
        </div>
        <span className="tc-abrir">Pedir orçamento <ArrowRight size={16} /></span>
      </div>
    </a>
  );
}

/* ---------------- Início ---------------- */
export function Inicio() {
  const t = TOURS[0];
  return (
    <div className="pagina">
      <section className="hero-app">
        <div className="ha-texto">
          <span className="eyebrow">Tour 3D para imóveis de temporada</span>
          <h2>Seu hóspede entra no imóvel antes de reservar.</h2>
          <p>A Mirante transforma a planta do seu imóvel num tour 3D mobiliado. Abre no celular, sem instalar nada, e você manda pelo WhatsApp, coloca no Instagram ou no seu site.</p>
          <div className="acoes">
            <a className="btn btn-coral" href={href('tours/' + t.slug)}>Ver o tour de exemplo <ArrowRight size={18} /></a>
            <a className="btn btn-linha" href={linkWhatsApp()} target="_blank" rel="noopener"><MessageCircle size={18} /> Pedir orçamento</a>
          </div>
        </div>
        <div className="ha-arco">
          <div className="ha-sol" aria-hidden="true" />
          <div className="ha-moldura"><img src={t.capa} alt="Maquete 3D vista de cima de um apartamento mobiliado" /></div>
        </div>
      </section>

      <section className="painel">
        <Cabecalho rotulo="Experimente" titulo="Tour em destaque" texto={`${t.titulo} · ${t.local} · ${t.area} m²`} acao={<a className="btn btn-fantasma" href={href('tours/' + t.slug)}>Abrir com lista de cômodos <ArrowRight size={16} /></a>} />
        <TourViewer tour={t} compacto />
      </section>

      <section className="grade-2">
        <div className="painel">
          <Cabecalho rotulo="Para quem aluga por temporada" titulo="O que o tour faz pelo seu imóvel" />
          <ul className="beneficios">
            {BENEFICIOS.map((b, i) => {
              const I = ICONES_BENEFICIO[i];
              return (
                <li key={b.t}>
                  <span className="ic"><I size={20} /></span>
                  <div><b>{b.t}</b><p>{b.d}</p></div>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="painel">
          <Cabecalho rotulo="Como funciona" titulo="Da planta ao link pronto" acao={<a className="btn btn-fantasma" href={href('como-funciona')}>Detalhes <ArrowRight size={16} /></a>} />
          <ol className="passos-mini">
            {PASSOS.map((p) => (
              <li key={p.t}><b>{p.t}</b><p>{p.d}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <CtaFaixa />
    </div>
  );
}

export function CtaFaixa() {
  return (
    <section className="cta-faixa">
      <div>
        <h2>Mostre seu imóvel por dentro.</h2>
        <p>Mande a planta e receba um orçamento pelo WhatsApp.</p>
      </div>
      <div className="cta-acoes">
        <a className="btn btn-coral" href={linkWhatsApp()} target="_blank" rel="noopener"><MessageCircle size={18} /> Conversar no WhatsApp</a>
        <span className="fone">{WHATSAPP_EXIBICAO}</span>
      </div>
    </section>
  );
}

/* ---------------- Tours ---------------- */
export function Tours() {
  const [q, setQ] = useState('');
  const lista = useMemo(() => {
    const n = q.trim().toLowerCase();
    return TOURS.filter((t) => !n || (t.titulo + ' ' + t.local + ' ' + t.tipologia + ' ' + t.comodos.map((c) => c.nome).join(' ')).toLowerCase().includes(n));
  }, [q]);
  return (
    <div className="pagina">
      <Cabecalho rotulo="Galeria" titulo="Tours" texto="Tours 3D publicados pela Mirante. Abra um para passear e ver cada cômodo." />
      <div className="barra-filtro">
        <label className="campo-busca">
          <Search size={18} />
          <input id="filtro-tours" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por cidade, tipo ou cômodo" />
        </label>
        <span className="contagem">{lista.length} {lista.length === 1 ? 'tour publicado' : 'tours publicados'}</span>
      </div>
      <div className="grade-tours">
        {lista.map((t) => <TourCard key={t.slug} slug={t.slug} />)}
        <CtaCard />
      </div>
      {lista.length === 0 && <p className="vazio">Nenhum tour com “{q}”. Tente outro termo.</p>}
    </div>
  );
}

/* ---------------- Como funciona ---------------- */
export function ComoFunciona() {
  return (
    <div className="pagina">
      <Cabecalho rotulo="Processo" titulo="Como funciona" texto="Você manda o material, a gente monta o 3D e você recebe um link pronto para divulgar." />
      <ol className="linha-tempo">
        {PASSOS.map((p, i) => (
          <li key={p.t}>
            <span className="lt-num">{i + 1}</span>
            <div className="painel"><b>{p.t}</b><p>{p.d}</p></div>
          </li>
        ))}
      </ol>
      <section className="grade-2">
        <div className="painel">
          <h3 className="h3-ic"><FileText size={20} /> O que você envia</h3>
          <ul className="checklist">
            <li><Check size={18} /> Planta do imóvel em PDF, imagem ou foto</li>
            <li><Check size={18} /> Fotos dos ambientes como estão hoje</li>
            <li><Check size={18} /> Referências de decoração, se quiser mudar algo</li>
          </ul>
        </div>
        <div className="painel">
          <h3 className="h3-ic"><Link2 size={20} /> O que você recebe</h3>
          <ul className="checklist">
            <li><Check size={18} /> Link do tour 3D para mandar a qualquer pessoa</li>
            <li><Check size={18} /> Modo maquete e passeio por dentro</li>
            <li><Check size={18} /> Imagem da maquete vista de cima para as redes</li>
          </ul>
        </div>
      </section>
      <div className="painel publico">
        <b>Feito para</b>
        <span>Proprietários de Airbnb</span><span>Administradoras de temporada</span><span>Gestores de imóveis</span><span>Corretores e construtoras</span>
      </div>
      <CtaFaixa />
    </div>
  );
}

/* ---------------- Dúvidas ---------------- */
export function Duvidas({ aberta }: { aberta: number | null }) {
  const [q, setQ] = useState('');
  const [abertas, setAbertas] = useState<Set<number>>(() => new Set(aberta !== null ? [aberta] : [0]));
  useEffect(() => {
    if (aberta !== null) {
      setAbertas(new Set([aberta]));
      setTimeout(() => document.getElementById('duvida-' + aberta)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
    }
  }, [aberta]);
  const n = q.trim().toLowerCase();
  const lista = DUVIDAS.map((d, i) => ({ ...d, i })).filter((d) => !n || (d.p + ' ' + d.r).toLowerCase().includes(n));
  const alternar = (i: number) => setAbertas((s) => { const x = new Set(s); x.has(i) ? x.delete(i) : x.add(i); return x; });
  return (
    <div className="pagina estreita">
      <Cabecalho rotulo="Ajuda" titulo="Dúvidas" texto="As perguntas que a gente mais ouve de quem aluga por temporada." />
      <label className="campo-busca grande">
        <Search size={18} />
        <input id="filtro-duvidas" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nas dúvidas" />
      </label>
      <div className="acordeao">
        {lista.map((d) => (
          <div key={d.i} className={'ac-item' + (abertas.has(d.i) ? ' aberto' : '')} id={'duvida-' + d.i}>
            <button onClick={() => alternar(d.i)} aria-expanded={abertas.has(d.i)}>
              <CircleHelp size={19} className="ac-ic" />
              <span>{d.p}</span>
              <ChevronDown size={19} className="ac-seta" />
            </button>
            {abertas.has(d.i) && <p>{d.r}</p>}
          </div>
        ))}
        {lista.length === 0 && <p className="vazio">Nenhuma dúvida com “{q}”. Pergunte direto no WhatsApp.</p>}
      </div>
      <div className="painel ajuda-extra">
        <div><b>Não achou a sua?</b><p>Pergunte direto no WhatsApp.</p></div>
        <a className="btn btn-coral" href={linkWhatsApp('Olá! Tenho uma dúvida sobre o tour 3D da Mirante.')} target="_blank" rel="noopener"><MessageCircle size={18} /> Perguntar</a>
      </div>
    </div>
  );
}

/* ---------------- Orçamento ---------------- */
export function Orcamento() {
  const [f, setF] = useState({ nome: '', tipo: 'Apartamento', cidade: '', quartos: 2, planta: 'Tenho em PDF', obs: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: k === 'quartos' ? Number(e.target.value) : e.target.value });
  const msg = [
    `Olá! Quero um orçamento de tour 3D da Mirante.`,
    f.nome && `Nome: ${f.nome}`,
    `Imóvel: ${f.tipo}${f.cidade ? ' em ' + f.cidade : ''}`,
    `Quartos: ${f.quartos}`,
    `Planta: ${f.planta}`,
    f.obs && `Observações: ${f.obs}`,
  ].filter(Boolean).join('\n');
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    window.open(linkWhatsApp(msg), '_blank', 'noopener');
  };
  return (
    <div className="pagina">
      <Cabecalho rotulo="Sob consulta" titulo="Pedir orçamento" texto="Preencha o básico e a mensagem já vai pronta para o WhatsApp. O valor e o prazo dependem do tamanho do imóvel." />
      <div className="grade-orc">
        <form className="painel form" onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="o-nome">Seu nome</label>
            <input id="o-nome" value={f.nome} onChange={set('nome')} placeholder="Como podemos te chamar?" autoComplete="name" />
          </div>
          <div className="campos-2">
            <div className="campo">
              <label htmlFor="o-tipo">Tipo de imóvel</label>
              <select id="o-tipo" value={f.tipo} onChange={set('tipo')}>
                <option>Apartamento</option><option>Casa</option><option>Chalé ou pousada</option><option>Imóvel na planta</option><option>Outro</option>
              </select>
            </div>
            <div className="campo">
              <label htmlFor="o-cidade">Cidade ou praia</label>
              <input id="o-cidade" value={f.cidade} onChange={set('cidade')} placeholder="Ex.: Praia do Forte" />
            </div>
          </div>
          <div className="campos-2">
            <div className="campo">
              <label htmlFor="o-quartos">Quartos</label>
              <div className="passo-num">
                <button type="button" onClick={() => setF({ ...f, quartos: Math.max(0, f.quartos - 1) })} aria-label="Menos um quarto">−</button>
                <input id="o-quartos" type="number" min={0} max={20} value={f.quartos} onChange={set('quartos')} />
                <button type="button" onClick={() => setF({ ...f, quartos: Math.min(20, f.quartos + 1) })} aria-label="Mais um quarto">+</button>
              </div>
            </div>
            <fieldset className="campo">
              <legend>Você tem a planta?</legend>
              <div className="opcoes">
                {['Tenho em PDF', 'Tenho foto ou imagem', 'Não tenho'].map((o, i) => (
                  <label key={o} className={'opcao' + (f.planta === o ? ' sel' : '')}>
                    <input type="radio" name="planta" id={'o-planta-' + i} value={o} checked={f.planta === o} onChange={set('planta')} />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="campo">
            <label htmlFor="o-obs">Observações</label>
            <textarea id="o-obs" rows={3} value={f.obs} onChange={set('obs')} placeholder="Algo que a gente deva saber? Ex.: quero trocar a decoração da sala" />
          </div>
          <button className="btn btn-coral btn-g" type="submit"><MessageCircle size={19} /> Enviar pelo WhatsApp</button>
        </form>
        <aside className="painel previa">
          <span className="eyebrow">Prévia da mensagem</span>
          <pre>{msg}</pre>
          <div className="previa-rodape">
            <span>Vai para</span>
            <b>{WHATSAPP_EXIBICAO}</b>
          </div>
        </aside>
      </div>
    </div>
  );
}

