# Nhịp Nhà – Gần nhau dù cách xa (Home Rhythm)
### Đề án RBPC 2026 • Hướng tới SDG 3, 4, 8

Monorepo hoàn chỉnh xây dựng bằng **Turborepo** và **pnpm**, bao gồm:
1. `apps/api`: **Next.js Serverless API** (sẵn sàng deploy Vercel), kết nối **Neon / PostgreSQL** thông qua **Drizzle ORM** (kèm bộ nhớ đệm in-memory fallback mượt mà khi chạy demo ngoại tuyến). Quản lý 4 thực thể chính: `Family`, `Member`, `CheckIn`, `Messages`.
2. `apps/mobile`: **Expo React Native (TypeScript, Tailwind/NativeWind)** thiết kế riêng cho **trẻ em nông thôn (6–12 tuổi)** và **ông bà già yếu (65–70 tuổi)** sử dụng điện thoại Android đời cũ / giá rẻ:
   - **Zero-Type Login**: Ghép đôi một chạm bằng mã QR dán ở quê, không cần gõ mật khẩu hay chờ SMS OTP.
   - **Luồng Trẻ Em "3 Nhịp Gắn Kết"**:
     - ☀️ **Chạm Sáng**: Báo thức, chào ngày mới một chạm trước khi cắp sách đến trường.
     - 🎒 **Chạm Chiều**: Chọn 4 cảm xúc thân thiện (*Vui vẻ 😄, Bình yên ⛅, Hơi mệt 🌧️, Cần ôm 🫂*) kèm ghi âm giọng nói 15 giây (có đồng hồ đếm ngược, sóng âm waveform, lưu trữ offline-first và hoãn tải audio thật).
     - 🌙 **Chạm Tối**: Nghe giọng dặn dò ấm áp từ ba mẹ sau giờ tan ca trước khi đi ngủ.
   - **Luồng Phụ Huynh (Công nhân làm việc xa)**:
     - Dòng thời gian nhật ký ngày của con.
     - **Trợ Lý Thấu Cảm (AI Empathy Assistant)**: Tóm tắt trung thực cảm xúc của con và gợi ý 2–3 câu hỏi mở phản hồi trong 30 giây để **tránh hoàn toàn việc tra khảo điểm số** ("Hôm nay được mấy điểm?").
     - Nút ghi âm phản hồi nhanh 30 giây gửi về quê cho con.
   - **Chuẩn Accessibility Đặc Biệt**:
     - Nút bấm to $\ge 56\text{px}$ (nút chính đạt $68\text{px} - 72\text{px}$).
     - Font chữ cực lớn (20px – 34px), tương phản cao theo WCAG AAA.
     - Màu sắc ấm cúng, ngôn từ mộc mạc làng quê Việt Nam.

---

## 📁 Cấu Trúc Monorepo

