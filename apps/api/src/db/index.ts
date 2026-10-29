import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import type { Family, Member, CheckIn, Message } from '@nhipnha/shared';

const databaseUrl = process.env.DATABASE_URL;

export const db = databaseUrl
  ? drizzle(neon(databaseUrl), { schema })
  : null;

/**
 * In-memory fallback repository for Zero-friction testing, local development,
 * and serverless environments when DATABASE_URL is not yet configured.
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
    const demoFamily: Family = {
      id: 'fam_dongthap_001',
      name: 'Gia đình Bác Ba & Bé An',
      code: 'NHIP-8868',
      qrPayload: JSON.stringify({
        version: '1.0',
        app: 'nhipnha',
        familyId: 'fam_dongthap_001',
        familyCode: 'NHIP-8868',
        familyName: 'Gia đình Bác Ba & Bé An',
        token: 'tok_demo_secure_8868',
        suggestedRole: 'CHILD',
        suggestedName: 'Bé An (8 tuổi)',
        generatedAt: Date.now(),
      }),
      addressProvince: 'Đồng Tháp',
      createdAt: new Date().toISOString(),
    };

    const childMember: Member = {
      id: 'mem_child_an',
      familyId: 'fam_dongthap_001',
      name: 'Bé An',
      role: 'CHILD',
      avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      deviceId: 'dev_old_android_redmi',
      createdAt: new Date().toISOString(),
    };

    const parentMember: Member = {
      id: 'mem_parent_hoa',
      familyId: 'fam_dongthap_001',
      name: 'Mẹ Hoa (Công nhân KCN Bình Dương)',
      role: 'PARENT',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      deviceId: 'dev_samsung_a12',
      createdAt: new Date().toISOString(),
    };

    const grandparentMember: Member = {
      id: 'mem_grand_ba',
      familyId: 'fam_dongthap_001',
      name: 'Bà Nội Bảy',
      role: 'GRANDPARENT',
      avatarUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=150',
      deviceId: 'dev_oppo_a3s',
      createdAt: new Date().toISOString(),
    };

    this.families.set(demoFamily.id, demoFamily);
    this.members.set(childMember.id, childMember);
    this.members.set(parentMember.id, parentMember);
    this.members.set(grandparentMember.id, grandparentMember);

    // Seed morning & afternoon checkin
    this.checkIns.push({
      id: 'chk_morning_today',
      familyId: 'fam_dongthap_001',
      memberId: 'mem_child_an',
      memberName: 'Bé An',
      rhythmType: 'MORNING',
      note: 'Con thức dậy rồi, chuẩn bị ăn sáng với nội đi học!',
      syncStatus: 'SYNCED',
      createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    });

    this.checkIns.push({
      id: 'chk_afternoon_today',
      familyId: 'fam_dongthap_001',
      memberId: 'mem_child_an',
      memberName: 'Bé An',
      rhythmType: 'AFTERNOON',
      mood: 'JOYFUL',
      note: 'Chiều nay con được cô khen vẽ hoa sen đẹp, nhưng con nhớ mẹ xíu.',
      voiceDurationSec: 14,
      voiceUrl: 'mock://audio/chieu-be-an-14s.aac',
      waveform: [15, 30, 65, 80, 95, 70, 45, 90, 85, 40, 20],
      syncStatus: 'SYNCED',
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    });

    // Seed bedtime message from parent
    this.messages.push({
      id: 'msg_evening_yesterday',
      familyId: 'fam_dongthap_001',
      senderId: 'mem_parent_hoa',
      senderName: 'Mẹ Hoa',
      recipientId: 'mem_child_an',
      rhythmType: 'EVENING',
      durationSec: 25,
      audioUrl: 'mock://audio/dan-do-me-hoa.aac',
      transcription: 'An ơi, mẹ tăng ca xong rồi nè. Con nhớ uống ly nước ấm bà pha rồi đi ngủ sớm nhé. Cuối tuần mẹ về mua sách màu cho con!',
      aiSummary: 'Mẹ đã hoàn thành ca làm, dặn con uống nước ấm và ngủ sớm, hứa cuối tuần về mua sách màu.',
      aiSuggestedPrompts: [
        'Hôm nay ở lớp có tranh bạn nào vẽ đẹp cùng con không?',
        'Bà nấu món canh gì cho An ăn chiều thế?',
        'Con ngủ ngoan nhé, mẹ thương An nhiều!'
      ],
      listenedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    });
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
}

// Global singleton memory repo
const globalRepo = global as unknown as { __memoryRepo?: MemoryRepository };
if (!globalRepo.__memoryRepo) {
  globalRepo.__memoryRepo = new MemoryRepository();
}

export const memoryStore = globalRepo.__memoryRepo;
