import asyncio
import websockets

connected_clients = set()

async def handler(websocket):
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            for client in connected_clients.copy():
                if client != websocket:
                    try:
                        await client.send(message)
                    except:
                        pass
    except:
        pass
    finally:
        connected_clients.remove(websocket)

async def main():
    async with websockets.serve(handler, "localhost", 8765):
        print("Server WebSocket berjalan di ws://localhost:8765")
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass