import type {
  Empreendimento,
  LandingPage,
  ProfessionalProfile,
  Property,
  SiteSettings
} from '../types/realEstate';

export const ASSET_IMAGES = {
  brandLogo: '/src/assets/images/logo_patricia_vicente.png',
  brandLogoFallback: '/src/assets/images/logo_patricia_vicente.png',
  heroArchitecture: '/src/assets/images/hero_sorocaba_architecture_1794928223974.jpg',
  patriciaPortrait: 'https://i.postimg.cc/bw8JP4Zp/Retrato-Profissional-no-Escritorio.png',
  naPlantaLaunch: '/src/assets/images/property_na_planta_launch_1794928224518.jpg',
  casaCondominio: '/src/assets/images/property_casa_condominio_1794928224557.jpg',
  prontoApartamento: '/src/assets/images/property_pronto_apartamento_1794928224769.jpg',
  assistantAvatar: '/src/assets/images/virtual_assistant_avatar_1794932191510.jpg'
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 'main',
  brandName: 'Patrícia Vicente',
  tagline: 'Corretora de Imóveis em Sorocaba e Região',
  logoUrl: '/src/assets/images/logo_patricia_vicente.png',
  primaryColor: '#1E4D5C',
  accentColor: '#A67C46',
  backgroundColor: '#FAF9F6',
  displayFont: 'Playfair Display',
  bodyFont: 'Plus Jakarta Sans',
  whatsappNumber: '5515998465635',
  whatsappDefaultMessage:
    'Olá, Patrícia! Vim pelo seu site e gostaria de conversar sobre imóveis em Sorocaba e região.',
  instagramUrl: 'https://www.instagram.com/patriciavicentecorretoraso/',
  heroTitle: '10 anos na construção civil. Agora, ajudando você a encontrar seu lar em Sorocaba e região.',
  heroSubtitle:
    'Atendimento próximo, olhar técnico de obra e seleção transparente em imóveis na planta, prontos e condomínios.',
  heroImageUrl: ASSET_IMAGES.heroArchitecture,
  seoTitle: 'Patrícia Vicente | Corretora de Imóveis em Sorocaba e Região',
  seoDescription:
    '10 anos na construção civil. Agora, ajudando você a encontrar seu lar em Sorocaba e região. Imóveis na planta, prontos e condomínios.',
  ga4MeasurementId: '',
  gtmContainerId: '',
  googleSearchConsoleTag: '',
  googleAdsConversionId: '',
  lgpdNoticeText:
    'Utilizamos cookies essenciais e dados de contato exclusivamente para responder às suas solicitações de atendimento e agendamento de visitas, em conformidade com a LGPD.'
};

export const DEFAULT_PROFESSIONAL_PROFILE: ProfessionalProfile = {
  id: 'main',
  fullName: 'Patrícia Vicente',
  roleTitle: 'Corretora de Imóveis – Sorocaba e Região',
  instagramHandle: '@patriciavicentecorretoraso',
  creciNumber: '',
  creciStatus: 'a_confirmar',
  commercialEmail: '',
  commercialEmailStatus: 'a_confirmar',
  commercialAddress: '',
  commercialAddressStatus: 'a_confirmar',
  yearsConstruction: 10,
  headline: '10 anos na construção civil. Agora, ajudando você a encontrar seu lar.',
  institutionalBio:
    'Sou Patrícia Vicente, Corretora de Imóveis em Sorocaba e região. Com 10 anos de experiência na construção civil, hoje ajudo você a encontrar o imóvel ideal — na planta, pronto ou em condomínio. Vamos conversar?',
  constructionStory:
    'Durante uma década acompanhando de perto projetos, acabamentos, cronogramas e qualidade construtiva, aprendi a enxergar o que realmente faz diferença na vida de quem vai morar em um imóvel. Hoje trago essa vivência prática para orientar cada família com clareza técnica, sem pressa e com total transparência sobre plantas, imóveis prontos e condomínios em Sorocaba e região.',
  portraitUrl: ASSET_IMAGES.patriciaPortrait,
  serviceRegion: 'Sorocaba e região'
};

