"use client";

import { useEffect, useState, useRef } from "react";
import { mosyenEngine } from "@/engine";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Square, RotateCcw, Save, Upload, Radio } from "lucide-react"; 
import { Navbar } from '@/components/layout/NavBar';

// Placeholder untuk 3D View (Three.js)
const MotionCanvas = () => {
    return (
        <div className="w-full h-[60vh] bg-neutral-900 rounded-xl flex items-center justify-center border border-neutral-800">
        <p className="text-neutral-500 animate-pulse">3D Viewport Render Here</p>
        </div>
    );
    };

    export default function DashboardPage() {
    const [fps, setFps] = useState(0);
    const [connected, setConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        // 1. Connect ke Backend 
        mosyenEngine.connect("http://localhost:3001");

        // 2. Subscribe data stream untuk update FPS & Status
        const unsubscribe = mosyenEngine.subscribe((data) => {
        setFps(mosyenEngine.fps);
        setConnected(mosyenEngine.isConnected);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
        <Navbar />

        <main className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            <div className="lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-light">Motion Capture <span className="font-bold text-blue-500">Preview</span></h1>
                <Badge variant={connected ? "default" : "destructive"} className="px-3 py-1">
                {connected ? "SYSTEM ONLINE" : "DISCONNECTED"}
                </Badge>
            </div>
            
            <MotionCanvas />
            
            {/* Info Bar */}
            <div className="flex gap-4 text-xs font-mono text-gray-400">
                <span>FPS: <span className="text-green-400">{fps}</span></span>
                <span>PACKETS: Streaming UDP/4210</span>
            </div>
            </div>

            {/* === RIGHT: CONTROL PANEL === */}
            <div className="lg:col-span-1 space-y-6">
            
            {/* Section: System Control */}
            <Card className="p-5 bg-neutral-900 border-neutral-800 space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">System</h3>
                
                <div className="grid grid-cols-2 gap-3">
                <Button 
                    variant="outline" 
                    className="w-full bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:text-white"
                    onClick={() => console.log("Reset T-Pose")}
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    T-Pose Reset
                </Button>

                <Button 
                    className={`w-full ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    onClick={() => setIsRecording(!isRecording)}
                >
                    <Radio className={`w-4 h-4 mr-2 ${isRecording ? 'animate-pulse' : ''}`} />
                    {isRecording ? "Stop" : "Record"}
                </Button>
                </div>
            </Card>

            {/* Section: Playback Control */}
            <Card className="p-5 bg-neutral-900 border-neutral-800 space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Playback</h3>
                
                <div className="space-y-3">
                <Button variant="secondary" className="w-full justify-start">
                    <Upload className="w-4 h-4 mr-2" />
                    Load Recording
                </Button>
                
                <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    <Play className="w-4 h-4 mr-2" />
                    Play
                    </Button>
                    <Button variant="outline" className="flex-1 bg-neutral-800 border-neutral-700">
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                    </Button>
                </div>
                </div>
            </Card>

            {/* Section: Start Action */}
            <Button size="lg" className="w-full h-16 text-lg font-bold bg-white text-black hover:bg-gray-200 mt-4">
                START SESSION
            </Button>

            </div>
        </main>
        </div>
    );
}