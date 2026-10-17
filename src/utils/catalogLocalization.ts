const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bGmail accounts\b/gi, 'Contas Gmail'],
  [/\bGmail account\b/gi, 'Conta Gmail'],
  [/\bGoogle Voice accounts\b/gi, 'Contas Google Voice'],
  [/\bGoogle Voice account\b/gi, 'Conta Google Voice'],
  [/\bGoogle Ads accounts\b/gi, 'Contas Google Ads'],
  [/\bGoogle Ads account\b/gi, 'Conta Google Ads'],
  [/\bGoogle accounts\b/gi, 'Contas Google'],
  [/\bGoogle account\b/gi, 'Conta Google'],
  [/\b(Facebook|Instagram|TikTok|Twitter|Discord|Reddit|LinkedIn|Twitch|Yandex) accounts\b/gi, 'Contas $1'],
  [/\b(Facebook|Instagram|TikTok|Twitter|Discord|Reddit|LinkedIn|Twitch|Yandex) account\b/gi, 'Conta $1'],
  [/\bemail accounts?\b/gi, 'contas de e-mail'],
  [/\bai accounts?\b/gi, 'contas de IA'],
  [/\bbusiness center\b/gi, 'central de negócios'],
  [/\bbusiness manager\b/gi, 'gerenciador de negócios'],
  [/\bad accounts?\b/gi, 'contas de anúncios'],
  [/\bgoogle services\b/gi, 'serviços do Google'],
  [/\brecovery email\b/gi, 'e-mail de recuperação'],
  [/\bbackup codes?\b/gi, 'códigos de backup'],
  [/\bautomatic payments?\b/gi, 'pagamento automático'],
  [/\bautomatic pay\b/gi, 'pagamento automático'],
  [/\bmanual registration\b/gi, 'cadastro manual'],
  [/\bverified email\b/gi, 'e-mail verificado'],
  [/\bemail verified\b/gi, 'e-mail verificado'],
  [/\bemail included\b/gi, 'e-mail incluído'],
  [/\bmail included\b/gi, 'e-mail incluído'],
  [/\bnot included\b/gi, 'não incluído'],
  [/\bno access\b/gi, 'sem acesso'],
  [/\bno login and password\b/gi, 'sem login e senha'],
  [/\bno warranty\b/gi, 'sem garantia'],
  [/\bno vat\b/gi, 'sem IVA'],
  [/\bwithout vat\b/gi, 'sem IVA'],
  [/\bare not used\b/gi, 'não utilizados'],
  [/\bnot used\b/gi, 'não utilizado'],
  [/\bused for ads\b/gi, 'usada para anúncios'],
  [/\bpayment method not added\b/gi, 'forma de pagamento não adicionada'],
  [/\bmay require\b/gi, 'pode exigir'],
  [/\bmight require\b/gi, 'pode exigir'],
  [/\bcan receive\b/gi, 'pode receber'],
  [/\bno replacement available\b/gi, 'sem reposição disponível'],
  [/\bno replacement\b/gi, 'sem reposição'],
  [/\btest carefully\b/gi, 'teste com cuidado'],
  [/\bfor Google sign-in only\b/gi, 'somente para login no Google'],
  [/\bfor Google sing-in only\b/gi, 'somente para login no Google'],
  [/\bnot a full Google account\b/gi, 'não é uma conta Google completa'],
  [/\bnot google account\b/gi, 'não é uma conta Google completa'],
  [/\bworks? for\b/gi, 'funciona por'],
  [/\bworking for\b/gi, 'funciona por'],
  [/\bpersonal\/business\b/gi, 'pessoal/empresarial'],
  [/\bprepaid\/postpaid\b/gi, 'pré-paga/pós-paga'],
  [/\bbackup email\b/gi, 'e-mail alternativo'],
  [/\brecovery mail\b/gi, 'e-mail de recuperação'],
  [/\binbox emails\b/gi, 'e-mails na caixa de entrada'],
  [/\bapp passwords\b/gi, 'senhas de aplicativo'],
  [/\bQR required\b/gi, 'QR obrigatório'],
  [/\bQR scan\b/gi, 'leitura de QR'],
  [/\bSMS code\b/gi, 'código SMS'],
  [/\bno videos?\b/gi, 'sem vídeos'],
  [/\bold videos?\b/gi, 'vídeos antigos'],
  [/\blong-term access\b/gi, 'acesso de longo prazo'],
  [/\bready to use\b/gi, 'pronta para uso'],
  [/\bfully activated\b/gi, 'totalmente ativada'],
  [/\bpartially verified\b/gi, 'parcialmente verificada'],
  [/\bself-registered\b/gi, 'autocadastrada'],
  [/\bprofile is filled\b/gi, 'perfil preenchido'],
  [/\benabled\b/gi, 'ativada'],
  [/\blocked\b/gi, 'bloqueada'],
  [/\bnew\b/gi, 'nova'],
  [/\bold\b/gi, 'antiga'],
  [/\bregistration\b/gi, 'cadastro'],
  [/\bdomains\b/gi, 'domínios'],
  [/\bdomain\b/gi, 'domínio'],
  [/\border\b/gi, 'pedido'],
  [/\breplacement\b/gi, 'reposição'],
  [/\bavailable\b/gi, 'disponível'],
  [/\bmanually\b/gi, 'manualmente'],
  [/\bmany\b/gi, 'vários'],
  [/\blanguage\b/gi, 'idioma'],
  [/\bviews\b/gi, 'visualizações'],
  [/\bvideos\b/gi, 'vídeos'],
  [/\bvideo\b/gi, 'vídeo'],
  [/\bSpain\b/gi, 'Espanha'],
  [/\bPoland\b/gi, 'Polônia'],
  [/\bUkraine\b/gi, 'Ucrânia'],
  [/\bFrance\b/gi, 'França'],
  [/\bphone verified\b/gi, 'telefone verificado'],
  [/\bphone removed\b/gi, 'telefone removido'],
  [/\bunverified email\b/gi, 'e-mail não verificado'],
  [/\bcreated\b/gi, 'criada'],
  [/\bregistered\b/gi, 'registrada'],
  [/\breinstated\b/gi, 'restabelecida'],
  [/\bfarmed\b/gi, 'preparada'],
  [/\bwarmed up\b/gi, 'aquecida'],
  [/\baged\b/gi, 'antiga'],
  [/\byears\b/gi, 'anos'],
  [/\byear\b/gi, 'ano'],
  [/\bmonths\b/gi, 'meses'],
  [/\bmonth\b/gi, 'mês'],
  [/\bdays\b/gi, 'dias'],
  [/\bday\b/gi, 'dia'],
  [/\bfriends\b/gi, 'amigos'],
  [/\bfriend\b/gi, 'amigo'],
  [/\bfollowers\b/gi, 'seguidores'],
  [/\bfollower\b/gi, 'seguidor'],
  [/\bposts\b/gi, 'publicações'],
  [/\bpost\b/gi, 'publicação'],
  [/\baccounts\b/gi, 'contas'],
  [/\baccount\b/gi, 'conta'],
  [/\bgender\b/gi, 'gênero'],
  [/\bfemale\b/gi, 'feminino'],
  [/\bmale\b/gi, 'masculino'],
  [/\brandom\b/gi, 'aleatório'],
  [/\bmixed\b/gi, 'misto'],
  [/\bmix\b/gi, 'misto'],
  [/\bworldwide\b/gi, 'mundial'],
  [/\beurope\b/gi, 'Europa'],
  [/\bcurrency\b/gi, 'moeda'],
  [/\bverified\b/gi, 'verificada'],
  [/\bincluded\b/gi, 'incluído'],
  [/\bpassword\b/gi, 'senha'],
  [/\bphone\b/gi, 'telefone'],
  [/\bempty profile\b/gi, 'perfil vazio'],
  [/\band\b/gi, 'e'],
  [/\bfrom\b/gi, 'de'],
  [/\bfor\b/gi, 'para'],
  [/\bother\b/gi, 'outros'],
];

