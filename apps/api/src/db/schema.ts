import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const families = pgTable('families', {
  id: varchar('id', { length: 64 }).primaryKey(),
  code: varchar('code', { length: 32 }).notNull().unique(), // e.g. "NHIP-8868"
  qrPayload: text('qr_payload').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  addressProvince: varchar('address_province', { length: 128 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const members = pgTable('members', {
  id: varchar('id', { length: 64 }).primaryKey(),
  familyId: varchar('family_id', { length: 64 })
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 128 }).notNull(),
  role: varchar('role', { length: 32 }).notNull(), // 'CHILD' | 'PARENT' | 'GRANDPARENT'
  avatarUrl: text('avatar_url'),
  deviceId: text('device_id'),
  isOwner: boolean('is_owner').default(false).notNull(),
  // Optional email + password login (both or neither). Stored lowercase / scrypt-hashed.
  email: varchar('email', { length: 254 }).unique(),
  passwordHash: text('password_hash'),
  // SHA-256 of the member's QR login secret; the secret itself is shown only once.
  qrSecretHash: text('qr_secret_hash'),
  failedLogins: integer('failed_logins').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// One row per signed-in device. Only the SHA-256 of the session token is stored.
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  memberId: varchar('member_id', { length: 64 })
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  deviceLabel: varchar('device_label', { length: 128 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invites = pgTable('invites', {
  id: varchar('id', { length: 64 }).primaryKey(),
  familyId: varchar('family_id', { length: 64 })
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 32 }).notNull().unique(),
  role: varchar('role', { length: 32 }).notNull(),
  memberName: varchar('member_name', { length: 128 }),
  createdBy: varchar('created_by', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  usedByName: varchar('used_by_name', { length: 128 }),
  revokedAt: timestamp('revoked_at'),
});

export const checkIns = pgTable('check_ins', {
  id: varchar('id', { length: 64 }).primaryKey(),
  familyId: varchar('family_id', { length: 64 })
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  memberId: varchar('member_id', { length: 64 })
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  memberName: varchar('member_name', { length: 128 }),
  rhythmType: varchar('rhythm_type', { length: 32 }).notNull(), // 'MORNING' | 'AFTERNOON' | 'EVENING'
  mood: varchar('mood', { length: 32 }), // 'JOYFUL' | 'CALM' | 'TIRED' | 'NEED_HUG'
  note: text('note'),
  voiceDurationSec: integer('voice_duration_sec').default(0),
  voiceUrl: text('voice_url'),
  waveform: jsonb('waveform'), // Simulated audio waveform values
  attachment: jsonb('attachment'), // CreativeAttachment JSONB
  syncStatus: varchar('sync_status', { length: 32 }).default('SYNCED').notNull(), // 'SYNCED' | 'PENDING'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: varchar('id', { length: 64 }).primaryKey(),
  familyId: varchar('family_id', { length: 64 })
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  senderId: varchar('sender_id', { length: 64 })
    .notNull()
    .references(() => members.id, { onDelete: 'cascade' }),
  senderName: varchar('sender_name', { length: 128 }),
  recipientId: varchar('recipient_id', { length: 64 }),
  rhythmType: varchar('rhythm_type', { length: 32 }).notNull(), // usually 'EVENING' or 'AFTERNOON'
  audioUrl: text('audio_url'),
  transcription: text('transcription'),
  durationSec: integer('duration_sec').default(0).notNull(),
  aiSummary: text('ai_summary'),
  aiSuggestedPrompts: jsonb('ai_suggested_prompts'), // Array of strings
  listenedAt: timestamp('listened_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const familiesRelations = relations(families, ({ many }) => ({
  members: many(members),
  checkIns: many(checkIns),
  messages: many(messages),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  family: one(families, {
    fields: [members.familyId],
    references: [families.id],
  }),
  checkIns: many(checkIns),
  messages: many(messages),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  family: one(families, {
    fields: [checkIns.familyId],
    references: [families.id],
  }),
  member: one(members, {
    fields: [checkIns.memberId],
    references: [members.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  family: one(families, {
    fields: [messages.familyId],
    references: [families.id],
  }),
  sender: one(members, {
    fields: [messages.senderId],
    references: [members.id],
  }),
}));

export type FamilyRecord = typeof families.$inferSelect;
export type MemberRecord = typeof members.$inferSelect;
export type CheckInRecord = typeof checkIns.$inferSelect;
export type MessageRecord = typeof messages.$inferSelect;
