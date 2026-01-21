import { io, Socket } from "socket.io-client";
import { MotionData } from "./types";

type Listener = (data: MotionData) => void;

export class RealtimeEngine {
    private socket: Socket | null = null;
    private listeners: Listener[] = []
    
    // Status koneksi untuk UI
    public isConnected = false;
    public fps = 0;
    private lastFrameTime = 0;

    connect(url: string) {
        this.socket = io(url, { transports: ["websocket"] });

        this.socket.on("connect", () => {
        console.log("Connected to MOSYEN Backend");
        this.isConnected = true;
        });

        this.socket.on("motion_data", (data: any) => {
        // Hitung FPS untuk monitoring
        const now = performance.now();
        this.fps = Math.round(1000 / (now - this.lastFrameTime));
        this.lastFrameTime = now;

        // Broadcast ke semua listener (UI)
        this.listeners.forEach(fn => fn(data));
        });

        this.socket.on("disconnect", () => {
        this.isConnected = false;
        });
    }

    subscribe(fn: Listener) {
        this.listeners.push(fn);
        return () => {
        this.listeners = this.listeners.filter(l => l !== fn);
        };
    }
}