export const localizeCatalogText = (value?: string) => {
  let result = String(value || '');
  for (const [pattern, replacement] of REPLACEMENTS) result = result.replace(pattern, replacement);
  return result.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:)])/g, '$1').trim();
};

const includesAny = (value: string, terms: string[]) => terms.some(term => value.includes(term));

export const deriveProductSubcategory = (collectionName?: string, title?: string) => {
  const collection = String(collectionName || '').toLowerCase();
  const text = `${collection} ${String(title || '').toLowerCase()}`;

  if (collection.includes('google')) {
    if (includesAny(text, ['google ads', 'adwords', 'adsense', 'ad account', 'conta de anúncio'])) return 'Google Ads';
    if (text.includes('google voice')) return 'Google Voice';
    if (text.includes('youtube')) return 'YouTube';
    if (includesAny(text, ['gmail', 'google mail'])) return 'Gmail';
    if (includesAny(text, ['business profile', 'google business', 'google maps'])) return 'Google Business';
    return 'Outros produtos Google';
  }
  if (collection.includes('email') || collection.includes('e-mail')) {
    if (text.includes('gmail')) return 'Gmail';
    if (includesAny(text, ['outlook', 'hotmail', 'microsoft'])) return 'Outlook & Hotmail';
    if (text.includes('proton')) return 'Proton Mail';
    if (text.includes('yahoo')) return 'Yahoo Mail';
    if (text.includes('mail.com')) return 'Mail.com';
    if (text.includes('firstmail')) return 'Firstmail';
    if (text.includes('yandex')) return 'Yandex Mail';
    return 'Outros provedores';
  }
  if (collection.includes('facebook')) {
    if (includesAny(text, ['business manager', 'business center', ' bm ', 'ad account', 'facebook ads'])) return 'Anúncios & Empresas';
    if (text.includes('marketplace')) return 'Marketplace';
    if (includesAny(text, ['page', 'fanpage'])) return 'Páginas';
    return 'Contas do Facebook';
  }
  if (collection.includes('tiktok')) {
    if (includesAny(text, ['tiktok ads', 'business center', 'ad account'])) return 'TikTok Ads';
    if (text.includes('tiktok shop')) return 'TikTok Shop';
    return 'Contas do TikTok';
  }
  if (collection.includes('instagram')) {
    if (text.includes('threads')) return 'Threads';
    if (includesAny(text, ['instagram ads', 'ad account'])) return 'Instagram Ads';
    return 'Contas do Instagram';
  }
  if (collection.includes('twitter') || collection.includes('x.com')) {
    if (includesAny(text, ['twitter ads', 'x ads', 'ad account'])) return 'Anúncios';
    return 'Contas do X (Twitter)';
  }
  if (collection.includes('discord')) {
    if (text.includes('token')) return 'Contas com Token';
    if (text.includes('nitro')) return 'Discord Nitro';
    return 'Contas do Discord';
  }
  if (collection.includes('reddit')) {
    if (text.includes('karma')) return 'Contas com Karma';
    if (includesAny(text, ['reddit ads', 'ad account'])) return 'Reddit Ads';
    return 'Contas do Reddit';
  }
  if (collection.includes('other') || collection.includes('outros')) {
    for (const brand of ['Spotify', 'CapCut', 'Etsy', 'TextPlus', 'Telegram', 'Pinterest', 'Netflix']) {
      if (text.includes(brand.toLowerCase())) return brand;
    }
    return 'Outros serviços';
  }
  return '';
};
