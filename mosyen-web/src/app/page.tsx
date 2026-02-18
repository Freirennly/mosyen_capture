"use client";

import React, { useEffect, useRef, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Float, PerspectiveCamera, Environment, RoundedBox, useGLTF } from "@react-three/drei";
import { Navbar } from "@/components/layout/NavBar";

// ============================================================================
// 1. KOMPONEN 3D UNTUK BAGIAN KONTAK (DIOPTIMASI UNTUK PERFORMA)
// ============================================================================
function FloatingCylinder({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);
  const [data] = useState(() => ({
    speed: Math.random() * 0.4 + 0.2,
    offset: Math.random() * Math.PI * 2,
    parallaxFactor: Math.random() * 0.5 + 0.2,
  }));

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const { mouse } = state;
    const targetY = position[1] + Math.sin(time * data.speed + data.offset) * 0.3;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.05);
    const targetX = position[0] + (mouse.x * data.parallaxFactor);
    const targetZ = position[2] + (mouse.y * data.parallaxFactor);
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.03);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.03);

    const sweepSpeed = 1.2;
    const highlight = Math.sin((position[0] * 0.5) - (time * sweepSpeed));
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity, Math.max(0, highlight) * 1.8, 0.05
      );
    }
  });

  return (
    // OPTIMASI: castShadow dan receiveShadow dihapus agar ratusan tabung ini tidak merender bayangan statis (sangat berat)
    <mesh ref={meshRef} position={position}>
      {/* OPTIMASI: smoothness diturunkan ke 4 agar tidak membebani polygon count, visual tetap melengkung */}
      <RoundedBox args={[1.5, 2.2, 1.5]} radius={0.7} smoothness={4}>
        <meshStandardMaterial ref={materialRef} color="#2a42a0" roughness={0.15} metalness={0.5} emissive="#a040ff" emissiveIntensity={0} />
      </RoundedBox>
    </mesh>
  );
}

function InteractiveLogos({ activeIndex }: { activeIndex: number }) {
  const groupRef = useRef<THREE.Group>(null!);
  const [displayIndex, setDisplayIndex] = useState(activeIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { viewport } = useThree();
  const isMobile = viewport.width < 10; 

  const whatsappModel = useGLTF('/models/the_whatsapp.glb');
  const emailModel = useGLTF('/models/Gmail.glb');
  const instagramModel = useGLTF('/models/instagram.glb');

  const logos = [
    { id: 0, url: "https://instagram.com/nndulgha_" },
    { id: 1, url: "https://wa.me/081328947127" },
    { id: 2, url: "mailto:anandaolga410@gmail.com" }
  ];

  useEffect(() => {
    if (activeIndex !== displayIndex) {
      setIsTransitioning(true);
      setTimeout(() => {
        setDisplayIndex(activeIndex);
        if (groupRef.current) groupRef.current.position.x = 12;
        setIsTransitioning(false);
      }, 350);
    }
  }, [activeIndex, displayIndex]);

  useFrame((state) => {
    if (groupRef.current) {
      const targetX = isTransitioning ? -12 : 0;
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.12);
      groupRef.current.traverse((child) => {
        if ((child as any).material) {
          (child as any).material.transparent = true;
          (child as any).material.opacity = THREE.MathUtils.lerp((child as any).material.opacity, isTransitioning ? 0 : 1, 0.15);
        }
      });
      if (!isTransitioning) {
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -state.mouse.y * 0.2, 0.05);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, state.mouse.x * 0.1, 0.05);
      }
    }
  });

  return (
    <Float speed={isTransitioning ? 0 : 1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group 
        ref={groupRef}
        onClick={() => !isTransitioning && window.open(logos[displayIndex].url, '_blank')}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
        position={[0, 0.2, 7.5]} scale={isMobile ? 0.65 : 1}
      >
        {displayIndex === 0 && <primitive object={instagramModel.scene.clone()} scale={3} position={[-1.8, -2, 1.5]} castShadow />}
        {displayIndex === 1 && <primitive object={whatsappModel.scene.clone()} scale={30} position={[-1.5, -2, 1.5]} castShadow />}
        {displayIndex === 2 && <primitive object={emailModel.scene.clone()} scale={10} position={[0, 1.5, 1.5]} castShadow />}
      </group>
    </Float>
  );
}

