'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Apple3DWeatherSphereProps {
  rainfallRate?: number;
  stormSeverity?: 'extreme' | 'severe' | 'moderate';
  interactive?: boolean;
}

export function Apple3DWeatherSphere({
  rainfallRate = 92.4,
  stormSeverity = 'extreme',
  interactive = true,
}: Apple3DWeatherSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isDragging: false });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 220;

    // Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 3.6;

    // WebGL Renderer with alpha transparency & antialiasing
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // Main Core Sphere (Atmosphere Core)
    const coreGeometry = new THREE.SphereGeometry(1, 48, 48);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: stormSeverity === 'extreme' ? 0x0a192f : 0x07111e,
      emissive: stormSeverity === 'extreme' ? 0x0369a1 : 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.1,
      transmission: 0.6,
      transparent: true,
      opacity: 0.88,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(coreMesh);

    // Outer Holographic Weather Atmosphere Shell
    const atmoGeometry = new THREE.SphereGeometry(1.08, 40, 40);
    const atmoMaterial = new THREE.MeshBasicMaterial({
      color: stormSeverity === 'extreme' ? 0x38bdf8 : 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const atmoMesh = new THREE.Mesh(atmoGeometry, atmoMaterial);
    scene.add(atmoMesh);

    // Weather Storm Vortex Rings
    const ringCount = 3;
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < ringCount; i++) {
      const ringGeo = new THREE.TorusGeometry(1.22 + i * 0.14, 0.012, 16, 80);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0x38bdf8 : i === 1 ? 0xef4444 : 0x38bdf8,
        transparent: true,
        opacity: 0.35 - i * 0.08,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2.3 + (i * 0.2);
      ringMesh.rotation.y = (i * 0.3);
      scene.add(ringMesh);
      rings.push(ringMesh);
    }

    // Dynamic Weather Particles removed for clean performance and no rain effect

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 3.5, 10);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    const stormLight = new THREE.PointLight(0xef4444, 2.8, 8);
    stormLight.position.set(-2, -1, 3);
    scene.add(stormLight);

    // Mouse Interaction
    const handlePointerDown = (e: PointerEvent) => {
      mouseRef.current.isDragging = true;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (mouseRef.current.isDragging) {
        const deltaX = (e.clientX - mouseRef.current.x) * 0.005;
        const deltaY = (e.clientY - mouseRef.current.y) * 0.005;
        mouseRef.current.targetX += deltaX;
        mouseRef.current.targetY += deltaY;
        mouseRef.current.x = e.clientX;
        mouseRef.current.y = e.clientY;
      }
    };

    const handlePointerUp = () => {
      mouseRef.current.isDragging = false;
    };

    if (interactive) {
      container.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    const startTime = performance.now();
    const animate = () => {
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Smooth damped rotation
      coreMesh.rotation.y += 0.005;
      atmoMesh.rotation.y -= 0.003;
      atmoMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.1;

      // Rotate storm rings
      rings.forEach((ring, idx) => {
        ring.rotation.z += (idx + 1) * 0.004;
      });

      // Apply drag interaction
      coreMesh.rotation.y += mouseRef.current.targetX * 0.05;
      coreMesh.rotation.x += mouseRef.current.targetY * 0.05;
      mouseRef.current.targetX *= 0.92;
      mouseRef.current.targetY *= 0.92;



      // Pulse storm light intensity
      stormLight.intensity = 2.2 + Math.sin(elapsedTime * 4) * 0.8;

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        container.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      }
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, [rainfallRate, stormSeverity, interactive]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {/* Holographic HUD Overlay */}
      <div className="absolute top-2 left-3 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
        <span className="text-[10px] font-mono tracking-wider text-sky-400/80 font-semibold uppercase">
          Doppler 3D Grid
        </span>
      </div>
      <div className="absolute bottom-2 right-3 pointer-events-none">
        <span className="text-[9px] font-mono tracking-wider text-white/40">
          Touch & Drag to Rotate
        </span>
      </div>
    </div>
  );
}
