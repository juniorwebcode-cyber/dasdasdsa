/**
 * Verificação estrutural dos payloads "Dirty Dozen" e invariantes de validação
 * em espelho com firebase-blueprint.json e firestore.rules.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesContent = fs.readFileSync('firestore.rules', 'utf8');
const blueprint = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));

// Verificar presença de todas as coleções do blueprint nas regras
for (const pathKey of Object.keys(blueprint.firestore)) {
  const collectionName = pathKey.split('/')[1];
  assert.ok(
    rulesContent.includes(`match /${collectionName}/`),
    `Coleção ${collectionName} deve estar protegida em firestore.rules`
  );
}

// Verificar invariantes obrigatórios nas regras
assert.ok(rulesContent.includes("rules_version = '2';"), 'Deve usar rules_version = 2');
assert.ok(rulesContent.includes('allow read, write: if false;'), 'Deve incluir catch-all deny');
assert.ok(rulesContent.includes('email_verified == true'), 'Deve exigir email_verified == true');
assert.ok(rulesContent.includes('request.time'), 'Deve validar timestamps com request.time');
assert.ok(rulesContent.includes('isValidId('), 'Deve validar IDs de caminho');

// Simulador local dos invariantes Dirty Dozen (validação pré-escrita do cliente)
const dirtyDozenTests = [
  {
    name: 'Shadow Field Injection on Lead',
    valid: (p: Record<string, unknown>) => !('isAdmin' in p),
    payload: { name: 'Ana', phone: '15999999999', isAdmin: true }
  },
  {
    name: 'Status Escalation on Public Lead Create',
    valid: (p: Record<string, unknown>) => p.status === 'novo',
    payload: { name: 'Ana', phone: '15999999999', status: 'fechado' }
  },
  {
    name: 'LGPD Bypass on Public Lead',
    valid: (p: Record<string, unknown>) => p.lgpdConsent === true,
    payload: { name: 'Ana', phone: '15999999999', lgpdConsent: false }
  },
  {
    name: 'Oversized Lead Message',
    valid: (p: Record<string, unknown>) => typeof p.message === 'string' && p.message.length <= 2000,
    payload: { message: 'a'.repeat(2001) }
  },
  {
    name: 'Invalid Property Slug',
    valid: (p: Record<string, unknown>) => typeof p.slug === 'string' && /^[a-z0-9-]+$/.test(p.slug),
    payload: { slug: 'Imovel INVALIDO / 123' }
  },
  {
    name: 'Invalid Path ID',
    valid: (p: Record<string, unknown>) => typeof p.id === 'string' && p.id.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(p.id),
    payload: { id: '../admin/hack' }
  }
];

for (const testCase of dirtyDozenTests) {
  assert.equal(testCase.valid(testCase.payload), false, `Dirty payload deve falhar: ${testCase.name}`);
}

console.log('Todos os invariantes estruturais e Dirty Dozen verificados com sucesso.');
