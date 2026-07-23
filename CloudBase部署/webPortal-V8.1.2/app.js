'use strict';

const crypto = require('crypto');
const https = require('https');
const { buildRequirementDocx, titleFor } = require('./document-generator');

let cloudbase;
let bcrypt;
let jwt;
let cloudApp;
let database;
let sdkInitError = null;

const VERSION = '8.1.5';
const DEFAULT_ENV_ID = 'cloud1-d3gji859l94c3e5ec';

const COLLECTIONS = Object.freeze({
  customers: 'customers',
  accounts: 'customer_accounts',
  memberships: 'account_memberships',
  transactions: 'customer_transactions',
  requirements: 'requirements',
  orders: 'orders',
  recovery: 'account_recovery_requests',
  notifications: 'notifications',
  audit: 'audit_logs'
});

const SAFE_PROFILE_FIELDS = [
  'name', 'phone', 'email', 'organization', 'department', 'wechatId', 'wechat',
  'contactName', 'invoiceTitle', 'taxNo', 'address', 'shippingAddress', 'remark', 'avatarUrl'
];

function now() { return new Date(); }
function nowIso() { return new Date().toISOString(); }
function plainObject(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function sanitizeText(value, maxLength = 5000) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, maxLength);
}
function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length > 11 && digits.startsWith('86')) digits = digits.slice(2);
  return digits.slice(0, 20);
}
function normalizeEmail(value) { return sanitizeText(value, 160).toLowerCase(); }
function sha256(value) { return crypto.createHash('sha256').update(String(value || '')).digest('hex'); }
function randomId(prefix = '') { return `${prefix}${Date.now().toString(36)}${crypto.randomBytes(6).toString('hex')}`; }
function maskPhone(value) {
  const phone = normalizePhone(value);
  return phone.length >= 7 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone;
}
function maskEmail(value) {
  const email = normalizeEmail(value);
  const at = email.indexOf('@');
  if (at <= 1) return email;
  return `${email.slice(0, 1)}***${email.slice(at - 1)}`;
}
function toIso(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (value.$date) return new Date(value.$date).toISOString();
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  try { return new Date(value).toISOString(); } catch (_) { return ''; }
}
function moneyCentsToYuan(value) { return Number((Number(value || 0) / 100).toFixed(2)); }
function clampNumber(value, min, max, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}
function pick(obj, fields) {
  const source = plainObject(obj);
  const out = {};
  for (const field of fields) if (source[field] !== undefined) out[field] = source[field];
  return out;
}
function cleanUpdate(obj) {
  const source = plainObject(obj);
  const out = {};
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && !['_id', 'accountId', 'linkedAccountId', 'openid', '_openid', 'passwordHash'].includes(key)) out[key] = value;
  }
  return out;
}
function getEnvId() {
  return process.env.CLOUDBASE_ENV_ID || process.env.TCB_ENV || process.env.SCF_NAMESPACE || DEFAULT_ENV_ID;
}
function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  return sha256(`HQTD-webPortal-${getEnvId()}-replace-in-console`);
}
function loadDependencies() {
  if (cloudbase && bcrypt && jwt) return;
  try {
    cloudbase = require('@cloudbase/node-sdk');
    bcrypt = require('bcryptjs');
    jwt = require('jsonwebtoken');
  } catch (error) {
    sdkInitError = error;
    throw error;
  }
}
function getDb() {
  if (database) return database;
  loadDependencies();
  try {
    cloudApp = cloudbase.init({ env: getEnvId() || cloudbase.SYMBOL_CURRENT_ENV });
    database = cloudApp.database();
    return database;
  } catch (error) {
    sdkInitError = error;
    throw error;
  }
}
function firstDoc(result) {
  if (!result) return null;
  if (Array.isArray(result.data)) return result.data[0] || null;
  return result.data || null;
}
function rows(result) { return result && Array.isArray(result.data) ? result.data : []; }
function isNotFound(error) {
  return /not exist|does not exist|DOCUMENT_NOT_EXIST|DATABASE_COLLECTION_NOT_EXIST|document.*not.*found/i.test(String(error && (error.errMsg || error.message || error)));
}
async function getDoc(collection, id) {
  try { return firstDoc(await getDb().collection(collection).doc(id).get()); }
  catch (error) { if (isNotFound(error)) return null; throw error; }
}
async function addDoc(collection, data) {
  const result = await getDb().collection(collection).add(data);
  return result.id || result._id || '';
}
async function setDoc(collection, id, data) { return getDb().collection(collection).doc(id).set(data); }
async function updateDoc(collection, id, data) { return getDb().collection(collection).doc(id).update(data); }

function response(statusCode, data, extraHeaders = {}) {
  return { statusCode, headers: { 'content-type': 'application/json; charset=utf-8', ...extraHeaders }, body: JSON.stringify(data) };
}
function ok(data = {}, statusCode = 200) { return response(statusCode, { ok: true, version: VERSION, ...data }); }
function fail(message, statusCode = 400, code = 'BAD_REQUEST', details) {
  return response(statusCode, { ok: false, version: VERSION, code, message, ...(details ? { details } : {}) });
}
function parseAuthorization(headers = {}) {
  const value = headers.authorization || headers.Authorization || '';
  const match = String(value).match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : '';
}
function signToken(profile, accountId) {
  loadDependencies();
  return jwt.sign(
    { sub: profile._id, accountId, role: profile.role || 'customer', phone: profile.phone || '', email: profile.email || '' },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d', issuer: 'hqtd-web-portal' }
  );
}
function verifyToken(token) {
  if (!token) throw Object.assign(new Error('请先登录'), { statusCode: 401, code: 'UNAUTHORIZED' });
  loadDependencies();
  try { return jwt.verify(token, getJwtSecret(), { issuer: 'hqtd-web-portal' }); }
  catch (_) { throw Object.assign(new Error('登录状态已失效，请重新登录'), { statusCode: 401, code: 'TOKEN_INVALID' }); }
}
async function resolveAccountId(profile) {
  if (!profile) return '';
  if (profile.activeWebAccountId) return sanitizeText(profile.activeWebAccountId, 100);
  if (profile.linkedAccountId) return sanitizeText(profile.linkedAccountId, 100);
  if (profile.accountId) return sanitizeText(profile.accountId, 100);
  if (profile.openid) {
    const membership = await getDoc(COLLECTIONS.memberships, sha256(profile.openid));
    if (membership && membership.accountId && !['disabled', 'removed'].includes(membership.status)) return membership.accountId;
    return sha256(profile.openid);
  }
  return sanitizeText(profile._id, 100);
}
async function requireUser(headers, body) {
  const token = parseAuthorization(headers) || sanitizeText(body.token, 4096);
  const payload = verifyToken(token);
  const profile = await getDoc(COLLECTIONS.customers, payload.sub);
  if (!profile || !profile.webLoginEnabled || !profile.passwordHash) {
    throw Object.assign(new Error('网站账户不存在或尚未激活'), { statusCode: 401, code: 'USER_NOT_FOUND' });
  }
  const accountId = await resolveAccountId(profile);
  return { profile, accountId };
}
function publicUser(profile, accountId) {
  if (!profile) return null;
  return {
    id: profile._id,
    accountId,
    customerNo: profile.customerNo || '',
    name: profile.name || profile.contactName || '',
    phone: profile.phone || '',
    phoneMasked: maskPhone(profile.phone),
    phoneVerified: profile.phoneVerified === true,
    email: profile.email || '',
    organization: profile.organization || '',
    department: profile.department || '',
    wechatId: profile.wechatId || profile.wechat || '',
    invoiceTitle: profile.invoiceTitle || '',
    taxNo: profile.taxNo || '',
    address: profile.address || profile.shippingAddress || '',
    role: profile.role || 'customer',
    registrationStatus: profile.registrationStatus || 'completed',
    createdAt: toIso(profile.createdAt),
    updatedAt: toIso(profile.updatedAt),
    lastLoginAt: toIso(profile.lastLoginAt)
  };
}
async function querySafe(collection, where, limit = 20) {
  try { return rows(await getDb().collection(collection).where(where).limit(limit).get()); }
  catch (_) { return []; }
}
async function scanCustomers(predicate, max = 1000) {
  const found = [];
  for (let skip = 0; skip < max; skip += 100) {
    let batch = [];
    try { batch = rows(await getDb().collection(COLLECTIONS.customers).skip(skip).limit(Math.min(100, max - skip)).get()); }
    catch (_) { break; }
    found.push(...batch.filter(predicate));
    if (batch.length < 100) break;
  }
  return found;
}
async function findProfilesByIdentity(phone, email) {
  const result = [];
  if (phone) {
    result.push(...await querySafe(COLLECTIONS.customers, { phoneNormalized: phone }));
    result.push(...await querySafe(COLLECTIONS.customers, { phone }));
  }
  if (email) {
    result.push(...await querySafe(COLLECTIONS.customers, { emailNormalized: email }));
    result.push(...await querySafe(COLLECTIONS.customers, { email }));
  }
  if (!result.length && (phone || email)) {
    result.push(...await scanCustomers(row =>
      (phone && normalizePhone(row.phone || row.contact) === phone) ||
      (email && normalizeEmail(row.email) === email)
    ));
  }
  const unique = new Map();
  for (const row of result) if (row && row._id) unique.set(row._id, row);
  return Array.from(unique.values());
}
async function findWebProfile(identity) {
  const phone = normalizePhone(identity);
  const email = normalizeEmail(identity);
  const candidates = await findProfilesByIdentity(phone, email);
  return candidates.find(row => row.webLoginEnabled === true && row.passwordHash) || null;
}
function createCustomerNo(seed) {
  return `HQT-C${new Date().getFullYear()}${sha256(seed).slice(0, 8).toUpperCase()}`;
}
async function ensureAccount(accountId, profile) {
  const current = await getDoc(COLLECTIONS.accounts, accountId);
  if (current) return current;
  const record = {
    accountId,
    ownerOpenid: profile.openid || '',
    name: sanitizeText(profile.name || profile.contactName, 80),
    organization: sanitizeText(profile.organization, 150),
    contact: sanitizeText(profile.phone || profile.wechatId || profile.email, 150),
    balanceCents: 0,
    totalRechargeCents: 0,
    totalSpentCents: 0,
    totalRefundCents: 0,
    totalAdjustmentCents: 0,
    transactionCount: 0,
    memberCount: profile.openid ? 1 : 0,
    status: 'active',
    source: 'website',
    createdAt: now(),
    updatedAt: now()
  };
  await setDoc(COLLECTIONS.accounts, accountId, record);
  return record;
}
async function syncAccountProfile(accountId, profile) {
  const current = await getDoc(COLLECTIONS.accounts, accountId);
  if (!current) return ensureAccount(accountId, profile);
  const patch = { updatedAt: now() };
  if (profile.name || profile.contactName) patch.name = sanitizeText(profile.name || profile.contactName, 80);
  if (profile.organization) patch.organization = sanitizeText(profile.organization, 150);
  if (profile.phone || profile.wechatId || profile.email) patch.contact = sanitizeText(profile.phone || profile.wechatId || profile.email, 150);
  await updateDoc(COLLECTIONS.accounts, accountId, patch);
  return { ...current, ...patch };
}
async function audit(action, profileId, accountId, details = {}) {
  try {
    await addDoc(COLLECTIONS.audit, { module: 'web_portal', action, profileId, accountId, details, createdAt: now() });
  } catch (_) {}
}

