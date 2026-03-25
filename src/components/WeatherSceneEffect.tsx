/**
 * Role: bgKey별 앰비언트 씬 효과 — clear_sunny 외 날씨에 맞는 시각 연출
 * Key Features: rainy(유리 빗방울), misty(안개 입자), windy(낙엽), overcast(구름 그림자), sunset(반딧불 입자)
 * Dependencies: motion/react
 */

import { useMemo } from 'react';
import { motion } from 'motion/react';
import MistyEffect from './MistyEffect';

// ── Rainy: 유리창에 맺히고 흘러내리는 빗방울 ──────────────────
function RainyScene() {
  const drops = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 75,
      size: 4 + Math.random() * 14,
      opacity: 0.12 + Math.random() * 0.30,
      duration: 5 + Math.random() * 9,
      delay: Math.random() * 10,
      isStreak: Math.random() > 0.5,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {drops.map(d =>
        d.isStreak ? (
          // 흘러내리는 물줄기
          <motion.div
            key={d.id}
            style={{
              position: 'absolute',
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: `${d.size * 0.35}px`,
              height: `${d.size * 3.5}px`,
              borderRadius: '50% 50% 50% 50% / 20% 20% 80% 80%',
              background: `rgba(190, 220, 255, ${d.opacity * 0.9})`,
              backdropFilter: 'blur(1px)',
            }}
            animate={{ y: [0, 100 + Math.random() * 80], opacity: [d.opacity, 0] }}
            transition={{
              duration: d.duration * 0.45,
              delay: d.delay,
              repeat: Infinity,
              repeatDelay: 4 + Math.random() * 6,
              ease: 'easeIn',
            }}
          />
        ) : (
          // 유리에 맺힌 동그란 물방울
          <motion.div
            key={d.id}
            style={{
              position: 'absolute',
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              borderRadius: '50%',
              background: `rgba(200, 228, 255, ${d.opacity})`,
              backdropFilter: 'blur(3px)',
              border: '0.5px solid rgba(255,255,255,0.25)',
            }}
            animate={{ scale: [0, 1.1, 1], opacity: [0, d.opacity, d.opacity * 0.7] }}
            transition={{
              duration: 2.2,
              delay: d.delay,
              repeat: Infinity,
              repeatDelay: 5 + Math.random() * 7,
              ease: 'easeOut',
            }}
          />
        )
      )}
    </div>
  );
}

