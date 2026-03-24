/**
 * Role: Clear & Sunny 날씨일 때 태양 광원(Lens Flare) + 화면 오버레이 연출
 * Key Features: 30초 루프 breathing, 렌즈 플레어, 채도 오버레이
 * Notes: backdrop-filter는 전체 레이어 1개로만 사용 (성능 최적화)
 */

import { motion } from 'motion/react';

const breathe = {
  duration: 30,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

export default function SunnyEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 3 }}>

      {/* ── 1. 전체 화면 채도 강화 — backdrop-filter는 여기 1개만 ── */}
      <motion.div
        className="absolute inset-0"
        style={{
          backdropFilter: 'saturate(1.35) brightness(1.03)',
          WebkitBackdropFilter: 'saturate(1.35) brightness(1.03)',
          background: 'radial-gradient(ellipse 80% 60% at 90% 0%, rgba(255,220,60,0.08) 0%, transparent 65%)',
        }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={breathe}
      />

      {/* ── 2. 태양 광원 — filter(CSS)만 사용, backdrop-filter 없음 ── */}
      <motion.div
        className="absolute"
        style={{ top: '-8%', right: '-6%', width: '42%', height: '42%' }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
        transition={breathe}
      >
        {/* 대기 글로우 */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle, rgba(255,230,100,0.22) 0%, rgba(255,180,40,0.08) 45%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(12px)',
        }} />
        {/* 코어 */}
        <div className="absolute" style={{
          top: '32%', right: '32%', width: '36%', height: '36%',
          background: 'radial-gradient(circle, rgba(255,255,220,0.95) 0%, rgba(255,240,120,0.65) 50%, transparent 100%)',
          borderRadius: '50%',
          filter: 'blur(2px)',
          boxShadow: '0 0 28px 10px rgba(255,240,120,0.3)',
        }} />
      </motion.div>

      {/* ── 3. 렌즈 플레어 3개 (위치만 다름, 애니메이션 공유) ── */}
      {[
        { top: '4%',  right: '8%',  size: 180, delay: 0 },
        { top: '22%', right: '28%', size: 70,  delay: 3 },
        { top: '38%', right: '44%', size: 38,  delay: 6 },
      ].map((f, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            top: f.top, right: f.right,
            width: f.size, height: f.size,
            background: 'radial-gradient(circle, rgba(255,235,120,0.18) 0%, transparent 65%)',
            filter: 'blur(3px)',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.75, 0.3] }}
          transition={{ ...breathe, delay: f.delay }}
        />
      ))}
    </div>
  );
}
