"use client";

import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/layout/NavBar";
import { multiMocap } from "@/lib/MultiMocapEngine"; 
import { Button } from "@/components/ui/button";
import { 
    Play, Square, Upload, RotateCcw, 
    Settings2, ChevronDown, ChevronLeft, 
    Plus, Trash2, Sliders, Radio, Pause, FileJson,
    Repeat, FastForward, StopCircle
} from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Grid, ContactShadows } from "@react-three/drei";
import { Avatar } from "@/components/3d/Avatar";
import { downloadJSON } from "@/lib/utils";
import { GlassAlert, AlertType } from "@/components/ui/GlassAlert";
import * as THREE from "three";

// --- KONSTANTA & MAPPING ---

// 1. Daftar ID Tulang (Internal - Sesuai Model 3D)
const BONE_LIST = [
    "Kepala", "Leher", "Dada", "Perut",
    "PundakR", "BahuR", "LenganR", "TanganR", 
    "PundakL", "BahuL", "LenganL", "TanganL",
    "PinggangR", "PahaR", "KempolR", "TelapakR", 
    "PinggangL", "PahaL", "KempolL", "TelapakL"
];

// 2. Mapping Nama User-Friendly
const BONE_LABELS: Record<string, string> = {
    "Kepala": "Kepala (Head)",
    "Leher": "Leher (Neck)",
    "Dada": "Dada (Chest)",
    "Perut": "Perut (Stomach)",
    "PundakR": "Pundak Kanan",
    "BahuR": "Lengan Atas Kanan",
    "LenganR": "Lengan Bawah Kanan",
    "TanganR": "Telapak Kanan",
    "PundakL": "Pundak Kiri",
    "BahuL": "Lengan Atas Kiri",
    "LenganL": "Lengan Bawah Kiri",
    "TanganL": "Telapak Kiri",
    "PinggangR": "Pinggul Kanan",
    "PahaR": "Paha Kanan",
    "KempolR": "Betis Kanan",
    "TelapakR": "Kaki Kanan",
    "PinggangL": "Pinggul Kiri",
    "PahaL": "Paha Kiri",
    "KempolL": "Betis Kiri",
    "TelapakL": "Kaki Kiri"
};

const AXIS_CONFIG = {
    x: { label: "Kanan / Kiri", color: "text-red-400", bg: "bg-red-500" },
    y: { label: "Putar (Atas/Bawah)", color: "text-green-400", bg: "bg-green-500" },
    z: { label: "Depan / Belakang", color: "text-blue-400", bg: "bg-blue-500" }
};

