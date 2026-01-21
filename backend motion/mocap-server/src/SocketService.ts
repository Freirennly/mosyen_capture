// src/SocketService.ts
import { Server } from 'socket.io';
import http from 'http';

export class SocketService {
    private io: Server;
    public httpServer: http.Server;

    constructor(port: number) {
        this.httpServer = http.createServer();
        this.io = new Server(this.httpServer, {
            cors: { origin: "*" }
        });

        this.io.on('connection', (socket) => {
            console.log(`🌐 Client Connect: ${socket.id}`);
        });

        // Start server
        this.httpServer.listen(port, () => {
            console.log(`🚀 Socket Service siap di Port ${port}`);
        });
    }

    // Fungsi untuk broadcast data
    public broadcast(event: string, data: any) {
        this.io.emit(event, data);
    }
}