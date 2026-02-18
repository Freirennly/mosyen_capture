"use client";

import React from "react";
import { motion } from "framer-motion";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex h-screen w-full items-center justify-center bg-black overflow-hidden font-sans">
      <div 
        className="absolute top-[-20%] left-[-10%] w-[100%] h-[70%] opacity-60 blur-[100px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(147,51,234,0.8) 0%, rgba(79,70,229,0.4) 50%, transparent 80%)",
          transform: "rotate(-25deg) skewX(-10deg)",
        }}
      />

      <div 
        className="absolute bottom-[-20%] right-[-10%] w-[100%] h-[70%] opacity-60 blur-[100px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(147,51,234,0.8) 0%, rgba(79,70,229,0.4) 50%, transparent 80%)",
          transform: "rotate(-25deg) skewX(-10deg)",
        }}
      />

      <div className="relative z-20 flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-extralight text-white/90 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] tracking-widest">
          MOSYEN
        </h1>
        
        <div className="mt-6 w-48 md:w-64 h-[2px] bg-white/10 relative overflow-hidden rounded-full">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent"
          />
        </div>
      </div>

      {/* Noise Texture Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};

export default Loader;