# GlobalDOCS — Plataforma de Arquivos, LLC, Contas & Ativos

Plataforma completa de e-commerce e distribuição automatizada com painel administrativo isolado por rota protegida, sistema de coleções e suporte a múltiplos formatos de entrega (**Digital**, **Físico**, **LLC** e **Contas**), construída estritamente sob as diretrizes do [`DESIGN.md`](./DESIGN.md).

---

## 🔒 Acesso Separado e Protegido do Painel Admin

Conforme solicitado, **o Painel Administrativo foi completamente desvinculado da loja pública**. Não existe nenhum botão público visível no cabeçalho dando acesso livre.

- **Rota Privada:** [`/admin`](http://127.0.0.1:5173/admin)
- **Tela de Autenticação / Login:** Ao acessar `/admin`, o sistema exige a senha de segurança de administrador.
- **Senha Padrão Inicial:** `admin` (pode ser alterada diretamente na aba de Configurações do painel).
- **Encerramento de Sessão:** Botão de **"Sair"** no topo do painel limpa a autenticação.

---

## 📁 Sistema de Coleções

O Admin pode criar, editar e excluir coleções temáticas para agrupar e organizar os produtos à venda:
- **Exemplos Inclusos:**
  - *Formação & Abertura de LLC nos EUA* (slug: `/llc-usa`)
  - *Contas & Estruturas Internacionais* (slug: `/contas-internacionais`)
  - *Documentação Física & Apostilamento* (slug: `/documentos-fisicos`)
  - *Templates & Ativos Digitais PRO* (slug: `/ativos-digitais`)
- **Filtro em Estante Visual:** Na loja pública, os clientes podem filtrar instantaneamente por coleção com badges coloridos personalizados.

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
npm run dev
```

- **Loja Pública:** [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Painel Administrativo Restrito:** [http://127.0.0.1:5173/admin](http://127.0.0.1:5173/admin) (Senha: `admin`)

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

## ☁️ Publicação na Vercel

O projeto já inclui `vercel.json` com a configuração do Vite, diretório de saída `dist`, cache dos assets versionados e fallback de SPA. Esse fallback permite abrir ou atualizar diretamente rotas como `/admin` e `/downloads` sem receber erro 404.

1. Importe o repositório no painel da Vercel.
2. Mantenha o preset **Vite** detectado automaticamente.
3. Publique; não há variáveis de ambiente obrigatórias no estado atual do projeto.

Também é possível publicar pela CLI da Vercel a partir da raiz do projeto.

> **Importante:** atualmente produtos, pedidos, configurações e autenticação são persistidos em `localStorage`/`sessionStorage`. Portanto, esses dados ficam apenas no navegador de cada visitante e não são compartilhados entre dispositivos. Para operação real de e-commerce, será necessário conectar um backend/banco de dados e autenticação no servidor.
