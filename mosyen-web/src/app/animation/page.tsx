"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/NavBar";
import { mosyenEngine } from "@/engine"; 
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Square, RotateCcw, ChevronDown, ChevronUp, Settings2, Activity, Radio, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AnimationPage() {
    const [isPanelVisible, setPanelVisible] = useState(true);
    const [connected, setConnected] = useState(false);
    const [fps, setFps] = useState(0);

    // Connection Logic
    useEffect(() => {
        mosyenEngine.connect("http://localhost:3001");
        const unsub = mosyenEngine.subscribe(() => {
            setConnected(mosyenEngine.isConnected);
            setFps(mosyenEngine.fps);
        });
        return () => unsub();
    }, []);

    return (
        <div className="h-screen w-screen overflow-hidden bg-black relative">
        <div className="bloom-bg opacity-50" />
        <Navbar />

        {/* === 3D VIEWPORT AREA (FULLSCREEN) === */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="text-center space-y-4 opacity-30">
                {/* GAWE <Canvas> Three.js MENGKO */}
                <div className="w-[600px] h-[600px] border border-white/10 rounded-full animate-pulse flex items-center justify-center">
                    <p className="font-mono text-sm">3D RENDER SPACE</p>
                </div>
            </div>
        </div>

        {/* === TOGGLE BUTTON (Muncul saat panel hidden) === */}
        <AnimatePresence>
            {!isPanelVisible && (
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={() => setPanelVisible(true)}
                    className="fixed bottom-8 right-8 z-40 p-4 rounded-full glass-panel hover:bg-white/10 transition group"
                >
                    <Settings2 className="w-6 h-6 text-white group-hover:rotate-45 transition-transform" />
                </motion.button>
            )}
        </AnimatePresence>

        {/* === CONTROL PANEL === */}
        <AnimatePresence>
            {isPanelVisible && (
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-8 right-4 md:right-8 z-50 w-[320px] glass-panel rounded-3xl p-6 flex flex-col gap-6"
            >
                {/* Header Panel */}
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`} />
                        <span className="text-xs font-mono text-gray-400">FPS: <span className="text-white">{fps}</span></span>
                    </div>
                    <button onClick={() => setPanelVisible(false)} className="hover:bg-white/10 p-1 rounded-md transition">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                {/* System Controls */}
                <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500">System</label>
                    <Button variant="outline" className="w-full bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10 justify-start h-10">
                        <RotateCcw className="w-4 h-4 mr-2" /> T-Pose Reset
                    </Button>
                </div>

                {/* Record Controls */}
                <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500">Record</label>
                    <Button className="w-full bg-white/10 border border-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 text-gray-300 transition-all h-12">
                        <Radio className="w-4 h-4 mr-2" /> Start Recording
                    </Button>
                </div>

                {/* Playback Controls */}
                <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500">Playback</label>
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="ghost" className="bg-white/5 hover:bg-white/10 text-gray-300">
                            <Upload className="w-4 h-4 mr-2" /> Load
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20">
                            <Play className="w-4 h-4 mr-2" /> Play
                        </Button>
                    </div>
                </div>

            </motion.div>
            )}
        </AnimatePresence>

        </div>
    );
}