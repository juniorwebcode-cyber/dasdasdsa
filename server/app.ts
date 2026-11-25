import express, { type Request, type Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { put } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import {
  dbBootstrapDefaults,
  dbConvertLeadToCrm,
  dbDeleteAdminUser,
  dbDeleteClient,
  dbDeleteEmpreendimento,
  dbDeleteLandingPage,
  dbDeleteLead,
  dbDeleteMediaAsset,
  dbDeletePipelineItem,
  dbDeleteProperty,
  dbDeleteProposal,
  dbDeleteTask,
  dbDeleteVisit,
  dbMovePipelineStage,
  dbRecordAnalytics,
  dbSaveAdminUser,
  dbSaveClient,
  dbSaveEmpreendimento,
  dbSaveLandingPage,
  dbSaveMediaAsset,
  dbSavePipelineItem,
  dbSaveProfessionalProfile,
  dbSaveProperty,
  dbSaveProposal,
  dbSaveSiteSettings,
  dbSaveTask,
  dbSaveVisit,
  dbSubmitPublicLead,
  dbUpdateLead,
  getFullDatabaseAsync,
  getPublicSnapshotAsync
} from './store.ts';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const IS_VERCEL = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);

function resolveUploadsRoot(): string {
  if (IS_VERCEL) {
    return path.join(os.tmpdir(), 'pv-uploads');
  }
  const localUploads = path.resolve(PROJECT_ROOT, 'uploads');
  try {
    fs.mkdirSync(localUploads, { recursive: true });
    return localUploads;
  } catch {
    return path.join(os.tmpdir(), 'pv-uploads');
  }
}

const uploadsRoot = resolveUploadsRoot();

function loadFirebaseApiKey(): string {
  const candidates = [
    path.resolve(PROJECT_ROOT, 'firebase-applet-config.json'),
    path.resolve(process.cwd(), 'firebase-applet-config.json')
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8')) as { apiKey?: string };
        if (parsed.apiKey) return parsed.apiKey;
      }
    } catch {
      // Try next candidate
    }
  }
  return '';
}

const FIREBASE_API_KEY = loadFirebaseApiKey();

const ADMIN_LOGIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@x.com').trim().toLowerCase();
const ADMIN_LOGIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin4321';
const ADMIN_COOKIE_NAME = 'pv_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret(): string {
  if (process.env.ADMIN_SESSION_SECRET) {
    return process.env.ADMIN_SESSION_SECRET;
  }
  return crypto
    .createHash('sha256')
    .update(`${ADMIN_LOGIN_EMAIL}:${ADMIN_LOGIN_PASSWORD}:pv-admin-session-v1`)
    .digest('hex');
}

function sha256Equal(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function signAdminSession(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ email, exp }), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminSessionToken(token: string | undefined): { email: string } | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payload)
    .digest('base64url');

  if (!sha256Equal(sig, expectedSig)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email?: string;
      exp?: number;
    };
    if (!parsed.email || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return { email: parsed.email };
  } catch {
    return null;
  }
}

function extractSessionToken(req: Request): string | undefined {
  const authHeader = req.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === ADMIN_COOKIE_NAME) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}

async function isAuthorizedAdminRequest(req: Request): Promise<boolean> {
  const session = verifyAdminSessionToken(extractSessionToken(req));
  if (session) return true;

  const fbIdToken = req.get('x-firebase-id-token');
  if (!fbIdToken || !FIREBASE_API_KEY) return false;

  try {
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: fbIdToken })
      }
    );
    if (!lookupRes.ok) return false;
    const data = (await lookupRes.json()) as {
      users?: { email?: string; emailVerified?: boolean }[];
    };
    const user = data.users?.[0];
    if (!user?.email) return false;
    const emailLower = user.email.trim().toLowerCase();
    return (
      emailLower === ADMIN_LOGIN_EMAIL ||
      (user.emailVerified === true && emailLower === 'juniorwebcode@gmail.com')
    );
  } catch {
    return false;
  }
}

function sanitizeUploadName(rawName: string): string {
  const base = path.basename(rawName || 'arquivo').replace(/[^a-zA-Z0-9._-]/g, '-');
  return (base || 'arquivo').slice(0, 120);
}

function sanitizeFolderName(rawFolder: string | undefined): string {
  return (rawFolder || 'patricia-vicente').replace(/[^a-zA-Z0-9_-]/g, '') || 'patricia-vicente';
}

