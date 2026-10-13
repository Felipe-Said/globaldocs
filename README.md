# GlobalDOCS — Plataforma de Arquivos, LLC, Contas & Ativos

Plataforma completa de e-commerce e distribuição automatizada com painel administrativo isolado por rota protegida, sistema de coleções e suporte a múltiplos formatos de entrega (**Digital**, **Físico**, **LLC** e **Contas**), construída estritamente sob as diretrizes do [`DESIGN.md`](./DESIGN.md).

---

## 🔒 Acesso Separado e Protegido do Painel Admin

Conforme solicitado, **o Painel Administrativo foi completamente desvinculado da loja pública**. Não existe nenhum botão público visível no cabeçalho dando acesso livre.

- **Rota Privada:** [`/admin`](http://127.0.0.1:5173/admin)
- **Tela de autenticação:** o acesso usa Supabase Auth com e-mail e senha.
- **Autorização:** políticas RLS verificam a tabela `admin_users`; conhecer a URL do painel não concede acesso aos dados.
- **Encerramento de sessão:** o botão **"Sair"** revoga a sessão local do Supabase.

---

## 📁 Sistema de Coleções

O administrador pode criar, editar e excluir coleções reais para agrupar os produtos à venda. O banco inicia sem catálogo demonstrativo.

---

## 📦 Tipos de Produtos & Serviços Suportados

1. **Digital (Download Imediato):**
   - Arquivos .DOCX, .ZIP, .XLSX, .FIG, .PDF.
   - Liberação instantânea para download no navegador após pagamento.
2. **LLC (Abertura, Estatutos & EIN USA):**
   - Kits para Delaware, Wyoming, Novo México e Flórida.
   - Operating Agreements, Articles of Organization, Resoluções Bancárias e passo a passo IRS SS-4.
3. **Contas (Mercury, Stripe US, Bancos Globais):**
   - Dossiês de validação cadastral, compliance internacional e scripts para aprovação de fintechs americanas.
4. **Físico (Remessa com Frete / Sedex):**
   - Livros de atas encadernados, certificados em papel moeda, carimbos secos.
   - Exige endereço de entrega completo no checkout.
   - Status de rastreio e acompanhamento na área do cliente.

---

## 🚀 Como Executar Localmente

Requisitos: Node.js 22 e npm.

```bash
npm ci
copy .env.example .env.local
npm run dev
```

- **Loja Pública:** [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Painel Administrativo Restrito:** [http://127.0.0.1:5173/admin](http://127.0.0.1:5173/admin)

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## ☁️ Publicação na Vercel

O projeto já inclui `vercel.json` com a configuração do Vite, diretório de saída `dist`, cache dos assets versionados e fallback de SPA. Esse fallback permite abrir ou atualizar diretamente rotas como `/admin` e `/downloads` sem receber erro 404.

1. Importe o repositório no painel da Vercel.
2. Mantenha o preset **Vite** detectado automaticamente.
3. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nos ambientes Production, Preview e Development.
4. Publique.

Também é possível publicar pela CLI da Vercel a partir da raiz do projeto.

## Banco e segurança

- O schema versionado está em `supabase/migrations`.
- Produtos, entregáveis, coleções, pedidos, cupons, banners, configurações e integrações ficam no Supabase.
- Dados de entrega e integrações são privados e protegidos por RLS.
- Pedidos públicos são criados pela função `create_order`, que recalcula preços no banco e sempre inicia com status `pending`.
- A área do cliente exige e-mail, token seguro e pagamento confirmado.
- Carrinho e estado visual existem apenas em memória; dados comerciais não são persistidos pelo navegador.
