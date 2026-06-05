# FRONTEND — AI Avatar Nói Chuyện Realtime (Lip-sync)
# Hướng dẫn tích hợp vào màn hình Phỏng vấn Voice

> **Ngày:** 2026-06-05  
> **Áp dụng cho:** `VoiceLivePage` — màn hình phỏng vấn realtime đang diễn ra  
> **Không cần thay đổi Backend**

---

## Mục tiêu

Khi AI interviewer đang nói, avatar trên màn hình phải:
- ✅ Miệng mở/đóng **đúng nhịp theo tiếng**
- ✅ Mắt chớp tự nhiên
- ✅ Biểu cảm thay đổi (lắng nghe / đang nói)
- ✅ Không có delay nhận ra
- ✅ Hoàn toàn offline — không cần API ngoài

---

## Kiến trúc tổng quan

```
AI Audio Stream (WebRTC ontrack)
        ↓
Web Audio API — AnalyserNode
        ↓
Đọc frequency data mỗi 30ms (animation frame)
        ↓
Map tần số âm thanh → Viseme (hình miệng)
        ↓
Render avatar lên <canvas> hoặc SVG
```

---

## Phần 1 — Phân tích Audio Realtime (Web Audio API)

Khi WebRTC nhận audio stream từ AI (`pc.ontrack`), ta pipe stream đó qua `AnalyserNode` để đọc dữ liệu tần số theo thời gian thực.

### File: `lib/realtime/avatarAudioAnalyser.ts`

```typescript
export interface AudioAnalysisResult {
  volume: number;          // 0.0 → 1.0  — tổng âm lượng
  lowFreq: number;         // 0.0 → 1.0  — tần số thấp (nguyên âm ồ, a, u)
  midFreq: number;         // 0.0 → 1.0  — tần số trung (phụ âm b, p, m)
  highFreq: number;        // 0.0 → 1.0  — tần số cao (s, t, ch)
  isSpeaking: boolean;     // true khi volume > ngưỡng
}

export class AvatarAudioAnalyser {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private onFrame: ((result: AudioAnalysisResult) => void) | null = null;

  /** Kết nối với audio stream nhận từ WebRTC (pc.ontrack) */
  connect(stream: MediaStream, onFrame: (result: AudioAnalysisResult) => void) {
    this.onFrame = onFrame;
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;           // 128 frequency bins
    this.analyser.smoothingTimeConstant = 0.6; // làm mượt chuyển động

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.source = this.audioCtx.createMediaStreamSource(stream);
    this.source.connect(this.analyser);

    this.tick();
  }

  private tick() {
    this.animFrameId = requestAnimationFrame(() => this.tick());
    if (!this.analyser || !this.dataArray || !this.onFrame) return;

    this.analyser.getByteFrequencyData(this.dataArray);

    const binCount = this.dataArray.length; // 128 bins

    // Chia 3 dải tần số
    const lowEnd  = Math.floor(binCount * 0.1);  // bins 0–12
    const midEnd  = Math.floor(binCount * 0.4);  // bins 13–51
    // highEnd      = bins 52–127

    const avg = (start: number, end: number) => {
      let sum = 0;
      for (let i = start; i < end; i++) sum += this.dataArray![i];
      return sum / ((end - start) * 255); // normalize 0→1
    };

    const lowFreq  = avg(0, lowEnd);
    const midFreq  = avg(lowEnd, midEnd);
    const highFreq = avg(midEnd, binCount);
    const volume   = avg(0, binCount);

    this.onFrame({
      volume,
      lowFreq,
      midFreq,
      highFreq,
      isSpeaking: volume > 0.03, // ngưỡng phát hiện đang nói
    });
  }

  disconnect() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.source?.disconnect();
    this.audioCtx?.close();
    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;
  }
}
```

---

## Phần 2 — Map Tần Số → Viseme (Hình Miệng)

Viseme là các trạng thái hình miệng tương ứng với âm thanh. Ta dùng đơn giản hóa với **6 hình miệng**:

```typescript
// lib/realtime/visemeMapper.ts

export type Viseme = 'closed' | 'small' | 'mid' | 'wide' | 'round' | 'teeth';

export function getViseme(analysis: AudioAnalysisResult): Viseme {
  if (!analysis.isSpeaking) return 'closed';

  const { lowFreq, midFreq, highFreq, volume } = analysis;

  // Tần số cao (s, t, ch) → miệng hơi mở thấy răng
  if (highFreq > 0.5 && volume > 0.1) return 'teeth';

  // Tần số thấp cao (a, o, u) → miệng mở tròn
  if (lowFreq > 0.4) return 'round';

  // Âm lượng lớn + tần số trung → mở rộng
  if (volume > 0.5) return 'wide';

  // Âm lượng trung bình
  if (volume > 0.2) return 'mid';

  // Âm lượng nhỏ
  if (volume > 0.05) return 'small';

  return 'closed';
}
```

---

## Phần 3 — Avatar Component (Canvas Render)

Vẽ khuôn mặt AI bằng Canvas 2D thuần — không cần thư viện ngoài. Đây là cách nhanh nhất, hoàn toàn kiểm soát được.

### File: `components/interview/AIAvatar.tsx`

```tsx
import { useRef, useEffect, useState, useCallback } from 'react';
import { AvatarAudioAnalyser, AudioAnalysisResult } from '@/lib/realtime/avatarAudioAnalyser';
import { getViseme, Viseme } from '@/lib/realtime/visemeMapper';

interface AIAvatarProps {
  audioStream: MediaStream | null;  // stream nhận từ pc.ontrack
  isAISpeaking?: boolean;           // có thể override từ bên ngoài
  size?: number;                    // kích thước canvas, default 280
}

// Màu sắc avatar
const COLORS = {
  skinLight:   '#FDDBB4',
  skinShade:   '#F5C49A',
  hairDark:    '#2C1A0E',
  eyeWhite:    '#FFFFFF',
  eyeIris:     '#2B5797',
  eyePupil:    '#0D0D0D',
  mouthInner:  '#C0392B',
  teethWhite:  '#F8F8F8',
  lipUpper:    '#E07B6A',
  lipLower:    '#D4695A',
  collar:      '#1A2B4A',
  shirt:       '#2C3E6B',
  glow:        'rgba(99, 179, 237, 0.35)',
};

// Định nghĩa hình dạng miệng theo viseme
const MOUTH_SHAPES: Record<Viseme, {
  openY: number;      // độ mở theo chiều dọc (0=đóng → 1=mở rộng)
  wideX: number;      // độ rộng ngang (0→1)
  curveUp: number;    // độ cong khóe miệng (>0 = cười, <0 = nghiêm)
  showTeeth: boolean;
}> = {
  closed: { openY: 0,    wideX: 0.7, curveUp:  0.15, showTeeth: false },
  small:  { openY: 0.15, wideX: 0.65, curveUp: 0.05, showTeeth: false },
  mid:    { openY: 0.35, wideX: 0.75, curveUp: 0,    showTeeth: false },
  wide:   { openY: 0.55, wideX: 0.9,  curveUp: 0,    showTeeth: true  },
  round:  { openY: 0.6,  wideX: 0.6,  curveUp: -0.05,showTeeth: false },
  teeth:  { openY: 0.25, wideX: 0.85, curveUp: 0.1,  showTeeth: true  },
};

export function AIAvatar({ audioStream, size = 280 }: AIAvatarProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AvatarAudioAnalyser | null>(null);

  // State nội tại của avatar (được lerp mượt)
  const stateRef = useRef({
    currentOpenY:  0,
    currentWideX:  0.7,
    currentCurve:  0.15,
    blinkProgress: 1,       // 1 = mắt mở hoàn toàn
    nextBlinkAt:   Date.now() + 2000 + Math.random() * 3000,
    isSpeaking:    false,
    glowAlpha:     0,
    headBobY:      0,       // nhúc nhích đầu nhẹ khi nói
    headBobPhase:  0,
    showTeeth:     false,
    viseme:        'closed' as Viseme,
  });

  const drawFrame = useCallback((
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    analysis: AudioAnalysisResult | null
  ) => {
    const s = stateRef.current;
    const now = Date.now();

    // ── Xác định viseme mục tiêu ──────────────────────────────────────
    const targetViseme = analysis ? getViseme(analysis) : 'closed';
    const target = MOUTH_SHAPES[targetViseme];

    // ── Lerp mượt miệng (tránh giật) ─────────────────────────────────
    const lerpSpeed = 0.25;
    s.currentOpenY = lerp(s.currentOpenY, target.openY, lerpSpeed);
    s.currentWideX = lerp(s.currentWideX, target.wideX, lerpSpeed);
    s.currentCurve = lerp(s.currentCurve, target.curveUp, lerpSpeed);
    s.showTeeth    = target.showTeeth && s.currentOpenY > 0.2;

    // ── Blink tự nhiên ───────────────────────────────────────────────
    if (now >= s.nextBlinkAt) {
      s.blinkProgress = 0;
      s.nextBlinkAt = now + 2500 + Math.random() * 4000;
    }
    if (s.blinkProgress < 1) {
      s.blinkProgress = Math.min(1, s.blinkProgress + 0.12);
    }
    const blinkY = s.blinkProgress < 0.5
      ? s.blinkProgress * 2       // đóng (0→1)
      : (1 - s.blinkProgress) * 2; // mở (1→0)
    const eyeOpenRatio = blinkY; // 0 = nhắm, 1 = mở hoàn toàn

    // ── Glow khi nói ─────────────────────────────────────────────────
    const targetGlow = analysis?.isSpeaking ? 1 : 0;
    s.glowAlpha = lerp(s.glowAlpha, targetGlow, 0.08);

    // ── Head bob nhẹ khi đang nói ────────────────────────────────────
    if (analysis?.isSpeaking) {
      s.headBobPhase += 0.04;
      s.headBobY = Math.sin(s.headBobPhase) * 2;
    } else {
      s.headBobY = lerp(s.headBobY, 0, 0.1);
    }

    // ── Vẽ ───────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2 + s.headBobY;

    // Background glow
    if (s.glowAlpha > 0.01) {
      const grd = ctx.createRadialGradient(cx, cy, 20, cx, cy, W * 0.55);
      grd.addColorStop(0, `rgba(99, 179, 237, ${s.glowAlpha * 0.4})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, W * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cổ áo / thân
    drawBody(ctx, cx, cy, W, H);

    // Khuôn mặt (oval)
    drawFace(ctx, cx, cy, W);

    // Tóc
    drawHair(ctx, cx, cy, W);

    // Mắt
    drawEyes(ctx, cx, cy, W, eyeOpenRatio);

    // Mũi
    drawNose(ctx, cx, cy, W);

    // Miệng
    drawMouth(ctx, cx, cy, W, {
      openY: s.currentOpenY,
      wideX: s.currentWideX,
      curveUp: s.currentCurve,
      showTeeth: s.showTeeth,
    });

  }, []);

  // Vẽ body / áo
  function drawBody(ctx: CanvasRenderingContext2D, cx: number, cy: number, W: number, H: number) {
    const bodyY = cy + W * 0.38;
    ctx.fillStyle = COLORS.shirt;
    ctx.beginPath();
    ctx.ellipse(cx, bodyY, W * 0.38, H * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cổ áo (V-neck)
    ctx.fillStyle = COLORS.collar;
    ctx.beginPath();
    ctx.moveTo(cx - W * 0.06, bodyY - H * 0.05);
    ctx.lineTo(cx, bodyY + H * 0.04);
    ctx.lineTo(cx + W * 0.06, bodyY - H * 0.05);
    ctx.fill();
  }

  // Vẽ khuôn mặt
  function drawFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, W: number) {
    // Bóng / shadow
    ctx.fillStyle = COLORS.skinShade;
    ctx.beginPath();
    ctx.ellipse(cx + 2, cy + 3, W * 0.31, W * 0.37, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mặt chính
    ctx.fillStyle = COLORS.skinLight;
    ctx.beginPath();
    ctx.ellipse(cx, cy, W * 0.31, W * 0.37, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vẽ tóc
  function drawHair(ctx: CanvasRenderingContext2D, cx: number, cy: number, W: number) {
    ctx.fillStyle = COLORS.hairDark;
    // Phần tóc trên đầu
    ctx.beginPath();
    ctx.ellipse(cx, cy - W * 0.22, W * 0.32, W * 0.2, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // Tóc mai bên trái
    ctx.beginPath();
    ctx.ellipse(cx - W * 0.28, cy - W * 0.05, W * 0.07, W * 0.14, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Tóc mai bên phải
    ctx.beginPath();
    ctx.ellipse(cx + W * 0.28, cy - W * 0.05, W * 0.07, W * 0.14, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vẽ mắt
  function drawEyes(ctx: CanvasRenderingContext2D, cx: number, cy: number, W: number, eyeOpenRatio: number) {
    const eyeY   = cy - W * 0.05;
    const eyeOffX = W * 0.11;
    const eyeRX  = W * 0.065;
    const eyeRY  = W * 0.07 * Math.max(0.05, eyeOpenRatio);

    for (const side of [-1, 1]) {
      const ex = cx + side * eyeOffX;

      // Lòng trắng
      ctx.fillStyle = COLORS.eyeWhite;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeRX, eyeRY, 0, 0, Math.PI * 2);
      ctx.fill();

      if (eyeOpenRatio > 0.15) {
        // Con ngươi (iris)
        const irisR = eyeRX * 0.62;
        ctx.fillStyle = COLORS.eyeIris;
        ctx.beginPath();
        ctx.arc(ex, eyeY, irisR, 0, Math.PI * 2);
        ctx.fill();

        // Đồng tử
        ctx.fillStyle = COLORS.eyePupil;
        ctx.beginPath();
        ctx.arc(ex, eyeY, irisR * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(ex - irisR * 0.25, eyeY - irisR * 0.3, irisR * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Lông mày
      const browY  = eyeY - eyeRY - W * 0.03;
      const browLX = ex - eyeRX * 0.85;
      const browRX = ex + eyeRX * 0.85;
      ctx.strokeStyle = COLORS.hairDark;
      ctx.lineWidth   = W * 0.025;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(browLX, browY + (side === -1 ? 1 : 0));
      ctx.quadraticCurveTo(ex, browY - W * 0.015, browRX, browY + (side === 1 ? 1 : 0));
      ctx.stroke();
    }
  }

  // Vẽ mũi
  function drawNose(ctx: CanvasRenderingContext2D, cx: number, cy: number, W: number) {
    const noseY = cy + W * 0.06;
    ctx.strokeStyle = COLORS.skinShade;
    ctx.lineWidth   = W * 0.018;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - W * 0.035, noseY - W * 0.03);
    ctx.quadraticCurveTo(cx - W * 0.04, noseY + W * 0.02, cx, noseY + W * 0.025);
    ctx.quadraticCurveTo(cx + W * 0.04, noseY + W * 0.02, cx + W * 0.035, noseY - W * 0.03);
    ctx.stroke();
  }

  // Vẽ miệng (phần quan trọng nhất)
  function drawMouth(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    W: number,
    shape: { openY: number; wideX: number; curveUp: number; showTeeth: boolean }
  ) {
    const mouthY  = cy + W * 0.18;
    const mouthW  = W * 0.18 * shape.wideX;  // nửa chiều rộng
    const openH   = W * 0.12 * shape.openY;  // độ mở
    const curveOff = W * 0.05 * shape.curveUp;

    if (shape.openY < 0.02) {
      // Miệng đóng — chỉ vẽ đường khép
      ctx.strokeStyle = COLORS.lipLower;
      ctx.lineWidth   = W * 0.022;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - mouthW, mouthY);
      ctx.quadraticCurveTo(cx, mouthY - curveOff * 2, cx + mouthW, mouthY);
      ctx.stroke();
      return;
    }

    // Khoang miệng tối
    ctx.fillStyle = COLORS.mouthInner;
    ctx.beginPath();
    ctx.moveTo(cx - mouthW, mouthY);
    ctx.quadraticCurveTo(cx, mouthY - curveOff, cx + mouthW, mouthY);
    ctx.quadraticCurveTo(cx + mouthW * 0.9, mouthY + openH, cx, mouthY + openH * 1.1);
    ctx.quadraticCurveTo(cx - mouthW * 0.9, mouthY + openH, cx - mouthW, mouthY);
    ctx.fill();

    // Răng (khi mở đủ)
    if (shape.showTeeth && openH > 3) {
      ctx.fillStyle = COLORS.teethWhite;
      ctx.beginPath();
      ctx.rect(
        cx - mouthW * 0.7,
        mouthY,
        mouthW * 1.4,
        Math.min(openH * 0.45, W * 0.04)
      );
      ctx.fill();
    }

    // Môi trên
    ctx.fillStyle = COLORS.lipUpper;
    ctx.beginPath();
    ctx.moveTo(cx - mouthW, mouthY);
    ctx.quadraticCurveTo(cx - mouthW * 0.4, mouthY - W * 0.03 - curveOff, cx, mouthY - W * 0.025 - curveOff);
    ctx.quadraticCurveTo(cx + mouthW * 0.4, mouthY - W * 0.03 - curveOff, cx + mouthW, mouthY);
    ctx.quadraticCurveTo(cx, mouthY + W * 0.008, cx - mouthW, mouthY);
    ctx.fill();

    // Môi dưới
    ctx.fillStyle = COLORS.lipLower;
    ctx.beginPath();
    ctx.moveTo(cx - mouthW * 0.9, mouthY + openH * 0.85);
    ctx.quadraticCurveTo(cx, mouthY + openH * 1.25, cx + mouthW * 0.9, mouthY + openH * 0.85);
    ctx.quadraticCurveTo(cx, mouthY + openH * 1.0, cx - mouthW * 0.9, mouthY + openH * 0.85);
    ctx.fill();
  }

  // Lerp helper
  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  // ── Effect: Kết nối audio stream ──────────────────────────────────────
  useEffect(() => {
    if (!audioStream) return;

    analyserRef.current = new AvatarAudioAnalyser();
    let latestAnalysis: AudioAnalysisResult | null = null;

    analyserRef.current.connect(audioStream, (result) => {
      latestAnalysis = result;
    });

    // Vòng render độc lập
    let rafId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const loop = () => {
      drawFrame(ctx, canvas.width, canvas.height, latestAnalysis);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      analyserRef.current?.disconnect();
    };
  }, [audioStream, drawFrame]);

  // Render idle animation khi không có audio
  useEffect(() => {
    if (audioStream) return; // đã có audio, bỏ qua
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let rafId: number;
    const loop = () => {
      drawFrame(ctx, canvas.width, canvas.height, null);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [audioStream, drawFrame]);

  return (
    <div className="ai-avatar-wrapper">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          boxShadow: '0 0 40px rgba(99,179,237,0.2)',
        }}
      />
    </div>
  );
}
```

---

## Phần 4 — Tích hợp vào VoiceLivePage

### Bước 1: Lưu AI audio stream khi nhận từ WebRTC

Trong đoạn xử lý `pc.ontrack` (đã có sẵn ở Phase 5), lưu stream lại:

```tsx
// VoiceLivePage.tsx

const [aiAudioStream, setAiAudioStream] = useState<MediaStream | null>(null);

// Trong openAiWebRtcClient hoặc trực tiếp trong VoiceLivePage:
pc.ontrack = (e) => {
  // Vẫn play audio như cũ
  audioEl.srcObject = e.streams[0];

  // THÊM: lưu stream để Avatar phân tích
  setAiAudioStream(e.streams[0]);
};
```

### Bước 2: Render avatar

```tsx
// VoiceLivePage.tsx — phần JSX

return (
  <div className="voice-live-layout">

    {/* Avatar AI bên trái / trên */}
    <div className="ai-panel">
      <AIAvatar
        audioStream={aiAudioStream}
        size={280}
      />
      <p className="ai-name">AI Interviewer</p>

      {/* Indicator đang nói */}
      <div className={`speaking-indicator ${aiAudioStream ? 'active' : ''}`}>
        <span />
        <span />
        <span />
      </div>
    </div>

    {/* Webcam người dùng bên phải / dưới */}
    <div className="user-panel">
      <video ref={userVideoRef} autoPlay muted className="user-cam" />
    </div>

    {/* Controls */}
    <div className="controls">
      <button onClick={handleEndCall}>Kết thúc phỏng vấn</button>
    </div>
  </div>
);
```

### Bước 3: CSS animation cho speaking indicator

```css
/* Speaking dots animation */
.speaking-indicator {
  display: flex;
  gap: 4px;
  height: 16px;
  align-items: flex-end;
  opacity: 0;
  transition: opacity 0.3s;
}

.speaking-indicator.active {
  opacity: 1;
}

.speaking-indicator span {
  width: 4px;
  background: #63b3ed;
  border-radius: 2px;
  animation: soundWave 0.8s infinite ease-in-out;
}

.speaking-indicator span:nth-child(1) { animation-delay: 0s;    height: 8px;  }
.speaking-indicator span:nth-child(2) { animation-delay: 0.15s; height: 14px; }
.speaking-indicator span:nth-child(3) { animation-delay: 0.3s;  height: 6px;  }

@keyframes soundWave {
  0%, 100% { transform: scaleY(0.4); opacity: 0.6; }
  50%       { transform: scaleY(1);   opacity: 1;   }
}
```

---

## Phần 5 — Cấu trúc file cần tạo

```
src/
├── lib/
│   └── realtime/
│       ├── avatarAudioAnalyser.ts   ← THÊM MỚI
│       └── visemeMapper.ts          ← THÊM MỚI
├── components/
│   └── interview/
│       └── AIAvatar.tsx             ← THÊM MỚI
└── pages/
    └── interview/
        └── voice/
            └── VoiceLivePage.tsx    ← CHỈNH SỬA (thêm aiAudioStream state + AIAvatar)
```

---

## Phần 6 — Checklist kiểm tra

| Hạng mục | Kiểm tra như thế nào |
|---|---|
| Miệng đồng bộ với tiếng AI | Nói câu ngắn, quan sát miệng mở theo âm |
| Miệng đóng khi AI im | Dừng nói, miệng phải khép lại trong ~300ms |
| Mắt chớp tự nhiên | Quan sát ~30 giây, mắt chớp 2–4 lần |
| Không giật/lag | Mở DevTools Performance, FPS phải ≥ 55 |
| Không lỗi khi stream=null | Vào trang trước khi kết nối WebRTC, không crash |
| Hoạt động trên Safari/Firefox | Test cross-browser (Web Audio API được hỗ trợ tất cả) |

---

## Ghi chú quan trọng

> ⚠️ `AudioContext` trên một số trình duyệt cần **user gesture** trước khi khởi tạo.  
> Nếu gặp lỗi `AudioContext was not allowed to start`, hãy khởi tạo `AudioContext` trong handler của sự kiện click (ví dụ: khi user bấm nút "Bắt đầu phỏng vấn"), **không** khởi tạo ngay khi load trang.

```typescript
// Cách xử lý: resume AudioContext sau user gesture
const analyser = new AvatarAudioAnalyser();
// Gọi connect() bên trong onClick handler hoặc sau user interaction đầu tiên
```

> ✅ **Không cần thay đổi gì ở Backend hoặc WebRTC flow hiện tại.**  
> Chỉ cần lấy `e.streams[0]` từ `pc.ontrack` và truyền vào component `AIAvatar` là xong.
