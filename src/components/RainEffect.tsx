/**
 * Role: 물주기 버튼 클릭 시 고품질 GLSL 셰이더 기반 비 내리는 효과 + 무지개 연출
 * Key Features: SDF 줄기 렌더링, 3레이어 깊이감, fade-in/out, 가장자리 감쇠, 비 끝자락 무지개
 * Dependencies: React, motion/react
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

const VERT = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAG = `
  precision highp float;
  uniform float uTime;
  uniform float uWaterStartTime;
  uniform vec2  uResolution;

  // 품질 좋은 해시 함수
  float hash(float n) {
    return fract(sin(n * 127.1 + 311.7) * 43758.5453);
  }

  // 빗줄기 SDF 렌더링
  // cx: 줄기 중심 x, headY: 머리(아래끝) y, len: 길이(px), wid: 두께(px sigma)
  // 머리(t=0)는 밝고 꼬리(t=1)로 갈수록 가늘어지며 사라짐
  float streak(vec2 fc, float cx, float headY, float len, float wid) {
    float dx = fc.x - cx;
    float dy = fc.y - headY;   // 0=머리(아래), len=꼬리(위)

    if (dy < -1.5 || dy > len) return 0.0;

    float t = clamp(dy / max(len, 0.1), 0.0, 1.0);

    // 꼬리로 갈수록 가늘어짐
    float w  = wid * (1.0 - t * 0.60) + 0.35;

    // 가로: Gaussian 단면 프로파일
    float xA = exp(-dx * dx / (w * w * 2.0));

    // 세로: 머리(dy=0) 최대 밝기 → 꼬리 smooth fade
    // smoothstep 끝을 0.0으로 설정해 머리에서 완전한 밝기 확보
    float yA = pow(1.0 - t, 1.6) * smoothstep(-1.5, 0.0, dy);

    return clamp(xA * yA, 0.0, 1.0);
  }

  // 레이어: cols 열로 분할, 각 열에 2개 물방울 (위상 분리)
  float layer(vec2 fc, float t, float cols, float spd, float len, float wid) {
    float cellW = uResolution.x / cols;
    float col   = floor(fc.x / cellW);
    float res   = 0.0;

    for (float d = 0.0; d < 2.0; d++) {
      float s  = col * 17.31 + d * 53.74;
      float r1 = hash(s);           // x 오프셋
      float r2 = hash(s + 1.73);    // 속도 변화
      float r3 = hash(s + 3.37);    // 위상 (시작 위치)

      // 셀 내 x 위치 (0.15~0.85 범위, 가장자리 회피)
      float cx     = (col + 0.15 + r1 * 0.7) * cellW;

      // 속도 ±15% 랜덤 변화로 자연스러운 밀도감
      float dropSpd = spd * (0.85 + r2 * 0.30);

      // 화면 높이 + len 주기로 seamless 반복 낙하
      float period = uResolution.y + len + 8.0;
      float headY  = uResolution.y - mod(t * dropSpd + r3 * period, period);

      res += streak(fc, cx, headY, len, wid);
    }

    return min(res, 1.0);
  }

  void main() {
    vec2 fc = gl_FragCoord.xy;

    float activeTime = uTime - uWaterStartTime;
    float duration   = 3.0;

    // 0.25s fade-in + 마지막 0.5s fade-out
    float fadeIn  = smoothstep(0.0, 0.25, activeTime);
    float fadeOut = smoothstep(duration, duration - 0.5, activeTime);
    float intensity = fadeIn * fadeOut;

    if (intensity <= 0.001) { gl_FragColor = vec4(0.0); return; }

    // 좌우 가장자리 감쇠 (양쪽 15% 구간)
    float nx   = fc.x / uResolution.x;
    float edge = smoothstep(0.0, 0.15, nx) * smoothstep(1.0, 0.85, nx);
    float lenS = mix(0.3, 1.0, edge);  // 가장자리: 줄기 길이 30%
    float opS  = mix(0.5, 1.0, edge);  // 가장자리: 투명도 50%

    // ── 3레이어 합성 (배경→전경) ──────────────────────────────
    // 배경: 촘촘하고 빠르고 얇음 — 은은한 비 분위기
    float rain  = layer(fc, activeTime, 65.0, 460.0, 20.0 * lenS, 1.0) * 0.20;
    // 중간: 배경과 전경 사이 자연스럽게 연결
    rain       += layer(fc, activeTime, 42.0, 560.0, 40.0 * lenS, 1.6) * 0.45;
    // 전경: 굵고 불투명한 흰색 줄기 — 가장 선명하게
    rain       += layer(fc, activeTime, 26.0, 650.0, 72.0 * lenS, 2.6) * 0.92;

    // 전경이 0.92까지 도달할 수 있도록 clamp 상한 높임
    rain = clamp(rain, 0.0, 0.96);

    // 물 느낌의 차가운 청백색 — screen 블렌드와 함께 배경에 자연스럽게 녹아듦
    gl_FragColor = vec4(0.78, 0.90, 1.0, rain * opS * intensity);
  }
`;

function initGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  const pos = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return {
    gl,
    timeLoc:      gl.getUniformLocation(prog, 'uTime')!,
    startTimeLoc: gl.getUniformLocation(prog, 'uWaterStartTime')!,
    resLoc:       gl.getUniformLocation(prog, 'uResolution')!,
  };
}

interface Props {
  onDone: () => void; // 효과 완료 후 부모에 알림
}

export default function RainEffect({ onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 비 끝자락(1.6s)에 무지개 등장 → 2.6s에 fade-out 시작 → 3.6s에 완전히 사라짐
  const [rainbowOpacity, setRainbowOpacity] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setRainbowOpacity(1), 1600);
    const t2 = setTimeout(() => setRainbowOpacity(0), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const glCtx = initGL(canvas);
    if (!glCtx) return;
    const { gl, timeLoc, startTimeLoc, resLoc } = glCtx;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resLoc, canvas.width, canvas.height);

    const waterStart = performance.now() / 1000;
    let rafId: number;

    const render = () => {
      const now = performance.now() / 1000;
      gl.uniform1f(timeLoc, now);
      gl.uniform1f(startTimeLoc, waterStart);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (now - waterStart < 3.6) {
        rafId = requestAnimationFrame(render);
      } else {
        onDone();
      }
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [onDone]);

  return (
    <>
      {/* mix-blend-mode: screen — 배경 밝기와 상호작용, 비 사이로 배경색 투과 */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 16, mixBlendMode: 'screen' }}
      />

      {/* 무지개 — 비 끝자락 은은하게 등장, 하단 중앙에서 호 형태로 퍼짐 */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{ opacity: rainbowOpacity }}
        transition={{ duration: 1.0, ease: 'easeInOut' }}
        style={{ zIndex: 17 }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80vh',
            // 하단 중앙을 원점으로 동심 타원 링 → 무지개 호 형태
            background: `radial-gradient(
              ellipse 85% 95% at 50% 108%,
              transparent 33%,
              rgba(180, 0, 255, 0.22) 35%,
              rgba(80, 0, 200, 0.20) 37.5%,
              rgba(0, 80, 230, 0.22) 40%,
              rgba(0, 190, 80, 0.22) 42.5%,
              rgba(220, 230, 0, 0.22) 45%,
              rgba(255, 140, 0, 0.22) 47.5%,
              rgba(230, 20, 20, 0.22) 50%,
              transparent 53%
            )`,
            filter: 'blur(14px)',
          }}
        />
      </motion.div>
    </>
  );
}
