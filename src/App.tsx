/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { Droplets, Wind, Thermometer, MapPin, Sun } from 'lucide-react';
import SunnyEffect from './components/SunnyEffect';
import LightRays from './components/LightRays';
import RainEffect from './components/RainEffect';
import WeatherSceneEffect from './components/WeatherSceneEffect';

export interface WeatherData {
  temp: number;
  humidity: number;
  wind: number;
  precipitation: number;
  cloudCover: number;
}

/**
 * 날씨 조건 → 배경 이미지 매핑
 * 이미지 교체 시 /public/ani/ 폴더에 동일한 파일명으로 저장
 * 확장자 변경 시 아래 경로에서 수정 (예: .svg → .jpg)
 */
const WEATHER_BG: Record<string, string> = {
  clear_sunny: '/ani/clear_sunny.png',
  overcast:    '/ani/overcast.png',
  rainy:       '/ani/rainy.png',
  sunset:      '/ani/sunset.png',
  misty:       '/ani/misty.png',
  windy:       '/ani/windy.png',
};

function getWeatherBgKey(weather: WeatherData): string {
  const hour = new Date().getHours();

  // Rainy Day   : 강수 발생 시 최우선
  if (weather.precipitation > 0) return 'rainy';

  // Misty Morning: 새벽~이른 아침(5~10시) + 고습(≥75%) + 약풍(≤12km/h) + 구름(≥20%)
  if (
    hour >= 5 && hour <= 10 &&
    weather.humidity >= 75 &&
    weather.wind <= 12 &&
    weather.cloudCover >= 20
  ) return 'misty';

  // Windy Day   : 강풍(≥30km/h)
  if (weather.wind >= 30) return 'windy';

  // Overcast Day: 구름량 65% 초과
  if (weather.cloudCover > 65) return 'overcast';

  // Sunset Day  : 오후 17~20시 + 구름 60% 미만
  if (hour >= 17 && hour <= 20 && weather.cloudCover < 60) return 'sunset';

  // Clear & Sunny: 위 조건 모두 해당 없을 때
  return 'clear_sunny';
}

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('런던, 영국'); // Default fallback
  // ?bg=rainy 등 쿼리 파라미터로 배경 강제 지정 가능 (테스트용)
  const VALID_BG_KEYS = ['clear_sunny', 'overcast', 'rainy', 'sunset', 'misty', 'windy'];
  const bgOverride = new URLSearchParams(window.location.search).get('bg');
  const [bgKey, setBgKey] = useState<string>(
    bgOverride && VALID_BG_KEYS.includes(bgOverride) ? bgOverride : 'clear_sunny'
  );
  const [isWatering, setIsWatering] = useState(false);


  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1.7]);

  // 마우스 위치 → 배경 패럴랙스용 모션 값
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // 스프링으로 부드럽게 보간 (stiffness 낮을수록 느리게 따라옴 = 더 깊은 공간감)
  const bgX = useSpring(rawX, { stiffness: 40, damping: 18 });
  const bgY = useSpring(rawY, { stiffness: 40, damping: 18 });

  useEffect(() => {
    let ticking = false;
    const onMouseMove = (e: MouseEvent) => {
      // rAF으로 쓰로틀링 — 프레임당 최대 1회만 처리
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * -35;
        const y = (e.clientY / window.innerHeight - 0.5) * -20;
        rawX.set(x);
        rawY.set(y);
        ticking = false;
      });
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [rawX, rawY]);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,cloud_cover&timezone=auto`
        );
        const data = await res.json();
        const parsed: WeatherData = {
          temp: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          wind: data.current.wind_speed_10m,
          precipitation: data.current.precipitation,
          cloudCover: data.current.cloud_cover,
        };
        setWeather(parsed);
        // ?bg= 오버라이드 없을 때만 실제 날씨로 배경 업데이트
        if (!bgOverride || !VALID_BG_KEYS.includes(bgOverride)) {
          setBgKey(getWeatherBgKey(parsed));
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setLoading(false);
      }
    };

    // Try to get user's location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationName('현재 위치');
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback to London
          fetchWeather(51.5074, -0.1278);
        }
      );
    } else {
      fetchWeather(51.5074, -0.1278);
    }
  }, []);

  // bgKey 기준으로 문구 결정 — 배경과 항상 일치하도록
  const getWeatherGreeting = (): string => {
    if (!weather) return '';

    switch (bgKey) {
      case 'rainy':    return '오늘은 자연이 식물을 돌봐요 🌧️';
      case 'misty':    return '안개 낀 아침, 수분이 충분해요 🌫️';
      case 'windy':    return '바람 부는 날, 식물을 단단히 붙잡아줘요 🍃';
      case 'overcast': return '흐린 하늘 아래, 식물은 오늘도 자라요 🌥️';
      case 'sunset':   return '노을빛 아래, 하루를 마무리해요 🌅';
      default:         // clear_sunny — 온도·습도로 세분화
        if (weather.temp > 28)      return '지금 바로 물을 주세요 🌵';
        if (weather.temp < 10)      return '식물을 따뜻하게 품어주세요 🧣';
        if (weather.humidity < 40)  return '분무기를 꺼낼 시간이에요 💧';
        return '식물도 당신도 활짝 피어나요 🌸';
    }
  };

  const getCareRecommendation = () => {
    if (!weather) return '대기 환경을 분석하는 중...';

    if (weather.temp > 28) {
      return '고온 감지. 수분 공급 빈도를 높이고 민감한 식물에 오후 그늘을 제공하세요.';
    }
    if (weather.temp < 10) {
      return '저온 환경. 물주기 양을 줄이고 열대 식물을 외풍으로부터 보호하세요.';
    }
    if (weather.humidity < 40) {
      return '낮은 습도. 잎에 분무하거나 가습기 사용을 권장합니다.';
    }
    if (weather.humidity > 70) {
      return '높은 습도. 곰팡이 발생 방지를 위해 통풍을 원활하게 유지하세요.';
    }
    if (weather.precipitation > 0) {
      return '강수 감지. 실외 물주기를 중단하고 토양 배수 상태를 확인하세요.';
    }

    return '최적의 생장 환경입니다. 평소 관리 루틴을 유지하며 토양 수분을 확인하세요.';
  };

  return (
    <div className="relative h-[200vh] text-botanical-100 font-sans selection:bg-accent selection:text-botanical-900">

      {/* 날씨 배경 이미지 — 마우스 패럴랙스 적용 */}
      {/* scale(1.1): 패럴랙스 이동 시 가장자리 여백 확보 */}
      <motion.div
        key={bgKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        className="fixed inset-0 z-0"
        style={{
          x: bgX,
          y: bgY,
          scale: 1.1,
          backgroundImage: `url(${WEATHER_BG[bgKey]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          willChange: 'transform',
        }}
      />

      {/* 맑은 날씨 렌즈 플레어 효과 */}
      {bgKey === 'clear_sunny' && <SunnyEffect />}

      {/* GLSL 태양 광선 — 주기적으로 스르륵 나타났다 사라짐 */}
      <LightRays />

      {/* rainy 배경: 상시 비 내리는 효과 (loop 모드) */}
      {bgKey === 'rainy' && <RainEffect loop />}

      {/* 물주기 GLSL 비 효과 */}
      {isWatering && <RainEffect onDone={() => setIsWatering(false)} />}

      {/* 심도감 비네트 — 고정 오버레이, 주변부를 어둡게 해 공간감 강조 */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }}
      />

      {/* Spline 3D — 항상 표시 (벌+꽃이 같은 씬이라 분리 불가) */}
      <motion.div style={{ scale }} className="fixed inset-0 z-[2] pointer-events-auto origin-center">
        <iframe
          src="https://my.spline.design/beeflyingflowerwebheroglbanimation-Qx6RSykiOHx1tLfscEvpdq1u/"
          frameBorder="0"
          width="100%"
          height="100%"
          title="Spline 3D Scene"
          allowTransparency={true}
          style={{ background: 'transparent' }}
        />
      </motion.div>

      {/* 날씨별 앰비언트 씬 효과 (clear_sunny 제외) */}
      <WeatherSceneEffect bgKey={bgKey} />

      {/* Liquid Glass 네비게이션 바 — pill 형태 */}
      <motion.header
        initial={{ opacity: 0, y: -32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-5 inset-x-4 md:inset-x-10 lg:inset-x-16 z-[10] pointer-events-auto"
      >
        <div
          className="liquid-glass w-full px-5 md:px-8 py-[14px] flex items-center justify-between gap-4"
          style={{ borderRadius: '9999px' }}
        >
          {loading ? (
            <div className="w-full flex justify-center items-center py-0.5">
              <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : weather ? (
            <>
              {/* 왼쪽(flex-start): 위치 pill + 날씨 수치 */}
              <div className="flex items-center gap-4 md:gap-6">
                {/* 위치 */}
                <div className="flex items-center gap-1.5 text-white/95 text-sm font-semibold tracking-wide shrink-0">
                  <MapPin className="w-4 h-4 text-white/70" />
                  <span>{locationName}</span>
                </div>

                {/* 구분선 */}
                <div className="w-px h-4 bg-white/20 hidden sm:block" />

                {/* 날씨 수치 */}
                <div className="hidden sm:flex items-center gap-4 text-white/75 text-sm font-medium">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-white/50" />
                    <span>{weather.temp.toFixed(1)}°</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-white/50" />
                    <span>{weather.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-white/50" />
                    <span>{weather.wind.toFixed(1)} km/h</span>
                  </div>
                </div>
              </div>

              {/* 오른쪽(flex-end): 물주기 버튼 */}
              <button
                onClick={() => { if (!isWatering) setIsWatering(true); }}
                disabled={isWatering}
                className="shrink-0 flex items-center gap-2.5 px-7 py-3 text-white/95 text-sm font-semibold tracking-wide transition-all duration-200 hover:scale-105 hover:bg-white/25 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: '0.5px solid rgba(255, 255, 255, 0.45)',
                  boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.5), 0 1px 6px rgba(0,0,0,0.08)',
                  minWidth: '100px',
                }}
              >
                <Droplets className="w-4 h-4 text-white/90" />
                <span>물주기</span>
              </button>
            </>
          ) : (
            <div className="w-full text-center text-xs text-white/35">
              날씨 데이터를 불러올 수 없습니다.
            </div>
          )}
        </div>
      </motion.header>

      {/* 중앙 날씨 인사 문구 오버레이 */}
      {weather && (
        <motion.div
          initial={{ opacity: 0, y: -138 }}
          animate={{ opacity: 1, y: -150 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
          className="fixed inset-0 z-[10] flex items-center justify-center pointer-events-none select-none"
        >
          <p className="font-sans text-[clamp(2.16rem,5.04vw,3.6rem)] font-semibold tracking-[-0.02em] text-botanical-100 text-center px-6">
            {getWeatherGreeting()}
          </p>
        </motion.div>
      )}

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10] flex flex-col items-center gap-3 pointer-events-none"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase text-botanical-100/50">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-botanical-100/50 to-transparent"></div>
      </motion.div>
    </div>
  );
}
