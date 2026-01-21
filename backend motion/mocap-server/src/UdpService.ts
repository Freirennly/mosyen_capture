// src/UdpService.ts
import dgram from 'dgram';
import { EventEmitter } from 'events';

// Kita pakai EventEmitter agar service ini bisa "berteriak" kalau ada data
export class UdpService extends EventEmitter {
    private server = dgram.createSocket('udp4');

    constructor(private port: number) {
        super(); // Init event emitter
        this.setup();
    }

    private setup() {
        // Saat data masuk
        this.server.on('message', (msg, rinfo) => {
            const rawString = msg.toString();
            
            // Coba parse JSON, kalau gagal abaikan
            try {
                const data = JSON.parse(rawString);
                // TERIAK: "Hei, ada data baru nih!"
                this.emit('data-received', data);
            } catch (e) {
                console.log('Data rusak diterima');
            }
        });

        this.server.on('listening', () => {
            console.log(`👂 UDP Service siap di Port ${this.port}`);
        });

        this.server.bind(this.port, '0.0.0.0');
    }
}