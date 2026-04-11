# Plano de Melhorias - Cerimonial Studio SaaS

## Problemas Identificados

### 1. Stripe - Integração Não Funcional
- IDs de produtos/preços são mock (`prod_basico`, `price_basico_monthly`) e não IDs reais do Stripe
- Falta endpoint `/api/create-portal` para gerenciar assinatura (cancelar, trocar plano)
- Falta endpoint `/api/manage-subscription` para portal do cliente Stripe
- Pricing.tsx usa normalização frágil por nome de produto

### 2. Arquitetura SaaS Fraca
- Limites de plano são verificados APENAS no frontend (facilmente burlável)
- `getLimit()` em Couples.tsx usa substring matching no nome do plano
- Contrato.tsx e Roteiros.tsx usam `userPlan?.includes('Pro')` - client-only
- Sem middleware de autorização no servidor
- Sem rate limiting

### 3. UI/UX Não Profissional
- Auth.tsx: mensagem de confirmação em inglês, sem feedback visual adequado
- Sem landing page / página de boas-vindas
- Sem toast notifications (usa `alert()` nativo em vários lugares)
- Sem loading states consistentes
- Sem tratamento de erros amigável
- Sidebar com texto hardcoded "Telêmaco Borba — Paraná"
- Dashboard não mostra contagem real de contratos/checklists
- Sem breadcrumbs ou indicação de navegação

### 4. Código e Arquitetura
- `supabase.ts` cai para placeholder silenciosamente
- Schemas SQL fragmentados em 4 arquivos separados
- Types incompletos (falta billing tables)
- `package.json` com nome genérico "react-example"
- `index.html` com lang="en" ao invés de "pt-BR"
- Sem SEO meta tags

## Melhorias a Implementar

### Fase 1: UI/UX Profissional
- [x] Sistema de Toast notifications
- [x] Landing page com hero, features, social proof
- [x] Auth melhorado com mensagens em PT-BR
- [x] Dashboard com stats reais
- [x] Sidebar profissional sem dados hardcoded
- [x] Loading states e skeleton screens
- [x] Meta tags e SEO

### Fase 2: Stripe Funcional
- [x] Endpoint `/api/create-portal` para Stripe Customer Portal
- [x] Pricing dinâmico que funciona com IDs reais do Stripe
- [x] Webhook robusto com logging
- [x] Sync automático de produtos/preços via webhook
- [x] Página de sucesso pós-checkout

### Fase 3: Arquitetura SaaS
- [x] Hook `usePlan` centralizado
- [x] Guard components para features premium
- [x] Middleware de rate limiting
- [x] Types completos
- [x] Schema SQL consolidado
