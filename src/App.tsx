/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Droplets, Wind, Thermometer, MapPin, Sun } from 'lucide-react';

export interface WeatherData {
  temp: number;
  humidity: number;
  wind: number;
  precipitation: number;
  cloudCover: number;
}

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('런던, 영국'); // Default fallback

  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,cloud_cover&timezone=auto`
        );
        const data = await res.json();
        setWeather({
          temp: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          wind: data.current.wind_speed_10m,
          precipitation: data.current.precipitation,
          cloudCover: data.current.cloud_cover,
        });
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
    <div className="relative h-[200vh] bg-botanical-900 text-botanical-100 font-sans selection:bg-accent selection:text-botanical-900">
      
      {/* Spline 3D Background - Fixed and Scaled on Scroll */}
      <motion.div
        style={{ scale }}
        className="fixed inset-0 z-0 pointer-events-auto origin-center"
      >
        <iframe
          src="https://my.spline.design/beeflyingflowerwebheroglbanimation-Qx6RSykiOHx1tLfscEvpdq1u/"
          frameBorder="0"
          className="w-full h-full"
          title="Spline 3D Scene"
        />
      </motion.div>

      {/* Subtle Top Gradient for Readability */}
      <div className="fixed top-0 inset-x-0 h-32 z-0 pointer-events-none bg-gradient-to-b from-botanical-900/80 to-transparent" />

      {/* Top Weather Tab Line */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-0 inset-x-0 z-10 w-full px-6 md:px-12 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 pointer-events-auto backdrop-blur-md bg-botanical-900/30 border-b border-white/10"
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
            className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none select-none"
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
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3 pointer-events-none"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase text-botanical-100/50">Scroll</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-botanical-100/50 to-transparent"></div>
      </motion.div>
    </div>
  );
}
