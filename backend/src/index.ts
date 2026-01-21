// src/index.ts
import { UdpService } from './UdpService';
import { SocketService } from './SocketService';

const UDP_PORT = 4210;
const WEB_PORT = 3001;

// 1. Hidupkan Service
const udp = new UdpService(UDP_PORT);
const web = new SocketService(WEB_PORT);

// 2. Sambungkan Keduanya (Logic Jembatan)
// "Saat UDP dapat data -> Suruh Web broadcast data itu"
udp.on('data-received', (motionData) => {
    // Kirim ke browser dengan nama event 'motion_data'
    web.broadcast('motion_data', motionData);
    
    // Debugging (Opsional)
    console.log('Relaying:', motionData);
});

console.log('--- SYSTEM MOTION CAPTURE AKTIF ---');