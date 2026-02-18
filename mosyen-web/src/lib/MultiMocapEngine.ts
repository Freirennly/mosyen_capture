import * as THREE from "three";

// Tipe Event untuk Notifikasi UI
export interface EngineEvent {
    type: "SUCCESS" | "ERROR" | "WARNING";
    msg: string;
}

export interface BoneConnection {
    id: string;
    ip: string;
    boneName: string;
    socket: WebSocket | null;
    quaternion: THREE.Quaternion;
    offset: THREE.Euler;
    status: "CONNECTING" | "CONNECTED" | "DISCONNECTED" | "ERROR";
}

class MultiMocapEngine {
    public connections: Map<string, BoneConnection> = new Map();
    
    // Listener sekarang menerima parameter opsional (Event)
    private listeners: ((event?: EngineEvent) => void)[] = [];

    constructor() {}

    connectDevice(boneName: string, ipRaw: string) {
        let ip = ipRaw.trim();
        if (!ip.startsWith("ws://") && !ip.startsWith("wss://")) {
        ip = `ws://${ip}`;
        }

        // 1. Cek apakah IP ini valid/bisa dijangkau (Basic check)
        if(ip.length < 9) {
            this.notifyListeners({ type: "ERROR", msg: `Invalid IP for ${boneName}` });
            return;
        }

        // 2. Bersihkan koneksi lama
        this.disconnectDevice(boneName);

        console.log(`🔌 [Engine] Connecting ${boneName} to ${ip}`);

        const conn: BoneConnection = {
        id: `${boneName}-${Date.now()}`,
        ip,
        boneName,
        socket: null,
        quaternion: new THREE.Quaternion(),
        offset: new THREE.Euler(0, 0, 0),
        status: "CONNECTING"
        };

        try {
        const ws = new WebSocket(ip);
        conn.socket = ws;

        // --- TIMEOUT HANDLER ---
        // Jika dalam 3 detik tidak connect, anggap gagal
        const connectionTimeout = setTimeout(() => {
            if (ws.readyState !== WebSocket.OPEN) {
                ws.close();
                conn.status = "ERROR";
                this.notifyListeners({ type: "ERROR", msg: `${boneName}: Connection Timeout` });
            }
        }, 3000);

        ws.onopen = () => {
            clearTimeout(connectionTimeout); 
            console.log(`[Engine] ${boneName} Connected!`);
            conn.status = "CONNECTED";
            // KIRIM NOTIFIKASI SUKSES
            this.notifyListeners({ type: "SUCCESS", msg: `${boneName} Connected!` });
        };

        ws.onmessage = (event) => {
            try {
                const text = event.data.toString().trim();
                const parts = text.split(',');
                if (parts.length >= 4) {
                    const w = parseFloat(parts[0]);
                    const x = parseFloat(parts[1]);
                    const y = parseFloat(parts[2]);
                    const z = parseFloat(parts[3]);
                    if (!isNaN(w)) conn.quaternion.set(x, y, z, w);
                }
            } catch (err) { console.error(err); }
        };

        ws.onclose = (e) => {
            clearTimeout(connectionTimeout);
            // Bedakan antara close manual atau error
            if (conn.status === "CONNECTED") {
                console.log(`[Engine] ${boneName} Disconnected`);
                conn.status = "DISCONNECTED";
                // KIRIM NOTIFIKASI DISCONNECT
                this.notifyListeners({ type: "WARNING", msg: `${boneName} Disconnected` });
            } else {
                conn.status = "ERROR";
            }
        };

        ws.onerror = (e) => {
            clearTimeout(connectionTimeout);
            console.error(`❌ [Engine] ${boneName} Error`);
            conn.status = "ERROR";
            // KIRIM NOTIFIKASI ERROR
            this.notifyListeners({ type: "ERROR", msg: `${boneName}: Connection Failed` });
        };

        this.connections.set(boneName, conn);
        this.notifyListeners(); 

        } catch (e) {
        console.error("Connection Failed", e);
        this.notifyListeners({ type: "ERROR", msg: `System Error: ${e}` });
        }
    }

    disconnectDevice(boneName: string) {
        const conn = this.connections.get(boneName);
        if (conn) {
        // Set status dulu agar onclose tidak memicu alert error
        conn.status = "DISCONNECTED"; 
        if (conn.socket) conn.socket.close();
        this.connections.delete(boneName);
        this.notifyListeners({ type: "WARNING", msg: `${boneName} Removed` });
        }
    }

    updateOffset(boneName: string, x: number, y: number, z: number) {
        const conn = this.connections.get(boneName);
        if (conn) conn.offset.set(x, y, z);
    }

    // Subscribe sekarang bisa menerima Event
    subscribe(fn: (event?: EngineEvent) => void) {
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter(l => l !== fn);
        };
    }

    private notifyListeners(event?: EngineEvent) {
        this.listeners.forEach(fn => fn(event));
    }
}

export const multiMocap = new MultiMocapEngine();