```tree
nhipnha/
├── apps/
│   ├── api/                     # Next.js Serverless API (Vercel) + Neon / Drizzle ORM
│   │   ├── drizzle/             # Drizzle migrations
│   │   ├── src/
│   │   │   ├── app/api/
│   │   │   │   ├── auth/qr-pair/route.ts      # Zero-type QR pairing & session
│   │   │   │   ├── auth/session/route.ts      # Member & family profile
│   │   │   │   ├── checkins/route.ts          # Ghi nhận nhịp sáng/chiều/tối & sync batch
│   │   │   │   ├── family/timeline/route.ts   # Tổng hợp timeline 3 nhịp
│   │   │   │   ├── ai/empathy-assistant/      # AI Thấu Cảm tránh hỏi điểm số
│   │   │   │   ├── messages/route.ts          # Gửi và nghe lời dặn dò tối
│   │   │   │   └── health/route.ts            # Health check & SDG metadata
│   │   │   ├── db/
│   │   │   │   ├── schema.ts                  # PostgreSQL schema (Family, Member, CheckIn, Messages)
│   │   │   │   └── index.ts                   # Neon client + In-memory fallback
│   │   │   └── drizzle.config.ts
│   │   ├── next.config.js
│   │   └── package.json
│   └── mobile/                  # Expo React Native (Accessible UI)
│       ├── src/
│       │   ├── components/
│       │   │   ├── BigButton.tsx              # Nút bấm >=56px, tương phản cao
│       │   │   ├── AccessibleText.tsx         # Typography cực lớn
│       │   │   ├── AudioWaveform.tsx          # Sóng âm + đếm ngược 15s/30s
│       │   │   ├── EmotionSelector.tsx        # 4 biểu tượng cảm xúc thân thiện
│       │   │   └── EmpathyPromptCard.tsx      # Thẻ gợi ý câu hỏi mở cho phụ huynh
│       │   ├── constants/
│       │   │   └── theme.ts                   # Bảng màu, kích thước chuẩn Accessibility
│       │   ├── context/
│       │   │   ├── AuthContext.tsx            # Zero-type pairing context
│       │   │   └── RhythmContext.tsx          # Quản lý 3 nhịp gắn kết & offline sync
│       │   ├── screens/
│       │   │   ├── QRLoginScreen.tsx          # Ghép đôi QR một chạm
│       │   │   ├── ChildHomeScreen.tsx        # Màn hình chính 3 Nhịp của trẻ
│       │   │   ├── MorningTouchScreen.tsx     # Chạm sáng chào ngày mới
│       │   │   ├── AfternoonTouchScreen.tsx   # Chạm chiều 4 cảm xúc + voice 15s
│       │   │   ├── EveningTouchScreen.tsx     # Chạm tối nghe lời dặn dò
│       │   │   ├── ParentDashboardScreen.tsx  # Timeline con + AI Thấu Cảm + Voice 30s
│       │   │   └── RoleSwitchScreen.tsx       # Chuyển đổi vai để demo tiện lợi
│       │   ├── services/
│       │   │   ├── api.ts                     # API Client có fallback
│       │   │   └── offlineStorage.ts          # AsyncStorage queue cho kết nối ngoại tuyến
│       ├── App.tsx
│       ├── app.json
│       ├── babel.config.js
│       ├── tailwind.config.js
│       └── package.json
├── packages/
│   └── shared/                  # Thư viện dùng chung (types, constants, models)
│       ├── src/index.ts
│       └── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### 1. Cài đặt các gói phụ thuộc (Dependencies)
```bash
pnpm install
```

### 2. Thiết lập Biến Môi Trường (Tùy chọn)
Nếu kết nối Neon PostgreSQL thật:
```bash
# apps/api/.env.local
DATABASE_URL="postgres://user:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
```
*(Lưu ý: Hệ thống đã tích hợp sẵn in-memory database mock tự động nạp dữ liệu gia đình Bé An & Mẹ Hoa để chạy ngay mà không cần cấu hình database).*

### 3. Chạy Khởi Động Đồng Thời (Turborepo)
```bash
# Khởi động toàn bộ Monorepo (Next.js API + Expo Mobile)
pnpm dev

# Hoặc chỉ chạy riêng API Vercel
pnpm --filter @nhipnha/api dev

# Hoặc chỉ chạy riêng ứng dụng Expo Mobile
pnpm --filter @nhipnha/mobile start
```

---

## 🎯 Giá Trị Xã Hội & Các Mục Tiêu Phát Triển Bền Vững (SDG)
- **SDG 3 (Good Health and Well-being)**: Nâng cao sức khỏe tinh thần, giảm trầm cảm và cảm giác bị bỏ rơi ở trẻ em sống xa cha mẹ; xoa dịu stress sau giờ làm của phụ huynh công nhân.
- **SDG 4 (Quality Education)**: Thay đổi cách phụ huynh tiếp cận giáo dục con cái từ xa—chuyển từ việc tra vấn điểm số khô khan sang đồng hành tâm lý và lắng nghe cảm xúc học đường.
- **SDG 8 (Decent Work and Economic Growth)**: Hỗ trợ người lao động di cư tại các khu chế xuất, khu công nghiệp giữ vững kết nối gia đình, an tâm lao động sản xuất.
