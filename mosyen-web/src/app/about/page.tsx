"use client";

import React, { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  useGLTF, 
  Float, 
  Environment, 
  ContactShadows, 
  Center 
} from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath"; 
import { Navbar } from "@/components/layout/NavBar";

// --- DATA PENJELASAN KOMPONEN ---
const DESCRIPTIONS: Record<string, { title: string; info: string }> = {
  tutup: { title: "Top Enclosure", info: "Pelindung luar bagian atas yang dirancang untuk melindungi komponen elektronik dari debu." },
  wadah: { title: "Bottom Case", info: "Struktur dasar kokoh yang menyatukan seluruh modul dan menjaga stabilitas perangkat." },
  OLED: { title: "OLED Display", info: "Layar monitor kecil untuk menampilkan status sensor." },
  VIN: { title: "Voltage Input", info: "Modul manajemen daya yang mengatur tegangan masuk agar aman bagi komponen internal." },
  MPU6050: { title: "IMU Sensor", info: "Sensor akselerometer dan giroskop 6-axis untuk mendeteksi orientasi gerak presisi." },
  pcb: { title: "Main PCB", info: "Papan sirkuit utama yang menghubungkan jalur komunikasi antar semua modul elektronik." },
  C3_SUPERMINI: { title: "Microcontroller", info: "ESP32-C3 sebagai otak perangkat yang mengolah data dan mendukung koneksi nirkabel." },
};

// --- KOMPONEN MODEL ---
function Model({ isDetail, setHovered }: { isDetail: boolean; setHovered: (name: string | null) => void }) {
  const { scene } = useGLTF("/models/PCB.glb");
  const modelRef = useRef<THREE.Group>(null);
  const autoRotationRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [localHover, setLocalHover] = useState<string | null>(null);

  const targetNames = ["tutup", "wadah", "OLED", "VIN", "MPU6050", "pcb", "C3_SUPERMINI"];

  useFrame((state, delta) => {
    if (modelRef.current) {
      const isHoveringComponent = isDetail && localHover !== null;
      if (!isDragging && !isHoveringComponent) {
        autoRotationRef.current += 0.005;
      }

      const mouseRotation = isDragging ? state.mouse.x * Math.PI : 0;
      const targetRotationY = autoRotationRef.current + mouseRotation;
      easing.damp(modelRef.current.rotation, "y", targetRotationY, 0.25, delta);
      easing.damp(modelRef.current.rotation, "x", 0.5, 0.25, delta);

      const targetPositionY = isDetail ? 0 : 0.3;
      easing.damp(modelRef.current.position, "y", targetPositionY, 0.4, delta);

      scene.traverse((obj) => {
        const isCurrentlyHovered = isDetail && localHover === obj.name;
        const hoverOffset = isCurrentlyHovered ? 0.002 : 0;

        if (obj.name === "wadah") {
          easing.damp(obj.position, "y", (isDetail ? -0.02 : 0) + hoverOffset, 0.2, delta);
        } else if (obj.name === "tutup") {
          easing.damp(obj.position, "y", (isDetail ? 0.02 : 0) + hoverOffset, 0.2, delta);
        } else if (["OLED", "MPU6050", "C3_SUPERMINI", "VIN"].includes(obj.name)) {
          easing.damp(obj.position, "y", (isDetail ? 0.01 : 0) + hoverOffset, 0.2, delta);
        } else if (obj.name === "pcb") {
          easing.damp(obj.position, "y", (isDetail ? -0.0025 : 0) + hoverOffset, 0.2, delta);
        }
      });

      const targetScale = isDetail ? 35 : 40;
      easing.damp3(modelRef.current.scale, [targetScale, targetScale, targetScale], 0.4, delta);
    }
  });

  return (
    <Float 
      speed={isDetail && localHover ? 0 : 2} 
      rotationIntensity={0.2} 
      floatIntensity={0.5}
    >
      <group 
        ref={modelRef}
        onPointerDown={(e) => { e.stopPropagation(); setIsDragging(true); }}
        onPointerUp={() => setIsDragging(false)}
        onPointerLeave={() => {
          setIsDragging(false);
          setLocalHover(null);
          setHovered(null);
        }}
        onPointerOver={(e) => {
          if (!isDetail) return;
          e.stopPropagation();
          let current: THREE.Object3D | null = e.object;
          while (current && !targetNames.includes(current.name)) {
            current = current.parent;
          }
          if (current) {
            setLocalHover(current.name);
            setHovered(current.name);
          }
        }}
        onPointerOut={() => {
          setLocalHover(null);
          setHovered(null);
        }}
      >
        <Center>
          <primitive object={scene} />
        </Center>
      </group>
    </Float>
  );
}

