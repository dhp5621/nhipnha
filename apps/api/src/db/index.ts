import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc, sql } from 'drizzle-orm';
import * as schema from './schema';
import {
  CREATIVE_ATTACHMENTS,
  type Family,
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

export const DEMO_FAMILY_ID = 'fam_dongthap_001';
export const DEMO_FAMILY_CODE = 'NHIP-8868';

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
        })
        .onConflictDoNothing();
    }

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
        return rows.map((r) => ({
          id: r.id,
          familyId: r.familyId,
          name: r.name,
          role: r.role as Role,
          avatarUrl: r.avatarUrl || undefined,
          deviceId: r.deviceId || undefined,
          createdAt: r.createdAt.toISOString(),
        }));
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
          return {
            id: rows[0].id,
            familyId: rows[0].familyId,
            name: rows[0].name,
            role: rows[0].role as Role,
            avatarUrl: rows[0].avatarUrl || undefined,
            deviceId: rows[0].deviceId || undefined,
            createdAt: rows[0].createdAt.toISOString(),
          };
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
          })
          .onConflictDoNothing();
      } catch (e) {
        console.warn('saveMember pg error:', e);
      }
    }
    return member;
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
        // Ensure member exists before foreign-key insert
        const existingMember = await this.getMember(checkIn.memberId);
        if (!existingMember) {
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
        if (!existingSender) {
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
