import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleSystemProps {
  particleCount?: number;
  particleSpread?: number;
  speed?: number;
  particleColors?: string[];
  moveParticlesOnHover?: boolean;
  particleHoverFactor?: number;
  alphaParticles?: boolean;
  particleBaseSize?: number;
  sizeRandomness?: number;
  disableRotation?: boolean;
}

const ParticleSystem = ({
  particleCount = 520,
  particleSpread = 19,
  speed = 0.2,
  particleColors = ["#fe0303", "#03e298", "#ffc100"],
  moveParticlesOnHover = true,
  particleHoverFactor = 4.2,
  alphaParticles = true,
  particleBaseSize = 100,
  sizeRandomness = 0.6,
  disableRotation = true,
}: ParticleSystemProps) => {
  const points = useRef<THREE.Points>(null);
  
  const { positions, colors, sizes, phases } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    const colorObj = new THREE.Color();
    
    for (let i = 0; i < particleCount; i++) {
      // Random position inside a sphere
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.cbrt(Math.random()) * (particleSpread * 1.5);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      
      const randomColor = particleColors[Math.floor(Math.random() * particleColors.length)];
      colorObj.set(randomColor);
      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;
      
      sizes[i] = (particleBaseSize * 0.05) * (1 - sizeRandomness + Math.random() * sizeRandomness);
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    return { positions, colors, sizes, phases };
  }, [particleCount, particleSpread, particleColors, particleBaseSize, sizeRandomness]);

  const { pointer } = useThree();

  useFrame((state, delta) => {
    if (!points.current) return;
    
    if (!disableRotation) {
      points.current.rotation.y += speed * delta * 0.5;
      points.current.rotation.x += speed * delta * 0.2;
    }

    const material = points.current.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value += delta * speed * 2.0;

    // pointer hover
    if (moveParticlesOnHover) {
      // mapping pointer from [-1, 1] to world space approximation
      material.uniforms.uMouse.value.set(
        pointer.x * particleSpread,
        pointer.y * particleSpread
      );
      material.uniforms.uHoverFactor.value = particleHoverFactor;
    }
  });

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uHoverFactor: { value: 1.0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uHoverFactor;
        
        attribute float size;
        attribute float phase;
        attribute vec3 color;
        
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vColor = color;
          
          vec3 pos = position;
          pos.y += sin(uTime + phase) * 0.5;
          pos.x += cos(uTime + phase) * 0.5;
          
          // hover repulsion
          if (uHoverFactor > 0.0) {
            vec2 mouseDist = vec2(pos.x - uMouse.x, pos.y - uMouse.y);
            float dist = length(mouseDist);
            if (dist < 10.0) {
              float force = (10.0 - dist) / 10.0;
              pos.x += normalize(mouseDist).x * force * uHoverFactor;
              pos.y += normalize(mouseDist).y * force * uHoverFactor;
            }
          }

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // size attenuation
          gl_PointSize = size * (300.0 / -mvPosition.z);
          
          vAlpha = ${alphaParticles ? '0.5 + sin(uTime * 2.0 + phase) * 0.5' : '1.0'};
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          // Circular particle
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float ll = length(xy);
          if (ll > 0.5) discard;
          
          // Soft edge
          float alpha = (1.0 - (ll * 2.0)) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [alphaParticles]);

  return (
    <points ref={points} material={shaderMaterial}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-phase" count={phases.length} array={phases} itemSize={1} />
      </bufferGeometry>
    </points>
  );
};

export default function BackgroundParticles(props: ParticleSystemProps & { blurAmount?: string }) {
  const { blurAmount = "20px", cameraDistance = 35, ...systemProps } = props as any;
  return (
    <div 
      className="absolute inset-0 z-0 pointer-events-auto"
      style={{ filter: `blur(${blurAmount})` }}
    >
      <Canvas camera={{ position: [0, 0, cameraDistance], fov: 60 }}>
        <ParticleSystem {...systemProps} />
      </Canvas>
    </div>
  );
}