function safeDecodeFileName(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function requireAdmin(req: Request, res: Response): Promise<boolean> {
  const ok = await isAuthorizedAdminRequest(req);
  if (!ok) {
    res.status(401).json({ error: 'Sessão administrativa expirada ou não autorizada.' });
    return false;
  }
  return true;
}

function getBlobToken(): string {
  return (process.env.BLOB_READ_WRITE_TOKEN || '').trim().replace(/^["']+|["']+$/g, '');
}

export function createExpressApp() {
  const app = express();
  app.set('trust proxy', 1);

  try {
    fs.mkdirSync(uploadsRoot, { recursive: true });
    app.use(
      '/uploads',
      express.static(uploadsRoot, {
        maxAge: '7d',
        acceptRanges: true
      })
    );
  } catch {
    // Ignore local upload dir setup failure on constrained serverless runtimes
  }

  // Raw streaming upload route BEFORE express.json() — zero size limit and zero base64 bloat
  app.post('/api/blob/upload-stream', async (req, res) => {
    try {
      const authorized = await isAuthorizedAdminRequest(req);
      if (!authorized) {
        res.status(401).json({ error: 'Sessão administrativa expirada ou não autorizada.' });
        return;
      }

      const rawFileName = req.get('x-file-name') || 'arquivo';
      const contentType = req.get('x-content-type') || 'application/octet-stream';
      const safeFolder = sanitizeFolderName(req.get('x-folder'));
      const cleanName = sanitizeUploadName(safeDecodeFileName(rawFileName));
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${cleanName}`;
      const objectPath = `${safeFolder}/${uniqueName}`;
      const declaredSize = Number(req.get('x-file-size') || req.get('content-length') || 0);

      const token = getBlobToken();
      if (token) {
        const reqWithBody = req as Request & { body?: unknown };
        const uploadPayload = Buffer.isBuffer(reqWithBody.body)
          ? reqWithBody.body
          : typeof reqWithBody.body === 'string'
            ? Buffer.from(reqWithBody.body, 'binary')
            : req;

        const blob = await put(objectPath, uploadPayload, {
          access: 'public',
          contentType,
          multipart: true,
          token
        });

        res.json({
          url: blob.url,
          pathname: blob.pathname,
          contentType,
          sizeBytes: declaredSize || undefined,
          storageProvider: 'vercel_blob'
        });
        return;
      }

      if (IS_VERCEL) {
        res.status(500).json({
          error:
            'Storage Vercel Blob não configurado na Vercel. Adicione BLOB_READ_WRITE_TOKEN nas variáveis de ambiente do projeto.'
        });
        return;
      }

      const targetDir = path.join(uploadsRoot, safeFolder);
      fs.mkdirSync(targetDir, { recursive: true });
      const targetPath = path.join(targetDir, uniqueName);
      await pipeline(req, fs.createWriteStream(targetPath));
      const stat = fs.statSync(targetPath);

      res.json({
        url: `/uploads/${safeFolder}/${uniqueName}`,
        pathname: objectPath,
        contentType,
        sizeBytes: stat.size,
        storageProvider: 'local_asset'
      });
    } catch (error) {
      console.error('Erro no upload via stream:', error);
      res.status(500).json({ error: 'Falha ao enviar arquivo para o armazenamento.' });
    }
  });

  app.use(express.json({ limit: '25mb' }));

  // Direct-to-Vercel-Blob client multipart token route (handles unlimited video & photo sizes)
  app.post('/api/blob/client-upload', async (req, res) => {
    try {
      const body = req.body as HandleUploadBody;
      if (body?.type !== 'blob.generate-client-token') {
        res.status(400).json({ error: 'Tipo de operação inválido para geração de token.' });
        return;
      }

      const authorized = await isAuthorizedAdminRequest(req);
      if (!authorized) {
        res.status(401).json({ error: 'Sessão administrativa expirada ou não autorizada.' });
        return;
      }

      const token = getBlobToken();
      if (!token) {
        res.status(501).json({
          error: 'BLOB_READ_WRITE_TOKEN não configurado neste ambiente.',
          fallbackRequired: true
        });
        return;
      }

      const jsonResponse = await handleUpload({
        body,
        request: req,
        token,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: [
            'image/*',
            'video/*',
            'application/pdf',
            'application/octet-stream'
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ uploadedAt: Date.now() })
        })
      });

      res.json(jsonResponse);
    } catch (error) {
      console.error('Erro no handleUpload Vercel Blob:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Falha ao autorizar upload direto.'
      });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    const { email, password } = (req.body || {}) as { email?: string; password?: string };
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const providedPassword = typeof password === 'string' ? password : '';
    const passwordMatches =
      providedPassword.length > 0 &&
      (sha256Equal(providedPassword, ADMIN_LOGIN_PASSWORD) ||
        sha256Equal(providedPassword.trim(), ADMIN_LOGIN_PASSWORD));

    if (
      !normalizedEmail ||
      !passwordMatches ||
      !sha256Equal(normalizedEmail, ADMIN_LOGIN_EMAIL)
    ) {
      res.status(401).json({ ok: false, error: 'Login ou senha inválidos.' });
      return;
    }

    const token = signAdminSession(normalizedEmail);
    const isHttps = req.secure || req.get('x-forwarded-proto') === 'https';

    res.cookie(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
      maxAge: SESSION_TTL_SECONDS * 1000,
      path: '/'
    });

    res.json({ ok: true, email: normalizedEmail, sessionToken: token });
  });

  app.get('/api/admin/session', (req, res) => {
    const token = extractSessionToken(req);
    const session = verifyAdminSessionToken(token);
    if (!session) {
      res.json({ authenticated: false });
      return;
    }
    res.json({ authenticated: true, email: session.email });
  });

  app.post('/api/admin/logout', (req, res) => {
    const isHttps = req.secure || req.get('x-forwarded-proto') === 'https';
    res.clearCookie(ADMIN_COOKIE_NAME, {
      httpOnly: true,
      sameSite: isHttps ? 'none' : 'lax',
      secure: isHttps,
      path: '/'
    });
    res.json({ ok: true });
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      blobConfigured: Boolean(getBlobToken()),
      runtime: IS_VERCEL ? 'vercel' : 'node',
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================================================
  // Persistent Store API (Public Readers + Authenticated Admin Writers)
  // ==========================================================================

  app.get('/api/public/data', async (_req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(await getPublicSnapshotAsync());
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao carregar catálogo público.'
      });
    }
  });

  app.post('/api/public/leads', async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
      if (name.length < 2 || phone.length < 6) {
        res.status(400).json({ error: 'Informe nome e telefone válidos.' });
        return;
      }
      if (body.lgpdConsent !== true) {
        res.status(400).json({ error: 'É necessário concordar com a política de privacidade (LGPD).' });
        return;
      }
      const lead = await dbSubmitPublicLead({
        id: typeof body.id === 'string' ? body.id : undefined,
        name,
        phone,
        email: typeof body.email === 'string' ? body.email : undefined,
        message: typeof body.message === 'string' ? body.message : undefined,
        interestType: (typeof body.interestType === 'string'
          ? body.interestType
          : 'contato') as 'agendamento_visita' | 'na_planta' | 'pronto' | 'condominio' | 'contato',
        preferredDate: typeof body.preferredDate === 'string' ? body.preferredDate : undefined,
        propertyId: typeof body.propertyId === 'string' ? body.propertyId : undefined,
        propertyTitle: typeof body.propertyTitle === 'string' ? body.propertyTitle : undefined,
        empreendimentoId:
          typeof body.empreendimentoId === 'string' ? body.empreendimentoId : undefined,
        source: typeof body.source === 'string' ? body.source : 'site',
        utmSource: typeof body.utmSource === 'string' ? body.utmSource : undefined,
        utmMedium: typeof body.utmMedium === 'string' ? body.utmMedium : undefined,
        utmCampaign: typeof body.utmCampaign === 'string' ? body.utmCampaign : undefined,
        utmContent: typeof body.utmContent === 'string' ? body.utmContent : undefined,
        utmTerm: typeof body.utmTerm === 'string' ? body.utmTerm : undefined,
        lgpdConsent: true
      });
      res.json({ ok: true, id: lead.id });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao registrar contato.'
      });
    }
  });

  app.post('/api/public/analytics', async (req, res) => {
    try {
      const body = (req.body || {}) as Record<string, unknown>;
      await dbRecordAnalytics({
        eventType: (typeof body.eventType === 'string'
          ? body.eventType
          : 'page_view') as
          | 'page_view'
          | 'property_view'
          | 'empreendimento_view'
          | 'landing_view'
          | 'whatsapp_click'
          | 'lead_submit'
          | 'share_click',
        path: typeof body.path === 'string' ? body.path : '/',
        targetId: typeof body.targetId === 'string' ? body.targetId : undefined,
        source: typeof body.source === 'string' ? body.source : undefined,
        utmSource: typeof body.utmSource === 'string' ? body.utmSource : undefined,
        utmMedium: typeof body.utmMedium === 'string' ? body.utmMedium : undefined,
        utmCampaign: typeof body.utmCampaign === 'string' ? body.utmCampaign : undefined
      });
      res.json({ ok: true });
    } catch {
      res.json({ ok: false });
    }
  });

  app.get('/api/admin/store', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(await getFullDatabaseAsync());
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao carregar dados administrativos.'
      });
    }
  });

  app.post('/api/admin/store/bootstrap', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const db = await dbBootstrapDefaults();
      res.json(db);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao inicializar catálogo padrão.'
      });
    }
  });

  app.put('/api/admin/store/settings', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const saved = await dbSaveSiteSettings(req.body);
      res.json(saved);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao salvar configurações.'
      });
    }
  });

  app.put('/api/admin/store/profile', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const saved = await dbSaveProfessionalProfile(req.body);
      res.json(saved);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao salvar perfil profissional.'
      });
    }
  });

  app.post('/api/admin/store/properties', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const saved = await dbSaveProperty(req.body);
      res.json({ id: saved.id, item: saved });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao salvar imóvel.'
      });
    }
  });

  app.delete('/api/admin/store/properties/:id', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbDeleteProperty(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao excluir imóvel.'
      });
    }
  });

  app.post('/api/admin/store/empreendimentos', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const saved = await dbSaveEmpreendimento(req.body);
      res.json({ id: saved.id, item: saved });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao salvar empreendimento.'
      });
    }
  });

  app.delete('/api/admin/store/empreendimentos/:id', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbDeleteEmpreendimento(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao excluir empreendimento.'
      });
    }
  });

  app.post('/api/admin/store/landing-pages', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const saved = await dbSaveLandingPage(req.body);
      res.json({ id: saved.id, item: saved });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao salvar landing page.'
      });
    }
  });

  app.delete('/api/admin/store/landing-pages/:id', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbDeleteLandingPage(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao excluir landing page.'
      });
    }
  });

  app.patch('/api/admin/store/leads/:id', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbUpdateLead(req.params.id, req.body || {});
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao atualizar lead.'
      });
    }
  });

  app.delete('/api/admin/store/leads/:id', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbDeleteLead(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao excluir lead.'
      });
    }
  });

  app.post('/api/admin/store/leads/:id/convert', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const { lead, forcedIds } = req.body || {};
      if (!lead) {
        res.status(400).json({ error: 'Dados do lead são obrigatórios.' });
        return;
      }
      const result = await dbConvertLeadToCrm(lead, forcedIds);
      res.json(result);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao converter lead.'
      });
    }
  });

  app.post('/api/admin/store/clients', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const saved = await dbSaveClient(req.body);
      res.json({ id: saved.id, item: saved });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao salvar cliente.'
      });
    }
  });

  app.delete('/api/admin/store/clients/:id', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbDeleteClient(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao excluir cliente.'
      });
    }
  });

  app.post('/api/admin/store/pipeline', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const saved = await dbSavePipelineItem(req.body);
      res.json({ id: saved.id, item: saved });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao salvar oportunidade.'
      });
    }
  });

  app.patch('/api/admin/store/pipeline/:id/stage', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbMovePipelineStage(req.params.id, req.body?.stage);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao mover oportunidade.'
      });
    }
  });

  app.delete('/api/admin/store/pipeline/:id', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbDeletePipelineItem(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao excluir oportunidade.'
      });
    }
  });

  app.post('/api/admin/store/visits', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const saved = await dbSaveVisit(req.body);
      res.json({ id: saved.id, item: saved });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao salvar visita.'
      });
    }
  });

  app.delete('/api/admin/store/visits/:id', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbDeleteVisit(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao excluir visita.'
      });
    }
  });

  app.post('/api/admin/store/proposals', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const saved = await dbSaveProposal(req.body);
      res.json({ id: saved.id, item: saved });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao salvar proposta.'
      });
    }
  });

  app.delete('/api/admin/store/proposals/:id', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbDeleteProposal(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao excluir proposta.'
      });
    }
  });

  app.post('/api/admin/store/tasks', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const saved = await dbSaveTask(req.body);
      res.json({ id: saved.id, item: saved });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao salvar tarefa.'
      });
    }
  });

  app.delete('/api/admin/store/tasks/:id', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbDeleteTask(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao excluir tarefa.'
      });
    }
  });

  app.post('/api/admin/store/media', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const saved = await dbSaveMediaAsset(req.body);
      res.json({ id: saved.id, item: saved });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao salvar registro de mídia.'
      });
    }
  });

  app.delete('/api/admin/store/media/:id', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbDeleteMediaAsset(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao remover mídia.'
      });
    }
  });

  app.post('/api/admin/store/admin-users/:uid', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const saved = await dbSaveAdminUser(req.params.uid, req.body);
      res.json({ id: saved.id, item: saved });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao salvar administrador.'
      });
    }
  });

  app.delete('/api/admin/store/admin-users/:uid', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      await dbDeleteAdminUser(req.params.uid);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Erro ao remover administrador.'
      });
    }
  });

  // Vercel Blob upload endpoint (supports base64 JSON payload for PDFs / legacy callers)
  app.post('/api/blob/upload', async (req, res) => {
    try {
      if (!(await requireAdmin(req, res))) return;
      const token = getBlobToken();
      const { fileName, contentType, base64Data, folder } = req.body as {
        fileName?: string;
        contentType?: string;
        base64Data?: string;
        folder?: string;
      };

      if (!fileName || !base64Data) {
        res.status(400).json({ error: 'Nome do arquivo e conteúdo são obrigatórios.' });
        return;
      }

      const cleanName = sanitizeUploadName(fileName);
      const safeFolder = sanitizeFolderName(folder);
      const uniqueName = `${Date.now()}-${cleanName}`;
      const base64Body = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buffer = Buffer.from(base64Body, 'base64');

      if (!token) {
        if (IS_VERCEL) {
          res.status(500).json({
            error:
              'Storage Vercel Blob não configurado na Vercel. Adicione BLOB_READ_WRITE_TOKEN nas variáveis de ambiente do projeto.'
          });
          return;
        }
        const targetDir = path.join(uploadsRoot, safeFolder);
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(path.join(targetDir, uniqueName), buffer);
        res.json({
          url: `/uploads/${safeFolder}/${uniqueName}`,
          pathname: `${safeFolder}/${uniqueName}`,
          contentType: contentType || 'application/octet-stream',
          sizeBytes: buffer.length,
          storageProvider: 'local_asset'
        });
        return;
      }

      const blob = await put(`${safeFolder}/${uniqueName}`, buffer, {
        access: 'public',
        contentType: contentType || 'application/octet-stream',
        multipart: true,
        token
      });

      res.json({
        url: blob.url,
        pathname: blob.pathname,
        contentType: contentType || 'application/octet-stream',
        sizeBytes: buffer.length,
        storageProvider: 'vercel_blob'
      });
    } catch (error) {
      console.error('Erro ao enviar arquivo para Vercel Blob:', error);
      res.status(500).json({ error: 'Falha ao enviar arquivo para o armazenamento.' });
    }
  });

  // SEO: robots.txt
  app.get('/robots.txt', (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        `Sitemap: ${baseUrl.replace(/\/$/, '')}/sitemap.xml`
      ].join('\n')
    );
  });

  // SEO: sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(
      /\/$/,
      ''
    );
    const staticRoutes = [
      '/',
      '/comprar',
      '/na-planta',
      '/prontos',
      '/condominios',
      '/empreendimentos',
      '/sobre',
      '/contato',
      '/privacidade'
    ];
    const today = new Date().toISOString().split('T')[0];
    const urls = staticRoutes
      .map(
        (route) =>
          `  <url>\n    <loc>${baseUrl}${route}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${route === '/' ? '1.0' : '0.8'}</priority>\n  </url>`
      )
      .join('\n');

    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`
    );
  });

  return app;
}
