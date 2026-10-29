import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc, sql, and, isNull } from 'drizzle-orm';
import * as schema from './schema';
import {
  CREATIVE_ATTACHMENTS,
  DEMO_FAMILY_ID,
  DEMO_FAMILY_CODE,
  type Family,
  type FamilyInvite,
  type Member,
  type CheckIn,
  type Message,
  type RhythmType,
  type MoodType,
  type Role,
  type CreativeAttachment,
} from '@nhipnha/shared';

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NO_SSL;

const sqlClient = databaseUrl ? neon(databaseUrl) : null;
export const db = sqlClient ? drizzle(sqlClient, { schema }) : null;

export { DEMO_FAMILY_ID, DEMO_FAMILY_CODE };

/** Seeded demo accounts cannot be edited or removed, so the demo always resets cleanly. */
export const DEMO_PROTECTED_MEMBER_IDS = ['mem_child_an', 'mem_parent_hoa', 'mem_grand_ba'];

/** A member can be signed in on a few devices at once; the oldest sign-in is dropped first. */
export const MAX_SESSIONS_PER_MEMBER = 3;

/** Login secrets of a member. Never sent to clients. */
export interface MemberSecrets {
  email?: string;
  passwordHash?: string;
  qrSecretHash?: string;
  failedLogins: number;
  lockedUntil?: string;
}

export interface SessionRecord {
  id: string;
  memberId: string;
  tokenHash: string;
  deviceLabel?: string;
  createdAt: string;
}

function toMember(r: typeof schema.members.$inferSelect): Member {
  return {
    id: r.id,
    familyId: r.familyId,
    name: r.name,
    role: r.role as Role,
    avatarUrl: r.avatarUrl || undefined,
    deviceId: r.deviceId || undefined,
    isOwner: r.isOwner,
    createdAt: r.createdAt.toISOString(),
  };
}

function toInvite(r: typeof schema.invites.$inferSelect): FamilyInvite {
  return {
    id: r.id,
    familyId: r.familyId,
    code: r.code,
    role: r.role as Role,
    memberName: r.memberName || undefined,
    createdBy: r.createdBy,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
    usedAt: r.usedAt ? r.usedAt.toISOString() : undefined,
    usedByName: r.usedByName || undefined,
    revokedAt: r.revokedAt ? r.revokedAt.toISOString() : undefined,
  };
}

const DEMO_FAMILY: Family = {
  id: DEMO_FAMILY_ID,
  name: 'Gia đình Bác Ba & Bé An',
  code: DEMO_FAMILY_CODE,
  qrPayload: JSON.stringify({
    version: '1.0',
    app: 'nhipnha',
    familyId: DEMO_FAMILY_ID,
    familyCode: DEMO_FAMILY_CODE,
    familyName: 'Gia đình Bác Ba & Bé An',
    token: 'tok_demo_secure_8868',
    suggestedRole: 'CHILD',
    suggestedName: 'Bé An (8 tuổi)',
    generatedAt: 1730200000000,
  }),
  addressProvince: 'Đồng Tháp',
  createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
};

const DEMO_MEMBERS: Member[] = [
  {
    id: 'mem_child_an',
    familyId: DEMO_FAMILY_ID,
    name: 'Bé An',
    role: 'CHILD',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
    deviceId: 'dev_old_android_redmi',
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mem_parent_hoa',
    familyId: DEMO_FAMILY_ID,
    name: 'Mẹ Hoa (Công nhân KCN Bình Dương)',
    role: 'PARENT',
    isOwner: true,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    deviceId: 'dev_samsung_a12',
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'mem_grand_ba',
    familyId: DEMO_FAMILY_ID,
    name: 'Bà Nội Bảy',
    role: 'GRANDPARENT',
    avatarUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=150',
    deviceId: 'dev_oppo_a3s',
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  },
];

