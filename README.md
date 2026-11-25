# Patrícia Vicente — Site Institucional Imobiliário & CRM Privado

Site institucional público em tema claro para **Patrícia Vicente — Corretora de Imóveis em Sorocaba e Região**, com painel administrativo privado, CRM imobiliário completo e Landing Page Premium exclusiva.

## Funcionalidades Principais

- **Site Público Institucional (Tema Claro)**: Home editorial, busca conectada ao Firestore, páginas de categorias (`Na Planta`, `Prontos`, `Condomínios`, `Comprar`, `Empreendimentos`), páginas individuais compartilháveis, Sobre, Contato e Política de Privacidade (LGPD).
- **1 Landing Page Premium Exclusiva (`/lp/:slug`)**: Sistema que garante no máximo 1 landing page premium em destaque publicada por vez, com efeitos de motion, parallax, cards interativos e captura de leads com UTMs.
- **CRM Imobiliário Privado (`/admin`)**:
  - Pipeline visual Kanban com 9 etapas (`Novo Lead` → `Contato` → `Qualificado` → `Visita Agendada` → `Visita Realizada` → `Proposta` → `Negociação` → `Fechado` / `Perdido`).
  - Captura automática de leads com UTMs, scoring (`Quente` / `Morno` / `Frio`) e conversão em 1 clique para Cliente + Pipeline + Tarefa de follow-up.
  - Fichas de clientes com histórico de interações, agenda de visitas com lembretes, propostas com upload de documentos, tarefas e relatórios de conversão.
- **Gestão Completa de Conteúdo**: CRUD de Imóveis, CRUD de Empreendimentos, Landing Pages, Biblioteca de Mídia (Vercel Blob) e Configurações do site (cores claras, textos, CRECI/e-mail/endereço editáveis, GA4/GTM/Search Console/Google Ads).

## Firebase & Provisionamento do Primeiro Admin

1. O projeto está conectado a um banco Firestore dedicado e isolado via `firebase-applet-config.json`.
2. As regras de segurança (`firestore.rules`) protegem dados pessoais (PII) de leads, clientes, visitas, propostas e tarefas, liberando acesso apenas para administradores autenticados com Google e e-mail verificado.
3. **Provisionamento de novos administradores (ex.: conta Google da Patrícia Vicente)**:
   - Acesse `/admin` e faça login com a conta Google proprietária configurada no provisionamento.
   - Vá em **Configurações & SEO → Administradores Autorizados**.
   - Caso outro usuário faça login em `/admin` pela primeira vez, a tela exibirá o **UID** e o e-mail dela; basta colar esse UID e e-mail em **Autorizar Admin** para liberar o acesso completo.

## Variáveis de Ambiente & Deploy na Vercel

Veja `.env.example`:

- `APP_URL`: URL pública de produção (usada em `/sitemap.xml` e `/robots.txt`).
- `BLOB_READ_WRITE_TOKEN`: Token do **Vercel Blob** para upload de imagens e documentos no painel administrativo.

### Comandos

```bash
npm install
npm run dev      # Inicia servidor Express + Vite na porta 3000
npm run lint     # Verificação TypeScript
npm run build    # Gera bundle de produção em dist/
npm run start    # Inicia servidor de produção (node server.ts)
```