function Pedestal() {
  return (
    <group position={[0, -2.3, 0]}>
      <mesh>
        <cylinderGeometry args={[1.2, 1.2, 3.5, 64]} />
        <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.8} />
      </mesh>
    </group>
  );
}

function SceneContent({ isDetail, setHovered }: { isDetail: boolean; setHovered: (name: string | null) => void }) {
  const sceneGroup = useRef<THREE.Group>(null);
  const modelWrapperRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (sceneGroup.current) {
      const targetX = isDetail ? 0 : 1.5;
      const targetY = isDetail ? -0.5 : 0;
      easing.damp3(sceneGroup.current.position, [targetX, targetY, 0], 0.4, delta);
    }
    if (modelWrapperRef.current) {
      const modelLift = isDetail ? 0.8 : 0;
      easing.damp(modelWrapperRef.current.position, "y", modelLift, 0.4, delta);
    }
  });

  return (
    <group ref={sceneGroup}>
      <group ref={modelWrapperRef}>
        <Model isDetail={isDetail} setHovered={setHovered} />
      </group>
      <Pedestal />
    </group>
  );
}

// --- MAIN PAGE ---
export default function HomePage() {
  const [isDetail, setIsDetail] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden font-sans">
      {/* Tampilan Header Awal */}
      <div className={`transition-opacity duration-1000 ${isDetail ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <div className="absolute top-0 left-0 w-full hidden md:flex items-center justify-between px-10 py-9 text-white text-xl font-light tracking-widest z-20">
          MOSYEN
        </div>
        <Navbar />
        <div className="absolute left-10 top-1/2 -translate-y-1/2 z-10 max-w-xl">
          <h1 className="text-white text-6xl font-extralight leading-tight mb-6">
            MOSYEN Our<br />
            <span className="font-medium text-zinc-200">Precision Motion</span><br />
            Capture Tech
          </h1>
          <p className="text-zinc-500 text-lg font-light italic">Click the device to explore internals.</p>
        </div>
      </div>

      {/* Overlay Penjelasan saat Hover (Hanya di mode Detail) */}
      {isDetail && hoveredKey && DESCRIPTIONS[hoveredKey] && (
        <div className="absolute top-32 right-12 z-[60] text-right pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-right-4">
          <h2 className="text-white text-4xl font-light tracking-tighter mb-2 uppercase">
            {DESCRIPTIONS[hoveredKey].title}
          </h2>
          <p className="text-zinc-400 max-w-sm text-sm leading-relaxed ml-auto">
            {DESCRIPTIONS[hoveredKey].info}
          </p>
          <div className="mt-4 h-[1px] w-24 bg-white/30 ml-auto" />
        </div>
      )}

      {/* Tombol Return */}
      {isDetail && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsDetail(false);
            setHoveredKey(null);
          }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 px-10 py-3 border border-white/20 text-white rounded-full font-light tracking-widest hover:bg-white hover:text-black transition-all duration-500"
        >
          RETURN TO VIEW
        </button>
      )}

      {/* Canvas Area */}
      <div 
        onClick={() => !isDetail && setIsDetail(true)}
        className="fixed top-0 left-0 w-full h-full cursor-pointer z-0"
      >
        <Canvas 
          shadows 
          camera={{ position: [0, 0, 5], fov: 40 }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
          <pointLight position={[-10, -10, -10]} intensity={1} />
          <Environment preset="city" />

          <Suspense fallback={null}>
            <SceneContent isDetail={isDetail} setHovered={setHoveredKey} />
            <ContactShadows 
              position={[0, -2.3, 0]} 
              opacity={0.4} 
              scale={10} 
              blur={2} 
            />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}