const DEMO_CHECKINS: CheckIn[] = [
  {
    id: 'chk_morning_today',
    familyId: DEMO_FAMILY_ID,
    memberId: 'mem_child_an',
    memberName: 'Bé An',
    rhythmType: 'MORNING',
    note: 'Con thức dậy rồi, chuẩn bị ăn sáng với nội đi học!',
    syncStatus: 'SYNCED',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: 'chk_afternoon_today',
    familyId: DEMO_FAMILY_ID,
    memberId: 'mem_child_an',
    memberName: 'Bé An',
    rhythmType: 'AFTERNOON',
    mood: 'JOYFUL',
    note: 'Chiều nay con được cô khen vẽ hoa sen đẹp, nhưng con nhớ mẹ xíu.',
    voiceDurationSec: 14,
    voiceUrl: 'mock://audio/chieu-be-an-14s.aac',
    waveform: [15, 30, 65, 80, 95, 70, 45, 90, 85, 40, 20],
    attachment: CREATIVE_ATTACHMENTS[0],
    syncStatus: 'SYNCED',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

const DEMO_MESSAGES: Message[] = [
  {
    id: 'msg_evening_yesterday',
    familyId: DEMO_FAMILY_ID,
    senderId: 'mem_parent_hoa',
    senderName: 'Mẹ Hoa',
    recipientId: 'mem_child_an',
    rhythmType: 'EVENING',
    durationSec: 25,
    audioUrl: 'mock://audio/dan-do-me-hoa.aac',
    transcription:
      'An ơi, mẹ tăng ca xong rồi nè. Mẹ thấy bức vẽ hoa sen hồng của con đẹp quá! Con nhớ uống ly nước ấm bà pha rồi đi ngủ sớm nhé. Cuối tuần mẹ về mua sách màu cho con!',
    aiSummary:
      'Mẹ đã hoàn thành ca làm, khen bức tranh hoa sen của con, dặn con uống nước ấm và ngủ sớm.',
    aiSuggestedPrompts: [
      'Hôm nay ở lớp có tranh bạn nào vẽ đẹp cùng con không?',
      'Bà nấu món canh gì cho An ăn chiều thế?',
      'Con ngủ ngoan nhé, mẹ thương An nhiều!',
    ],
    listenedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

/**
 * In-memory fallback repository when DATABASE_URL is not configured.
 */
class MemoryRepository {
  private families: Map<string, Family> = new Map();
  private members: Map<string, Member> = new Map();
  private checkIns: CheckIn[] = [];
  private messages: Message[] = [];
  private invites: Map<string, FamilyInvite> = new Map();
  private secrets: Map<string, MemberSecrets> = new Map();
  private sessions: SessionRecord[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    this.families.set(DEMO_FAMILY.id, DEMO_FAMILY);
    for (const m of DEMO_MEMBERS) {
      this.members.set(m.id, m);
    }
    this.checkIns = [...DEMO_CHECKINS];
    this.messages = [...DEMO_MESSAGES];
  }

  getFamily(id: string): Family | undefined {
    return this.families.get(id);
  }

  getFamilyByCode(code: string): Family | undefined {
    for (const fam of this.families.values()) {
      if (fam.code.toUpperCase() === code.toUpperCase()) return fam;
    }
    return undefined;
  }

  saveFamily(family: Family): Family {
    this.families.set(family.id, family);
    return family;
  }

  getMembers(familyId: string): Member[] {
    return Array.from(this.members.values()).filter((m) => m.familyId === familyId);
  }

  getMember(memberId: string): Member | undefined {
    return this.members.get(memberId);
  }

  saveMember(member: Member): Member {
    this.members.set(member.id, member);
    return member;
  }

  getSecrets(memberId: string): MemberSecrets {
    return this.secrets.get(memberId) || { failedLogins: 0 };
  }

  setSecrets(memberId: string, patch: Partial<MemberSecrets>): void {
    this.secrets.set(memberId, { ...this.getSecrets(memberId), ...patch });
  }

  findMemberIdByEmail(email: string): string | undefined {
    for (const [memberId, s] of this.secrets.entries()) {
      if (s.email === email) return memberId;
    }
    return undefined;
  }

  addSession(session: SessionRecord): void {
    this.sessions.push(session);
    const mine = this.sessions
      .filter((s) => s.memberId === session.memberId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const evict = new Set(mine.slice(MAX_SESSIONS_PER_MEMBER).map((s) => s.id));
    if (evict.size > 0) this.sessions = this.sessions.filter((s) => !evict.has(s.id));
  }

  hasSession(memberId: string, tokenHash: string): boolean {
    return this.sessions.some((s) => s.memberId === memberId && s.tokenHash === tokenHash);
  }

  deleteSessions(memberId: string, exceptTokenHash?: string): void {
    this.sessions = this.sessions.filter(
      (s) => s.memberId !== memberId || (exceptTokenHash !== undefined && s.tokenHash === exceptTokenHash)
    );
  }

  countSessions(memberId: string): number {
    return this.sessions.filter((s) => s.memberId === memberId).length;
  }

  updateMember(memberId: string, patch: { name?: string; role?: Role }): Member | undefined {
    const current = this.members.get(memberId);
    if (!current) return undefined;
    const next: Member = {
      ...current,
      name: patch.name ?? current.name,
      role: patch.role ?? current.role,
    };
    this.members.set(memberId, next);
    return next;
  }

  deleteMember(memberId: string): void {
    this.members.delete(memberId);
    this.secrets.delete(memberId);
    this.sessions = this.sessions.filter((s) => s.memberId !== memberId);
    this.checkIns = this.checkIns.filter((c) => c.memberId !== memberId);
    this.messages = this.messages.filter((m) => m.senderId !== memberId);
  }

  saveInvite(invite: FamilyInvite): FamilyInvite {
    this.invites.set(invite.id, invite);
    return invite;
  }

  getInviteByCode(code: string): FamilyInvite | undefined {
    for (const inv of this.invites.values()) {
      if (inv.code === code) return inv;
    }
    return undefined;
  }

  listInvites(familyId: string): FamilyInvite[] {
    return Array.from(this.invites.values())
      .filter((i) => i.familyId === familyId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Returns true only for the single caller that actually claimed the invite. */
  claimInvite(inviteId: string, usedByName: string): boolean {
    const inv = this.invites.get(inviteId);
    if (!inv || inv.usedAt || inv.revokedAt) return false;
    inv.usedAt = new Date().toISOString();
    inv.usedByName = usedByName;
    return true;
  }

  revokeInvite(familyId: string, inviteId: string): boolean {
    const inv = this.invites.get(inviteId);
    if (!inv || inv.familyId !== familyId || inv.usedAt || inv.revokedAt) return false;
    inv.revokedAt = new Date().toISOString();
    return true;
  }

  getCheckIns(familyId: string): CheckIn[] {
    return this.checkIns.filter((c) => c.familyId === familyId);
  }

  addCheckIn(checkIn: CheckIn): CheckIn {
    this.checkIns.unshift(checkIn);
    return checkIn;
  }

  getMessages(familyId: string): Message[] {
    return this.messages.filter((m) => m.familyId === familyId);
  }

  addMessage(msg: Message): Message {
    this.messages.unshift(msg);
    return msg;
  }

  markMessageListened(messageId: string) {
    const target = this.messages.find((m) => m.id === messageId);
    if (target) {
      target.listenedAt = new Date().toISOString();
    }
  }
}

const globalRepo = global as unknown as {
  __memoryRepo?: MemoryRepository;
  __pgBootstrapped?: boolean;
};
if (!globalRepo.__memoryRepo) {
  globalRepo.__memoryRepo = new MemoryRepository();
}

export const memoryStore = globalRepo.__memoryRepo;

/**
 * Ensures PostgreSQL tables exist and the Demo Family (`fam_dongthap_001` / `NHIP-8868`)
 * is seeded in the real database so demo testing data comes directly from the database.
 */
async function ensurePgBootstrap(): Promise<boolean> {
  if (!db || !sqlClient) return false;
  if (globalRepo.__pgBootstrapped) return true;

  try {
    await sqlClient`
      CREATE TABLE IF NOT EXISTS families (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        qr_payload TEXT NOT NULL,
        name VARCHAR(255) NOT NULL,
        address_province VARCHAR(128),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    await sqlClient`
      CREATE TABLE IF NOT EXISTS members (
        id VARCHAR(64) PRIMARY KEY,
        family_id VARCHAR(64) NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        name VARCHAR(128) NOT NULL,
        role VARCHAR(32) NOT NULL,
        avatar_url TEXT,
        device_id TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    await sqlClient`
      CREATE TABLE IF NOT EXISTS check_ins (
        id VARCHAR(64) PRIMARY KEY,
        family_id VARCHAR(64) NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        member_id VARCHAR(64) NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        member_name VARCHAR(128),
        rhythm_type VARCHAR(32) NOT NULL,
        mood VARCHAR(32),
        note TEXT,
        voice_duration_sec INTEGER DEFAULT 0,
        voice_url TEXT,
        waveform JSONB,
        attachment JSONB,
        sync_status VARCHAR(32) DEFAULT 'SYNCED' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    // Safely add columns if check_ins existed from earlier schema
    await sqlClient`ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS member_name VARCHAR(128);`;
    await sqlClient`ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS attachment JSONB;`;

    await sqlClient`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY,
        family_id VARCHAR(64) NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        sender_id VARCHAR(64) NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        sender_name VARCHAR(128),
        recipient_id VARCHAR(64),
        rhythm_type VARCHAR(32) NOT NULL,
        audio_url TEXT,
        transcription TEXT,
        duration_sec INTEGER DEFAULT 0 NOT NULL,
        ai_summary TEXT,
        ai_suggested_prompts JSONB,
        listened_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    await sqlClient`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(128);`;

    // Roles & invitations: owner flag, hashed session token and single-use invites
    await sqlClient`ALTER TABLE members ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE NOT NULL;`;
    await sqlClient`ALTER TABLE members DROP COLUMN IF EXISTS token_hash;`;
    await sqlClient`ALTER TABLE members ADD COLUMN IF NOT EXISTS email VARCHAR(254);`;
    await sqlClient`ALTER TABLE members ADD COLUMN IF NOT EXISTS password_hash TEXT;`;
    await sqlClient`ALTER TABLE members ADD COLUMN IF NOT EXISTS qr_secret_hash TEXT;`;
    await sqlClient`ALTER TABLE members ADD COLUMN IF NOT EXISTS failed_logins INTEGER DEFAULT 0 NOT NULL;`;
    await sqlClient`ALTER TABLE members ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;`;
    await sqlClient`CREATE UNIQUE INDEX IF NOT EXISTS members_email_unique ON members (email);`;
    await sqlClient`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(64) PRIMARY KEY,
        member_id VARCHAR(64) NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        device_label VARCHAR(128),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;
    await sqlClient`CREATE INDEX IF NOT EXISTS sessions_lookup_idx ON sessions (member_id, token_hash);`;
    await sqlClient`
      CREATE TABLE IF NOT EXISTS invites (
        id VARCHAR(64) PRIMARY KEY,
        family_id VARCHAR(64) NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        code VARCHAR(32) NOT NULL UNIQUE,
        role VARCHAR(32) NOT NULL,
        member_name VARCHAR(128),
        created_by VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        used_by_name VARCHAR(128),
        revoked_at TIMESTAMP
      );
    `;
    await sqlClient`CREATE INDEX IF NOT EXISTS invites_family_idx ON invites (family_id, created_at);`;

    // Idempotently seed Demo Family in Postgres
    await db
      .insert(schema.families)
      .values({
        id: DEMO_FAMILY.id,
        code: DEMO_FAMILY.code,
        qrPayload: DEMO_FAMILY.qrPayload,
        name: DEMO_FAMILY.name,
        addressProvince: DEMO_FAMILY.addressProvince,
      })
      .onConflictDoNothing();

    for (const m of DEMO_MEMBERS) {
      await db
        .insert(schema.members)
        .values({
          id: m.id,
          familyId: m.familyId,
          name: m.name,
          role: m.role,
          avatarUrl: m.avatarUrl,
          deviceId: m.deviceId,
          isOwner: !!m.isOwner,
        })
        .onConflictDoNothing();
    }
    // Existing demo databases were seeded before owners existed
    await sqlClient`UPDATE members SET is_owner = TRUE WHERE id = 'mem_parent_hoa';`;

    for (const c of DEMO_CHECKINS) {
      await db
        .insert(schema.checkIns)
        .values({
          id: c.id,
          familyId: c.familyId,
          memberId: c.memberId,
          memberName: c.memberName,
          rhythmType: c.rhythmType,
          mood: c.mood,
          note: c.note,
          voiceDurationSec: c.voiceDurationSec || 0,
          voiceUrl: c.voiceUrl,
          waveform: c.waveform,
          attachment: c.attachment,
          syncStatus: 'SYNCED',
        })
        .onConflictDoNothing();
    }

    for (const msg of DEMO_MESSAGES) {
      await db
        .insert(schema.messages)
        .values({
          id: msg.id,
          familyId: msg.familyId,
          senderId: msg.senderId,
          senderName: msg.senderName,
          recipientId: msg.recipientId,
          rhythmType: msg.rhythmType,
          audioUrl: msg.audioUrl,
          transcription: msg.transcription,
          durationSec: msg.durationSec,
          aiSummary: msg.aiSummary,
          aiSuggestedPrompts: msg.aiSuggestedPrompts,
        })
        .onConflictDoNothing();
    }

    globalRepo.__pgBootstrapped = true;
    return true;
  } catch (err) {
    console.warn('Postgres bootstrap warning, falling back to memoryStore:', err);
    return false;
  }
}

/**
 * Unified async Database Repository (PostgreSQL primary + MemoryStore fallback)
 */
export const dataRepository = {
  async getFamily(id: string): Promise<Family | undefined> {
    if (await ensurePgBootstrap()) {
      try {
        const rows = await db!
          .select()
          .from(schema.families)
          .where(eq(schema.families.id, id))
          .limit(1);
        if (rows[0]) {
          return {
            id: rows[0].id,
            code: rows[0].code,
            name: rows[0].name,
            qrPayload: rows[0].qrPayload,
            addressProvince: rows[0].addressProvince || undefined,
            createdAt: rows[0].createdAt.toISOString(),
          };
        }
      } catch (e) {
        console.warn('getFamily pg error:', e);
      }
    }
    return memoryStore.getFamily(id);
  },

  async getFamilyByCode(code: string): Promise<Family | undefined> {
    const cleanCode = code.trim().toUpperCase();
    if (await ensurePgBootstrap()) {
      try {
        const rows = await db!
          .select()
          .from(schema.families)
          .where(eq(schema.families.code, cleanCode))
          .limit(1);
        if (rows[0]) {
          return {
            id: rows[0].id,
            code: rows[0].code,
            name: rows[0].name,
            qrPayload: rows[0].qrPayload,
            addressProvince: rows[0].addressProvince || undefined,
            createdAt: rows[0].createdAt.toISOString(),
          };
        }
      } catch (e) {
        console.warn('getFamilyByCode pg error:', e);
      }
    }
    return memoryStore.getFamilyByCode(cleanCode);
  },

  async saveFamily(family: Family): Promise<Family> {
    memoryStore.saveFamily(family);
    if (await ensurePgBootstrap()) {
      try {
        await db!
          .insert(schema.families)
          .values({
            id: family.id,
            code: family.code.toUpperCase(),
            name: family.name,
            qrPayload: family.qrPayload,
            addressProvince: family.addressProvince,
          })
          .onConflictDoNothing();
      } catch (e) {
        console.warn('saveFamily pg error:', e);
      }
    }
    return family;
  },

  async getMembers(familyId: string): Promise<Member[]> {
    if (await ensurePgBootstrap()) {
      try {
        const rows = await db!
          .select()
          .from(schema.members)
          .where(eq(schema.members.familyId, familyId));
        return rows.map(toMember);
      } catch (e) {
        console.warn('getMembers pg error:', e);
      }
    }
    return memoryStore.getMembers(familyId);
  },

  async getMember(memberId: string): Promise<Member | undefined> {
    if (await ensurePgBootstrap()) {
      try {
        const rows = await db!
          .select()
          .from(schema.members)
          .where(eq(schema.members.id, memberId))
          .limit(1);
        if (rows[0]) {
          return toMember(rows[0]);
        }
      } catch (e) {
        console.warn('getMember pg error:', e);
      }
    }
    return memoryStore.getMember(memberId);
  },

  async saveMember(member: Member): Promise<Member> {
    memoryStore.saveMember(member);
    if (await ensurePgBootstrap()) {
      try {
        await db!
          .insert(schema.members)
          .values({
            id: member.id,
            familyId: member.familyId,
            name: member.name,
            role: member.role,
            avatarUrl: member.avatarUrl,
            deviceId: member.deviceId,
            isOwner: !!member.isOwner,
          })
          .onConflictDoNothing();
      } catch (e) {
        console.warn('saveMember pg error:', e);
        throw e;
      }
    }
    return member;
  },

  // ----- Login secrets (email / password / QR secret). Errors are thrown, never swallowed. -----

  async getSecrets(memberId: string): Promise<MemberSecrets> {
    if (await ensurePgBootstrap()) {
      const rows = await db!
        .select()
        .from(schema.members)
        .where(eq(schema.members.id, memberId))
        .limit(1);
      const r = rows[0];
      if (!r) return { failedLogins: 0 };
      return {
        email: r.email || undefined,
        passwordHash: r.passwordHash || undefined,
        qrSecretHash: r.qrSecretHash || undefined,
        failedLogins: r.failedLogins,
        lockedUntil: r.lockedUntil ? r.lockedUntil.toISOString() : undefined,
      };
    }
    return memoryStore.getSecrets(memberId);
  },

  async setSecrets(memberId: string, patch: Partial<MemberSecrets>): Promise<void> {
    memoryStore.setSecrets(memberId, patch);
    if (await ensurePgBootstrap()) {
      const values: Partial<typeof schema.members.$inferInsert> = {};
      if ('email' in patch) values.email = patch.email ?? null;
      if ('passwordHash' in patch) values.passwordHash = patch.passwordHash ?? null;
      if ('qrSecretHash' in patch) values.qrSecretHash = patch.qrSecretHash ?? null;
      if ('failedLogins' in patch) values.failedLogins = patch.failedLogins ?? 0;
      if ('lockedUntil' in patch) values.lockedUntil = patch.lockedUntil ? new Date(patch.lockedUntil) : null;
      if (Object.keys(values).length > 0) {
        await db!.update(schema.members).set(values).where(eq(schema.members.id, memberId));
      }
    }
  },

  /** Email → member id (emails are stored lowercase). */
  async findMemberIdByEmail(email: string): Promise<string | undefined> {
    if (await ensurePgBootstrap()) {
      const rows = await db!
        .select({ id: schema.members.id })
        .from(schema.members)
        .where(eq(schema.members.email, email))
        .limit(1);
      return rows[0]?.id;
    }
    return memoryStore.findMemberIdByEmail(email);
  },

  /** Credential summary for every member of a family (email is only shown to owner / self). */
  async getCredentialSummaries(
    familyId: string
  ): Promise<Map<string, { email?: string; hasPassword: boolean }>> {
    const result = new Map<string, { email?: string; hasPassword: boolean }>();
    if (await ensurePgBootstrap()) {
      const rows = await db!
        .select({
          id: schema.members.id,
          email: schema.members.email,
          passwordHash: schema.members.passwordHash,
        })
        .from(schema.members)
        .where(eq(schema.members.familyId, familyId));
      for (const r of rows) {
        result.set(r.id, { email: r.email || undefined, hasPassword: !!r.passwordHash });
      }
      return result;
    }
    for (const m of memoryStore.getMembers(familyId)) {
      const s = memoryStore.getSecrets(m.id);
      result.set(m.id, { email: s.email, hasPassword: !!s.passwordHash });
    }
    return result;
  },

  // ----- Sessions (one per signed-in device, capped per member) -----

  async createSession(session: SessionRecord): Promise<void> {
    memoryStore.addSession(session);
    if (await ensurePgBootstrap()) {
      await db!.insert(schema.sessions).values({
        id: session.id,
        memberId: session.memberId,
        tokenHash: session.tokenHash,
        deviceLabel: session.deviceLabel,
      });
      // Keep only the newest MAX_SESSIONS_PER_MEMBER devices
      const rows = await db!
        .select({ id: schema.sessions.id })
        .from(schema.sessions)
        .where(eq(schema.sessions.memberId, session.memberId))
        .orderBy(desc(schema.sessions.createdAt));
      for (const old of rows.slice(MAX_SESSIONS_PER_MEMBER)) {
        await db!.delete(schema.sessions).where(eq(schema.sessions.id, old.id));
      }
    }
  },

  async hasSession(memberId: string, tokenHash: string): Promise<boolean> {
    if (await ensurePgBootstrap()) {
      const rows = await db!
        .select({ id: schema.sessions.id })
        .from(schema.sessions)
        .where(and(eq(schema.sessions.memberId, memberId), eq(schema.sessions.tokenHash, tokenHash)))
        .limit(1);
      return rows.length > 0;
    }
    return memoryStore.hasSession(memberId, tokenHash);
  },

  /** Signs a member out of every device (optionally keeping the current one). */
  async deleteSessions(memberId: string, exceptTokenHash?: string): Promise<void> {
    memoryStore.deleteSessions(memberId, exceptTokenHash);
    if (await ensurePgBootstrap()) {
      const rows = await db!
        .select({ id: schema.sessions.id, tokenHash: schema.sessions.tokenHash })
        .from(schema.sessions)
        .where(eq(schema.sessions.memberId, memberId));
      for (const r of rows) {
        if (exceptTokenHash !== undefined && r.tokenHash === exceptTokenHash) continue;
        await db!.delete(schema.sessions).where(eq(schema.sessions.id, r.id));
      }
    }
  },

  async countSessions(memberId: string): Promise<number> {
    if (await ensurePgBootstrap()) {
      const rows = await db!
        .select({ id: schema.sessions.id })
        .from(schema.sessions)
        .where(eq(schema.sessions.memberId, memberId));
      return rows.length;
    }
    return memoryStore.countSessions(memberId);
  },

  async updateMember(
    memberId: string,
    patch: { name?: string; role?: Role }
  ): Promise<Member | undefined> {
    const memoryResult = memoryStore.updateMember(memberId, patch);
    if (await ensurePgBootstrap()) {
      try {
        const values: { name?: string; role?: string } = {};
        if (patch.name !== undefined) values.name = patch.name;
        if (patch.role !== undefined) values.role = patch.role;
        if (Object.keys(values).length > 0) {
          await db!.update(schema.members).set(values).where(eq(schema.members.id, memberId));
        }
        return await this.getMember(memberId);
      } catch (e) {
        console.warn('updateMember pg error:', e);
      }
    }
    return memoryResult;
  },

  async deleteMember(memberId: string): Promise<void> {
    memoryStore.deleteMember(memberId);
    if (await ensurePgBootstrap()) {
      try {
        // check_ins and messages of this member are removed by ON DELETE CASCADE
        await db!.delete(schema.members).where(eq(schema.members.id, memberId));
      } catch (e) {
        console.warn('deleteMember pg error:', e);
      }
    }
  },

  async createInvite(invite: FamilyInvite): Promise<FamilyInvite> {
    memoryStore.saveInvite(invite);
    if (await ensurePgBootstrap()) {
      try {
        await db!.insert(schema.invites).values({
          id: invite.id,
          familyId: invite.familyId,
          code: invite.code,
          role: invite.role,
          memberName: invite.memberName,
          createdBy: invite.createdBy,
          expiresAt: new Date(invite.expiresAt),
        });
      } catch (e) {
        console.warn('createInvite pg error:', e);
        throw e;
      }
    }
    return invite;
  },

  async getInviteByCode(code: string): Promise<FamilyInvite | undefined> {
    const clean = code.trim().toUpperCase();
    if (await ensurePgBootstrap()) {
      try {
        const rows = await db!
          .select()
          .from(schema.invites)
          .where(eq(schema.invites.code, clean))
          .limit(1);
        return rows[0] ? toInvite(rows[0]) : undefined;
      } catch (e) {
        console.warn('getInviteByCode pg error:', e);
      }
    }
    return memoryStore.getInviteByCode(clean);
  },

  async listInvites(familyId: string): Promise<FamilyInvite[]> {
    if (await ensurePgBootstrap()) {
      try {
        const rows = await db!
          .select()
          .from(schema.invites)
          .where(eq(schema.invites.familyId, familyId))
          .orderBy(desc(schema.invites.createdAt))
          .limit(50);
        return rows.map(toInvite);
      } catch (e) {
        console.warn('listInvites pg error:', e);
      }
    }
    return memoryStore.listInvites(familyId);
  },

  /**
   * Atomically marks an invite as used. Only one concurrent caller can win,
   * so a single-use code can never create two members.
   */
  async claimInvite(inviteId: string, usedByName: string): Promise<boolean> {
    if (await ensurePgBootstrap()) {
      try {
        const rows = await db!
          .update(schema.invites)
          .set({ usedAt: new Date(), usedByName })
          .where(
            and(
              eq(schema.invites.id, inviteId),
              isNull(schema.invites.usedAt),
              isNull(schema.invites.revokedAt)
            )
          )
          .returning({ id: schema.invites.id });
        if (rows.length > 0) {
          memoryStore.claimInvite(inviteId, usedByName);
          return true;
        }
        return false;
      } catch (e) {
        console.warn('claimInvite pg error:', e);
      }
    }
    return memoryStore.claimInvite(inviteId, usedByName);
  },

  async revokeInvite(familyId: string, inviteId: string): Promise<boolean> {
    if (await ensurePgBootstrap()) {
      try {
        const rows = await db!
          .update(schema.invites)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(schema.invites.id, inviteId),
              eq(schema.invites.familyId, familyId),
              isNull(schema.invites.usedAt),
              isNull(schema.invites.revokedAt)
            )
          )
          .returning({ id: schema.invites.id });
        memoryStore.revokeInvite(familyId, inviteId);
        return rows.length > 0;
      } catch (e) {
        console.warn('revokeInvite pg error:', e);
      }
    }
    return memoryStore.revokeInvite(familyId, inviteId);
  },

  async getCheckIns(familyId: string): Promise<CheckIn[]> {
    if (await ensurePgBootstrap()) {
      try {
        const rows = await db!
          .select()
          .from(schema.checkIns)
          .where(eq(schema.checkIns.familyId, familyId))
          .orderBy(desc(schema.checkIns.createdAt));
        return rows.map((r) => ({
          id: r.id,
          familyId: r.familyId,
          memberId: r.memberId,
          memberName: r.memberName || undefined,
          rhythmType: r.rhythmType as RhythmType,
          mood: (r.mood as MoodType) || undefined,
          note: r.note || undefined,
          voiceDurationSec: r.voiceDurationSec || undefined,
          voiceUrl: r.voiceUrl || undefined,
          waveform: (r.waveform as number[]) || undefined,
          attachment: (r.attachment as CreativeAttachment) || undefined,
          syncStatus: (r.syncStatus as 'SYNCED' | 'PENDING') || 'SYNCED',
          createdAt: r.createdAt.toISOString(),
        }));
      } catch (e) {
        console.warn('getCheckIns pg error:', e);
      }
    }
    return memoryStore.getCheckIns(familyId);
  },

  async addCheckIn(checkIn: CheckIn): Promise<CheckIn> {
    memoryStore.addCheckIn(checkIn);
    if (await ensurePgBootstrap()) {
      try {
        // Only the public demo family may auto-create unknown members; real families
        // are managed exclusively through invitations by the family owner.
        const existingMember = await this.getMember(checkIn.memberId);
        if (!existingMember && checkIn.familyId === DEMO_FAMILY_ID) {
          await this.saveMember({
            id: checkIn.memberId,
            familyId: checkIn.familyId,
            name: checkIn.memberName || 'Thành viên',
            role: 'CHILD',
            createdAt: new Date().toISOString(),
          });
        }

        await db!
          .insert(schema.checkIns)
          .values({
            id: checkIn.id,
            familyId: checkIn.familyId,
            memberId: checkIn.memberId,
            memberName: checkIn.memberName,
            rhythmType: checkIn.rhythmType,
            mood: checkIn.mood,
            note: checkIn.note,
            voiceDurationSec: checkIn.voiceDurationSec || 0,
            voiceUrl: checkIn.voiceUrl,
            waveform: checkIn.waveform,
            attachment: checkIn.attachment,
            syncStatus: 'SYNCED',
          })
          .onConflictDoNothing();
      } catch (e) {
        console.warn('addCheckIn pg error:', e);
      }
    }
    return checkIn;
  },

  async getMessages(familyId: string): Promise<Message[]> {
    if (await ensurePgBootstrap()) {
      try {
        const rows = await db!
          .select()
          .from(schema.messages)
          .where(eq(schema.messages.familyId, familyId))
          .orderBy(desc(schema.messages.createdAt));
        return rows.map((r) => ({
          id: r.id,
          familyId: r.familyId,
          senderId: r.senderId,
          senderName: r.senderName || 'Bố / Mẹ',
          recipientId: r.recipientId || undefined,
          rhythmType: r.rhythmType as RhythmType,
          audioUrl: r.audioUrl || undefined,
          transcription: r.transcription || undefined,
          durationSec: r.durationSec,
          aiSummary: r.aiSummary || undefined,
          aiSuggestedPrompts: (r.aiSuggestedPrompts as string[]) || undefined,
          listenedAt: r.listenedAt ? r.listenedAt.toISOString() : undefined,
          createdAt: r.createdAt.toISOString(),
        }));
      } catch (e) {
        console.warn('getMessages pg error:', e);
      }
    }
    return memoryStore.getMessages(familyId);
  },

  async addMessage(msg: Message): Promise<Message> {
    memoryStore.addMessage(msg);
    if (await ensurePgBootstrap()) {
      try {
        const existingSender = await this.getMember(msg.senderId);
        if (!existingSender && msg.familyId === DEMO_FAMILY_ID) {
          await this.saveMember({
            id: msg.senderId,
            familyId: msg.familyId,
            name: msg.senderName || 'Bố / Mẹ',
            role: 'PARENT',
            createdAt: new Date().toISOString(),
          });
        }

        await db!
          .insert(schema.messages)
          .values({
            id: msg.id,
            familyId: msg.familyId,
            senderId: msg.senderId,
            senderName: msg.senderName,
            recipientId: msg.recipientId,
            rhythmType: msg.rhythmType,
            audioUrl: msg.audioUrl,
            transcription: msg.transcription,
            durationSec: msg.durationSec,
            aiSummary: msg.aiSummary,
            aiSuggestedPrompts: msg.aiSuggestedPrompts,
          })
          .onConflictDoNothing();
      } catch (e) {
        console.warn('addMessage pg error:', e);
      }
    }
    return msg;
  },

  async markMessageListened(messageId: string): Promise<void> {
    memoryStore.markMessageListened(messageId);
    if (await ensurePgBootstrap()) {
      try {
        await db!
          .update(schema.messages)
          .set({ listenedAt: new Date() })
          .where(eq(schema.messages.id, messageId));
      } catch (e) {
        console.warn('markMessageListened pg error:', e);
      }
    }
  },
};
