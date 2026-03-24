/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react';
import { Droplets, Wind, Thermometer, MapPin, Sun } from 'lucide-react';

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
  const [bgKey, setBgKey] = useState<string>('clear_sunny');

  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);

  // 마우스 위치 → 배경 패럴랙스용 모션 값
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // 스프링으로 부드럽게 보간 (stiffness 낮을수록 느리게 따라옴 = 더 깊은 공간감)
  const bgX = useSpring(rawX, { stiffness: 40, damping: 18 });
  const bgY = useSpring(rawY, { stiffness: 40, damping: 18 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      // -0.5 ~ 0.5 정규화 후 이동 범위(px) 적용
      // 음수 방향: 마우스 오른쪽 → 배경 왼쪽으로 → 시선이 오른쪽을 향하는 느낌
      const x = (e.clientX / window.innerWidth - 0.5) * -35;
      const y = (e.clientY / window.innerHeight - 0.5) * -20;
      rawX.set(x);
      rawY.set(y);
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
        // 날씨 데이터 수신 후 배경 키 업데이트
        setBgKey(getWeatherBgKey(parsed));
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

  const getWeatherGreeting = () => {
    if (!weather) return { line1: '', line2: '' };

    if (weather.precipitation > 0) {
      return { line1: '비 오는 날,', line2: '자연이 식물을 돌봐요' };
    }
    if (weather.temp > 28) {
      return { line1: '뜨거운 여름,', line2: '식물에게 물 한 잔을' };
    }
    if (weather.temp < 10) {
      return { line1: '추운 겨울,', line2: '식물을 따뜻하게 품어주세요' };
    }
    if (weather.humidity < 40) {
      return { line1: '건조한 공기,', line2: '분무기를 꺼내세요' };
    }
    if (weather.humidity > 70) {
      return { line1: '촉촉한 날,', line2: '통풍을 잊지 마세요' };
    }
    return { line1: '맑고 상쾌한 날,', line2: '식물도 활짝 웃어요' };
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

      {/* 심도감 비네트 — 고정 오버레이, 주변부를 어둡게 해 공간감 강조 */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }}
      />

      {/* Spline 3D — 비네트 위, 날씨 배경 위에 투명하게 올라감 */}
      <motion.div
        style={{ scale }}
        className="fixed inset-0 z-[2] pointer-events-auto origin-center"
      >
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

      {/* Subtle Top Gradient for Readability */}
      <div className="fixed top-0 inset-x-0 h-32 z-[3] pointer-events-none bg-gradient-to-b from-black/60 to-transparent" />

      {/* Top Weather Tab Line */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 inset-x-0 z-[10] w-full px-6 md:px-12 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 pointer-events-auto backdrop-blur-md bg-botanical-900/30 border-b border-white/10"
      >
        {loading ? (
          <div className="w-full flex justify-center items-center py-2">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : weather ? (
          <>
            {/* Left: Location & Basic Metrics */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 lg:gap-10 text-xs tracking-[0.15em] uppercase font-medium">
              <div className="flex items-center gap-2 text-accent">
                <MapPin className="w-4 h-4" />
                <span>{locationName}</span>
              </div>
              
              <div className="flex items-center gap-6 text-botanical-100/90">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-botanical-100/50" />
                  <span>{weather.temp.toFixed(1)}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-botanical-100/50" />
                  <span>{weather.humidity}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-botanical-100/50" />
                  <span>{weather.wind.toFixed(1)} km/h</span>
                </div>
              </div>
            </div>

            {/* Right: AI Recommendation */}
            <div className="flex items-center gap-3 text-[10px] md:text-xs tracking-widest uppercase text-botanical-100/80 max-w-xl text-center lg:text-right mt-2 lg:mt-0">
              <Sun className="w-4 h-4 text-accent shrink-0 hidden md:block" />
              <span className="truncate">{getCareRecommendation()}</span>
            </div>
          </>
        ) : (
          <div className="w-full text-center text-xs tracking-widest uppercase text-botanical-100/50 py-2">
            날씨 데이터를 불러올 수 없습니다.
          </div>
        )}
      </motion.header>

      {/* 중앙 날씨 인사 문구 오버레이 */}
      {weather && (() => {
        const { line1, line2 } = getWeatherGreeting();
        return (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
            className="fixed inset-0 z-[10] flex flex-col items-center justify-center pointer-events-none select-none"
          >
            <p className="font-serif text-[clamp(1.1rem,2.5vw,1.6rem)] font-light tracking-[0.2em] text-botanical-100/60 mb-1">
              {line1}
            </p>
            <p className="font-serif text-[clamp(1.8rem,5vw,3.5rem)] font-light tracking-[0.1em] text-botanical-100">
              {line2}
            </p>
          </motion.div>
        );
      })()}

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
