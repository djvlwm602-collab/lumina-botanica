/**
 * Role: misty 배경 시 GLSL FBM 워핑 기반 안개 효과 — 화면 하단부에만 국소적으로 연출
 * Key Features: FBM 도메인 워핑, 하단 마스킹, 투명 오버레이
 * Dependencies: React
 */

import { useEffect, useRef } from 'react';

const VERT = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAG = `
  precision highp float;
  uniform float uTime;
  uniform vec2  uResolution;

  // 1. 노이즈 생성용 보조 함수들
  float rand(vec2 n) {
    return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }

  float noise(vec2 n) {
    const vec2 d = vec2(0.0, 1.0);
    vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
    return mix(
      mix(rand(b),        rand(b + d.yx), f.x),
      mix(rand(b + d.xy), rand(b + d.yy), f.x),
      f.y
    );
  }

  float fbm(vec2 n) {
    float total = 0.0, amplitude = 1.0;
    for (int i = 0; i < 3; i++) {
      total    += noise(n) * amplitude;
      n        += n;
      amplitude *= 0.5;
    }
    return total;
  }

  // 2. 안개 밀도 계산 — FBM 도메인 워핑 + 왼→오 흐름
  float getFogDensity(vec2 uv, float time) {
    // 왼쪽→오른쪽 흐름: x축으로 시간에 비례해 UV를 이동
    // 0.06 = 흐름 속도 (클수록 빠름)
    vec2 p = (uv + vec2(time * 0.02, 0.0)) * 5.0;

    vec2 speed = vec2(0.03, 0.12);

    // 도메인 워핑
    float q = fbm(p - time * 0.025);
    vec2  r = vec2(
      fbm(p + q + time * speed.x - p.x - p.y),
      fbm(p + q - time * speed.y)
    );

    return fbm(p + r);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;

    // 안개 밀도
    float density = getFogDensity(uv, uTime);

    // 새벽 안개 색상 — 파란빛이 살짝 도는 흰색
    vec3 fogColor = vec3(0.82, 0.88, 0.95);

    // 하단 마스크: 아래쪽(uv.y 낮음)이 짙고 위로 갈수록 사라짐
    // smoothstep 범위로 안개 상단 높이 조절 (0.55 = 화면 55% 지점까지)
    float mask = 1.0 - smoothstep(0.0, 0.55, uv.y);

    // 좌우 가장자리 페이드 제거 — 화면 전체를 활용, 흐름이 끊기지 않도록
    float edgeFade = 1.0;

    density *= mask * edgeFade;

    // 주기적으로 사라졌다 나타나는 파동 — 두 사인파를 겹쳐 불규칙하게 숨쉬는 느낌
    // 주기 약 14s(기본) + 9s(보조) → 박자가 어긋나며 자연스러운 출몰 반복
    float breathe = sin(uTime * 0.18) * 0.5 + 0.5;           // 0~1, 주기 ~35s
    breathe      *= sin(uTime * 0.09 + 1.3) * 0.35 + 0.65;  // 0.3~1 변조, 주기 ~70s
    breathe       = smoothstep(0.05, 0.95, breathe);         // 넓은 범위 — 더 천천히 전환

    // 알파 스케일 — 배경이 완전히 가려지지 않도록 최대 0.72
    float alpha = clamp(density * 0.85 * breathe, 0.0, 0.72);

    gl_FragColor = vec4(fogColor, alpha);
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
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const pos = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return {
    gl,
    timeLoc: gl.getUniformLocation(prog, 'uTime')!,
    resLoc:  gl.getUniformLocation(prog, 'uResolution')!,
  };
}

export default function MistyEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const glCtx = initGL(canvas);
    if (!glCtx) return;
    const { gl, timeLoc, resLoc } = glCtx;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resLoc, canvas.width, canvas.height);

    let rafId: number;
    let active = true;

    const render = () => {
      gl.uniform1f(timeLoc, performance.now() / 1000);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (active) rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => { active = false; cancelAnimationFrame(rafId); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5, mixBlendMode: 'normal' }}
    />
  );
}
