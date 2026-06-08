import { connect } from "cloudflare:sockets";

const expectedUserID = "b831381d-6324-4d53-ad4f-8cda48b30811"; // Default UUID
const proxyIP = "cdn.anycast.eu.org";

export default {
    async fetch(request, env, ctx) {
        try {
            const uuid = env.UUID || expectedUserID;
            const currentProxyIp = env.PROXYIP || proxyIP;
            const url = new URL(request.url);
            const upgradeHeader = request.headers.get('Upgrade');

            // 1. WebSocket Proxy Handler (VLESS Protocol)
            if (upgradeHeader === 'websocket') {
                return await handleVLESSWebSocket(request, uuid, currentProxyIp);
            }

            // 2. HTTP Routing / Dashboard
            if (url.pathname === '/') {
               return serveDashboard(url.hostname, uuid);
            }

            if (url.pathname === '/sub') {
                return new Response(btoa(`vless://${uuid}@${url.hostname}:443?encryption=none&security=tls&sni=${url.hostname}&fp=random&type=ws&host=${url.hostname}&path=%2F#Worker-VLESS`), { 
                    status: 200, 
                    headers: { 'Content-Type': 'text/plain' }
                });
            }

            return new Response('Not Found', { status: 404 });
        } catch (error) {
            return new Response("Node Error: " + error.message, { status: 500 });
        }
    }
};

async function handleVLESSWebSocket(request, expectedUUID, fallbackProxyIP) {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    server.accept();

    let tcpSocket = null;
    let vlessHeader = new Uint8Array([0, 0]); 

    server.addEventListener('message', async (event) => {
        const message = event.data;
        if (!(message instanceof ArrayBuffer)) return;

        const buffer = new Uint8Array(message);
        if (buffer.byteLength < 24) return;
        
        const incomingUUID = [...buffer.slice(1, 17)].map(b => b.toString(16).padStart(2, '0')).join('');
        if (incomingUUID.replace(/-/g, '') !== expectedUUID.replace(/-/g, '')) {
            server.close(1008, "Auth Failed");
            return;
        }

        const addonLen = buffer[17];
        const cmdOffset = 18 + addonLen;
        const cmd = buffer[cmdOffset];
        const port = (buffer[cmdOffset + 1] << 8) | buffer[cmdOffset + 2];
        const addrType = buffer[cmdOffset + 3];

        let addrOffset = cmdOffset + 4;
        let hostname = "";

        if (addrType === 1) { 
            hostname = buffer.slice(addrOffset, addrOffset + 4).join('.');
            addrOffset += 4;
        } else if (addrType === 2) { 
            const len = buffer[addrOffset];
            hostname = new TextDecoder().decode(buffer.slice(addrOffset + 1, addrOffset + 1 + len));
            addrOffset += 1 + len;
        } else if (addrType === 3) { 
            let ipv6 = [];
            for (let i = 0; i < 8; i++) ipv6.push((buffer[addrOffset + i*2] << 8 | buffer[addrOffset + i*2 + 1]).toString(16));
            hostname = ipv6.join(':');
            addrOffset += 16;
        }

        const payloadInfo = buffer.slice(addrOffset);

        if (!tcpSocket) {
            const targetHost = fallbackProxyIP ? fallbackProxyIP : hostname;
            try {
                tcpSocket = connect({ hostname: targetHost, port });
                
                const writer = tcpSocket.writable.getWriter();
                await writer.write(payloadInfo);
                writer.releaseLock();
                
                tcpSocket.readable.pipeTo(new WritableStream({
                    async write(chunk) {
                        if (vlessHeader) {
                            const combined = new Uint8Array(vlessHeader.length + chunk.length);
                            combined.set(vlessHeader, 0);
                            combined.set(chunk, vlessHeader.length);
                            server.send(combined);
                            vlessHeader = null;
                        } else {
                            server.send(chunk);
                        }
                    }
                }));
            } catch (e) {
                server.close(1011, "Upstream Proxy Connection Failed");
            }
        } else {
            const writer = tcpSocket.writable.getWriter();
            await writer.write(payloadInfo);
            writer.releaseLock();
        }
    });

    return new Response(null, { status: 101, webSocket: client });
}

function serveDashboard(domain, uuid) {
    const vlessLink = `vless://${uuid}@${domain}:443?encryption=none&security=tls&sni=${domain}&fp=random&type=ws&host=${domain}&path=%2F#Worker-VLESS`;
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VLESS Worker Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-900 text-slate-200 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-2xl w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            <div class="p-6 md:p-8">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">VLESS Worker Node</h1>
                        <p class="text-slate-400 text-sm">Status: <span class="text-emerald-400 font-medium">Online</span></p>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">VLESS Client Configuration</label>
                        <textarea class="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-emerald-400 font-mono text-sm focus:outline-none focus:border-indigo-500 resize-none" readonly id="vless-config">${vlessLink}</textarea>
                        <button onclick="copyConfig()" class="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                            Copy Configuration
                        </button>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">UUID</label>
                            <p class="text-slate-300 font-mono text-sm break-all">${uuid}</p>
                        </div>
                        <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Domain</label>
                            <p class="text-slate-300 font-mono text-sm break-all">${domain}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bg-slate-950 p-4 text-center text-slate-500 text-xs border-t border-slate-800">
                Advanced VLESS Proxy Router &bull; Deployed on Cloudflare Workers
            </div>
        </div>

        <script>
            function copyConfig() {
                const textarea = document.getElementById('vless-config');
                textarea.select();
                document.execCommand('copy');
                const btn = document.querySelector('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Copied!';
                btn.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
                btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
                    btn.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
                }, 2000);
            }
        </script>
    </body>
    </html>
    `;
    
    return new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
}