export default function AnimationPage() {
    // --- UI VIEW STATE ---
    const [viewMode, setViewMode] = useState<'main' | 'devices'>('main');
    const [isPanelVisible, setPanelVisible] = useState(true);
    
    // --- MULTI DEVICE STATE ---
    // FIX 1: Default bone ambil dari index 0, BUKAN string manual "RightArm"
    const [targetBone, setTargetBone] = useState(BONE_LIST[0]); 
    const [targetIp, setTargetIp] = useState("192.168.137.65:81");
    const [deviceList, setDeviceList] = useState<any[]>([]); 
    const [editingBone, setEditingBone] = useState<string | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0, z: 0 });

    // --- PLAYBACK & RECORDING STATE ---
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Feature: Loop & Speed
    const [isLooping, setIsLooping] = useState(true);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0); 
    
    const [playbackData, setPlaybackData] = useState<any[]>([]);
    const recordingBuffer = useRef<any[]>([]);
    const playbackFrame = useRef(0);
    const playbackInterval = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- ALERT STATE ---
    const [alertState, setAlertState] = useState({ show: false, msg: "", type: "info" as AlertType });

    const showAlert = (msg: string, type: AlertType = "info") => {
        setAlertState({ show: false, msg: "", type });
        setTimeout(() => setAlertState({ show: true, msg, type }), 50);
    };

    // --- ENGINE SYNC ---
    useEffect(() => {
        const unsub = multiMocap.subscribe((event) => {
            setDeviceList(Array.from(multiMocap.connections.values()));
            if (event) {
                if (event.type === "SUCCESS") showAlert(event.msg, "success");
                else if (event.type === "ERROR") showAlert(event.msg, "error");
                else if (event.type === "WARNING") showAlert(event.msg, "warning");
            }
        });

        // Recording Loop (30 FPS)
        const recordInterval = setInterval(() => {
            if (isRecording) {
                const frameSnapshot: any = {};
                multiMocap.connections.forEach((conn, boneName) => {
                    if (conn.status === "CONNECTED" || isPlaying) {
                        frameSnapshot[boneName] = conn.quaternion.toArray();
                    }
                });
                if (Object.keys(frameSnapshot).length > 0) {
                    recordingBuffer.current.push({ t: Date.now(), data: frameSnapshot });
                }
            }
        }, 33);

        return () => {
            unsub();
            clearInterval(recordInterval);
        };
    }, [isRecording, isPlaying]);

    // --- HANDLERS: DEVICE ---
    const handleAddDevice = () => {
        if (!targetIp) return showAlert("IP Kosong", "error");
        // Validasi ekstra: pastikan targetBone ada di list
        if (!BONE_LIST.includes(targetBone)) return showAlert("Pilih Bone dulu!", "warning");
        
        multiMocap.connectDevice(targetBone, targetIp);
    };

    const handleRemoveDevice = (bone: string) => multiMocap.disconnectDevice(bone);

    const handleOffsetChange = (axis: 'x'|'y'|'z', percentVal: string) => {
        const percent = parseFloat(percentVal);
        const radianVal = (percent / 100) * 3.14; // Convert % ke Radian
        const newOffset = { ...offset, [axis]: radianVal };
        setOffset(newOffset);
        if (editingBone) multiMocap.updateOffset(editingBone, newOffset.x, newOffset.y, newOffset.z);
    };

    const startEditing = (boneName: string) => {
        const conn = multiMocap.connections.get(boneName);
        if (conn) {
            if (editingBone === boneName) setEditingBone(null); 
            else {
                setEditingBone(boneName);
                setOffset({ x: conn.offset.x, y: conn.offset.y, z: conn.offset.z });
            }
        }
    };

    // --- HANDLERS: REC/PLAY ---
    const handleRecordToggle = () => {
        if(!isRecording) {
            recordingBuffer.current = [];
            setIsRecording(true);
            setIsPlaying(false);
            showAlert("Merekam...", "info");
        } else {
            setIsRecording(false);
            showAlert(`Selesai. ${recordingBuffer.current.length} frames tersimpan di memori.`, "success");
        }
    };

    const handleSave = () => {
        if (recordingBuffer.current.length === 0) return showAlert("Belum ada rekaman!", "error");
        downloadJSON(recordingBuffer.current, `mocap_${new Date().toISOString().slice(0,19)}.json`);
        showAlert("File Tersimpan!", "success");
    };

    const handleLoadClick = () => fileInputRef.current?.click();
    const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                setPlaybackData(json);
                showAlert(`Loaded ${json.length} frames`, "success");
            } catch (err) { showAlert("File JSON Rusak", "error"); }
        };
        reader.readAsText(file);
    };

    // --- PLAYBACK LOGIC UPDATE ---
    const stopPlayback = () => {
        setIsPlaying(false);
        if (playbackInterval.current) clearInterval(playbackInterval.current);
        playbackFrame.current = 0;
    };

    const handlePlayToggle = () => {
        if (playbackData.length === 0) return showAlert("Load JSON dulu!", "warning");

        if (isPlaying) {
            // PAUSE
            setIsPlaying(false);
            if (playbackInterval.current) clearInterval(playbackInterval.current);
            showAlert("Paused", "info");
        } else {
            // PLAY
            setIsPlaying(true);
            setIsRecording(false);
            showAlert(`Playing (${playbackSpeed}x)`, "success");

            // Interval berdasarkan Speed (Normal 33ms = 30fps)
            const intervalMs = 33 / playbackSpeed;

            playbackInterval.current = setInterval(() => {
                const frame = playbackData[playbackFrame.current];
                if (frame && frame.data) {
                    Object.keys(frame.data).forEach(boneName => {
                        let conn = multiMocap.connections.get(boneName);
                        if (!conn) {
                            // Dummy connection agar avatar visual update
                            conn = { id: 'play', ip: 'rec', boneName, socket: null, quaternion: new THREE.Quaternion(), offset: new THREE.Euler(), status: 'CONNECTED' };
                            multiMocap.connections.set(boneName, conn);
                        }
                        const [x,y,z,w] = frame.data[boneName];
                        conn.quaternion.set(x,y,z,w);
                    });
                }

                playbackFrame.current++;
                
                // Logic Loop / Stop
                if (playbackFrame.current >= playbackData.length) {
                    if (isLooping) {
                        playbackFrame.current = 0;
                    } else {
                        stopPlayback();
                        showAlert("Playback Selesai", "info");
                    }
                }
            }, intervalMs);
        }
    };

    const handleReset = () => {
        stopPlayback();
        setIsRecording(false);
        recordingBuffer.current = [];
        setPlaybackData([]);
        if (editingBone) {
            multiMocap.updateOffset(editingBone, 0, 0, 0);
            setOffset({ x: 0, y: 0, z: 0 });
        }
        showAlert("Scene Reset", "info");
    };

    return (
        <div className="h-screen w-screen overflow-hidden bg-[#050505] relative font-sans text-white">
            <div className="absolute z-100 top-0 left-0 w-full flex items-center justify-between px-10 py-9 text-white text-x2 font-reguler tracking-wide">
            MOSYEN
            </div> 
            <Navbar />
            <GlassAlert isVisible={alertState.show} message={alertState.msg} type={alertState.type} onClose={() => setAlertState(s => ({ ...s, show: false }))} />
            <input type="file" ref={fileInputRef} onChange={handleFileLoad} className="hidden" accept=".json" />

            {/* 3D SCENE */}
            <div className="absolute inset-0 z-0">
                <Canvas shadows camera={{ position: [0, 1.5, 3.5], fov: 45 }}>
                    <color attach="background" args={['#050505']} />
                    <ambientLight intensity={0.6} />
                    <spotLight position={[5, 10, 5]} intensity={1.5} castShadow />
                    <Environment preset="city" />
                    <group position={[0, -1, 0]}>
                        <Avatar /> 
                        <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.5} far={10} color="#000000" />
                        <Grid infiniteGrid cellSize={0.5} sectionSize={2} fadeDistance={15} sectionColor={"#3b82f6"} cellColor={"#1e293b"} />
                    </group>
                    <OrbitControls target={[0, 1, 0]} />
                </Canvas>
            </div>

            {/* TOGGLE BUTTON */}
            <AnimatePresence>
                {!isPanelVisible && (
                    <motion.button onClick={() => setPanelVisible(true)} className="fixed bottom-8 right-8 z-40 p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/20 transition shadow-lg">
                        <Settings2 className="w-6 h-6 text-white" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* GLASSMORPHISM CONTROL PANEL */}
            <AnimatePresence mode="wait">
                {isPanelVisible && (
                <motion.div 
                    initial={{ opacity: 0, y: 50, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    className="fixed bottom-8 right-8 z-50 w-[360px] bg-black/40 backdrop-blur-xl border border-white/10 p-5 rounded-[2rem] shadow-2xl flex flex-col gap-4 overflow-hidden ring-1 ring-white/5"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-blue-200 uppercase drop-shadow-lg">
                            {viewMode === 'main' ? 'Studio Controller' : 'Device Config'}
                        </span>
                        <button onClick={() => setPanelVisible(false)} className="opacity-50 hover:opacity-100 transition"><ChevronDown className="w-4 h-4" /></button>
                    </div>

                    {/* VIEW 1: MAIN CONTROLS */}
                    {viewMode === 'main' ? (
                        <motion.div 
                            key="main"
                            initial={{ x: -20, opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-4"
                        >
                            {/* Record Button */}
                            <Button onClick={handleRecordToggle} className={`w-full h-12 text-xs font-bold tracking-wide transition-all rounded-xl ${isRecording ? "bg-red-500/20 text-red-200 border border-red-500/50 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300"}`}>
                                {isRecording ? <Square className="w-4 h-4 mr-2 fill-current" /> : <Radio className="w-4 h-4 mr-2" />}
                                {isRecording ? `STOP RECORDING` : "START LIVE RECORD"}
                            </Button>

                            {/* Playback Controls Container */}
                            <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-3">
                                {/* Speed & Loop Controls */}
                                <div className="flex justify-between items-center px-1">
                                    <button 
                                        onClick={() => setIsLooping(!isLooping)} 
                                        className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition ${isLooping ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-transparent border-transparent text-gray-500 hover:text-white'}`}
                                    >
                                        <Repeat className="w-3 h-3" /> {isLooping ? 'Loop ON' : 'Loop OFF'}
                                    </button>

                                    <div className="flex items-center gap-2 bg-black/20 rounded-full px-2 py-1">
                                        <FastForward className="w-3 h-3 text-gray-400" />
                                        <select 
                                            value={playbackSpeed} 
                                            onChange={(e) => {
                                                setPlaybackSpeed(parseFloat(e.target.value));
                                                if(isPlaying) {
                                                    stopPlayback(); // Reset if changing speed while playing
                                                    setTimeout(handlePlayToggle, 100);
                                                }
                                            }}
                                            className="bg-transparent text-[10px] text-white focus:outline-none cursor-pointer"
                                        >
                                            <option value="0.25" className="bg-gray-900">0.25x</option>
                                            <option value="0.5" className="bg-gray-900">0.5x</option>
                                            <option value="1.0" className="bg-gray-900">1.0x (Normal)</option>
                                            <option value="1.5" className="bg-gray-900">1.5x</option>
                                            <option value="2.0" className="bg-gray-900">2.0x</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Main Buttons */}
                                <div className="grid grid-cols-4 gap-2">
                                    <Button onClick={handleLoadClick} variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 h-10 col-span-1 rounded-lg" title="Load JSON">
                                        <Upload className="w-4 h-4 text-gray-300" />
                                    </Button>
                                    
                                    <Button onClick={handlePlayToggle} className={`h-10 col-span-2 rounded-lg font-bold text-xs transition border ${isPlaying ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 hover:bg-amber-500/30' : 'bg-blue-500/20 border-blue-500/50 text-blue-200 hover:bg-blue-500/30'}`}>
                                        {isPlaying ? <><Pause className="w-4 h-4 mr-2" /> PAUSE</> : <><Play className="w-4 h-4 mr-2" /> PLAY</>}
                                    </Button>
                                    
                                    <Button onClick={stopPlayback} variant="outline" className="bg-white/5 border-white/10 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200 h-10 col-span-1 rounded-lg" title="Stop">
                                        <StopCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                                
                                <div className="flex justify-between gap-2">
                                    <Button onClick={handleSave} variant="ghost" className="flex-1 h-8 text-[10px] bg-white/5 hover:bg-green-500/20 text-gray-400 hover:text-green-200 rounded-lg">
                                        <FileJson className="w-3 h-3 mr-2" /> Save JSON
                                    </Button>
                                    <Button onClick={handleReset} variant="ghost" className="flex-1 h-8 text-[10px] bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-200 rounded-lg">
                                        <RotateCcw className="w-3 h-3 mr-2" /> Reset All
                                    </Button>
                                </div>
                            </div>

                            <Button onClick={() => setViewMode('devices')} className="w-full h-10 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/10 hover:border-white/30 text-white/80 text-xs rounded-xl shadow-lg mt-2">
                                <Settings2 className="w-3 h-3 mr-2" /> Device Manager
                            </Button>
                        </motion.div>
                    ) : (
                        /* VIEW 2: MULTI-DEVICE MANAGER */
                        <motion.div 
                            key="devices"
                            initial={{ x: 20, opacity: 0 }} 
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 20, opacity: 0 }}
                            className="flex flex-col h-full"
                        >
                            <button onClick={() => setViewMode('main')} className="flex items-center text-xs text-white-400 hover:text-white mb-4 transition group w-fit">
                                <ChevronLeft className="w-3 h-3 mr-1 group-hover:-translate-x-1 transition" /> Back to Studio
                            </button>

                            {/* Form Input Glass */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3 mb-3 shadow-inner">
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase text-white-500 font-bold ml-1">Target Bone</label>
                                    <div className="relative">
                                        <select 
                                            value={targetBone} 
                                            onChange={(e) => setTargetBone(e.target.value)}
                                            className="w-full appearance-none bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition cursor-pointer"
                                        >
                                            {BONE_LIST.map(b => (
                                                <option key={b} value={b} className="bg-[#1a1a1a]">
                                                    {BONE_LABELS[b] || b}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-2.5 w-3 h-3 text-gray-500 pointer-events-none" />
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <label className="text-[9px] uppercase text-white-500 font-bold ml-1">IP Address</label>
                                    <div className="flex gap-2">
                                        <input 
                                            value={targetIp} 
                                            onChange={(e) => setTargetIp(e.target.value)}
                                            placeholder="192.168.137.X:81"
                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500/50 transition text-blue-200"
                                        />
                                        <Button onClick={handleAddDevice} size="sm" className="bg-blue-600/80 hover:bg-blue-500 rounded-lg h-full w-10 p-0 shadow-lg shadow-blue-900/50"><Plus className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            </div>

                            {/* List Devices */}
                            <div className="flex-1 max-h-[280px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {deviceList.length === 0 && (
                                    <div className="text-center py-8 flex flex-col items-center justify-center text-white-600 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                                        <Settings2 className="w-8 h-8 mb-2 opacity-20" />
                                        <span className="text-[10px]">No Devices Connected</span>
                                    </div>
                                )}
                                
                                {deviceList.map((dev) => (
                                    <div key={dev.boneName} className={`bg-white/5 border ${editingBone === dev.boneName ? 'border-blue-500/30 bg-blue-500/5' : 'border-white/5'} rounded-xl p-3 transition-all hover:bg-white/10`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-xs font-bold text-gray-200">{BONE_LABELS[dev.boneName] || dev.boneName}</div>
                                                <div className="text-[9px] text-gray-500 font-mono mt-0.5">{dev.ip}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${dev.status === 'CONNECTED' ? 'bg-green-500 shadow-green-500/50 animate-pulse' : 'bg-red-500 shadow-red-500/50'}`} />
                                                
                                                <button onClick={() => startEditing(dev.boneName)} className={`p-1.5 rounded-lg transition ${editingBone === dev.boneName ? 'text-blue-300 bg-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                                                    <Sliders className="w-3.5 h-3.5" />
                                                </button>
                                                
                                                <button onClick={() => handleRemoveDevice(dev.boneName)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-300 hover:bg-red-500/20 transition">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* CALIBRATION SLIDERS */}
                                        {editingBone === dev.boneName && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }} 
                                                animate={{ height: "auto", opacity: 1 }}
                                                className="mt-3 pt-3 border-t border-white/10 space-y-3"
                                            >
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[9px] uppercase tracking-wider text-blue-300/80 font-bold">Calibration</span>
                                                    <button onClick={() => { handleOffsetChange('x', "0"); handleOffsetChange('y', "0"); handleOffsetChange('z', "0"); }} className="text-[8px] text-gray-500 hover:text-white transition">Reset</button>
                                                </div>

                                                {(['x', 'y', 'z'] as const).map((axis) => {
                                                    const currentPercent = Math.round((offset[axis] / 3.14) * 100);
                                                    const config = AXIS_CONFIG[axis];
                                                    return (
                                                        <div key={axis} className="space-y-1.5">
                                                            <div className="flex justify-between text-[9px] px-1">
                                                                <span className={`${config.color}`}>{config.label}</span>
                                                                <span className="font-mono text-white/50">{currentPercent}%</span>
                                                            </div>
                                                            <div className="relative flex items-center h-4 group">
                                                                <input 
                                                                    type="range" min="-100" max="100" step="1"
                                                                    value={currentPercent}
                                                                    onChange={(e) => handleOffsetChange(axis, e.target.value)}
                                                                    className="w-full h-full opacity-0 absolute z-20 cursor-pointer"
                                                                />
                                                                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden absolute">
                                                                    <div className={`h-full ${config.bg} shadow-[0_0_10px_currentColor]`} style={{ width: `${((currentPercent + 100) / 200) * 100}%` }} />
                                                                </div>
                                                                <div className="w-3 h-3 bg-white rounded-full shadow-lg absolute pointer-events-none transition-all group-hover:scale-110" style={{ left: `calc(${((currentPercent + 100) / 200) * 100}% - 6px)` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}