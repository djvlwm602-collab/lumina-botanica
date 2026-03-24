/**
 * Role: rainy 배경 시 번개 번쩍임 효과 — 불규칙한 간격으로 화면을 순간 밝힘
 * Key Features: 단발/이중 번개, 랜덤 인터벌, 자연스러운 페이드
 * Dependencies: React, motion/react
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function LightningEffect() {
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      // 다음 번개까지 4~18초 랜덤 대기
      const delay = 4000 + Math.random() * 14000;
      timeout = setTimeout(flash, delay);
    };

    const flash = () => {
      // 이중 번개 여부 (40% 확률)
      const isDouble = Math.random() < 0.4;

      setFlashing(true);
      setTimeout(() => {
        setFlashing(false);

        if (isDouble) {
          // 80~160ms 후 두 번째 번쩍
          setTimeout(() => {
            setFlashing(true);
            setTimeout(() => {
              setFlashing(false);
              scheduleNext();
            }, 60 + Math.random() * 80);
          }, 80 + Math.random() * 80);
        } else {
          scheduleNext();
        }
      }, 80 + Math.random() * 120); // 첫 번쩍: 80~200ms
    };

    scheduleNext();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <AnimatePresence>
      {flashing && (
        <motion.div
          key={Math.random()} // 매번 새 인스턴스로 애니메이션 재실행
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 18 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.04, ease: 'easeOut' }}
        >
          {/* 번개 색상: 청백색 — 번쩍이는 전기광 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(200, 220, 255, 0.45)',
              mixBlendMode: 'screen',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