export const DEFAULT_PROPERTIES: Property[] = [
  {
    id: 'prop-selecao-na-planta',
    code: 'PV-001',
    title: 'Apartamentos na Planta em Sorocaba',
    slug: 'apartamentos-na-planta-sorocaba',
    category: 'na_planta',
    transactionType: 'lancamento',
    region: 'Sorocaba e região',
    neighborhood: 'Região a confirmar',
    priceText: 'Valor a confirmar',
    confirmationStatus: 'a_confirmar',
    bedrooms: 'A confirmar',
    suites: 'A confirmar',
    bathrooms: 'A confirmar',
    parkingSpaces: 'A confirmar',
    areaSqm: 'A confirmar',
    description:
      'Seleção de projetos na planta em Sorocaba com acompanhamento técnico desde a leitura do memorial descritivo até as etapas de obra. Valores, plantas disponíveis, condições de pagamento e previsão de entrega são confirmados diretamente pela corretora conforme tabela vigente.',
    confirmationNote:
      'Dados de tipologia, metragem, disponibilidade de unidades e valores sujeitos à confirmação pela corretora Patrícia Vicente.',
    coverImage: ASSET_IMAGES.naPlantaLaunch,
    gallery: [ASSET_IMAGES.naPlantaLaunch, ASSET_IMAGES.prontoApartamento],
    features: [
      'Análise de planta e memorial descritivo',
      'Acompanhamento de evolução de obra',
      'Atendimento personalizado em Sorocaba e região'
    ],
    empreendimentoId: 'emp-vitrine-sorocaba',
    featured: true,
    published: true
  },
  {
    id: 'prop-selecao-pronto',
    code: 'PV-002',
    title: 'Apartamento Pronto para Morar em Sorocaba',
    slug: 'apartamento-pronto-para-morar-sorocaba',
    category: 'pronto',
    transactionType: 'venda',
    region: 'Sorocaba e região',
    neighborhood: 'Bairro a confirmar',
    priceText: 'Valor a confirmar',
    confirmationStatus: 'a_confirmar',
    bedrooms: 'A confirmar',
    suites: 'A confirmar',
    bathrooms: 'A confirmar',
    parkingSpaces: 'A confirmar',
    areaSqm: 'A confirmar',
    description:
      'Imóvel pronto avaliado com olhar prático de quem conhece construção civil: verificação cuidadosa de acabamentos, insolação, ventilação natural e potencial de personalização. Entre em contato para confirmar endereço, disponibilidade e agendar visita presencial.',
    confirmationNote:
      'Valores, metragem exata e documentação detalhada sujeitos à confirmação presencial com a corretora.',
    coverImage: ASSET_IMAGES.prontoApartamento,
    gallery: [ASSET_IMAGES.prontoApartamento, ASSET_IMAGES.heroArchitecture],
    features: [
      'Vistoria com olhar técnico de construção civil',
      'Agendamento de visita acompanhada',
      'Transparência documental'
    ],
    featured: true,
    published: true
  },
  {
    id: 'prop-selecao-condominio',
    code: 'PV-003',
    title: 'Residência em Condomínio Fechado — Sorocaba e Região',
    slug: 'residencia-condominio-fechado-sorocaba-regiao',
    category: 'condominio',
    transactionType: 'venda',
    region: 'Sorocaba e região',
    neighborhood: 'Condomínio a confirmar',
    priceText: 'Valor a confirmar',
    confirmationStatus: 'a_confirmar',
    bedrooms: 'A confirmar',
    suites: 'A confirmar',
    bathrooms: 'A confirmar',
    parkingSpaces: 'A confirmar',
    areaSqm: 'A confirmar',
    description:
      'Seleção de casas e terrenos em condomínios residenciais em Sorocaba e região para quem busca convivência tranquila, área verde e qualidade construtiva. Consulte opções atualizadas e agende sua visita com orientação técnica.',
    confirmationNote:
      'Taxa condominial, metragem construída/terreno e valor de venda sujeitos à confirmação pela corretora.',
    coverImage: ASSET_IMAGES.casaCondominio,
    gallery: [ASSET_IMAGES.casaCondominio, ASSET_IMAGES.heroArchitecture],
    features: [
      'Avaliação estrutural e de acabamentos',
      'Seleção de condomínios em Sorocaba e região',
      'Atendimento consultivo do primeiro contato à visita'
    ],
    empreendimentoId: 'emp-condominios-sorocaba',
    featured: true,
    published: true
  }
];

