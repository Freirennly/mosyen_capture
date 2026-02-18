import { MotionData } from "./types";

type Listener = (data: MotionData) => void;
type ConnectionListener = (status: boolean) => void;

export class RealtimeEngine {
  private socket: WebSocket | null = null;
  private listeners: Listener[] = [];
  private connectionListeners: ConnectionListener[] = [];
  
  public isConnected = false;
  public currentMotion: MotionData | null = null;

  connect(url: string) {
    if (this.socket) this.socket.close();
    console.log(`🔌 Mencoba connect ke: ${url}`);
    
    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log("✅ WebSocket Terhubung!");
        this.isConnected = true;
        this.notifyConnection(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const rawData = event.data;
          
          // --- DEBUG RAW DATA ---
          // Kita print data mentah dari Arduino
          // console.log("📩 Raw Data dari ESP32:", rawData); 

          let parsedData: MotionData | null = null;

          // Parsing CSV "w,x,y,z"
          if (typeof rawData === 'string' && rawData.includes(',')) {
             const parts = rawData.split(",");
             if (parts.length >= 4) {
                 const w = parseFloat(parts[0]);
                 const x = parseFloat(parts[1]);
                 const y = parseFloat(parts[2]);
                 const z = parseFloat(parts[3]);
                 
                 // Masukkan ke array pertama
                 parsedData = { s: [[x, y, z, w]] };
             }
          }

          if (parsedData) {
             this.currentMotion = parsedData;
             this.listeners.forEach(fn => fn(parsedData!));
          } else {
             console.warn("⚠️ Gagal parsing data:", rawData);
          }

        } catch (e) {
          console.error("❌ Error onmessage:", e);
        }
      };

      this.socket.onclose = (e) => {
        console.log("🔴 WebSocket Putus:", e.code, e.reason);
        this.isConnected = false;
        this.notifyConnection(false);
      };

      this.socket.onerror = (e) => {
        console.error("❌ WebSocket Error:", e);
      };

    } catch (e) {
      console.error("Invalid URL", e);
    }
  }

  subscribe(fn: Listener) {
    this.listeners.push(fn);
    return () => this.listeners = this.listeners.filter(l => l !== fn);
  }

  subscribeConnection(fn: ConnectionListener) {
    this.connectionListeners.push(fn);
    return () => this.connectionListeners = this.connectionListeners.filter(l => l !== fn);
  }

  private notifyConnection(status: boolean) {
    this.connectionListeners.forEach(fn => fn(status));
  }
}

export const mosyenEngine = new RealtimeEngine();