async function claimGuestRequirements(profile, accountId) {
  const phone = normalizePhone(profile && profile.phone);
  const email = normalizeEmail(profile && profile.email);
  const matched = new Map();
  if (phone) {
    for (const row of await querySafe(COLLECTIONS.requirements, { phone }, 100)) if (row && row._id && !row.accountId) matched.set(row._id, row);
  }
  if (email) {
    for (const row of await querySafe(COLLECTIONS.requirements, { email }, 100)) if (row && row._id && !row.accountId) matched.set(row._id, row);
  }
  for (const row of matched.values()) {
    await updateDoc(COLLECTIONS.requirements, row._id, {
      accountId,
      websiteProfileId: profile._id || '',
      linkedAt: now(),
      linkedBy: 'contact_registration',
      updatedAt: now()
    }).catch(() => {});
  }
  return matched.size;
}

async function register(body) {
  loadDependencies();
  const phone = normalizePhone(body.phone);
  const email = normalizeEmail(body.email);
  const password = sanitizeText(body.password, 200);
  const name = sanitizeText(body.name || body.contactName, 120);
  if (!phone && !email) return fail('手机号和邮箱至少填写一项');
  if (password.length < 6) return fail('密码至少需要 6 位');

  const candidates = await findProfilesByIdentity(phone, email);
  const existingWeb = candidates.find(row => row.webLoginEnabled === true && row.passwordHash);
  if (existingWeb) return fail('该手机号或邮箱已经开通官网登录，请直接登录', 409, 'ACCOUNT_EXISTS');

  const customerNo = sanitizeText(body.customerNo, 50);
  if (candidates.length) {
    const exact = customerNo ? candidates.find(row => String(row.customerNo || '').toUpperCase() === customerNo.toUpperCase()) : null;
    if (!exact) {
      return fail('该手机号或邮箱已存在于小程序客户库。请使用“激活已有账户”，填写客户编号后设置官网登录密码。', 409, 'ACCOUNT_LINK_REQUIRED', {
        action: 'activateExisting',
        phone: phone ? maskPhone(phone) : '',
        email: email ? maskEmail(email) : ''
      });
    }
    return activateExisting({ ...body, phone, email, customerNo });
  }

  const profileId = randomId('web_');
  const accountId = sha256(`website-account:${profileId}`);
  const createdAt = now();
  const profile = {
    accountId,
    linkedAccountId: accountId,
    openid: '',
    appid: '',
    customerNo: createCustomerNo(profileId),
    name,
    contactName: name,
    phone,
    phoneNormalized: phone,
    phoneVerified: false,
    phoneSource: 'website_unverified',
    email,
    emailNormalized: email,
    organization: sanitizeText(body.organization, 200),
    department: sanitizeText(body.department, 200),
    wechatId: sanitizeText(body.wechatId || body.wechat, 100),
    address: sanitizeText(body.address || body.shippingAddress, 300),
    invoiceTitle: sanitizeText(body.invoiceTitle, 200),
    taxNo: sanitizeText(body.taxNo, 80),
    passwordHash: await bcrypt.hash(password, 10),
    webLoginEnabled: true,
    webLoginActivatedAt: createdAt,
    registrationStatus: 'completed',
    lastLoginMode: 'website',
    source: 'website',
    role: 'customer',
    createdAt,
    updatedAt: createdAt,
    lastLoginAt: createdAt
  };
  await setDoc(COLLECTIONS.customers, profileId, profile);
  await ensureAccount(accountId, profile);
  await claimGuestRequirements({ _id: profileId, ...profile }, accountId);
  await audit('register', profileId, accountId, { source: 'website' });
  notifyWebhook(`【官网新客户注册】\n客户编号：${profile.customerNo}\n客户：${profile.name || '未填写'}\n单位：${profile.organization || '未填写'}\n联系方式：${profile.phone || profile.email || '未填写'}\n账户已写入小程序共用客户库。`).catch(() => {});
  return ok({ token: signToken({ _id: profileId, ...profile }, accountId), user: publicUser({ _id: profileId, ...profile }, accountId) }, 201);
}

async function activateExisting(body) {
  loadDependencies();
  const phone = normalizePhone(body.phone || body.identity);
  const email = normalizeEmail(body.email || body.identity);
  const customerNo = sanitizeText(body.customerNo, 50).toUpperCase();
  const password = sanitizeText(body.password || body.newPassword, 200);
  if (!customerNo || (!phone && !email)) return fail('请填写客户编号，并填写原账户手机号或邮箱');
  if (password.length < 6) return fail('密码至少需要 6 位');
  const candidates = await findProfilesByIdentity(phone, email);
  const profile = candidates.find(row => String(row.customerNo || '').toUpperCase() === customerNo);
  if (!profile) return fail('客户编号与手机号或邮箱不匹配', 404, 'CUSTOMER_NOT_MATCHED');
  if (profile.webLoginEnabled && profile.passwordHash) return fail('该客户已经开通官网登录，请直接登录', 409, 'ACCOUNT_EXISTS');
  const accountId = await resolveAccountId(profile);
  const patch = {
    accountId: profile.accountId || accountId,
    linkedAccountId: profile.linkedAccountId || accountId,
    phoneNormalized: normalizePhone(profile.phone || phone),
    emailNormalized: normalizeEmail(profile.email || email),
    passwordHash: await bcrypt.hash(password, 10),
    webLoginEnabled: true,
    webLoginActivatedAt: now(),
    lastLoginMode: 'website',
    lastLoginAt: now(),
    updatedAt: now()
  };
  await updateDoc(COLLECTIONS.customers, profile._id, patch);
  const merged = { ...profile, ...patch };
  await ensureAccount(accountId, merged);
  await claimGuestRequirements(merged, accountId);
  await syncAccountProfile(accountId, merged);
  await audit('activate_existing', profile._id, accountId, { customerNo });
  notifyWebhook(`【小程序客户开通官网登录】\n客户编号：${profile.customerNo || ''}\n客户：${profile.name || '未填写'}\n单位：${profile.organization || '未填写'}\n官网登录已与原小程序账户绑定。`).catch(() => {});
  return ok({ token: signToken(merged, accountId), user: publicUser(merged, accountId), linkedExistingAccount: true });
}

async function login(body) {
  loadDependencies();
  const identity = sanitizeText(body.identity || body.phone || body.email, 160);
  const password = sanitizeText(body.password, 200);
  if (!identity || !password) return fail('请输入账号和密码');
  const profile = await findWebProfile(identity);
  if (!profile || !(await bcrypt.compare(password, profile.passwordHash))) return fail('账号或密码错误', 401, 'LOGIN_FAILED');
  const accountId = await resolveAccountId(profile);
  const patch = { lastLoginAt: now(), lastLoginMode: 'website', updatedAt: now() };
  await updateDoc(COLLECTIONS.customers, profile._id, patch);
  const merged = { ...profile, ...patch };
  return ok({ token: signToken(merged, accountId), user: publicUser(merged, accountId) });
}

async function updateProfile(headers, body) {
  const { profile, accountId } = await requireUser(headers, body);
  const input = pick(body.profile || body, SAFE_PROFILE_FIELDS);
  const patch = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === 'phone') {
      patch.phone = normalizePhone(value);
      patch.phoneNormalized = patch.phone;
      if (patch.phone !== normalizePhone(profile.phone)) {
        patch.phoneVerified = false;
        patch.phoneSource = 'website_unverified';
      }
    } else if (key === 'email') {
      patch.email = normalizeEmail(value);
      patch.emailNormalized = patch.email;
    } else if (key === 'wechat') {
      patch.wechatId = sanitizeText(value, 100);
    } else {
      patch[key] = sanitizeText(value, 500);
    }
  }
  patch.updatedAt = now();
  await updateDoc(COLLECTIONS.customers, profile._id, patch);
  const merged = { ...profile, ...patch };
  await syncAccountProfile(accountId, merged);
  await audit('update_profile', profile._id, accountId, { fields: Object.keys(patch).filter(k => k !== 'updatedAt') });
  return ok({ user: publicUser(merged, accountId) });
}

async function changePassword(headers, body) {
  loadDependencies();
  const { profile, accountId } = await requireUser(headers, body);
  const oldPassword = sanitizeText(body.oldPassword, 200);
  const newPassword = sanitizeText(body.newPassword, 200);
  if (newPassword.length < 6) return fail('新密码至少需要 6 位');
  if (!oldPassword || !(await bcrypt.compare(oldPassword, profile.passwordHash))) return fail('原密码错误', 401, 'OLD_PASSWORD_INVALID');
  await updateDoc(COLLECTIONS.customers, profile._id, { passwordHash: await bcrypt.hash(newPassword, 10), passwordUpdatedAt: now(), updatedAt: now() });
  await audit('change_password', profile._id, accountId);
  return ok({ message: '密码已更新' });
}

async function requestPasswordReset(body) {
  const identity = sanitizeText(body.identity || body.phone || body.email, 160);
  if (!identity) return fail('请填写手机号或邮箱');
  const profile = await findWebProfile(identity);
  if (!profile) return ok({ message: '如该账号存在，管理员将收到找回申请。' });
  const accountId = await resolveAccountId(profile);
  const recoveryNo = `WEB-RESET-${Date.now()}`;
  await addDoc(COLLECTIONS.recovery, {
    recoveryNo,
    type: 'website_password_reset',
    profileId: profile._id,
    targetAccountId: accountId,
    customerNo: profile.customerNo || '',
    phoneLast4: normalizePhone(profile.phone).slice(-4),
    emailMasked: maskEmail(profile.email),
    status: 'pending',
    statusText: '等待管理员核验',
    source: 'website',
    createdAt: now(),
    updatedAt: now()
  });
  notifyWebhook(`【官网账户找回申请】\n申请编号：${recoveryNo}\n客户编号：${profile.customerNo || ''}\n客户：${profile.name || '未填写'}\n请在管理端核验后处理。`).catch(() => {});
  return ok({ message: '找回申请已提交，请等待管理员核验', recoveryNo });
}

