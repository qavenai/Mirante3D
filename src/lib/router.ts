import { useEffect, useState } from 'react';

export type Rota = { caminho: string[]; query: URLSearchParams };

function ler(): Rota {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [p, q = ''] = h.split('?');
  return { caminho: p.split('/').filter(Boolean), query: new URLSearchParams(q) };
}

export function useRota(): Rota {
  const [rota, setRota] = useState(ler);
  useEffect(() => {
    const f = () => setRota(ler());
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  return rota;
}

export const href = (destino: string) => '#/' + destino.replace(/^\//, '');
export const ir = (destino: string) => {
  window.location.hash = href(destino);
};

export function lerPreferencia(chave: string, padrao: string) {
  try {
    return localStorage.getItem(chave) ?? padrao;
  } catch {
    return padrao;
  }
}
export function salvarPreferencia(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* sem armazenamento: segue sem lembrar */
  }
}
