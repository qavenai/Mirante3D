export const WHATSAPP = '5571992087050';
export const WHATSAPP_EXIBICAO = '(71) 99208-7050';

export const linkWhatsApp = (texto = 'Olá! Vi o app da Mirante e quero um orçamento de tour 3D para o meu imóvel.') =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;

export type Duvida = { p: string; r: string };

export const DUVIDAS: Duvida[] = [
  { p: 'Preciso ter a planta do imóvel?', r: 'Ajuda bastante. Serve PDF, imagem ou foto da planta impressa. Se você não tiver, a gente conversa sobre outra forma de levantar as medidas.' },
  { p: 'Os móveis ficam iguais aos meus?', r: 'Ficam parecidos: mesmo tipo de móvel, cores próximas e a mesma posição. O tour representa o espaço com fidelidade, sem ser uma fotografia.' },
  { p: 'O hóspede precisa baixar algum aplicativo?', r: 'Não. O tour abre no navegador do celular ou do computador, a partir de um link.' },
  { p: 'Posso colocar o tour no anúncio do Airbnb?', r: 'Plataformas como Airbnb e Booking costumam limitar links externos nos anúncios. Por isso o tour rende mais no seu Instagram, no seu site de reserva direta e no WhatsApp, onde você já conversa com o hóspede.' },
  { p: 'Quanto tempo leva para ficar pronto?', r: 'Depende do tamanho do imóvel e do material que você enviar. O prazo vem junto com o orçamento.' },
  { p: 'Quanto custa?', r: 'O valor é sob consulta, porque cada imóvel tem um tamanho e um número de ambientes. Mande a planta pelo WhatsApp e receba o valor e o prazo.' },
  { p: 'E se eu mudar a decoração depois?', r: 'Dá para atualizar o tour. O ajuste é orçado conforme o tamanho da mudança.' },
  { p: 'Funciona em qualquer celular?', r: 'Funciona nos celulares atuais. Em aparelhos muito antigos, o passeio pode ficar mais lento.' },
];

export const BENEFICIOS = [
  { t: 'Menos dúvida no chat', d: 'O hóspede vê onde ficam as camas, a varanda e a cozinha. Sobram menos perguntas antes da reserva.' },
  { t: 'Expectativa certa na chegada', d: 'Os ambientes seguem as medidas da planta. O hóspede chega sabendo o tamanho real da sala e dos quartos.' },
  { t: 'Um imóvel que se destaca', d: 'Enquanto a maioria manda só fotos, você manda um passeio. É um bom motivo para escolherem o seu.' },
  { t: 'Abre em qualquer navegador', d: 'Um link só, que funciona no celular e no computador. Sem aplicativo e sem cadastro.' },
];

export const PASSOS = [
  { t: 'Você manda a planta', d: 'PDF, imagem ou foto da planta, junto com fotos dos ambientes.' },
  { t: 'A gente monta o 3D', d: 'Paredes na medida, portas, janelas e móveis parecidos com os do imóvel.' },
  { t: 'Você revisa', d: 'Confere o passeio e pede os ajustes que quiser na decoração.' },
  { t: 'Recebe o link', d: 'Pronto para mandar aos hóspedes e divulgar nas suas redes.' },
];
