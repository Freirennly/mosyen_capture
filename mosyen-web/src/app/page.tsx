"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { Navbar } from "@/components/layout/NavBar";

export default function HomePage() {
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate blobs with GSAP
    if (blob1Ref.current) {
      gsap.to(blob1Ref.current, {
        x: "random(-100, 100)",
        y: "random(-100, 100)",
        duration: "random(15, 25)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    if (blob2Ref.current) {
      gsap.to(blob2Ref.current, {
        x: "random(-150, 150)",
        y: "random(-150, 150)",
        duration: "random(20, 30)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    if (blob3Ref.current) {
      gsap.to(blob3Ref.current, {
        x: "random(-120, 120)",
        y: "random(-120, 120)",
        duration: "random(18, 28)",
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }
  }, []);

  return (
    
    <div className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center">
      <div className="absolute top-0 left-0 w-full flex items-center justify-between px-10 py-9 text-white text-x2 font-reguler tracking-wide">
      MOSYEN
      </div>      
      <Navbar />
      
      {/* Animated Fluid Purple Blobs */}
      <div
        ref={blob1Ref}
        className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-purple-600/40 rounded-full blur-[150px] animate-pulse"
        style={{ animationDuration: "8s" }}
      />
      <div
        ref={blob2Ref}
        className="absolute bottom-[15%] right-[15%] w-[700px] h-[700px] bg-purple-500/30 rounded-full blur-[180px] animate-pulse"
        style={{ animationDuration: "10s" }}
      />
      <div
        ref={blob3Ref}
        className="absolute top-[40%] left-[30%] w-[500px] h-[500px] bg-purple-700/25 rounded-full blur-[160px] animate-pulse"
        style={{ animationDuration: "12s" }}
      />

      {/* Content */}
      <div className="relative z-10 text-right px-8 max-w-4xl ml-auto mr-20">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 leading-tight">
          Fluid Motion Tracking
          <br />
          Website
        </h1>

        <p className="text-zinc-400 text-sm md:text-base font-light mb-12 max-w-xl ml-auto">
          The website we created to demonstrate our motion tracking tool, MOSYEN
        </p>

        <Link
          href="/animation"
          className="inline-flex items-center gap-3 px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white font-medium transition-all duration-300 hover:scale-105 group">
          Get Started
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}