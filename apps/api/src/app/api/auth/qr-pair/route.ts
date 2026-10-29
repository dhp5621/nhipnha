import { NextResponse } from 'next/server';
import { memoryStore } from '@/db';
import type { QRPairingPayload, Role } from '@nhipnha/shared';

export const dynamic = 'force-dynamic';

// POST: Validate or generate QR Pairing session (Zero-type login)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, qrPayload, code, memberRole, memberName, deviceId } = body;

    // 1. Generation action: Create a new QR pairing code for a family
    if (action === 'generate') {
      const familyId = `fam_${Date.now().toString(36)}`;
      const familyCode = `NHIP-${Math.floor(1000 + Math.random() * 9000)}`;
      const familyName = body.familyName || 'Gia đình Nhịp Nhà';

      const payload: QRPairingPayload = {
        version: '1.0',
        app: 'nhipnha',
        familyId,
        familyCode,
        familyName,
        token: `tok_${Math.random().toString(36).substring(2)}`,
        suggestedRole: memberRole || 'CHILD',
        suggestedName: memberName || 'Bé Nhỏ',
        generatedAt: Date.now(),
      };

      const family = memoryStore.saveFamily({
        id: familyId,
        code: familyCode,
        name: familyName,
        qrPayload: JSON.stringify(payload),
        addressProvince: body.addressProvince || 'Đồng Tháp',
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        family,
        qrPayload: payload,
      });
    }

    // 2. Pair action: Zero-type 1-touch pairing via scanned QR data or 4-digit code
    let matchedFamily;
    let targetRole: Role = (memberRole as Role) || 'CHILD';
    let targetName = memberName;

    if (qrPayload) {
      try {
        const parsed: QRPairingPayload = typeof qrPayload === 'string' ? JSON.parse(qrPayload) : qrPayload;
        matchedFamily = memoryStore.getFamily(parsed.familyId) || memoryStore.getFamilyByCode(parsed.familyCode);
        if (parsed.suggestedRole) targetRole = parsed.suggestedRole;
        if (parsed.suggestedName && !targetName) targetName = parsed.suggestedName;
      } catch {
        // Fallback search by string code
        matchedFamily = memoryStore.getFamilyByCode(qrPayload);
      }
    } else if (code) {
      matchedFamily = memoryStore.getFamilyByCode(code);
    }

    // If family is not found in memory, fallback to the default demo family
    if (!matchedFamily) {
      matchedFamily = memoryStore.getFamily('fam_dongthap_001');
    }

    if (!matchedFamily) {
      return NextResponse.json(
        { success: false, error: 'Mã QR hoặc mã ghép đôi không hợp lệ. Vui lòng thử lại!' },
        { status: 404 }
      );
    }

    // Auto-create or link member to this device
    const memberId = `mem_${targetRole.toLowerCase()}_${Date.now().toString(36)}`;
    const newMember = memoryStore.saveMember({
      id: memberId,
      familyId: matchedFamily.id,
      name: targetName || (targetRole === 'CHILD' ? 'Bé An' : targetRole === 'PARENT' ? 'Bố/Mẹ' : 'Ông/Bà'),
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

// GET: Return active demo QR payload for quick testing
export async function GET() {
  const demoFamily = memoryStore.getFamily('fam_dongthap_001');
  return NextResponse.json({
    family: demoFamily,
    demoCode: demoFamily?.code || 'NHIP-8868',
    qrPayload: demoFamily?.qrPayload,
  });
}
