"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { Navbar } from "@/components/layout/NavBar";

export default function HomePage() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 45,(window.innerWidth / 2) / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true,
    });
    renderer.setSize(window.innerWidth / 2, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, -3, 3);
    scene.add(fillLight);

    // heart shape
    const heartShape = new THREE.Shape();
    const x = 0, y = 0;
    heartShape.moveTo(x + 0.5, y + 0.5);
    heartShape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
    heartShape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
    heartShape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
    heartShape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
    heartShape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1.0, y);
    heartShape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);

    // Extrude heart 3D
    const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.05,
        bevelSegments: 8,
        };

        const heartGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
        heartGeometry.center();

        const heartMaterial = new THREE.MeshStandardMaterial({
        color: 0xb0b0b0,
        metalness: 0.4,
        roughness: 0.3,
        });

        const heart = new THREE.Mesh(heartGeometry, heartMaterial);
        heart.position.y = 0.8;
        heart.scale.set(0.7, 0.7, 0.7);
        heart.rotation.z = Math.PI;
        scene.add(heart);

        // cylinder pedestal
        const cylinderGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1.8, 64);
        const cylinderMaterial = new THREE.MeshStandardMaterial({
        color: 0xd0d0d0,
        metalness: 0.2,
        roughness: 0.5,
        });
        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        cylinder.position.y = -0.6;
        scene.add(cylinder);

        // horizontal cutout stripes
        const createStripe = (yPos: number) => {
        const stripeGeometry = new THREE.BoxGeometry(3, 0.18, 0.8);
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1,
        });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.position.set(0, yPos, 0);
        scene.add(stripe);
        return stripe;
        };

        createStripe(1.0);
        createStripe(0.55);

        // Mouse interaction
        let mouseX = 0;
        let mouseY = 0;
        let targetRotationY = 0;

        const handleMouseMove = (event: MouseEvent) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        };

        window.addEventListener("mousemove", handleMouseMove);

        // GSAP Animations
        gsap.to(heart.position, {
        y: 1.0,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        });

        // Animation loop
        const animate = () => {
        requestAnimationFrame(animate);

        targetRotationY += 0.005;
        heart.rotation.y = targetRotationY + mouseX * 0.3;

        camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.05;
        camera.position.y += (mouseY * 0.2 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
        };

        animate();
        setIsLoaded(true);

        // Handle resize
        const handleResize = () => {
        camera.aspect = (window.innerWidth / 2) / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth / 2, window.innerHeight);
        };

        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        renderer.dispose();
        heartGeometry.dispose();
        heartMaterial.dispose();
        cylinderGeometry.dispose();
        cylinderMaterial.dispose();
        };
    }, []);

    return (
        <div className="relative min-h-screen bg-black overflow-hidden">
                <div className="flex items-center justify-between px-10 py-9 text-white text-x2 font-reguler tracking-wide">
            MOSYEN
            </div>      
            <Navbar />
        {/* 3D Canvas - Right Side */}
        <canvas
            ref={canvasRef}
            className={`fixed right-0 top-0 w-1/2 h-full transition-opacity duration-1000 ${
            isLoaded ? "opacity-100" : "opacity-0"
            }`}
        />

        {/* Left Content */}
        <div className="absolute left-10 top-1/2 -translate-y-1/2 z-10 max-w-xl">
            <h1 className="text-white text-6xl font-light leading-tight mb-6">
            MOSYEN Our
            <br />
            Precision Motion
            <br />
            Capture Technology
            </h1>

            <p className="text-zinc-400 text-base font-light leading-relaxed">
            MOSYEN is an innovative motion capture device designed to
            <br />
            accurately record, analyze, and visualize movement in real time,
            <br />
            supporting animation, research, and interactive technology
            <br />
            development.
            </p>
        </div>
        </div>
    );
}