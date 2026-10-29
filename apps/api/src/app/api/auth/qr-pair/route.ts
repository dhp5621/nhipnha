import { NextResponse } from 'next/server';
import { dataRepository } from '@/db';
import type { QRPairingPayload, Role } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

// POST: Validate or generate QR Pairing session (Zero-type login)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, qrPayload, code, memberRole, memberName, deviceId } = body;

    // 1. Generation action: Create a new QR pairing code for a family in database
    if (action === 'generate') {
      const familyId = `fam_${Date.now().toString(36)}`;
      const familyCode = `NHIP-${Math.floor(1000 + Math.random() * 9000)}`;
      const familyName = body.familyName || 'Gia đình Nhịp Nhà';
      const targetRole: Role = (memberRole as Role) || 'PARENT';
      const targetName =
        memberName ||
        (targetRole === 'CHILD' ? 'Con' : targetRole === 'PARENT' ? 'Bố / Mẹ' : 'Ông / Bà');

      const payload: QRPairingPayload = {
        version: '1.0',
        app: 'nhipnha',
        familyId,
        familyCode,
        familyName,
        token: `tok_${Math.random().toString(36).substring(2)}`,
        suggestedRole: targetRole,
        suggestedName: targetName,
        generatedAt: Date.now(),
      };

      const family = await dataRepository.saveFamily({
        id: familyId,
        code: familyCode,
        name: familyName,
        qrPayload: JSON.stringify(payload),
        addressProvince: body.addressProvince || 'Việt Nam',
        createdAt: new Date().toISOString(),
      });

      const memberId = `mem_${targetRole.toLowerCase()}_${Date.now().toString(36)}`;
      const member = await dataRepository.saveMember({
        id: memberId,
        familyId: family.id,
        name: targetName,
        role: targetRole,
        deviceId: deviceId || `dev_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        family,
        member,
        qrPayload: payload,
      });
    }

    // 2. Pair action: Zero-type 1-touch pairing via scanned QR data or family code
    let matchedFamily;
    let targetRole: Role = (memberRole as Role) || 'CHILD';
    let targetName = memberName;

    if (qrPayload) {
      try {
        const parsed: QRPairingPayload =
          typeof qrPayload === 'string' ? JSON.parse(qrPayload) : qrPayload;
        if (parsed.familyId) {
          matchedFamily = await dataRepository.getFamily(parsed.familyId);
        }
        if (!matchedFamily && parsed.familyCode) {
          matchedFamily = await dataRepository.getFamilyByCode(parsed.familyCode);
        }
        if (parsed.suggestedRole && !memberRole) targetRole = parsed.suggestedRole;
        if (parsed.suggestedName && !targetName) targetName = parsed.suggestedName;
      } catch {
        matchedFamily = await dataRepository.getFamilyByCode(String(qrPayload));
      }
    } else if (code) {
      matchedFamily = await dataRepository.getFamilyByCode(String(code));
    }

    if (!matchedFamily) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mã gia đình không tồn tại trên hệ thống. Vui lòng kiểm tra lại hoặc dùng mã mẫu NHIP-8868.',
        },
        { status: 404 }
      );
    }

    // Reuse existing member of the same role in the family if found, or create a new member
    const existingMembers = await dataRepository.getMembers(matchedFamily.id);
    const matchedRoleMember = existingMembers.find((m) => m.role === targetRole);

    if (matchedRoleMember && (!targetName || targetName === matchedRoleMember.name)) {
      return NextResponse.json({
        success: true,
        message: 'Ghép đôi gia đình thành công!',
        family: matchedFamily,
        member: matchedRoleMember,
      });
    }

    const memberId = `mem_${targetRole.toLowerCase()}_${Date.now().toString(36)}`;
    const newMember = await dataRepository.saveMember({
      id: memberId,
      familyId: matchedFamily.id,
      name:
        targetName ||
        matchedRoleMember?.name ||
        (targetRole === 'CHILD' ? 'Con' : targetRole === 'PARENT' ? 'Bố / Mẹ' : 'Ông / Bà'),
      role: targetRole,
      deviceId: deviceId || `dev_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Ghép đôi gia đình thành công!',
      family: matchedFamily,
      member: newMember,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi xử lý ghép đôi QR' },
      { status: 500 }
    );
  }
}

// GET: Return active demo QR payload from database
export async function GET() {
  const demoFamily = await dataRepository.getFamily('fam_dongthap_001');
  return NextResponse.json({
    family: demoFamily,
    demoCode: demoFamily?.code || 'NHIP-8868',
    qrPayload: demoFamily?.qrPayload,
  });
}
