export type Comodo = {
  id: string;
  nome: string;
  area: number; // m², conforme a planta
  moveis: string[];
};

export type Tour = {
  slug: string;
  titulo: string;
  local: string;
  tipologia: string;
  area: number;
  origem: string;
  descricao: string;
  capa: string;
  capaPequena: string;
  src: string;
  comodos: Comodo[];
};

const comodos: Comodo[] = [
  { id: 'estar', nome: 'Estar', area: 34.47, moveis: ['Sofá 3 lugares', 'Painel ripado com rack e TV', 'Mesas de centro em travertino', 'Poltrona de leitura', 'Poltrona bouclê', 'Mesa lateral', 'Luminária de piso', 'Aparador com espelho', 'Tapete da sala', 'Cortina de linho', 'Ar-condicionado split', 'Figueira-lira', 'Costela-de-adão', 'Quadro'] },
  { id: 'jantar', nome: 'Jantar', area: 11.09, moveis: ['Mesa de jantar 6 lugares', 'Cadeiras de jantar', 'Pendente linear', 'Buffet com palhinha', 'Tapete do jantar', 'Palmeira ráfis', 'Quadro'] },
  { id: 'varanda-gourmet', nome: 'Varanda gourmet', area: 4.3, moveis: ['Bancada gourmet com churrasqueira', 'Mesa bistrô', 'Cadeiras de varanda', 'Costela-de-adão', 'Zamioculca'] },
  { id: 'cozinha', nome: 'Cozinha', area: 7.07, moveis: ['Marcenaria da cozinha', 'Cooktop de indução', 'Forno de embutir', 'Cuba inox', 'Geladeira inox'] },
  { id: 'servico', nome: 'Área de serviço', area: 3.94, moveis: ['Lavadora de roupas', 'Tanque', 'Varal de teto'] },
  { id: 'lavabo', nome: 'Lavabo', area: 1.73, moveis: ['Bancada do lavabo', 'Espelho redondo', 'Arandelas', 'Bacia sanitária'] },
  { id: 'quarto-servico', nome: 'Quarto de serviço', area: 4.9, moveis: ['Cama de solteiro', 'Escrivaninha', 'Cadeira de escritório', 'Quadro'] },
  { id: 'wc-servico', nome: 'WC de serviço', area: 1.47, moveis: ['Lavatório', 'Bacia sanitária', 'Chuveiro'] },
  { id: 'suite-hospedes', nome: 'Suíte de hóspedes', area: 10.55, moveis: ['Cama queen', 'Cabeceira estofada', 'Criados-mudos', 'Abajures', 'Guarda-roupa', 'Cômoda', 'Cortina blackout', 'Tapete', 'Ar-condicionado split', 'Quadro'] },
  { id: 'banho-hospedes', nome: 'Banho de hóspedes', area: 2.67, moveis: ['Bancada do banheiro', 'Bacia sanitária', 'Box de vidro'] },
  { id: 'closet', nome: 'Closet', area: 7.57, moveis: ['Closet com portas de vidro', 'Sapateira', 'Espelho de corpo inteiro', 'Pufe'] },
  { id: 'suite-casal', nome: 'Suíte do casal', area: 14.3, moveis: ['Cama king', 'Cabeceira estofada', 'Criados-mudos', 'Pendentes de cabeceira', 'TV da suíte', 'Poltrona de leitura', 'Luminária de piso', 'Mesa lateral', 'Cortina de linho', 'Tapete', 'Ar-condicionado split', 'Figueira-lira', 'Quadro'] },
  { id: 'banho-suite', nome: 'Banho da suíte', area: 3.35, moveis: ['Bancada dupla', 'Bacia sanitária', 'Box de vidro'] },
  { id: 'varanda-suite', nome: 'Varanda da suíte', area: 1.86, moveis: ['Cadeiras de varanda', 'Mesa lateral', 'Palmeira ráfis'] },
];

export const TOURS: Tour[] = [
  {
    slug: 'apartamento-salvador',
    titulo: 'Apartamento de 2 suítes',
    local: 'Salvador, BA',
    tipologia: '2 suítes · quarto de serviço · varanda gourmet',
    area: 112, // soma das áreas da planta, incluindo a circulação (2,69 m²)
    origem: 'Planta de obra em PDF, escala 1/75',
    descricao:
      'Paredes, portas e janelas tiradas direto da planta, com mobília completa em todos os ambientes. Dá para girar a maquete, caminhar por dentro e tocar nos móveis para ver medidas e materiais.',
    capa: 'img/apartamento-3d.jpg',
    capaPequena: 'img/apartamento-3d-760.jpg',
    src: 'tours/apartamento-salvador/index.html?embed=1',
    comodos,
  },
];

export const tourPorSlug = (slug: string) => TOURS.find((t) => t.slug === slug);
export const fmtArea = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' m²';
