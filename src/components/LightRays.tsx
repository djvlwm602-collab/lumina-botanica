/**
 * Role: GLSL 셰이더 기반 태양 광선 효과 — WebGL 캔버스로 렌더링
 * Key Features: 두 광원 빛줄기, 주기적 fade in/out (~23초 주기), mix-blend-mode: screen
 * Dependencies: motion/react
 */

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

// ── Vertex Shader ──────────────────────────────────────────────
const VERT = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// ── Fragment Shader ────────────────────────────────────────────
// soft-light 블렌드용: 0.5 = 중립(배경 영향 없음), 0.5+ = 따뜻하게 밝아짐
const FRAG = `
  precision mediump float;
  uniform float uTime;
  uniform vec2  uResolution;

  float rayStrength(
    vec2 raySource, vec2 rayRefDirection,
    vec2 coord, float seedA, float seedB, float speed
  ) {
    vec2  d = coord - raySource;
    float c = dot(normalize(d), rayRefDirection);
    return clamp(
      (0.45 + 0.15 * sin(c * seedA + uTime * speed)) +
      (0.30 + 0.20 * cos(-c * seedB + uTime * speed)),
      0.0, 1.0
    ) * clamp((uResolution.x - length(d)) / uResolution.x, 0.5, 1.0);
  }

  void main() {
    vec2 coord = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);

    // 광원 1, 2
    float r1 = rayStrength(
      vec2(uResolution.x * 0.7, uResolution.y * -0.4),
      normalize(vec2(1.0, -0.116)),
      coord, 36.2214, 21.11349, 1.5
    );
    float r2 = rayStrength(
      vec2(uResolution.x * 0.8, uResolution.y * -0.6),
      normalize(vec2(1.0, 0.241)),
      coord, 22.39910, 18.0234, 1.1
    );

    // 강도 축소: 기존 최대 0.9 → 0.58 (과도한 밝기 방지)
    float strength = r1 * 0.32 + r2 * 0.26;

    // 화면 가장자리 vignette: 경계에서 부드럽게 사라짐
    float nx   = coord.x / uResolution.x;
    float ny   = coord.y / uResolution.y;
    float edge = smoothstep(0.0, 0.22, nx) * smoothstep(1.0, 0.78, nx)
               * smoothstep(0.0, 0.18, ny);
    strength  *= edge;

    // soft-light 중립점 0.5 기준 황금빛 웜 매핑
    // R > G > B → 따뜻한 햇살 색온도
    float vr = 0.5 + strength * 0.20;
    float vg = 0.5 + strength * 0.14;
    float vb = 0.5 + strength * 0.07;

    // alpha=1.0: soft-light는 불투명 픽셀 기준으로 동작
    // 중립(strength=0) → vec4(0.5,0.5,0.5,1) = 배경에 완전히 영향 없음
    gl_FragColor = vec4(vr, vg, vb, 1.0);
  }
`;

function initGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false });
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

  return {
    gl,
    timeLoc: gl.getUniformLocation(prog, 'uTime')!,
    resLoc:  gl.getUniformLocation(prog, 'uResolution')!,
  };
}

export default function LightRays() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(0);

  // 주기적 스케줄: 3s 뒤 첫 등장 → 5s 표시 → fade-out → 10s 대기 → 반복
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    const cycle = (initialDelay: number) => {
      t1 = setTimeout(() => {
        setOpacity(0.75);                       // fade-in — soft-light는 screen보다 은은해 opacity 상향
        t2 = setTimeout(() => {
          setOpacity(0);                        // fade-out
          cycle(10000);                         // 10s 뒤 다음 사이클
        }, 5000);                               // 5s 유지
      }, initialDelay);
    };

    cycle(3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // WebGL 렌더 루프 — visible일 때만 RAF 실행
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glCtx = initGL(canvas);
    if (!glCtx) return;
    const { gl, timeLoc, resLoc } = glCtx;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    // resize는 디바운스 처리
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    window.addEventListener('resize', onResize);

    const start = performance.now();
    let rafId: number;

    const render = () => {
      // opacity 0이면 렌더 건너뜀 (GPU 절약)
      if (opacity === 0) {
        rafId = requestAnimationFrame(render);
        return;
      }
      gl.uniform1f(timeLoc, (performance.now() - start) / 1000);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, [opacity]);

  return (
    <motion.canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 4, mixBlendMode: 'soft-light' }}
      animate={{ opacity }}
      transition={{ duration: 3.0, ease: 'easeInOut' }}
    />
  );
}
