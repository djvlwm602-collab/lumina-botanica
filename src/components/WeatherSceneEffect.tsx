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
      delay: Math.random() * 12,
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

// ── Overcast: 구름 그림자 천천히 흐름 ────────────────────────
function OvercastScene() {
  const bands = useMemo(() =>
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      y: i * 20 + Math.random() * 8,
      height: 14 + Math.random() * 22,
      opacity: 0.035 + Math.random() * 0.055,
      duration: 28 + Math.random() * 32,
      delay: Math.random() * 18,
    })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
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

interface Props {
  bgKey: string;
}

export default function WeatherSceneEffect({ bgKey }: Props) {
  switch (bgKey) {
    case 'rainy':    return <RainyScene />;
    case 'misty':    return <><MistyScene /><MistyEffect /></>;
    case 'windy':    return <WindyScene />;
    case 'overcast': return <OvercastScene />;
    case 'sunset':   return <SunsetScene />;
    default:         return null;
  }
}
