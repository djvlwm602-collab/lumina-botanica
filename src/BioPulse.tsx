import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- GLSL SHADER CODE ---
// 3D Simplex Noise from https://github.com/stegu/webgl-noise
const NOISE_GLSL = `
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 permute(vec4 x) {
  return mod289(((x*34.0)+10.0)*x);
}
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}
float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}
`;

const vertexShader = `
  ${NOISE_GLSL}
  
  uniform float uTime;
  uniform float uHumidity;
  uniform float uTemperature;
  uniform float uWind;
  
  varying vec2 vUv;
  varying float vNoise;
  varying vec3 vNormal;
  
  void main() {
    vUv = uv;
    vNormal = normal;
    
    // Calculate noise based on position and time
    // Humidity: low humidity -> high frequency noise (dry/scattered). High humidity -> low frequency (viscous/smooth)
    float noiseFreq = mix(3.0, 0.8, clamp(uHumidity / 100.0, 0.0, 1.0));
    float noiseAmp = mix(0.4, 0.15, clamp(uHumidity / 100.0, 0.0, 1.0));
    
    // Wind: creates an offset and turbulence
    vec3 windOffset = vec3(uWind * 0.05, 0.0, 0.0);
    
    vec3 noisePos = position * noiseFreq + uTime * mix(0.5, 2.0, uTemperature / 40.0) + windOffset;
    float noiseValue = snoise(noisePos);
    
    // Wind pushes the shape to one side
    vec3 wPush = vec3(uWind * 0.02 * (position.y + 1.0), 0.0, 0.0);
    
    vec3 newPosition = position + normal * (noiseValue * noiseAmp) + wPush;
    
    vNoise = noiseValue;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uTemperature;
  uniform float uHumidity;
  
  varying vec2 vUv;
  varying float vNoise;
  varying vec3 vNormal;
  
  // Color palette interpolation based on temperature
  vec3 getTemperatureColor(float t) {
    vec3 coldColor = vec3(0.1, 0.3, 0.8); // Blue/Purple for cold
    vec3 optimalColor = vec3(0.2, 0.8, 0.6); // Green/Teal for optimal
    vec3 warmColor = vec3(1.0, 0.3, 0.1); // Red/Orange for hot
    
    if (t < 15.0) {
      return mix(coldColor, optimalColor, max(0.0, t / 15.0));
    } else {
      return mix(optimalColor, warmColor, clamp((t - 15.0) / 15.0, 0.0, 1.0));
    }
  }

  void main() {
    // Make the color shift based on the noise value (which gives a nice gradient over the blob)
    vec3 baseColor = getTemperatureColor(uTemperature);
    
    // Add specular-like highlights based on normal and noise
    float highlight = smoothstep(0.2, 0.8, vNoise + 0.5);
    
    // If humidity is high, make it more "glossy/viscous" by boosting highlights
    // If low, make it matte/dry.
    float glossiness = mix(0.1, 0.8, clamp(uHumidity / 100.0, 0.0, 1.0));
    vec3 finalColor = mix(baseColor, vec3(1.0), highlight * glossiness);
    
    // Add a slight fresnel rim
    float fresnel = dot(vNormal, vec3(0.0, 0.0, 1.0));
    fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
    fresnel = pow(fresnel, 3.0);
    
    finalColor += fresnel * 0.5 * mix(vec3(1.0), baseColor, 0.5);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface WeatherData {
  temp: number;
  humidity: number;
  wind: number;
  precipitation?: number;
  cloudCover?: number;
}

const Blob = ({ weather }: { weather: WeatherData | null }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Defaults if weather is null
  const targetUniforms = useRef({
    uTime: { value: 0 },
    uTemperature: { value: 20 },
    uHumidity: { value: 50 },
    uWind: { value: 10 },
  });

  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uTemperature: { value: 20 },
      uHumidity: { value: 50 },
      uWind: { value: 10 },
    };
  }, []);

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Temperature affects time pulse (faster pulse when hot)
      const currentTemp = uniforms.uTemperature.value;
      const speedMultiplier = 1.0 + Math.max(0, (currentTemp - 20) / 20) * 1.5;
      
      uniforms.uTime.value += delta * speedMultiplier;
      
      // Smoothly interpolate to target values
      if (weather) {
        targetUniforms.current.uTemperature.value = weather.temp;
        targetUniforms.current.uHumidity.value = weather.humidity;
        targetUniforms.current.uWind.value = weather.wind;
      }
      
      uniforms.uTemperature.value = THREE.MathUtils.lerp(uniforms.uTemperature.value, targetUniforms.current.uTemperature.value, 0.02);
      uniforms.uHumidity.value = THREE.MathUtils.lerp(uniforms.uHumidity.value, targetUniforms.current.uHumidity.value, 0.02);
      uniforms.uWind.value = THREE.MathUtils.lerp(uniforms.uWind.value, targetUniforms.current.uWind.value, 0.02);
    }
    
    if (meshRef.current) {
      // Slowly rotate the whole blob
      meshRef.current.rotation.y += delta * 0.1;
      meshRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[2, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        wireframe={false}
      />
    </mesh>
  );
};

export default function BioPulse({ weather }: { weather: WeatherData | null }) {
  return (
    <div className="w-full h-full absolute inset-0 z-0 bg-transparent">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <Blob weather={weather} />
      </Canvas>
    </div>
  );
}