// ── Misty: 안개 입자 천천히 떠다님 ───────────────────────────
function MistyScene() {
  const blobs = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: -15 + Math.random() * 110,
      y: 5 + Math.random() * 75,
      w: 180 + Math.random() * 320,
      h: 90 + Math.random() * 160,
      blur: 45 + Math.random() * 35,
      opacity: 0.06 + Math.random() * 0.10,
      duration: 20 + Math.random() * 22,
      delay: Math.random() * 1.5,  // 12초 → 1.5초로 단축, 바로 등장
      dx: (Math.random() - 0.5) * 120,
      dy: (Math.random() - 0.5) * 60,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {blobs.map(b => (
        <motion.div
          key={b.id}
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.w,
            height: b.h,
            borderRadius: '50%',
            background: 'rgba(215, 228, 240, 1)',
            filter: `blur(${b.blur}px)`,
            opacity: b.opacity,
          }}
          animate={{
            x: [0, b.dx, 0],
            y: [0, b.dy, 0],
            opacity: [b.opacity * 0.7, b.opacity * 1.4, b.opacity * 0.7],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Windy: 낙엽 흩날림 ───────────────────────────────────────
function WindyScene() {
  const COLORS = [
    'rgba(110, 155, 55, 0.75)',
    'rgba(155, 115, 35, 0.75)',
    'rgba(175, 90, 25, 0.70)',
    'rgba(85, 135, 45, 0.75)',
    'rgba(140, 170, 50, 0.70)',
  ];

  const leaves = useMemo(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      startY: 3 + Math.random() * 88,
      size: 9 + Math.random() * 13,
      opacity: 0.55 + Math.random() * 0.35,
      duration: 5 + Math.random() * 8,
      delay: Math.random() * 10,
      rotateStart: Math.random() * 360,
      rotateDelta: 300 + Math.random() * 400,
      dy: (Math.random() - 0.45) * 130,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {leaves.map(l => (
        <motion.div
          key={l.id}
          style={{
            position: 'absolute',
            top: `${l.startY}%`,
            left: '-24px',
            width: l.size,
            height: l.size * 0.65,
            borderRadius: '50% 0 50% 0',
            background: l.color,
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.18))',
          }}
          animate={{
            x: ['0vw', '112vw'],
            y: [0, l.dy],
            rotate: [l.rotateStart, l.rotateStart + l.rotateDelta],
            opacity: [0, l.opacity, l.opacity, 0],
          }}
          transition={{
            duration: l.duration,
            delay: l.delay,
            repeat: Infinity,
            repeatDelay: 0.5 + Math.random() * 3,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// ── Overcast: 구름 그림자 + 주기적 어두워짐 + 차가운 색조 + 산란광 ──
function OvercastScene() {
  // 기존 구름 그림자 밴드
  const bands = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      y: i * 20 + Math.random() * 8,
      height: 14 + Math.random() * 22,
      opacity: 0.035 + Math.random() * 0.055,
      duration: 28 + Math.random() * 32,
      delay: Math.random() * 18,
    })), []);

  // 산란광: 화면 곳곳에 흐릿한 차가운 빛 번짐
  const glows = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 5 + Math.random() * 70,
      size: 200 + Math.random() * 280,
      opacity: 0.04 + Math.random() * 0.06,
      duration: 8 + Math.random() * 10,
      delay: Math.random() * 8,
    })), []);

  // 이슬비: rainy보다 훨씬 얇고 연한 빗줄기
  const drizzles = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 110,
      delay: Math.random() * 5,
      duration: 1.2 + Math.random() * 1.0,
      opacity: 0.06 + Math.random() * 0.10,
      length: 10 + Math.random() * 16,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>

      {/* 차가운 색조 오버레이 — 식물을 가리지 않도록 상단 위주로만 적용 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(100,130,180,0.18) 0%, rgba(80,110,160,0.06) 60%, transparent 100%)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* 주기적 어두워짐 — 하단(식물 영역) 제외, 상단에서 페이드 */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(30,40,65,1) 0%, rgba(30,40,65,0.3) 60%, transparent 100%)',
        }}
        animate={{ opacity: [0.08, 0.22, 0.08] }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          times: [0, 0.45, 1],
          repeatDelay: 3,
        }}
      />

      {/* 산란광 — 차가운 흰빛 blob이 주기적으로 나타났다 사라짐 */}
      {glows.map(g => (
        <motion.div
          key={g.id}
          style={{
            position: 'absolute',
            left: `${g.x}%`,
            top: `${g.y}%`,
            width: g.size,
            height: g.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,220,255,1) 0%, transparent 70%)',
            filter: 'blur(50px)',
            transform: 'translate(-50%, -50%)',
            mixBlendMode: 'screen',
          }}
          animate={{ opacity: [0, g.opacity * 5, 0] }}
          transition={{
            duration: g.duration,
            delay: g.delay,
            repeat: Infinity,
            repeatDelay: 2 + Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* 소용돌이 흐림 — 대형 반투명 blob이 화면 중심에서 느리게 회전 */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '160vw',
          height: '160vw',
          marginTop: '-80vw',
          marginLeft: '-80vw',
          borderRadius: '50%',
          // opacity를 높여 회전이 눈에 띄게
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(90,110,160,0.10) 20%, transparent 40%, rgba(60,85,140,0.08) 60%, transparent 80%, rgba(90,110,160,0.10) 100%)',
          filter: 'blur(35px)',
          mixBlendMode: 'multiply',
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />

      {/* 이슬비 — 얇고 연한 빗줄기, rainy의 1/3 굵기 */}
      {drizzles.map(d => (
        <motion.div
          key={d.id}
          style={{
            position: 'absolute',
            left: `${d.x}%`,
            top: '-20px',
            width: '1px',
            height: `${d.length}px`,
            background: `rgba(180,210,240,${d.opacity * 2.5})`,
            borderRadius: '1px',
          }}
          animate={{ y: ['0vh', '110vh'], opacity: [0, d.opacity * 2.5, d.opacity * 2.5, 0] }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            repeatDelay: Math.random() * 0.8,
            ease: 'linear',
          }}
        />
      ))}

      {/* 기존 구름 그림자 밴드 */}
      {bands.map(b => (
        <motion.div
          key={b.id}
          style={{
            position: 'absolute',
            top: `${b.y}%`,
            left: '-110%',
            width: '160%',
            height: `${b.height}%`,
            background: 'radial-gradient(ellipse at center, rgba(60,70,90,1) 0%, transparent 70%)',
            filter: 'blur(28px)',
            opacity: b.opacity,
          }}
          animate={{ x: ['0%', '140%'] }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// ── Sunset: 반딧불 같은 따뜻한 빛 입자 ──────────────────────
function SunsetScene() {
  const EMBER_COLORS = [
    'rgba(255, 185, 55, 0.9)',
    'rgba(255, 145, 30, 0.9)',
    'rgba(255, 215, 95, 0.9)',
    'rgba(255, 165, 70, 0.9)',
    'rgba(240, 130, 40, 0.85)',
  ];

  const embers = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: 4 + Math.random() * 92,
      startY: 45 + Math.random() * 48,
      size: 3 + Math.random() * 5,
      opacity: 0.45 + Math.random() * 0.45,
      duration: 6 + Math.random() * 9,
      delay: Math.random() * 9,
      riseY: 130 + Math.random() * 120,
      dx: (Math.random() - 0.5) * 90,
      color: EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)],
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      {embers.map(e => (
        <motion.div
          key={e.id}
          style={{
            position: 'absolute',
            left: `${e.x}%`,
            top: `${e.startY}%`,
            width: e.size,
            height: e.size,
            borderRadius: '50%',
            background: e.color,
            boxShadow: `0 0 ${e.size * 2}px ${e.color}, 0 0 ${e.size * 5}px ${e.color}`,
          }}
          animate={{
            y: [0, -e.riseY],
            x: [0, e.dx],
            opacity: [0, e.opacity, e.opacity * 0.8, 0],
            scale: [0.5, 1.1, 0.9, 0.2],
          }}
          transition={{
            duration: e.duration,
            delay: e.delay,
            repeat: Infinity,
            repeatDelay: 0.5 + Math.random() * 2.5,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Clear Sunny: 꽃가루·보케·아지랑이·글리터 ─────────────────
function ClearSunnyScene() {
  // 꽃가루/먼지 입자 — 햇빛에 떠다니는 작은 점들
  const pollen = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.25 + Math.random() * 0.45,
      duration: 10 + Math.random() * 16,
      delay: Math.random() * 8,
      dx: (Math.random() - 0.5) * 80,
      dy: -(30 + Math.random() * 80), // 위로 떠오름
    })), []);

  // 빛 보케 — 흐릿한 원형 빛 방울
  const bokeh = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 20 + Math.random() * 70,
      size: 40 + Math.random() * 80,
      opacity: 0.08 + Math.random() * 0.14,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 6,
      dy: -(60 + Math.random() * 120),
    })), []);


  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>

      {/* 아지랑이 — 화면 하단 열기 왜곡용 SVG 필터 정의 */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id="haze-filter" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.008"
              numOctaves="3"
              seed="2"
              result="noise"
            >
              {/* 시간에 따라 baseFrequency를 변화시켜 일렁이는 아지랑이 표현 */}
              <animate
                attributeName="baseFrequency"
                values="0.012 0.008;0.014 0.010;0.012 0.008"
                dur="4s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* 아지랑이 적용 영역 — 하단 30% 영역에 왜곡 오버레이 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          // 실제 배경 픽셀을 왜곡하기 위해 배경과 동일한 패턴을 얹는 대신
          // 반투명 레이어에 필터를 걸어 아래 레이어가 일렁이는 것처럼 보이게 함
          background: 'linear-gradient(to top, rgba(255,240,200,0.06) 0%, transparent 100%)',
          filter: 'url(#haze-filter)',
          backdropFilter: 'blur(0.3px)',
        }}
      />

      {/* 꽃가루/먼지 입자 */}
      {pollen.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `rgba(255, 240, 180, ${p.opacity})`,
            boxShadow: `0 0 ${p.size * 2}px rgba(255,230,120,${p.opacity * 0.8})`,
          }}
          animate={{
            x: [0, p.dx, 0],
            y: [0, p.dy, 0],
            opacity: [0, p.opacity, p.opacity * 0.6, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: 1 + Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* 빛 보케 — 흐릿한 원형 빛 방울 */}
      {bokeh.map(b => (
        <motion.div
          key={b.id}
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,245,200,1) 0%, rgba(255,220,100,0.4) 50%, transparent 70%)',
            filter: 'blur(12px)',
            transform: 'translate(-50%, -50%)',
            mixBlendMode: 'screen',
          }}
          animate={{
            y: [0, b.dy],
            opacity: [0, b.opacity, b.opacity * 0.5, 0],
            scale: [0.6, 1.2, 0.8],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            repeatDelay: 2 + Math.random() * 4,
            ease: 'easeOut',
          }}
        />
      ))}

    </div>
  );
}

interface Props {
  bgKey: string;
}

export default function WeatherSceneEffect({ bgKey }: Props) {
  switch (bgKey) {
    case 'rainy':       return <RainyScene />;
    case 'misty':       return <><MistyScene /><MistyEffect /></>;
    case 'windy':       return <WindyScene />;
    case 'overcast':    return <OvercastScene />;
    case 'sunset':      return <SunsetScene />;
    case 'clear_sunny': return <ClearSunnyScene />;
    default:            return null;
  }
}