function ResponsiveCamera() {
  const { viewport } = useThree();
  return <PerspectiveCamera makeDefault position={[2, 2, viewport.width < 10 ? 48 : 35]} fov={22} />;
}


// ============================================================================
// 2. HALAMAN UTAMA
// ============================================================================
export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeLogo, setActiveLogo] = useState(0);

  const cylinders = useMemo(() => {
    const temp = [];
    for (let x = -20; x <= 20; x += 1.5) {
      for (let z = 0; z <= 24; z += 2.0) {
        const rowOffset = (Math.round(z / 2.0) % 2 === 0) ? 0.75 : 0;
        temp.push({ id: `${x}-${z}`, pos: [x + rowOffset, -4, z] as [number, number, number] });
      }
    }
    return temp;
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-element", {
        y: 30, opacity: 0, duration: 1.2, stagger: 0.15, ease: "power3.out", delay: 0.1,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <div suppressHydrationWarning className="bg-[#030305] text-white font-sans overflow-x-hidden">
      
      {/* Noise Background */}
      <div className="fixed inset-0 z-0 opacity-[0.03] mix-blend-screen pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <Navbar />

      <div className="absolute top-0 left-0 w-full hidden md:flex items-center justify-between px-10 py-9 text-white text-xl font-light tracking-[0.2em] z-50 pointer-events-none">
        <span>MOSYEN</span>
      </div>      

      {/* ==================== 1. HERO SECTION ==================== */}
      <section ref={heroRef} className="relative min-h-[100dvh] overflow-hidden flex items-center justify-center">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden flex justify-center pointer-events-none">
          {/* Lapis 1: Cahaya Gradient (Pulse) */}
          <div 
            className="absolute top-[11%] left-1/2 -translate-x-1/2 w-[380px] h-[380px] sm:w-[480px] sm:h-[480px] md:w-[550px] md:h-[550px] lg:w-[600px] lg:h-[600px] bg-gradient-to-r from-purple-600 to-blue-500 rounded-full blur-[25px] sm:blur-[35px] animate-pulse opacity-90"
            style={{ animationDuration: "4s" }} 
          />
          {/* Lapis 2: Lingkaran Hitam (Memotong bawah cahaya) */}
          <div 
            className="absolute top-[17%] md:top-[18%] left-1/2 -translate-x-1/2 w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] md:w-[530px] md:h-[530px] lg:w-[590px] lg:h-[590px] bg-[#030305] rounded-full" 
          />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 flex flex-col items-center text-center mt-10 md:mt-0">
          <h1 className="hero-element text-[clamp(2.5rem,6vw,5.5rem)] font-light text-white leading-[1.1] tracking-tight mb-6 drop-shadow-2xl">
            <span className="font-bold">Fluid Motion</span> <br />
            <span>Tracking Website</span>
          </h1>
          <div className="hero-element text-zinc-400 text-[11px] sm:text-xs md:text-sm font-light mb-12 max-w-lg leading-relaxed">
            <span>The website we created to demonstrate our motion tracking tool, MOSYEN</span>
          </div>

          <div className="hero-element relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full blur-md md:blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 -z-10 scale-90 group-hover:scale-105" />
            <Link
              href="/animation"
              className="inline-flex items-center gap-2 sm:gap-3 px-6 py-2.5 sm:px-8 sm:py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-xl rounded-full text-white text-[10px] sm:text-sm uppercase tracking-widest font-medium transition-all duration-300"
            >
              <span>Get Started</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors duration-300">
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== 2. THE REALITY ==================== */}
      <section className="relative min-h-[90dvh] flex flex-col justify-center px-6 py-24 z-10 bg-[#030305]">
        <div className="max-w-5xl w-full mx-auto relative z-10">
          
          <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="text-xs text-zinc-500 tracking-[0.2em] font-medium uppercase mb-6 flex items-center gap-3">
                <span className="w-8 h-px bg-zinc-600"></span> <span>The Reality</span>
              </h2>
              <h3 className="text-3xl md:text-5xl font-light text-white tracking-tight leading-[1.2]">
                <span>Studio-grade tracking.</span><br/>
                <span className="font-semibold text-zinc-400">Indie budget.</span>
              </h3>
            </div>
            <div className="text-zinc-400 text-sm font-light leading-relaxed max-w-sm">
              <span>As indie creators, we know the struggle. Traditional optical systems cost over $15,000 and require dedicated studio rooms. We built MOSYEN to prove that high-end motion capture shouldn't be locked behind massive budgets.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04] transition-colors duration-300">
              <div className="text-zinc-600 text-sm font-mono mb-8">01</div>
              <h4 className="text-lg font-medium text-white mb-3"><span>No Absurd Markups</span></h4>
              <div className="text-xs text-zinc-400 font-light leading-relaxed">
                <span>Legacy MoCap setups run upwards of $15K. We engineered our hardware to deliver sub-millimeter precision for educational institutions and indie game studios without the legacy price tag.</span>
              </div>
            </div>

            <div className="p-8 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04] transition-colors duration-300">
              <div className="text-zinc-600 text-sm font-mono mb-8">02</div>
              <h4 className="text-lg font-medium text-white mb-3"><span>Record Anywhere</span></h4>
              <div className="text-xs text-zinc-400 font-light leading-relaxed">
                <span>Ditch the 5x5 meter camera rigs. Our sensor-based tracking means you can suit up, calibrate in seconds, and capture complex acrobatics in a cramped bedroom or garage.</span>
              </div>
            </div>

            <div className="p-8 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.04] transition-colors duration-300">
              <div className="text-zinc-600 text-sm font-mono mb-8">03</div>
              <h4 className="text-lg font-medium text-white mb-3"><span>Skip the Keyframing</span></h4>
              <div className="text-xs text-zinc-400 font-light leading-relaxed">
                <span>Stop spending weeks manually animating subtle movements. Stream your body data in real-time straight to Blender, Unity, or Unreal Engine and let the hardware do the work.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 3. INTERACTIVE 3D CONTACT ==================== */}
      <section className="relative h-[100dvh] w-full flex flex-col overflow-hidden bg-[#030305]">
        <div className="absolute top-7 left-0 w-full flex justify-center z-40 pointer-events-none">
          <h1 className="text-3xl md:text-5xl font-bold tracking-widest uppercase opacity-80">
            <span>Contact Us</span>
          </h1>
        </div>

        {/* Floating Pill Navbar Contact */}
        <div className="absolute bottom-5 md:bottom-16 left-1/2 -translate-x-1/2 z-40 flex w-[90%] max-w-[300px] md:max-w-fit md:gap-5 items-center justify-around md:justify-center bg-[#121212]/60 backdrop-blur-3xl px-6 md:px-8 py-3 md:py-3 rounded-full border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          {['Instagram', 'WhatsApp', 'Email'].map((name, idx) => (
            <button
              key={name}
              onClick={() => setActiveLogo(idx)}
              className={`text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.4em] transition-all duration-700 relative group text-center py-2 ${
                activeLogo === idx ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>{name}</span>
              <div className={`absolute -bottom-0 left-1/2 -translate-x-1/2 h-[1.5px] bg-gradient-to-r from-white to-blue-100 transition-all duration-500 ${
                activeLogo === idx ? 'w-1/2 opacity-75' : 'w-0 opacity-0'
              }`} />
            </button>
          ))}
        </div>

        <div className="flex-1 w-full outline-none">
          {/* OPTIMASI: Membatasi Device Pixel Ratio (dpr) maksimal 1.5 agar HP tidak panas */}
          <Canvas shadows gl={{ antialias: true, powerPreference: "high-performance" }} dpr={[1, 1.5]}>
            <ResponsiveCamera />
            <fog attach="fog" args={['#030305', 15, 60]} />
            <ambientLight intensity={2} />
            <pointLight position={[10, 10, 10]} intensity={1000} color="#7a92f0" />
            <spotLight position={[0, 20, 10]} angle={0.3} intensity={2} castShadow />
            <Environment preset="night" />
            <Suspense fallback={null}>
              <InteractiveLogos activeIndex={activeLogo} />
              <group>
                {cylinders.map((item) => <FloatingCylinder key={item.id} position={item.pos} />)}
              </group>
            </Suspense>
            <OrbitControls enableRotate={false} enableZoom={false} enablePan={false} target={[0, -1, 7.5]} />
          </Canvas>
        </div>
      </section>

    </div>
  );
}