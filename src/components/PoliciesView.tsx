import React from 'react';
import { FileCheck2, Mail, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const CONTACT_EMAIL = 'saidlabsglobal@gmail.com';

type PolicySection = {
  id: string;
  title: string;
  summary: string;
  icon: React.ElementType;
  content: React.ReactNode;
};

const ContactLink = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary underline decoration-primary/30 underline-offset-2 hover:text-primary-pressed">
    {CONTACT_EMAIL}
  </a>
);

const sections: PolicySection[] = [
  {
    id: 'termos',
    title: 'Termos de Uso',
    summary: 'Regras para utilizar a plataforma, a conta do cliente e os produtos adquiridos.',
    icon: FileCheck2,
    content: (
      <div className="space-y-4">
        <p>Ao acessar ou comprar na Global DOCs, você concorda em fornecer dados verdadeiros, manter sua senha de acesso protegida e utilizar os produtos e serviços de forma lícita.</p>
        <p>Descrições, formatos, quantidades, prazos e condições específicas apresentados na página do produto integram a contratação. O conteúdo entregue não pode ser redistribuído, revendicado como autoria própria ou utilizado para fraude, abuso de plataforma ou violação de direitos de terceiros.</p>
        <p>Podemos suspender acessos quando houver indícios objetivos de fraude, chargeback indevido, uso abusivo ou descumprimento destes termos, sem afastar os direitos assegurados pela legislação aplicável.</p>
        <p>Para esclarecimentos sobre estes termos, entre em contato pelo e-mail <ContactLink />.</p>
      </div>
    ),
  },
  {
    id: 'privacidade',
    title: 'Privacidade e LGPD',
    summary: 'Como os dados pessoais são usados para cadastro, pagamento, entrega e suporte.',
    icon: ShieldCheck,
    content: (
      <div className="space-y-4">
        <p>Tratamos dados como nome, e-mail, CPF ou CNPJ, histórico de pedidos, registros de acesso e informações necessárias ao pagamento para executar compras, prevenir fraude, prestar suporte e cumprir obrigações legais.</p>
        <p>Os dados podem ser processados por fornecedores essenciais de infraestrutura, banco de dados, e-mail e pagamento, sempre limitados à finalidade do serviço. Não vendemos dados pessoais. Adotamos controles técnicos e organizacionais compatíveis com a natureza das informações tratadas.</p>
        <p>Você pode solicitar confirmação de tratamento, correção, acesso, portabilidade, informação sobre compartilhamentos ou exclusão quando aplicável. Alguns registros poderão ser mantidos pelo prazo necessário ao cumprimento de obrigação legal, exercício de direitos e prevenção a fraude.</p>
        <p>Para exercer seus direitos de privacidade ou falar sobre proteção de dados, entre em contato pelo e-mail <ContactLink />.</p>
      </div>
    ),
  },
  {
    id: 'reembolso',
    title: 'Trocas e Reembolsos',
    summary: 'Critérios para pedidos duplicados, falhas de entrega, defeitos e direito de arrependimento.',
    icon: RefreshCcw,
    content: (
      <div className="space-y-4">
        <p>Solicitações de cancelamento, troca ou reembolso são analisadas conforme a natureza do item, o estágio da entrega e os direitos obrigatórios previstos na legislação brasileira, inclusive o Código de Defesa do Consumidor.</p>
        <p>Se houver cobrança duplicada, item não entregue, arquivo corrompido, credencial inválida ou produto diferente da descrição, informe o número do pedido e detalhes do problema para que possamos verificar, corrigir a entrega ou realizar o reembolso cabível.</p>
        <p>Produtos digitais já acessados, baixados, copiados ou credenciais já reveladas exigem análise técnica do histórico de entrega. Essa análise não limita direitos que não possam ser afastados por contrato.</p>
        <p>Para solicitar análise, entre em contato pelo e-mail <ContactLink /> e informe o número do pedido.</p>
      </div>
    ),
  },
  {
    id: 'entrega',
    title: 'Entrega Digital',
    summary: 'Onde acompanhar arquivos, credenciais e itens que exigem processamento.',
    icon: Truck,
    content: (
      <div className="space-y-4">
        <p>Após a confirmação do pagamento, arquivos e acessos disponíveis para liberação automática aparecem na Área do Cliente. Produtos que dependem de validação, personalização ou processamento permanecem com o status “Processando envio” até a conclusão.</p>
        <p>O prazo e a forma de entrega informados na página de cada produto prevalecem sobre estimativas gerais. O cliente é responsável por manter o e-mail da conta acessível e por conferir sua Área do Cliente.</p>
        <p>Se o pedido constar como pago e a entrega não aparecer dentro do prazo informado, entre em contato pelo e-mail <ContactLink /> com o número do pedido.</p>
      </div>
    ),
  },
];

export const PoliciesView: React.FC = () => {
  const location = useLocation();

  React.useLayoutEffect(() => {
    const sectionId = location.hash.replace('#', '');
    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    const scrollToSection = () => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'auto', block: 'start' });
    scrollToSection();
    const frame = window.requestAnimationFrame(scrollToSection);
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash]);

  return (
    <div className="bg-surface-warm px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Informações legais</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Políticas da Global DOCs</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
            Consulte as regras de uso, privacidade, reembolso e entrega aplicáveis às compras realizadas na plataforma.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-muted">
            <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
            Canal de contato: <ContactLink />
          </p>
        </header>

        <nav aria-label="Navegação das políticas" className="mt-8 flex flex-wrap gap-2">
          {sections.map(section => (
            <a key={section.id} href={`#${section.id}`} className="inline-flex min-h-11 items-center rounded-xl border border-borderSoft bg-white px-4 text-xs font-semibold text-ink transition-colors hover:border-primary/40 hover:bg-primary-tint hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              {section.title}
            </a>
          ))}
        </nav>

        <div className="mt-8 grid gap-5">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <article id={section.id} key={section.id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-borderSoft bg-white shadow-notion-card">
                <div className="flex items-start gap-4 border-b border-borderSoft p-5 sm:p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-ink sm:text-xl">{section.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted sm:text-sm">{section.summary}</p>
                  </div>
                </div>
                <div className="max-w-4xl p-5 text-sm leading-7 text-ink-muted sm:p-6">
                  {section.content}
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-ink-faint">Última atualização: 18 de outubro de 2026.</p>
      </div>
    </div>
  );
};