function sanitizeAttachments(value) {
  return (Array.isArray(value) ? value : []).slice(0, 20).map(item => ({
    name: sanitizeText(item && item.name, 100),
    size: Math.max(0, Number(item && item.size || 0)),
    fileID: sanitizeText(item && (item.fileID || item.url), 800),
    url: sanitizeText(item && item.url, 800)
  })).filter(item => item.fileID || item.url);
}

function decodeUploadFilename(value) {
  const raw = String(value || 'attachment.bin');
  try { return decodeURIComponent(raw); } catch (_) { return raw; }
}
function safeCloudFilename(value) {
  const name = decodeUploadFilename(value).replace(/[\\/:?<>|\"\r\n\t]/g, '_').replace(/\s+/g, '_').slice(-120) || 'attachment.bin';
  return name.replace(/[^0-9a-zA-Z\u4e00-\u9fa5!\-_.，,*]/g, '_');
}
function uploadMimeAllowed(value) {
  const mime = sanitizeText(value, 120).toLowerCase();
  return !/(x-msdownload|x-sh|javascript|text\/html)/i.test(mime);
}
function uploadExtensionAllowed(name) {
  const ext = String(name || '').toLowerCase().match(/\.[a-z0-9]{1,12}$/)?.[0] || '';
  const allowed = new Set(['.doc','.docx','.pdf','.xls','.xlsx','.csv','.zip','.rar','.7z','.png','.jpg','.jpeg','.cif','.pdb','.mol','.mol2','.xyz','.txt','.dat','.log','.gjf','.com','.inp','.vasp','.poscar','.contcar']);
  return allowed.has(ext);
}
async function getTemporaryUrl(fileID) {
  if (!fileID) return '';
  try {
    const result = await cloudApp.getTempFileURL({ fileList: [fileID] });
    const first = result && Array.isArray(result.fileList) ? result.fileList[0] : null;
    return first && (first.tempFileURL || first.download_url || first.url) || '';
  } catch (_) { return ''; }
}

function sanitizeItems(value) {
  return (Array.isArray(value) ? value : []).slice(0, 100).map((item, index) => {
    const qty = Math.max(1, Math.min(9999, Number(item && (item.qty || item.quantity) || 1)));
    const price = Math.max(0, Number(item && item.price || 0));
    return {
      id: sanitizeText(item && (item.id || item.sku || `WEB-${index + 1}`), 100),
      title: sanitizeText(item && (item.title || item.name || item.projectName), 300),
      name: sanitizeText(item && (item.name || item.title || item.projectName), 300),
      board: sanitizeText(item && item.board, 100),
      category: sanitizeText(item && item.category, 120),
      serviceType: sanitizeText(item && item.serviceType, 120),
      qty,
      price,
      unit: sanitizeText(item && item.unit, 40),
      note: sanitizeText(item && (item.note || item.remark || item.details), 1000)
    };
  }).filter(item => item.title || item.name);
}

function projectCodeFromBody(body, items) {
  const ids = (items || []).map(x => sanitizeText(x.id, 30).toUpperCase()).filter(Boolean);
  if (ids.length !== 1) return ids.length > 1 ? 'ZH' : 'ZH';
  let id = ids[0];
  let legacy = id.match(/^A0*(\d+)$/); if (legacy) id = `FX-${Number(legacy[1])}`;
  legacy = id.match(/^AI-0*(\d+)$/); if (legacy) id = `AI-${Number(legacy[1])}`;
  legacy = id.match(/^JS-0*(\d+)$/); if (legacy) id = `JS-${Number(legacy[1])}`;
  legacy = id.match(/^FX-0*(\d+)$/); if (legacy) id = `FX-${Number(legacy[1])}`;
  legacy = id.match(/^HC-0*(\d+)$/); if (legacy) id = `HC-${Number(legacy[1])}`;
  if (/^AI-\d+$/.test(id)) return id;
  if (/^JS-\d+$/.test(id)) return id;
  if (/^FX-\d+$/.test(id)) return id;
  if (/^HC-\d+$/.test(id)) return id;
  const st = sanitizeText(body.serviceType || '', 80);
  return st === 'AI项目' ? 'AI-1' : st === '计算模拟' ? 'JS-1' : st === '分析表征' ? 'FX-1' : st === '耗材仪器' ? 'HC-1' : 'ZH-1';
}
async function nextBusinessNo(body, items) {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
  const rawCode = projectCodeFromBody(body, items);
  const combined = (items || []).length > 1;
  const code = combined ? 'ZH' : rawCode;
  const prefix = `HQTD-${ymd}-${code}-`;
  let rows = [];
  try { rows = await querySafe(COLLECTIONS.requirements, {}, 1000); } catch (_) {}
  const used = rows.map(r => String(r.demandNo || r.no || '')).filter(n => n.startsWith(prefix)).map(n => Number(n.slice(prefix.length))).filter(Number.isFinite);
  return `${prefix}${(used.length ? Math.max(...used) : 0) + 1}`;
}
async function buildRequirementRecord(userContext, body, mode) {
  const profile = userContext && userContext.profile || {};
  const accountId = userContext && userContext.accountId || '';
  const items = sanitizeItems(body.items || body.cartItems);
  const attachments = sanitizeAttachments(body.attachments || body.files);
  const totalQuantity = items.reduce((sum, item) => sum + item.qty, 0);
  const estimatedAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const demandNo = await nextBusinessNo(body, items);
  const contact = normalizePhone(body.phone || body.contact || profile.phone) || sanitizeText(body.contact || profile.wechatId || profile.email, 120);
  const projectName = sanitizeText(body.projectName || body.project || body.title, 300) || (items.length ? `服务与采购清单（${items.length}种 / ${totalQuantity}项）` : '官网客户需求');
  const description = sanitizeText(body.details || body.requirements || body.description || body.note, 10000) || items.map(item => `${item.name} × ${item.qty}`).join('\n');
  const source = mode === 'order' ? 'website-cart' : 'website-requirement';
  const statusNote = mode === 'order' ? '客户通过官网提交服务或采购清单' : '客户通过官网提交需求';
  return {
    requestId: randomId('webreq_'),
    schemaVersion: 4,
    clientVersion: `web-${VERSION}`,
    websiteProfileId: profile._id || '',
    openid: '',
    accountId,
    appid: '',
    demandNo,
    no: demandNo,
    name: sanitizeText(body.name || body.contactName || profile.name || profile.contactName, 80),
    organization: sanitizeText(body.organization || profile.organization, 150),
    contact,
    phone: normalizePhone(body.phone || profile.phone),
    email: normalizeEmail(body.email || profile.email),
    serviceType: sanitizeText(body.serviceType || body.category || body.type, 120) || (mode === 'order' ? '官网服务与采购清单' : '官网需求'),
    projectName,
    title: projectName,
    description,
    detail: description,
    note: sanitizeText(body.note || body.remark, 800),
    deadline: sanitizeText(body.deadline || body.expectedDate, 80),
    needInvoice: body.needInvoice === true,
    invoiceTitle: sanitizeText(body.invoiceTitle || profile.invoiceTitle, 200),
    taxNo: sanitizeText(body.taxNo || profile.taxNo, 80),
    shippingAddress: sanitizeText(body.shippingAddress || body.address || profile.address, 300),
    cartItems: items,
    cartGroups: Array.isArray(body.cartGroups) ? body.cartGroups.slice(0, 30) : [],
    itemTypeCount: items.length,
    totalQuantity,
    pricedItemTypeCount: items.filter(item => item.price > 0).length,
    inquiryTypeCount: items.filter(item => item.price <= 0).length,
    estimatedAmount: Number(estimatedAmount.toFixed(2)),
    estimatedAmountText: `¥${estimatedAmount.toFixed(2)}`,
    priceValidatedByServer: false,
    attachments,
    expectedAttachmentCount: attachments.length,
    attachmentStatus: attachments.length ? 'complete' : 'none',
    attachmentError: '',
    status: '待评估',
    statusText: '待评估',
    source,
    channel: '官网',
    consentVersion: sanitizeText(body.consentVersion, 30) || '2026-07',
    consentAt: now(),
    notificationStatus: 'pending',
    notificationError: '',
    customerSubscriptionStatus: 'not_applicable',
    statusHistory: [{ status: '待评估', note: statusNote, time: now() }],
    createdAt: now(),
    updatedAt: now()
  };
}
async function optionalUser(headers, body) {
  try { return await requireUser(headers, body); }
  catch (error) { if (error.statusCode === 401) return null; throw error; }
}
async function resolveSubmissionUser(headers, body) {
  const authenticated = await optionalUser(headers, body);
  if (authenticated) return authenticated;
  const phone = normalizePhone(body.phone || body.contact);
  const email = normalizeEmail(body.email);
  if (!phone && !email) return null;
  const profiles = [];
  if (phone) {
    profiles.push(...await querySafe(COLLECTIONS.customers, { phoneNormalized: phone }, 5));
    if (!profiles.length) profiles.push(...await querySafe(COLLECTIONS.customers, { phone }, 5));
  }
  if (!profiles.length && email) {
    profiles.push(...await querySafe(COLLECTIONS.customers, { emailNormalized: email }, 5));
    if (!profiles.length) profiles.push(...await querySafe(COLLECTIONS.customers, { email }, 5));
  }
  const profile = profiles[0] || null;
  if (!profile) return null;
  const accountId = await resolveAccountId(profile);
  return { profile, accountId, matchedByContact: true };
}

function dispatchRequirementNotice(id, record, mode) {
  const content = `${mode === 'order' ? '【官网新订单】' : '【官网新需求】'}
编号：${record.demandNo}
客户：${record.name}
单位：${record.organization || '未填写'}
类型：${record.serviceType}
项目：${record.projectName}
联系方式：${record.contact}`;
  Promise.resolve().then(() => notifyWebhook(content)).then(notice => updateDoc(COLLECTIONS.requirements, id, {
    notificationStatus: notice.status,
    notificationError: notice.error || '',
    notificationUpdatedAt: now(),
    updatedAt: now()
  })).catch(() => {});
}
async function saveRequirement(headers, body, mode) {
  const user = await resolveSubmissionUser(headers, body);
  const record = await buildRequirementRecord(user, body, mode);
  if (!record.name || !record.contact || !record.description) return fail('请完整填写联系人、联系方式和需求内容');
  if (mode === 'order' && !record.cartItems.length && !record.projectName) return fail('请至少选择一个项目或填写项目名称');
  record.notificationStatus = 'queued';
  record.fastAcknowledgement = true;
  record.submissionAckAt = now();
  const id = await addDoc(COLLECTIONS.requirements, record);
  dispatchRequirementNotice(id, record, mode);
  if (user) audit(mode === 'order' ? 'create_order_requirement' : 'submit_requirement', user.profile._id, user.accountId, { id, demandNo: record.demandNo }).catch(() => {});
  return { id, record: { _id: id, ...record } };
}
function publicRequirement(row) {
  return {
    id: row._id,
    orderNo: row.demandNo || row.no || '',
    demandNo: row.demandNo || row.no || '',
    recordType: 'requirement',
    type: row.serviceType || row.type || '',
    category: row.category || '',
    projectName: row.projectName || row.project || row.title || '',
    items: row.cartItems || [],
    amount: Number(row.estimatedAmount || 0),
    finalAmount: Number(row.finalAmount || 0),
    status: row.status || '待评估',
    progress: Number(row.progress || 0),
    contactName: row.name || '',
    phone: row.phone || row.contact || '',
    email: row.email || '',
    organization: row.organization || '',
    requirements: row.description || row.detail || '',
    attachments: row.attachments || [],
    quoteUrl: row.quoteUrl || '',
    documentUrl: row.documentUrl || '',
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    estimatedCompletionDate: row.expectedDate || row.estimatedCompletionDate || '',
    logisticsCompany: row.trackingCompany || (row.logistics && row.logistics.company) || '',
    trackingNo: row.trackingNo || (row.logistics && row.logistics.number) || ''
  };
}
function publicOrder(row) {
  return {
    id: row._id,
    orderNo: row.orderNo || '',
    demandNo: row.orderNo || '',
    recordType: 'order',
    sourceRequirementId: row.sourceRequirementId || '',
    type: row.type || '',
    category: row.category || '',
    projectName: row.projectName || row.title || '',
    items: row.items || [],
    amount: row.amount !== undefined ? Number(row.amount) : moneyCentsToYuan(row.amountCents),
    finalAmount: row.finalAmount !== undefined ? Number(row.finalAmount) : moneyCentsToYuan(row.finalAmountCents || row.proposedAmountCents),
    status: row.status || '待处理',
    progress: Number(row.progress || 0),
    contactName: row.customerName || row.contactName || '',
    phone: row.phone || '',
    email: row.email || '',
    organization: row.organization || '',
    requirements: row.description || '',
    attachments: row.attachments || [],
    quoteUrl: row.quoteUrl || '',
    documentUrl: row.documentUrl || '',
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    estimatedCompletionDate: row.expectedAt || row.estimatedCompletionDate || '',
    logisticsCompany: row.logisticsCompany || '',
    trackingNo: row.trackingNo || ''
  };
}
async function createOrder(headers, body) {
  const result = await saveRequirement(headers, body, 'order');
  if (result.statusCode) return result;
  return ok({ businessNo: result.record.demandNo, demandNo: result.record.demandNo, order: publicRequirement(result.record), workflow: 'requirements_to_quote_to_order' }, 201);
}
async function submitRequirement(headers, body) {
  const result = await saveRequirement(headers, body, 'requirement');
  if (result.statusCode) return result;
  return ok({ id: result.id, requirementNo: result.record.demandNo, requirement: publicRequirement(result.record) }, 201);
}

async function requestDocumentExport(headers, body) {
  const { profile, accountId } = await requireUser(headers, body);
  const businessNo = sanitizeText(body.businessNo || body.demandNo || body.requirementNo || body.no, 100);
  if (!businessNo) return fail('缺少业务编号');
  let records = await querySafe(COLLECTIONS.requirements, { accountId, demandNo: businessNo }, 2);
  if (!records.length) records = await querySafe(COLLECTIONS.requirements, { accountId, no: businessNo }, 2);
  const row = records[0];
  if (!row) return fail('未找到对应需求单', 404, 'REQUIREMENT_NOT_FOUND');

  let docx;
  try { docx = require('docx'); }
  catch (_) { return fail('Word 导出依赖未安装，请在部署时安装 package.json 依赖', 500, 'DOCX_DEPENDENCY_MISSING'); }
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;
  const line = (label, value) => new Paragraph({ children: [new TextRun({ text: `${label}：`, bold: true }), new TextRun(String(value || '未填写'))] });
  const children = [
    new Paragraph({ text: '上海红祺腾达信息技术有限公司', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: 'HQTD 科研服务综合需求单', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
    line('业务编号', businessNo),
    line('联系人', row.name || profile.name),
    line('单位/学校', row.organization || profile.organization),
    line('手机号', row.phone || row.contact),
    line('邮箱', row.email || profile.email),
    line('服务类型', row.serviceType),
    line('项目名称', row.projectName || row.title),
    line('期望完成日期', row.deadline || row.expectedDate),
    new Paragraph({ text: '总体需求', heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: row.description || row.detail || '未填写' })
  ];
  const items = Array.isArray(row.cartItems) ? row.cartItems : [];
  if (items.length) {
    children.push(new Paragraph({ text: '项目清单', heading: HeadingLevel.HEADING_2 }));
    items.forEach((item, index) => {
      children.push(new Paragraph({ children: [
        new TextRun({ text: `${index + 1}. ${item.name || item.title || '未命名项目'}`, bold: true }),
        new TextRun({ text: `  数量：${item.qty || 1}${item.unit || '项'}${Number(item.price || 0) > 0 ? `  参考单价：¥${Number(item.price).toFixed(2)}` : '  价格：待评估'}` })
      ] }));
      if (item.note) children.push(new Paragraph({ text: `补充要求：${item.note}` }));
    });
  }
  const attachments = Array.isArray(row.attachments) ? row.attachments : [];
  if (attachments.length) {
    children.push(new Paragraph({ text: '附件清单', heading: HeadingLevel.HEADING_2 }));
    attachments.forEach((item, index) => children.push(new Paragraph({ text: `${index + 1}. ${item.name || item.fileID || '附件'}` })));
  }
  children.push(new Paragraph({ text: '说明：本需求单用于技术评估与报价确认，不代表最终成交价格。', spacing: { before: 360 } }));
  children.push(new Paragraph({ text: `生成时间：${new Date().toLocaleString('zh-CN', { hour12: false })}` }));

  const document = new Document({ sections: [{ properties: {}, children }] });
  const buffer = await Packer.toBuffer(document);
  getDb();
  const cloudPath = `generated-documents/${sha256(accountId).slice(0, 16)}/${safeCloudFilename(`${businessNo}-综合需求单.docx`)}`;
  const uploaded = await cloudApp.uploadFile({ cloudPath, fileContent: buffer });
  const fileID = uploaded.fileID || '';
  const downloadUrl = await getTemporaryUrl(fileID);
  await updateDoc(COLLECTIONS.requirements, row._id, {
    documentFileID: fileID,
    documentUrl: downloadUrl,
    documentFormat: 'docx',
    documentGeneratedAt: now(),
    updatedAt: now()
  });
  await audit('request_document_export', profile._id, accountId, { businessNo, fileID });
  return ok({ businessNo, fileID, downloadUrl, url: downloadUrl, message: downloadUrl ? 'Word 综合需求单已生成' : 'Word 已生成并保存到云存储，可稍后在业务进度中下载' });
}

async function listByAccount(collection, accountId, limit) {
  const result = await getDb().collection(collection).where({ accountId }).limit(limit).get();
  return rows(result);
}
async function listOrders(headers, body) {
  const { accountId } = await requireUser(headers, body);
  const limit = Math.max(1, Math.min(200, Number(body.limit || 100)));
  const [requirements, ordersList] = await Promise.all([
    listByAccount(COLLECTIONS.requirements, accountId, limit).catch(() => []),
    listByAccount(COLLECTIONS.orders, accountId, limit).catch(() => [])
  ]);
  const orderByRequirement = new Map();
  for (const order of ordersList) if (order.sourceRequirementId) orderByRequirement.set(String(order.sourceRequirementId), order);
  const merged = [];
  for (const req of requirements) {
    const converted = orderByRequirement.get(String(req._id));
    if (!converted) merged.push(publicRequirement(req));
  }
  merged.push(...ordersList.map(publicOrder));
  merged.sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
  return ok({ orders: merged.slice(0, limit), accountId });
}
async function getOrder(headers, body) {
  const { accountId } = await requireUser(headers, body);
  const id = sanitizeText(body.id || body.orderId, 100);
  const number = sanitizeText(body.orderNo || body.demandNo, 100);
  let row = null;
  let kind = '';
  if (id) {
    row = await getDoc(COLLECTIONS.orders, id);
    if (row) kind = 'order';
    if (!row) { row = await getDoc(COLLECTIONS.requirements, id); if (row) kind = 'requirement'; }
  } else if (number) {
    const orderRows = await querySafe(COLLECTIONS.orders, { orderNo: number }, 1);
    row = orderRows[0] || null;
    if (row) kind = 'order';
    if (!row) {
      const reqRows = await querySafe(COLLECTIONS.requirements, { demandNo: number }, 1);
      row = reqRows[0] || null;
      if (row) kind = 'requirement';
    }
  }
  if (!row || String(row.accountId || row.customerId || '') !== String(accountId)) return fail('订单或需求不存在', 404, 'ORDER_NOT_FOUND');
  return ok({ order: kind === 'order' ? publicOrder(row) : publicRequirement(row) });
}
async function getAccount(headers, body) {
  const { accountId } = await requireUser(headers, body);
  const account = await getDoc(COLLECTIONS.accounts, accountId) || { accountId, balanceCents: 0 };
  let ledger = [];
  try {
    ledger = rows(await getDb().collection(COLLECTIONS.transactions).where({ accountId }).limit(Math.max(1, Math.min(200, Number(body.limit || 100)))).get());
  } catch (_) {}
  ledger = ledger.map(item => ({
    id: item._id,
    type: item.type || '',
    amount: moneyCentsToYuan(item.deltaCents),
    deltaCents: Number(item.deltaCents || 0),
    beforeCents: Number(item.beforeCents || 0),
    afterCents: Number(item.afterCents || 0),
    description: item.note || item.description || '',
    orderNo: item.orderNo || '',
    orderId: item.orderId || '',
    createdAt: toIso(item.createdAt)
  })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return ok({
    accountId,
    balance: moneyCentsToYuan(account.balanceCents),
    balanceCents: Number(account.balanceCents || 0),
    account: {
      name: account.name || '客户账户',
      organization: account.organization || '',
      status: account.status || 'active',
      totalRecharge: moneyCentsToYuan(account.totalRechargeCents),
      totalSpent: moneyCentsToYuan(account.totalSpentCents),
      totalRefund: moneyCentsToYuan(account.totalRefundCents)
    },
    ledger
  });
}


function accountBalanceCents(account) {
  const source = plainObject(account);
  if (Number.isFinite(Number(source.balanceCents))) return Math.round(Number(source.balanceCents));
  if (Number.isFinite(Number(source.availableBalance))) return Math.round(Number(source.availableBalance) * 100);
  if (Number.isFinite(Number(source.balance))) return Math.round(Number(source.balance) * 100);
  return 0;
}
async function compatibleAccountRows(collection, accountId, limit = 200) {
  const result = [];
  const seen = new Set();
  for (const field of ['accountId', 'customerId', 'customerAccountId', 'clientAccountId', 'websiteAccountId']) {
    try {
      const batch = rows(await getDb().collection(collection).where({ [field]: accountId }).limit(limit).get());
      for (const row of batch) {
        const key = String(row && (row._id || row.id || `${field}:${result.length}`));
        if (!seen.has(key)) { seen.add(key); result.push(row); }
      }
    } catch (_) {}
  }
  return result;
}
async function collectionCount(collection, accountId) {
  try {
    const result = await getDb().collection(collection).where({ accountId }).count();
    if (result && Number.isFinite(Number(result.total))) return Number(result.total);
  } catch (_) {}
  try {
    const result = await getDb().collection(collection).where({ customerId: accountId }).count();
    if (result && Number.isFinite(Number(result.total))) return Number(result.total);
  } catch (_) {}
  return 0;
}
async function dashboard(headers, body) {
  const { profile, accountId } = await requireUser(headers, body);
  const account = await getDoc(COLLECTIONS.accounts, accountId) || {};
  const [requirements, ordersList, projectRows, quoteRows, deliveryRows, afterSalesRows, unreadNotifications] = await Promise.all([
    compatibleAccountRows(COLLECTIONS.requirements, accountId, 200),
    compatibleAccountRows(COLLECTIONS.orders, accountId, 200),
    compatibleAccountRows('projects', accountId, 300),
    compatibleAccountRows('quotes', accountId, 300),
    compatibleAccountRows('deliveries', accountId, 300),
    compatibleAccountRows('after_sales', accountId, 300),
    (async () => {
      try {
        const result = await getDb().collection(COLLECTIONS.notifications).where({ accountId, read: false }).count();
        return Number(result && result.total || 0);
      } catch (_) { return 0; }
    })()
  ]);

  const convertedRequirementIds = new Set(
    ordersList.map(item => String(item.sourceRequirementId || '')).filter(Boolean)
  );
  const openRequirements = requirements.filter(item => !convertedRequirementIds.has(String(item._id || '')));
  const mergedOrders = [
    ...openRequirements.map(publicRequirement),
    ...ordersList.map(publicOrder)
  ].sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));

  const normStatus = row => String((row && (row.status || row.state || row.stage || row.progressStatus)) || '').toLowerCase();
  const isClosed = status => /completed|complete|finished|closed|cancelled|canceled|rejected|已完成|已关闭|已取消|已拒绝/.test(status);
  const isQuoteDone = status => /accepted|confirmed|approved|paid|declined|rejected|已确认|已接受|已批准|已付款|已拒绝/.test(status);
  const isDeliveryDone = status => /confirmed|accepted|completed|closed|已确认|已接收|已完成|已关闭/.test(status);
  // 顶部统计与业务列表使用同一批记录；独立集合为空时从订单/需求状态回退计算。
  const orderStatusRows = [...ordersList, ...openRequirements];
  const quoteLike = status => /quote|quoted|pending_quote|待报价|已报价|待确认报价|待客户确认/.test(status);
  const projectLike = status => /confirmed|accepted|processing|in_progress|running|testing|calculating|已确认|进行中|处理中|计算中|测试中/.test(status) && !isClosed(status);
  const deliveryLike = status => /delivery|delivered|pending_acceptance|待交付|已交付待确认|待确认交付/.test(status) && !isDeliveryDone(status);
  const projects = projectRows.length
    ? projectRows.filter(row => !isClosed(normStatus(row))).length
    : orderStatusRows.filter(row => projectLike(normStatus(row))).length;
  const quotes = quoteRows.length
    ? quoteRows.filter(row => !isQuoteDone(normStatus(row))).length
    : orderStatusRows.filter(row => quoteLike(normStatus(row)) && !isQuoteDone(normStatus(row))).length;
  const deliveries = deliveryRows.length
    ? deliveryRows.filter(row => !isDeliveryDone(normStatus(row))).length
    : orderStatusRows.filter(row => deliveryLike(normStatus(row))).length;
  const afterSales = afterSalesRows.filter(row => !isClosed(normStatus(row))).length;
  const balanceCents = accountBalanceCents(account);
  const counts = {
    requirements: requirements.length,
    orders: ordersList.length,
    projects,
    quotes,
    deliveries,
    afterSales,
    unreadNotifications
  };
  const todos = [
    { key: 'quotes', label: '待确认报价', count: quotes },
    { key: 'projects', label: '进行中项目', count: projects },
    { key: 'deliveries', label: '待确认交付', count: deliveries },
    { key: 'afterSales', label: '售后处理中', count: afterSales },
    { key: 'notifications', label: '未读消息', count: unreadNotifications }
  ].filter(item => item.count > 0);

  const currentAccount = {
    _id: accountId,
    accountId,
    name: account.name || account.walletName || profile.organization || profile.name || profile.contactName || '客户账户',
    organization: account.organization || profile.organization || '',
    status: account.status || 'active',
    statusText: account.status === 'frozen' ? '已冻结' : '正常'
  };
  const user = publicUser(profile, accountId);
  return ok({
    user,
    currentAccount,
    account: {
      ...currentAccount,
      balance: moneyCentsToYuan(balanceCents),
      balanceCents,
      availableBalance: (balanceCents / 100).toFixed(2),
      totalRecharge: moneyCentsToYuan(account.totalRechargeCents),
      totalSpent: moneyCentsToYuan(account.totalSpentCents),
      totalRefund: moneyCentsToYuan(account.totalRefundCents)
    },
    summary: {
      availableBalance: (balanceCents / 100).toFixed(2),
      balance: moneyCentsToYuan(balanceCents),
      balanceCents,
      todoCount: todos.reduce((sum, item) => sum + item.count, 0),
      requirementCount: requirements.length,
      orderCount: ordersList.length,
      unreadCount: unreadNotifications
    },
    counts,
    todos,
    recentOrders: mergedOrders.slice(0, 5),
    orders: mergedOrders.slice(0, 5)
  });
}



function statusText(row) {
  return sanitizeText(row && (row.statusText || row.status || row.stateText || row.state), 80) || '查看';
}
function amountYuan(row) {
  if (!row) return 0;
  if (row.amountCents !== undefined) return moneyCentsToYuan(row.amountCents);
  if (row.finalAmountCents !== undefined) return moneyCentsToYuan(row.finalAmountCents);
  if (row.proposedAmountCents !== undefined) return moneyCentsToYuan(row.proposedAmountCents);
  return Number(row.finalAmount || row.amount || row.totalAmount || 0) || 0;
}
function publicPortalItem(row, kind) {
  const item = row || {};
  return {
    ...item,
    id: item._id || '',
    kind,
    no: item.no || item.orderNo || item.requirementNo || item.demandNo || item.projectNo || item.quoteNo || item.contractNo || '',
    title: item.title || item.projectName || item.serviceName || item.name || item.subject || '业务记录',
    statusText: statusText(item),
    amount: amountYuan(item),
    createdAt: toIso(item.createdAt),
    updatedAt: toIso(item.updatedAt)
  };
}
async function rowsForAccount(collection, accountId, limit = 100) {
  const max = Math.max(1, Math.min(200, Number(limit || 100)));
  const unique = new Map();
  for (const field of ['accountId', 'customerId', 'linkedAccountId']) {
    try {
      const list = rows(await getDb().collection(collection).where({ [field]: accountId }).limit(max).get());
      for (const row of list) if (row && row._id) unique.set(row._id, row);
    } catch (_) {}
  }
  return Array.from(unique.values())
    .sort((a, b) => String(toIso(b.updatedAt || b.createdAt)).localeCompare(String(toIso(a.updatedAt || a.createdAt))))
    .slice(0, max);
}
async function portalList(headers, body) {
  const { accountId } = await requireUser(headers, body);
  const kind = sanitizeText(body.kind || body.type, 40);
  const map = {
    todos: 'customer_todos', flows: 'business_flows', quotes: 'quotes', orders: COLLECTIONS.orders,
    requirements: COLLECTIONS.requirements, projects: 'projects', deliveries: 'deliveries', contracts: 'contracts',
    notifications: COLLECTIONS.notifications, afterSales: 'after_sales', invoices: 'invoices', transactions: COLLECTIONS.transactions
  };
  const collection = map[kind];
  if (!collection) return fail('不支持的客户中心列表', 400, 'LIST_KIND_NOT_SUPPORTED');
  let items = await rowsForAccount(collection, accountId, body.limit || 100);
  if (kind === 'notifications' && body.unreadOnly) items = items.filter(x => x.read !== true);
  return ok({ kind, items: items.map(x => publicPortalItem(x, kind)), total: items.length });
}
async function customerCenterData(headers, body) {
  const { accountId } = await requireUser(headers, body);
  const [requirements, orderRows, quotes, projects, deliveries, afterSales, contracts, invoices, notifications, members] = await Promise.all([
    rowsForAccount(COLLECTIONS.requirements, accountId, 200),
    rowsForAccount(COLLECTIONS.orders, accountId, 200),
    rowsForAccount('quotes', accountId, 100),
    rowsForAccount('projects', accountId, 100),
    rowsForAccount('deliveries', accountId, 100),
    rowsForAccount('after_sales', accountId, 100),
    rowsForAccount('contracts', accountId, 100),
    rowsForAccount('invoices', accountId, 100),
    rowsForAccount(COLLECTIONS.notifications, accountId, 100),
    rowsForAccount(COLLECTIONS.memberships, accountId, 100)
  ]);
  return ok({
    requirements: requirements.map(publicRequirement),
    orders: orderRows.map(publicOrder),
    quotes: quotes.map(x => publicPortalItem(x, 'quotes')),
    projects: projects.map(x => publicPortalItem(x, 'projects')),
    deliveries: deliveries.map(x => publicPortalItem(x, 'deliveries')),
    afterSales: afterSales.map(x => publicPortalItem(x, 'afterSales')),
    contracts: contracts.map(x => publicPortalItem(x, 'contracts')),
    invoices: invoices.map(x => publicPortalItem(x, 'invoices')),
    notifications: notifications.map(x => publicPortalItem(x, 'notifications')),
    members: members.map(x => publicPortalItem(x, 'members'))
  });
}

async function namedPortalList(headers, body, kind, key) {
  const result = await portalList(headers, { ...body, kind });
  const parsed = JSON.parse(result.body || '{}');
  if (parsed.ok === false) return result;
  return ok({ [key]: parsed.items || [], total: parsed.total || 0 });
}

async function listAccounts(headers, body) {
  const { profile, accountId } = await requireUser(headers, body);
  const ids = new Set([accountId, profile.accountId, profile.linkedAccountId, profile.activeWebAccountId].filter(Boolean));
  if (Array.isArray(profile.accountIds)) profile.accountIds.forEach(id => id && ids.add(String(id)));
  if (profile.openid) {
    try {
      const memberships = rows(await getDb().collection(COLLECTIONS.memberships).where({ openid: profile.openid }).limit(100).get());
      memberships.filter(x => !['disabled', 'removed'].includes(x.status)).forEach(x => x.accountId && ids.add(String(x.accountId)));
    } catch (_) {}
  }
  for (const field of ['customerId', 'profileId']) {
    try {
      const memberships = rows(await getDb().collection(COLLECTIONS.memberships).where({ [field]: profile._id }).limit(100).get());
      memberships.filter(x => !['disabled', 'removed'].includes(x.status)).forEach(x => x.accountId && ids.add(String(x.accountId)));
    } catch (_) {}
  }
  const accounts = [];
  for (const id of ids) {
    const a = await getDoc(COLLECTIONS.accounts, id) || {};
    accounts.push({
      _id: id, accountId: id,
      name: a.name || a.walletName || profile.organization || profile.name || '客户账户',
      organization: a.organization || profile.organization || '',
      role: id === accountId ? 'current' : 'member', current: id === accountId,
      balance: moneyCentsToYuan(accountBalanceCents(a)), availableBalance: (accountBalanceCents(a) / 100).toFixed(2),
      status: a.status || 'active', statusText: a.status === 'frozen' ? '已冻结' : '正常'
    });
  }
  return ok({ accounts, currentAccountId: accountId });
}
async function switchAccount(headers, body) {
  const { profile } = await requireUser(headers, body);
  const target = sanitizeText(body.accountId, 100);
  if (!target) return fail('缺少账户 ID');
  const listed = await listAccounts(headers, body);
  const parsed = JSON.parse(listed.body || '{}');
  if (!Array.isArray(parsed.accounts) || !parsed.accounts.some(x => x.accountId === target)) return fail('无权访问该账户', 403, 'ACCOUNT_FORBIDDEN');
  await updateDoc(COLLECTIONS.customers, profile._id, { activeWebAccountId: target, updatedAt: now() });
  const merged = { ...profile, activeWebAccountId: target };
  return ok({ currentAccountId: target, token: signToken(merged, target), user: publicUser(merged, target) });
}
async function wallets(headers, body) {
  const { accountId } = await requireUser(headers, body);
  let accounts = await rowsForAccount(COLLECTIONS.accounts, accountId, 100);
  const direct = await getDoc(COLLECTIONS.accounts, accountId);
  if (direct && !accounts.some(x => x._id === accountId)) accounts.unshift({ _id: accountId, ...direct });
  if (!accounts.length) accounts = [{ _id: accountId, accountId, name: '通用预存账户', balanceCents: 0, status: 'active' }];
  const transactions = await rowsForAccount(COLLECTIONS.transactions, accountId, body.limit || 100);
  return ok({
    accounts: accounts.map(x => ({
      _id: x._id || accountId, accountId: x.accountId || accountId,
      name: x.name || x.walletName || '通用预存账户', typeName: x.accountTypeName || x.typeName || '通用账户',
      status: x.status || 'active', statusText: x.status === 'frozen' ? '冻结' : '正常',
      availableBalance: (accountBalanceCents(x) / 100).toFixed(2), balance: moneyCentsToYuan(accountBalanceCents(x)),
      frozenBalance: moneyCentsToYuan(x.frozenBalanceCents || x.frozenBalance), monthSpent: moneyCentsToYuan(x.monthSpentCents || x.monthSpent)
    })),
    transactions: transactions.map(x => publicPortalItem(x, 'transactions'))
  });
}
async function members(headers, body) {
  const { accountId } = await requireUser(headers, body);
  const items = await rowsForAccount(COLLECTIONS.memberships, accountId, 100);
  const roleMap = { owner: '账户所有者', finance: '财务联系人', project_admin: '项目管理员', member: '普通成员', readonly: '只读成员' };
  return ok({ items: items.map(x => ({
    ...x, id: x._id || '', roleName: roleMap[x.role] || x.role || '普通成员',
    statusText: x.status === 'disabled' ? '已停用' : '有效', scopeText: x.projectScope === 'limited' ? '指定项目' : '全部项目'
  })) });
}
async function projectDetail(headers, body) {
  const { accountId } = await requireUser(headers, body);
  const id = sanitizeText(body.id || body.projectId, 100);
  const project = await getDoc('projects', id);
  if (!project) return fail('项目不存在', 404, 'PROJECT_NOT_FOUND');
  if (![project.accountId, project.customerId, project.linkedAccountId].filter(Boolean).includes(accountId)) return fail('无权访问该项目', 403, 'PROJECT_FORBIDDEN');
  return ok({ project: { ...project, id: project._id, statusText: statusText(project), timeline: Array.isArray(project.timeline) ? project.timeline : [] } });
}
async function projectMessages(headers, body) {
  const { accountId } = await requireUser(headers, body);
  const projectId = sanitizeText(body.projectId, 100);
  let items = [];
  try { items = rows(await getDb().collection('project_messages').where({ accountId, projectId }).limit(100).get()); } catch (_) {}
  items.sort((a, b) => String(toIso(a.createdAt)).localeCompare(String(toIso(b.createdAt))));
  return ok({ items });
}
async function sendProjectMessage(headers, body) {
  const { profile, accountId } = await requireUser(headers, body);
  const projectId = sanitizeText(body.projectId, 100);
  const content = sanitizeText(body.content, 2000);
  if (!projectId || !content) return fail('项目和留言内容不能为空');
  await addDoc('project_messages', {
    accountId, projectId, customerId: profile._id, type: sanitizeText(body.type, 40), content,
    senderName: profile.name || profile.contactName || '客户', source: 'website', createdAt: now(), createdAtText: new Date().toLocaleString('zh-CN')
  });
  return ok({ message: '留言已发送' }, 201);
}
async function createAfterSales(headers, body) {
  const { profile, accountId } = await requireUser(headers, body);
  const form = plainObject(body.form || body);
  const type = sanitizeText(form.type, 50);
  const description = sanitizeText(form.description, 2000);
  if (!type || !description) return fail('请完善问题类型和描述');
  const no = `SH-${Date.now()}`;
  await addDoc('after_sales', {
    accountId, customerId: profile._id, no, type, businessNo: sanitizeText(form.businessNo, 100), description,
    attachments: Array.isArray(form.attachments) ? form.attachments.slice(0, 20) : [], source: 'website',
    status: 'submitted', statusText: '已提交', createdAt: now(), updatedAt: now()
  });
  const notify = await notifyWebhook(`【官网售后申请】\n编号：${no}\n客户：${profile.name || profile.contactName || ''}\n类型：${type}\n业务编号：${sanitizeText(form.businessNo, 100) || '未填写'}\n说明：${description}`);
  return ok({ no, notification: notify }, 201);
}
async function invoiceTitles(headers, body) {
  const { accountId } = await requireUser(headers, body);
  const items = await rowsForAccount('invoice_titles', accountId, 50);
  return ok({ items });
}
async function saveInvoiceTitle(headers, body) {
  const { accountId } = await requireUser(headers, body);
  const form = plainObject(body.form || body);
  const title = sanitizeText(form.title || form.invoiceTitle, 200);
  if (!title) return fail('发票抬头不能为空');
  const id = await addDoc('invoice_titles', {
    accountId, title, taxNo: sanitizeText(form.taxNo, 80), type: sanitizeText(form.type, 50) || '电子普通发票',
    addressPhone: sanitizeText(form.addressPhone, 300), bankAccount: sanitizeText(form.bankAccount, 300),
    isDefault: form.isDefault === true, source: 'website', createdAt: now(), updatedAt: now()
  });
  return ok({ id, message: '发票抬头已保存' }, 201);
}
async function orderPriceAction(headers, body, mode) {
  const { profile, accountId } = await requireUser(headers, body);
  const id = sanitizeText(body.id || body.orderId, 100);
  const order = await getDoc(COLLECTIONS.orders, id);
  if (!order) return fail('订单不存在', 404, 'ORDER_NOT_FOUND');
  if (![order.accountId, order.customerId, order.linkedAccountId].filter(Boolean).includes(accountId)) return fail('无权访问该订单', 403, 'ORDER_FORBIDDEN');
  if (mode === 'confirm') {
    const cents = Number(order.proposedAmountCents || order.finalAmountCents || order.amountCents || 0);
    await updateDoc(COLLECTIONS.orders, id, {
      finalAmountCents: cents, amountCents: cents, priceStatus: 'confirmed', priceStatusText: '客户已确认',
      priceConfirmedBy: profile._id, priceConfirmedAt: now(), status: order.status === '待确认' ? '待付款' : order.status, updatedAt: now()
    });
    await addDoc(COLLECTIONS.notifications, {
      accountId, title: '订单价格已确认', subtitle: `${order.orderNo || order.title || '订单'} 最终价格 ¥${(cents / 100).toFixed(2)}`,
      category: '订单消息', businessType: 'order_price_confirmed', businessId: id, read: false, createdAt: now()
    }).catch(() => '');
    return ok({ amountCents: cents, amount: cents / 100, message: '价格已确认' });
  }
  const reason = sanitizeText(body.reason, 500);
  if (!reason) return fail('请填写希望修改的原因');
  await updateDoc(COLLECTIONS.orders, id, {
    priceStatus: 'rejected_customer', priceStatusText: '客户要求修改', customerPriceRevisionReason: reason,
    priceRejectedBy: profile._id, priceRejectedAt: now(), updatedAt: now()
  });
  return ok({ message: '修改请求已提交' });
}

async function requireAdmin(headers, body) {
  const user = await requireUser(headers, body);
  const adminToken = sanitizeText(headers['x-admin-token'] || headers['X-Admin-Token'] || body.adminToken, 4096);
  let tokenMatches = false;
  if (process.env.ADMIN_TOKEN && adminToken) {
    const supplied = Buffer.from(adminToken);
    const expected = Buffer.from(process.env.ADMIN_TOKEN);
    tokenMatches = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
  }
  if (user.profile.role !== 'admin' && !tokenMatches) throw Object.assign(new Error('需要管理员权限'), { statusCode: 403, code: 'ADMIN_REQUIRED' });
  return user;
}
async function adminListOrders(headers, body) {
  await requireAdmin(headers, body);
  const limit = Math.max(1, Math.min(200, Number(body.limit || 100)));
  const [reqs, ordersList] = await Promise.all([
    getDb().collection(COLLECTIONS.requirements).limit(limit).get().then(rows).catch(() => []),
    getDb().collection(COLLECTIONS.orders).limit(limit).get().then(rows).catch(() => [])
  ]);
  const list = [...reqs.map(publicRequirement), ...ordersList.map(publicOrder)]
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
    .slice(0, limit);
  return ok({ orders: list });
}
async function adminUpdateOrder(headers, body) {
  await requireAdmin(headers, body);
  const id = sanitizeText(body.id || body.orderId, 100);
  if (!id) return fail('缺少记录 ID');
  let collection = sanitizeText(body.collection || body.recordType, 30) === 'requirement' ? COLLECTIONS.requirements : COLLECTIONS.orders;
  let current = await getDoc(collection, id);
  if (!current) {
    collection = collection === COLLECTIONS.orders ? COLLECTIONS.requirements : COLLECTIONS.orders;
    current = await getDoc(collection, id);
  }
  if (!current) return fail('记录不存在', 404, 'ORDER_NOT_FOUND');
  const allowed = ['status', 'statusText', 'progress', 'finalAmount', 'finalAmountCents', 'expectedDate', 'expectedAt', 'estimatedCompletionDate', 'logisticsCompany', 'trackingCompany', 'trackingNo', 'quoteUrl', 'documentUrl', 'adminRemark', 'latestProgressNote'];
  const updates = cleanUpdate(pick(body.updates || body, allowed));
  if (updates.progress !== undefined) updates.progress = clampNumber(updates.progress, 0, 100, 0);
  if (updates.finalAmount !== undefined) updates.finalAmount = Math.max(0, Number(updates.finalAmount) || 0);
  if (updates.finalAmountCents !== undefined) updates.finalAmountCents = Math.max(0, Math.round(Number(updates.finalAmountCents) || 0));
  updates.updatedAt = now();
  await updateDoc(collection, id, updates);

  const accountId = sanitizeText(current.accountId || current.customerId || current.linkedAccountId, 100);
  const status = sanitizeText(updates.statusText || updates.status || current.statusText || current.status, 80) || '状态已更新';
  const number = sanitizeText(current.demandNo || current.orderNo || current.no, 100);
  if (accountId) {
    await addDoc(COLLECTIONS.notifications, {
      accountId,
      customerId: accountId,
      type: 'order_status',
      title: `订单状态更新：${status}`,
      content: `${number ? `业务编号 ${number}，` : ''}${sanitizeText(current.projectName || current.title, 200)} 状态已更新为“${status}”。${updates.latestProgressNote ? ` ${sanitizeText(updates.latestProgressNote, 500)}` : ''}`,
      relatedId: id,
      businessNo: number,
      status,
      read: false,
      channel: 'customer_center',
      createdAt: now(),
      updatedAt: now()
    }).catch(() => {});
  }
  return ok({ message: '记录已更新，客户中心状态通知已生成', collection, updates, notificationCreated: Boolean(accountId) });
}

async function databaseCheck() {
  const result = {};
  for (const [key, name] of Object.entries(COLLECTIONS)) {
    try {
      await getDb().collection(name).limit(1).get();
      result[key] = { collection: name, exists: true };
    } catch (error) {
      result[key] = { collection: name, exists: false, error: sanitizeText(error && (error.errMsg || error.message || error), 300) };
    }
  }
  return ok({ databaseModel: 'mini-program-shared-account', collections: result });
}

async function notifyWebhook(content) {
  const url = process.env.QYWX_WEBHOOK_URL || process.env.WECOM_WEBHOOK_URL;
  if (!url) return { notified: false, status: 'not_configured', error: '' };
  try {
    const result = await postJson(url, { msgtype: 'text', text: { content: sanitizeText(content, 4000) } });
    let body = {};
    try { body = JSON.parse(result.body || '{}'); } catch (_) {}
    if (result.statusCode >= 200 && result.statusCode < 300 && (!body.errcode || body.errcode === 0)) return { notified: true, status: 'sent', error: '' };
    return { notified: false, status: 'failed', error: sanitizeText(body.errmsg || result.body || `HTTP ${result.statusCode}`, 500) };
  } catch (error) {
    return { notified: false, status: 'failed', error: sanitizeText(error.message || error, 500) };
  }
}
function postJson(urlString, payload) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(urlString); } catch (error) { reject(error); return; }
    const data = Buffer.from(JSON.stringify(payload));
    const req = https.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 443,
      path: `${url.pathname}${url.search}`,
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': data.length },
      timeout: 2000
    }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('timeout', () => req.destroy(new Error('request timeout')));
    req.on('error', reject);
    req.end(data);
  });
}


