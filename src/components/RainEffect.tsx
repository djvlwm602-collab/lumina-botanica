/**
 * Role: 물주기 버튼 클릭 시 GLSL 셰이더 기반 비 내리는 효과
 * Key Features: WebGL 캔버스, u_water_start_time 기반 3초 fade-out, 알파 합성
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
  precision mediump float;
  uniform float uTime;
  uniform float uWaterStartTime;
  uniform vec2  uResolution;

  #define RAIN_DENSITY .002
  #define BRIGHTNESS   .06
  #define BLUR_LENGTH  28.
  #define SPEED        500.
  #define rnd(p,s) fract(sin(((p)+.01*(s))*12.9898)*43758.5453)

  void main() {
    vec2 R = uResolution.xy;
    // 원본과 동일: raw 픽셀 좌표에서 0.5만 빼기 (항상 양수 유지)
    vec2 U = gl_FragCoord.xy - 0.5;

    float activeTime = uTime - uWaterStartTime;
    float duration   = 3.0;
    float intensity  = smoothstep(duration, duration - 0.5, activeTime)
                     * step(0.0, activeTime);

    vec4 O = vec4(0.0);

    if (intensity > 0.0) {
      float Ny = RAIN_DENSITY * R.y;

      // 좌우 가장자리 감쇠 (양쪽 15% 구간)
      float nx      = U.x / R.x;
      float edge    = smoothstep(0.0, 0.15, nx) * smoothstep(1.0, 0.85, nx);

      // 가장자리: 물줄기 길이 30% / 투명도 50% → 중앙: 100%
      float blurLen = mix(BLUR_LENGTH * 0.3, BLUR_LENGTH, edge);
      float alpha   = mix(0.5, 1.0, edge);

      for (float i = 0.; i <= 60.; i++) {
        if (i > floor(Ny)) break;
        float y = floor(mod(rnd(U.x, 2.*i) * R.y - SPEED * uTime, R.y));
        if (rnd(U.x, 2.*i+1.) < (Ny - i)
            && abs(U.y - y) < blurLen)
          O += BRIGHTNESS * intensity * alpha;
      }
    }

    O = sqrt(O);
    // 흰색(1,1,1) 빗줄기, 알파로만 투명도 조절
    gl_FragColor = vec4(1.0, 1.0, 1.0, clamp(O.r * 8.0, 0.0, 0.85) * intensity);
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

  // 알파 블렌딩 활성화
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return {
    gl,
    timeLoc:       gl.getUniformLocation(prog, 'uTime')!,
    startTimeLoc:  gl.getUniformLocation(prog, 'uWaterStartTime')!,
    resLoc:        gl.getUniformLocation(prog, 'uResolution')!,
  };
}

interface Props {
  onDone: () => void; // 효과 완료 후 부모에 알림
}

export default function RainEffect({ onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const globalStart = performance.now() / 1000; // 페이지 기준 시간
    const waterStart  = globalStart;               // 버튼 누른 시점

    let rafId: number;

    const render = () => {
      const now = performance.now() / 1000;
      gl.uniform1f(timeLoc, now);
      gl.uniform1f(startTimeLoc, waterStart);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // 3.6초 후 자동 종료 (셰이더 fade-out 3.5s + 여유)
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
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 16 }}
    />
  );
}
