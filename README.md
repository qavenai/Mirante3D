# Mirante

App da **Mirante**, serviço de tour 3D para imóveis de temporada. O cliente explora um tour de exemplo, busca cômodos e móveis, tira dúvidas e pede orçamento pelo WhatsApp.

## O que tem no app

- **Início**: apresentação do serviço e o tour em destaque
- **Tours**: galeria dos tours publicados
- **Tour**: visualizador 3D com lista de cômodos, móveis e ficha técnica. Clicar num cômodo leva o passeio até ele
- **Busca** (`Ctrl/⌘ K` ou `/`): encontra cômodos, móveis, páginas e dúvidas
- **Como funciona**, **Dúvidas** e **Orçamento** (o formulário monta a mensagem e abre o WhatsApp)
- No celular, o menu lateral vira uma barra de abas

## Rodar localmente

```bash
npm install
npm run dev
```

## Publicar

Todo push na `main` publica o site no GitHub Pages pelo workflow em `.github/workflows/deploy.yml`.
Na primeira vez, ative em **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Estrutura

```
public/tours/<slug>/index.html   tour 3D (Three.js), um arquivo por imóvel
public/img/                      capas dos tours
public/marca/                    logo, símbolo e avatar
src/data/tours.ts                cadastro dos tours, cômodos e móveis
src/data/conteudo.ts             WhatsApp, dúvidas, benefícios e etapas
src/components/                  menu lateral, barra superior, busca, visualizador
src/pages/                       telas do app
```

### Adicionar um tour novo

1. Coloque o arquivo do tour em `public/tours/<slug>/index.html` e a capa em `public/img/`.
2. Cadastre o tour em `src/data/tours.ts` com os cômodos (os `id` precisam ser os mesmos usados dentro do tour).

O app e o tour conversam por `postMessage`: o app envia `goRoom`, `aerial` e `walk`, e o tour avisa `ready` e o cômodo atual (`room`).

## Paleta

| Cor | Hex |
|---|---|
| Azul-mar | `#0E3B4F` |
| Areia | `#EFE8DC` |
| Coral | `#E8705A` |
| Azul-água | `#2B7F95` |
| Fundo | `#F5F1E9` |

Tipografia: Bricolage Grotesque (títulos) e Figtree (texto).