async function generateRequirementDocuments(headers, body) {
  const type = ['ai','calculation','analysis'].includes(sanitizeText(body.type,30)) ? sanitizeText(body.type,30) : 'analysis';
  const form = plainObject(body.form);
  const demandNo = sanitizeText(body.demandNo || form.demandNo || body.businessNo, 80) || randomId('HQTD-');
  form.demandNo = demandNo;
  const buffer = await buildRequirementDocx(type, form);
  getDb(); // 确保 cloudApp 已初始化，避免 uploadFile 为 undefined
  const filename = `${titleFor(type)}-${demandNo}.docx`;
  const cloudPath = `generated/requirements/${demandNo}-${type}.docx`;
  const upload = await cloudApp.uploadFile({ cloudPath, fileContent: buffer });
  let pdf = null;
  let pdfStatus = 'not_configured';
  let pdfMessage = '';
  const converter = sanitizeText(process.env.PDF_CONVERTER_URL, 500);
  if (converter) {
    pdfStatus = 'pending';
    try {
      const converted = await postJson(converter.replace(/\/$/, '') + '/convert', { sourceFileID: upload.fileID, sourceFormat: 'docx', targetFormat: 'pdf', outputPath: `generated/requirements/${demandNo}-${type}.pdf`, filename: `${titleFor(type)}-${demandNo}.pdf` });
      let parsed = {}; try { parsed = JSON.parse(converted.body || '{}'); } catch (_) {}
      const fileID = parsed.fileID || parsed.outputFileID;
      if (converted.statusCode >= 200 && converted.statusCode < 300 && fileID) {
        pdf = { fileID, filename: `${titleFor(type)}-${demandNo}.pdf` };
        pdfStatus = 'ready';
      } else {
        pdfStatus = converted.statusCode === 503 ? 'service_unavailable' : 'failed';
        pdfMessage = parsed.message || `PDF转换服务返回 ${converted.statusCode}`;
      }
    } catch (error) {
      pdfStatus = 'service_unavailable';
      pdfMessage = error.message || String(error);
    }
  }
  let docxTempURL = '';
  let pdfTempURL = '';
  try {
    const ids = [upload.fileID].concat(pdf && pdf.fileID ? [pdf.fileID] : []);
    const temp = await cloudApp.getTempFileURL({ fileList: ids });
    const files = (temp && temp.fileList) || [];
    docxTempURL = files.find(x => x.fileID === upload.fileID)?.tempFileURL || '';
    if (pdf && pdf.fileID) pdfTempURL = files.find(x => x.fileID === pdf.fileID)?.tempFileURL || '';
  } catch (_) {}
  const item = { demandNo, type, title: titleFor(type), docx: { fileID: upload.fileID, filename, tempURL: docxTempURL }, pdf: pdf ? { ...pdf, tempURL: pdfTempURL } : null, pdfStatus, pdfMessage, createdAt: nowIso() };
  await setDoc('resource_manifest', `generated-${demandNo}`, item);
  return ok({ item, message: pdf ? 'Word/PDF已生成' : 'Word已生成；PDF转换服务暂不可用，可稍后重试' });
}
async function retryRequirementPdf(headers, body) {
  const demandNo = sanitizeText(body.demandNo, 80);
  if (!demandNo) return fail('缺少需求编号');
  const item = await getDoc('resource_manifest', `generated-${demandNo}`);
  if (!item || !item.docx || !item.docx.fileID) return fail('未找到已生成的Word文档', 404);
  if (item.pdf && item.pdf.fileID) return ok({ item, message: 'PDF已存在' });
  const converter = sanitizeText(process.env.PDF_CONVERTER_URL, 500);
  if (!converter) return fail('PDF转换服务未配置', 503, 'PDF_NOT_CONFIGURED');
  const type = ['ai','calculation','analysis'].includes(item.type) ? item.type : 'analysis';
  try {
    const converted = await postJson(converter.replace(/\/$/, '') + '/convert', { sourceFileID: item.docx.fileID, sourceFormat: 'docx', targetFormat: 'pdf', outputPath: `generated/requirements/${demandNo}-${type}.pdf`, filename: `${titleFor(type)}-${demandNo}.pdf` });
    let parsed = {}; try { parsed = JSON.parse(converted.body || '{}'); } catch (_) {}
    const fileID = parsed.fileID || parsed.outputFileID;
    if (!(converted.statusCode >= 200 && converted.statusCode < 300 && fileID)) {
      await setDoc('resource_manifest', `generated-${demandNo}`, { ...item, pdfStatus: converted.statusCode === 503 ? 'service_unavailable' : 'failed', pdfMessage: parsed.message || `PDF转换服务返回 ${converted.statusCode}`, updatedAt: nowIso() });
      return fail('PDF转换服务暂不可用，请稍后重试', 503, 'PDF_SERVICE_UNAVAILABLE');
    }
    const updated = { ...item, pdf: { fileID, filename: `${titleFor(type)}-${demandNo}.pdf` }, pdfStatus: 'ready', pdfMessage: '', updatedAt: nowIso() };
    await setDoc('resource_manifest', `generated-${demandNo}`, updated);
    return ok({ item: updated, message: 'PDF已生成' });
  } catch (error) {
    return fail('PDF转换服务暂不可用，请稍后重试', 503, 'PDF_SERVICE_UNAVAILABLE', error.message || String(error));
  }
}
const actionAliases = {
  ping: 'health', healthCheck: 'health', dbCheck: 'databaseCheck', schemaCheck: 'databaseCheck',
  signup: 'register', signUp: 'register', activateMiniAccount: 'activateExisting',
  signin: 'login', signIn: 'login', getProfile: 'me', profile: 'me', saveProfile: 'updateProfile',
  forgotPassword: 'requestPasswordReset', resetPassword: 'requestPasswordReset', recoverAccount: 'requestPasswordReset',
  submitOrder: 'createOrder', getOrders: 'listOrders', myOrders: 'listOrders', orderDetail: 'getOrder',
  dashboard: 'dashboard', getDashboard: 'dashboard', overview: 'dashboard', home: 'dashboard',
  balance: 'getAccount', ledger: 'getAccount', createRequirement: 'submitRequirement', submitInquiry: 'submitRequirement',
  adminOrders: 'adminListOrders', updateOrder: 'adminUpdateOrder',
  list: 'portalList', listBusiness: 'listBusiness', listNotifications: 'listNotifications', listContracts: 'listContracts', listInvoices: 'listInvoices', listAccountMembers: 'listAccountMembers', listAccounts: 'listAccounts', switchAccount: 'switchAccount', wallets: 'wallets', members: 'members',
  projectDetail: 'projectDetail', projectMessages: 'projectMessages', sendProjectMessage: 'sendProjectMessage',
  createAfterSales: 'createAfterSales', invoiceTitles: 'invoiceTitles', saveInvoiceTitle: 'saveInvoiceTitle',
  confirmOrderPrice: 'confirmOrderPrice', requestPriceRevision: 'requestPriceRevision', requestDocumentExport: 'requestDocumentExport', exportDocument: 'requestDocumentExport'
};
async function handleAction(action, headers, body) {
  const resolved = actionAliases[action] || action || 'health';
  switch (resolved) {
    case 'health': return ok({
      service: 'webPortal', runtime: 'dual', databaseModel: 'mini-program-shared-account',
      envId: getEnvId(), node: process.version,
      jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
      webhookConfigured: Boolean(process.env.QYWX_WEBHOOK_URL || process.env.WECOM_WEBHOOK_URL),
      sdkLoadError: sdkInitError ? sdkInitError.message : null,
      time: nowIso()
    });
    case 'databaseCheck': return databaseCheck();
    case 'dashboard': return dashboard(headers, body);
    case 'register': return register(body);
    case 'activateExisting': return activateExisting(body);
    case 'login': return login(body);
    case 'me': { const user = await requireUser(headers, body); return ok({ user: publicUser(user.profile, user.accountId) }); }
    case 'updateProfile': return updateProfile(headers, body);
    case 'changePassword': return changePassword(headers, body);
    case 'requestPasswordReset': return requestPasswordReset(body);
    case 'createOrder': return createOrder(headers, body);
    case 'listOrders': return listOrders(headers, body);
    case 'getOrder': return getOrder(headers, body);
    case 'getAccount': return getAccount(headers, body);
    case 'submitRequirement': return submitRequirement(headers, body);
    case 'requestDocumentExport': return requestDocumentExport(headers, body);
    case 'generateRequirementDocuments': return generateRequirementDocuments(headers, body);
    case 'retryRequirementPdf': return retryRequirementPdf(headers, body);
    case 'portalList': return portalList(headers, body);
    case 'listBusiness': return customerCenterData(headers, body);
    case 'listNotifications': return namedPortalList(headers, body, 'notifications', 'notifications');
    case 'listContracts': return namedPortalList(headers, body, 'contracts', 'contracts');
    case 'listInvoices': return namedPortalList(headers, body, 'invoices', 'invoices');
    case 'listAccountMembers': return namedPortalList(headers, body, 'members', 'members');
    case 'listAccounts': return listAccounts(headers, body);
    case 'switchAccount': return switchAccount(headers, body);
    case 'wallets': return wallets(headers, body);
    case 'members': return members(headers, body);
    case 'projectDetail': return projectDetail(headers, body);
    case 'projectMessages': return projectMessages(headers, body);
    case 'sendProjectMessage': return sendProjectMessage(headers, body);
    case 'createAfterSales': return createAfterSales(headers, body);
    case 'invoiceTitles': return invoiceTitles(headers, body);
    case 'saveInvoiceTitle': return saveInvoiceTitle(headers, body);
    case 'confirmOrderPrice': return orderPriceAction(headers, body, 'confirm');
    case 'requestPriceRevision': return orderPriceAction(headers, body, 'revise');
    case 'adminListOrders': return adminListOrders(headers, body);
    case 'adminUpdateOrder': return adminUpdateOrder(headers, body);
    default: return fail(`不支持的 action：${resolved}`, 404, 'ACTION_NOT_FOUND');
  }
}
function corsHeaders(origin) {
  const configured = (process.env.ALLOWED_ORIGINS || 'https://www.hongqitengda.com,http://localhost:3000,http://127.0.0.1:3000')
    .split(',').map(v => v.trim()).filter(Boolean);
  const allowOrigin = configured.includes('*') || configured.includes(origin) ? (origin || '*') : configured[0] || 'https://www.hongqitengda.com';
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'Content-Type,Authorization,X-Admin-Token,X-Filename,X-Mime-Type,X-File-Size',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

async function processBinaryUpload({ method = 'POST', headers = {}, query = {}, buffer = Buffer.alloc(0) }) {
  const origin = headers.origin || headers.Origin || '';
  const cors = corsHeaders(origin);
  if (String(method).toUpperCase() === 'OPTIONS') return response(204, {}, cors);
  try {
    const user = await optionalUser(headers, query || {});
    const requirementId = sanitizeText(query.requirementId || query.orderId, 100);
    const submittedContact = sanitizeText(query.contact || headers['x-contact'] || headers['X-Contact'], 160);
    let requirement = requirementId ? await getDoc(COLLECTIONS.requirements, requirementId) : null;
    if (!user) {
      if (!requirement) throw Object.assign(new Error('请先创建订单后再上传附件'), { statusCode: 401, code: 'ORDER_REQUIRED' });
      const matched = (normalizePhone(submittedContact) && normalizePhone(submittedContact) === normalizePhone(requirement.phone || requirement.contact)) ||
        (normalizeEmail(submittedContact) && normalizeEmail(submittedContact) === normalizeEmail(requirement.email || requirement.contact));
      if (!matched) throw Object.assign(new Error('订单联系方式校验失败'), { statusCode: 403, code: 'CONTACT_MISMATCH' });
    }
    const declaredSize = Number(headers['x-file-size'] || headers['X-File-Size'] || query.size || 0);
    const size = Buffer.isBuffer(buffer) ? buffer.length : 0;
    if (!size) {
      const result = fail('附件内容为空', 400, 'EMPTY_FILE');
      return { ...result, headers: { ...result.headers, ...cors } };
    }
    if (size > 5 * 1024 * 1024 || declaredSize > 5 * 1024 * 1024) {
      const result = fail('单个附件不能超过 5 MB', 413, 'FILE_TOO_LARGE');
      return { ...result, headers: { ...result.headers, ...cors } };
    }
    const originalName = decodeUploadFilename(headers['x-filename'] || headers['X-Filename'] || query.filename || 'attachment.bin');
    const mimeType = sanitizeText(headers['x-mime-type'] || headers['X-Mime-Type'] || query.mimeType || 'application/octet-stream', 120);
    if (!uploadMimeAllowed(mimeType) || !uploadExtensionAllowed(originalName)) {
      const result = fail('不支持该附件类型', 415, 'UNSUPPORTED_FILE_TYPE');
      return { ...result, headers: { ...result.headers, ...cors } };
    }
    getDb(); // 确保 cloudApp 已初始化
    const ownerKey = user ? user.accountId : requirementId;
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cloudPath = `website-uploads/${sha256(ownerKey).slice(0, 16)}/${date}/${Date.now()}-${crypto.randomBytes(3).toString('hex')}-${safeCloudFilename(originalName)}`;
    const uploaded = await cloudApp.uploadFile({ cloudPath, fileContent: buffer });
    const fileID = uploaded.fileID || '';
    const file = { name: originalName, size, mimeType, fileID, url: '', uploadedAt: nowIso() };
    if (requirementId && requirement) {
      const attachments = sanitizeAttachments([...(Array.isArray(requirement.attachments) ? requirement.attachments : []), file]);
      await updateDoc(COLLECTIONS.requirements, requirementId, {
        attachments,
        expectedAttachmentCount: attachments.length,
        attachmentStatus: 'complete',
        attachmentError: '',
        updatedAt: now()
      });
    }
    if (user) audit('upload_attachment', user.profile._id, user.accountId, { name: originalName, size, fileID, requirementId }).catch(() => {});
    const result = ok({ file, requirementId, uploadMode: 'post-submit-binary-cloud-storage' }, 201);
    return { ...result, headers: { ...result.headers, ...cors } };
  } catch (error) {
    console.error('[webPortal] binary upload', error && error.stack ? error.stack : error);
    const statusCode = Number(error.statusCode || 500);
    const result = fail(error.message || '附件上传失败', statusCode, error.code || 'UPLOAD_FAILED');
    return { ...result, headers: { ...result.headers, ...cors } };
  }
}

async function processRequest({ method = 'POST', path = '/', headers = {}, query = {}, body = {} }) {
  const origin = headers.origin || headers.Origin || '';
  const cors = corsHeaders(origin);
  if (String(method).toUpperCase() === 'OPTIONS') return response(204, {}, cors);
  const merged = { ...plainObject(query), ...plainObject(body) };
  const pathParts = String(path || '').split('/').filter(Boolean);
  const pathAction = pathParts[pathParts.length - 1];
  const action = sanitizeText(merged.action || (pathAction && !['api', 'webPortal'].includes(pathAction) ? pathAction : '') || 'health', 80);
  try {
    const result = await handleAction(action, headers, merged);
    return { ...result, headers: { ...result.headers, ...cors } };
  } catch (error) {
    console.error('[webPortal]', action, error && error.stack ? error.stack : error);
    const statusCode = Number(error.statusCode || 500);
    const code = error.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED');
    const message = statusCode === 500 && process.env.NODE_ENV === 'production' ? '服务器内部错误' : (error.message || '服务器内部错误');
    const result = fail(message, statusCode, code);
    return { ...result, headers: { ...result.headers, ...cors } };
  }
}

module.exports = { processRequest, processBinaryUpload, VERSION };