export const DEFAULT_EMPREENDIMENTOS: Empreendimento[] = [
  {
    id: 'emp-vitrine-sorocaba',
    name: 'Seleção Empreendimentos na Planta — Sorocaba',
    slug: 'selecao-empreendimentos-na-planta-sorocaba',
    category: 'na_planta',
    region: 'Sorocaba e região',
    developer: 'A confirmar conforme projeto',
    stage: 'Lançamento / Em obras (a confirmar)',
    deliveryForecast: 'A confirmar',
    priceRangeText: 'Sob consulta — valores a confirmar',
    confirmationStatus: 'a_confirmar',
    description:
      'Portfólio de empreendimentos selecionados em Sorocaba com acompanhamento próximo sobre estágio de obra, especificações construtivas e plantas disponíveis.',
    highlights: [
      'Leitura clara do memorial de acabamentos',
      'Acompanhamento de obra e visitas técnicas',
      'Atendimento direto com Patrícia Vicente'
    ],
    coverImage: ASSET_IMAGES.naPlantaLaunch,
    gallery: [ASSET_IMAGES.naPlantaLaunch, ASSET_IMAGES.heroArchitecture],
    featured: true,
    published: true
  },
  {
    id: 'emp-condominios-sorocaba',
    name: 'Roteiro de Condomínios Residenciais — Sorocaba e Região',
    slug: 'roteiro-condominios-residenciais-sorocaba-regiao',
    category: 'condominio',
    region: 'Sorocaba e região',
    developer: 'Diversos empreendimentos',
    stage: 'Pronto / Em expansão (a confirmar)',
    deliveryForecast: 'A confirmar',
    priceRangeText: 'Sob consulta — valores a confirmar',
    confirmationStatus: 'a_confirmar',
    description:
      'Conheça os condomínios residenciais com casas prontas ou lotes disponíveis em Sorocaba e região, com orientação prática para escolher a melhor implantação e padrão construtivo.',
    highlights: [
      'Comparativo técnico de implantação e estrutura',
      'Visitas guiadas com horário agendado',
      'Suporte transparente durante toda a escolha'
    ],
    coverImage: ASSET_IMAGES.casaCondominio,
    gallery: [ASSET_IMAGES.casaCondominio, ASSET_IMAGES.heroArchitecture],
    featured: true,
    published: true
  }
];

export const DEFAULT_LANDING_PAGE: LandingPage = {
  id: 'lp-sorocaba-exclusiva',
  title: 'Apresentação Exclusiva — Seu Lar em Sorocaba com Olhar da Construção Civil',
  slug: 'seu-lar-em-sorocaba',
  targetType: 'campaign',
  targetId: 'emp-vitrine-sorocaba',
  isPremiumShowcase: true,
  heroKicker: 'Sorocaba e região · Atendimento consultivo',
  heroTitle: 'Escolher um imóvel exige mais do que fotos bonitas: exige quem entende de obra.',
  heroSubtitle:
    'Com 10 anos de experiência na construção civil, Patrícia Vicente acompanha você na escolha segura de imóveis na planta, prontos ou em condomínios.',
  heroCtaLabel: 'Agendar conversa com Patrícia',
  heroImage: ASSET_IMAGES.heroArchitecture,
  architecturalThesis:
    'Antes de apresentar opções, ouvimos como você e sua família vivem. A leitura técnica de plantas, insolação, materiais e cronograma de obra evita surpresas e transforma a busca pelo lar ideal em uma decisão tranquila e bem informada em Sorocaba e região.',
  highlights: [
    '01. Leitura técnica de plantas, acabamentos e memorial descritivo',
    '02. Seleção sob medida entre imóveis na planta, prontos e condomínios',
    '03. Visitas acompanhadas e informações confirmadas com transparência'
  ],
  gallery: [
    ASSET_IMAGES.heroArchitecture,
    ASSET_IMAGES.casaCondominio,
    ASSET_IMAGES.naPlantaLaunch
  ],
  formTitle: 'Solicite atendimento personalizado ou agende sua visita',
  seoTitle: 'Encontre seu Lar em Sorocaba e Região | Patrícia Vicente',
  seoDescription:
    'Atendimento imobiliário consultivo em Sorocaba com 10 anos de experiência na construção civil. Imóveis na planta, prontos e condomínios.',
  published: true
};
