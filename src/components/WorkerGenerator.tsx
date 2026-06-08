import React, { useState } from 'react';
import { Terminal, Copy, CheckCircle2 } from 'lucide-react';
import { generateUUID } from '../lib/vless';

export default function WorkerGenerator() {
  const [uuid, setUuid] = useState(generateUUID());
  const [proxyIp, setProxyIp] = useState('cdn.anycast.eu.org');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(workerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const workerCode = `// -------------------------------------------------------------
// USER GENERAL - ADVANCED VLESS PROXY ROUTER
// 100% Standalone Cloudflare Worker Node
// -------------------------------------------------------------

import { connect } from "cloudflare:sockets";

// --- CONFIGURATION ---
const NODE_UUID = '${uuid}';
const PROXY_IP = '${proxyIp}';
const ALLOWED_PORTS = [443, 80, 2053, 2083, 2087, 2096, 8443];

// --- CORE ROUTER LOGIC ---
export default {
    async fetch(request, env, ctx) {
        try {
            const uuid = env.UUID || NODE_UUID;
            const proxyIp = env.PROXYIP || PROXY_IP;
            const url = new URL(request.url);
            const upgradeHeader = request.headers.get('Upgrade');

            // 1. Dashboard / Sub Handler (HTTP Router)
            if (!upgradeHeader || upgradeHeader !== 'websocket') {
                switch (url.pathname) {
                    case '/':
                        return new Response(JSON.stringify({
                            status: "Online",
                            node: "USER GENERAL EDGE NODE",
                            proxy_status: proxyIp ? "Enabled" : "Direct",
                            timestamp: new Date().toISOString()
                        }, null, 2), { status: 200, headers: { "Content-Type": "application/json" } });
                    case '/sub':
                        return new Response("Subscription endpoint ready.", { status: 200 });
                    default:
                        return new Response('Not Found', { status: 404 });
                }
            }

            // 2. VLESS WS Proxy Router (TCP Relay)
            return await vlessRouter(request, uuid, proxyIp);
        } catch (error) {
            return new Response("Node Error: " + error.message, { status: 500 });
        }
    }
};

async function vlessRouter(request, expectedUUID, fallbackProxyIP) {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    server.accept();

    let tcpSocket = null;
    let vlessHeader = new Uint8Array([0, 0]); // Response version & addon length

    server.addEventListener('message', async (event) => {
        const message = event.data;
        if (!(message instanceof ArrayBuffer)) return;
        const buffer = new Uint8Array(message);
        
        if (buffer.byteLength < 24) return; // Prevent malformed packets
        
        // Protocol Parsing (VLESS)
        const incomingUUID = [...buffer.slice(1, 17)].map(b => b.toString(16).padStart(2, '0')).join('');
        
        // UUID Validation Check
        if (incomingUUID.replace(/-/g, '') !== expectedUUID.replace(/-/g, '')) {
            server.close(1008, "Auth Failed");
            return;
        }

        const addonLen = buffer[17];
        const cmdOffset = 18 + addonLen;
        const port = (buffer[cmdOffset + 1] << 8) | buffer[cmdOffset + 2];
        const addrType = buffer[cmdOffset + 3];

        let addrOffset = cmdOffset + 4;
        let hostname = "";

        if (addrType === 1) { // IPv4
            hostname = buffer.slice(addrOffset, addrOffset + 4).join('.');
            addrOffset += 4;
        } else if (addrType === 2) { // Domain Name
            const len = buffer[addrOffset];
            hostname = new TextDecoder().decode(buffer.slice(addrOffset + 1, addrOffset + 1 + len));
            addrOffset += 1 + len;
        } else if (addrType === 3) { // IPv6
            let ipv6 = [];
            for (let i = 0; i < 8; i++) ipv6.push((buffer[addrOffset + i*2] << 8 | buffer[addrOffset + i*2 + 1]).toString(16));
            hostname = ipv6.join(':');
            addrOffset += 16;
        }

        const payloadInfo = buffer.slice(addrOffset);

        // Core Outbound Routing Logic
        if (!tcpSocket) {
            // Priority: Use CF Fallback Proxy IP if provided to prevent recursive CF blocking
            const targetHost = fallbackProxyIP ? fallbackProxyIP : hostname;
            
            try {
                tcpSocket = connect({ hostname: targetHost, port });
                
                // Write initial payload chunk
                const writer = tcpSocket.writable.getWriter();
                await writer.write(payloadInfo);
                writer.releaseLock();
                
                // Read from TCP and pipe back to WebSocket Client
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
            // Write existing payload stream
            const writer = tcpSocket.writable.getWriter();
            await writer.write(payloadInfo);
            writer.releaseLock();
        }
    });

    return new Response(null, { status: 101, webSocket: client });
}
`;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 w-full">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-4 md:mb-6 flex items-center justify-between">
          <h2 className="font-bold text-base md:text-lg text-slate-800">Cloudflare Pages Worker Code</h2>
        </div>
        
        <p className="text-slate-600 text-xs md:text-sm mb-6 leading-relaxed max-w-3xl">
          Generate a standalone Cloudflare Worker script optimized for VLESS WebSocket proxying. 
          Set your preferred UUID and Proxy IP below to inject it into the payload.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-3xl">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Deployment UUID</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                value={uuid} 
                onChange={(e) => setUuid(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm inset-shadow-sm w-full"
              />
              <button 
                onClick={() => setUuid(generateUUID())}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold rounded-lg transition-colors border border-indigo-100 text-sm shadow-sm flex-shrink-0 text-center"
              >
                Regenerate
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Fallback Proxy IP / CF Routed IP</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                value={proxyIp} 
                onChange={(e) => setProxyIp(e.target.value)}
                placeholder="Leave blank for direct"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm inset-shadow-sm w-full"
              />
            </div>
          </div>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 md:p-6 max-w-3xl mb-2">
          <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-sm">💡</span>
            Cara Penggunaan (Deployment Steps)
          </h3>
          <ol className="list-decimal list-inside text-sm text-indigo-800/80 space-y-3 leading-relaxed">
            <li><strong>Copy Script:</strong> Klik tombol <strong className="font-semibold text-indigo-900">Copy Code</strong> di bawah untuk menyalin seluruh kode generator ke clipboard Anda.</li>
            <li><strong>Buka Cloudflare:</strong> Login ke dashboard Cloudflare Anda, lalu buka menu <strong className="font-semibold text-indigo-900">Workers & Pages</strong>.</li>
            <li><strong>Buat Worker:</strong> Klik tombol <strong>Create Application</strong> &rarr; <strong>Create Worker</strong>, beri nama bebas, lalu klik <strong>Deploy</strong>.</li>
            <li><strong>Edit Code:</strong> Setelah terdeploy, klik tombol <strong>Edit Code</strong>.</li>
            <li><strong>Paste & Save:</strong> Hapus semua kode bawaan yang ada di editor Cloudflare, lalu paste kode yang telah Anda copy dari sini. Klik <strong>Save and Deploy</strong>.</li>
            <li className="pt-2 text-xs text-indigo-700"><em>Langkah ini wajib! Web app ini hanyalah "Generator" untuk scriptnya. Proxy VLESS Anda baru benar-benar berfungsi jika script ini di-deploy di infrastruktur jaringan global milik Cloudflare.</em></li>
          </ol>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="text-[10px] md:text-xs font-bold text-slate-400 font-mono uppercase tracking-widest break-all">_worker.js</span>
          </div>
          <button 
            onClick={handleCopy}
            className="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1.5 hover:bg-slate-800 bg-slate-800 sm:bg-transparent rounded-lg text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider border border-slate-700 sm:border-transparent"
            title="Copy Code"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Code'}
          </button>
        </div>
        <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
          <pre className="text-slate-300 font-mono text-[10px] md:text-xs leading-relaxed min-w-[max-content]">
            <code>{workerCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
