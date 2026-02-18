"use client";

import React, { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { multiMocap } from "@/lib/MultiMocapEngine";

export function Avatar() {
  const { scene } = useGLTF("/models/character.glb");
  const avatarRef = useRef<THREE.Group>(null);
  // Map untuk pencarian cepat
  const bonesMap = useRef<Map<string, THREE.Bone>>(new Map());
  const { scene: threeScene } = useThree();
  
  // Mencegah spam log
  const loggedErrors = useRef<Set<string>>(new Set());
  const hasPrintedList = useRef(false);

  useEffect(() => {
    bonesMap.current.clear();
    const allBoneNames: string[] = [];

    // 1. Scan Model dan Simpan Nama Asli
    scene.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        bonesMap.current.set(child.name, child as THREE.Bone);
        allBoneNames.push(child.name);
      }
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // 2. TAMPILKAN DAFTAR TULANG (Hanya Sekali)
    if (!hasPrintedList.current) {
        console.clear(); // Bersihkan console biar rapi
        console.log("%c ✅ BERHASIL LOAD MODEL! INI DAFTAR TULANGNYA:", "color: green; font-size: 14px; font-weight: bold;");
        console.log("------------------------------------------------");
        // Print sebagai tabel biar mudah dibaca
        console.table(allBoneNames); 
        console.log("------------------------------------------------");
        console.log("⚠️ Gunakan nama PERSIS seperti di atas untuk 'Target Bone'");
        hasPrintedList.current = true;
    }

    // Helper Visual
    const helper = new THREE.SkeletonHelper(scene);
    threeScene.add(helper);

    return () => {
        threeScene.remove(helper);
    };
  }, [scene, threeScene]);

  useFrame(() => {
    multiMocap.connections.forEach((conn, targetNameRaw) => {
        if (conn.status === "CONNECTED" && conn.quaternion) {
            
            // --- CARI TULANG ---
            let targetBone = bonesMap.current.get(targetNameRaw);

            // Jika tidak ketemu persis, cari yang mirip (case insensitive)
            if (!targetBone) {
                for (const [name, bone] of Array.from(bonesMap.current.entries())) {
                    // Cek apakah nama asli mengandung nama target (Target: "Head" -> Asli: "Mixamorig:Head")
                    if (name.toLowerCase().includes(targetNameRaw.toLowerCase())) {
                        targetBone = bone;
                        break;
                    }
                }
            }

            if (targetBone) {
                // Apply Rotasi
                const qSensor = conn.quaternion.clone();
                const qOffset = new THREE.Quaternion().setFromEuler(conn.offset);
                qSensor.multiply(qOffset);
                targetBone.quaternion.slerp(qSensor, 0.5);
            } else {
                // LOG ERROR (Hanya sekali per nama tulang, biar tidak spam)
                if (!loggedErrors.current.has(targetNameRaw)) {
                    console.error(`❌ ERROR KRITIS: Tulang '${targetNameRaw}' tidak ditemukan di model 3D!`);
                    console.warn(`👉 Cek Console Log di atas untuk melihat nama tulang yang benar.`);
                    loggedErrors.current.add(targetNameRaw);
                }
            }
        }
    });
  });

  return (
    <group>
        <primitive object={scene} ref={avatarRef} />
    </group>
  );
}