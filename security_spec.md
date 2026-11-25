# Especificação de Segurança Firestore (Phase 0)

## 1. Invariantes de Dados
1. **Isolamento de PII (Leads, Clientes, Visitas, Propostas, Tarefas)**: Nenhum visitante não autenticado ou usuário comum pode ler (`get` / `list`), atualizar ou excluir documentos em `leads`, `clients`, `pipeline`, `visits`, `proposals`, `tasks`, `media`, `analytics` ou `adminUsers`.
2. **Captura Pública Controlada**: Visitantes públicos só podem criar documentos em `leads` (com `status == 'novo'`, `lgpdConsent == true` e `createdAt == request.time`) e `analytics` (com `createdAt == request.time` e campos estritamente limitados, sem PII).
3. **Visibilidade de Rascunhos**: Imóveis (`properties`), empreendimentos (`empreendimentos`) e landing pages (`landingPages`) com `published == false` (ou `confirmationStatus == 'a_confirmar'` não publicados) só são visíveis para administradores autenticados e verificados.
4. **Integridade Temporal**: Todos os campos `createdAt` na criação e `updatedAt` na criação/atualização devem corresponder estritamente a `request.time`. Em atualizações, `createdAt` é imutável (`incoming().createdAt == existing().createdAt`).
5. **Proteção contra Campos Sombra e Injeção de ID**: Todo documento tem verificação `hasAll(...) && hasOnly(...)`, limites `.size()` em todas as strings e arrays, e `isValidId()` (`^[a-zA-Z0-9_-]+$`, `<= 128`) em todos os IDs de caminho.
6. **Administração Verificada**: Nenhuma regra confia apenas em e-mail sem `request.auth.token.email_verified == true`. Nenhum usuário pode auto-atribuir privilégios em `adminUsers`.

## 2. The "Dirty Dozen" Payloads (12 Ataques Bloqueados)
1. **Shadow Field Injection on Lead**: `{ "name": "Teste", "phone": "15999999999", "interestType": "contato", "source": "home", "score": "quente", "status": "novo", "lgpdConsent": true, "isAdmin": true }` -> Bloqueado por `keys().hasOnly(...)`.
2. **Status Escalation on Public Lead Create**: Criar lead público com `"status": "fechado"` -> Bloqueado por `incoming().status == 'novo'`.
3. **LGPD Bypass on Public Lead**: Criar lead público com `"lgpdConsent": false` -> Bloqueado por `incoming().lgpdConsent == true`.
4. **Public PII Read on Leads**: `getDocs(collection(db, 'leads'))` sem autenticação -> Bloqueado por `isAdmin()`.
5. **Unverified Admin Email Spoof**: Token com `email: 'juniorwebcode@gmail.com'` e `email_verified: false` -> Bloqueado por `request.auth.token.email_verified == true`.
6. **Self-Privilege Escalation on adminUsers**: Usuário autenticado comum tentando criar `/adminUsers/{uid}` com `role: 'admin'` -> Bloqueado por `isAdmin()`.
7. **Draft Property Leak**: Visitante tentando ler `/properties/{id}` com `published: false` -> Bloqueado por `existing().published == true || isAdmin()`.
8. **ID Poisoning**: Gravação com documentId contendo `/` ou 500 caracteres -> Bloqueado por `isValidId()`.
9. **Timestamp Forgery**: Criar lead ou analytics com `createdAt` retroativo (cliente tentando falsificar `request.time`) -> Bloqueado por `createdAt == request.time`.
10. **Immutable `createdAt` Tampering**: Admin atualizando imóvel tentando alterar `createdAt` -> Bloqueado por `incoming().createdAt == existing().createdAt`.
11. **Denial-of-Wallet Oversized String**: Enviar `message` com 100.000 caracteres em `leads` -> Bloqueado por `data.message.size() <= 2000`.
12. **Unbounded Array Injection**: Enviar `gallery` com 500 itens em `properties` -> Bloqueado por `data.gallery.size() <= 100`.
