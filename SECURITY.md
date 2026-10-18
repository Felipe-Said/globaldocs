# Segurança da plataforma

## Fronteiras de confiança

- O navegador nunca define preço, desconto, saldo, estado pago ou conteúdo entregue. Essas decisões pertencem ao banco e às funções de servidor.
- A chave `service_role`, chaves de gateways, segredo IPN e credenciais de fornecedores existem apenas no servidor.
- A criação e a consulta de cobranças exigem a sessão Supabase do proprietário do pedido. O token público do pedido não autoriza operações financeiras.
- Um IPN assinado é somente um aviso. Antes de liberar pedido ou saldo, o servidor consulta o pagamento diretamente no provedor e reconcilia identificadores, moeda, preço em BRL, valor esperado e valor efetivamente recebido.

## Controles implementados

- HMAC SHA-512 do IPN, ordenação recursiva do JSON e comparação em tempo constante.
- Reconciliação server-to-server e política de liberação somente no estado `finished` com pagamento integral.
- Idempotência por restrições únicas, transições condicionais de estado e chave única das transações de carteira.
- Crédito de carteira permitido no banco somente para recarga pendente, pagamento `finished` e valor integral.
- Limites distribuídos por cliente/IP para criação e consulta de cobranças.
- Limite de corpo JSON, exigência de `application/json` e mensagens públicas sem detalhes internos.
- URL de callback construída apenas de configuração confiável, sem confiar no cabeçalho `Host` da requisição.
- RLS e revogação de acesso direto às tabelas financeiras; operações privilegiadas usam apenas `service_role` no servidor.
- HSTS, proteção contra iframe, política de origem, restrição de permissões e CSP.

## Operação

- Configure `SITE_URL` com a origem HTTPS canônica da loja.
- Rotacione imediatamente qualquer segredo que tenha sido exposto em código, log, captura de tela ou conversa pública.
- Mantenha a proteção contra senhas vazadas, CAPTCHA e limites de envio de OTP habilitados no Supabase Auth.
- Investigue logs `reconciliation-failed`, `identity-mismatch` e `invalid-signature`; eles indicam tentativa maliciosa ou divergência que exige conferência manual.
- Reembolse ou revise manualmente pagamentos enviados depois que uma recarga foi cancelada. O sistema não credita uma recarga encerrada automaticamente.

## Riscos residuais

- A senha numérica enviada por e-mail foi mantida por compatibilidade com o fluxo atual. Códigos temporários e autenticação sem senha são mais resistentes a reutilização e vazamento.
- A CSP permite imagens HTTPS externas porque banners e ícones atuais usam CDNs. Migrar esses ativos para o storage próprio permitirá restringir `img-src` a domínios específicos.
- Monitoramento centralizado, alertas e testes de intrusão periódicos continuam sendo necessários; nenhuma mudança de código substitui essas práticas.
