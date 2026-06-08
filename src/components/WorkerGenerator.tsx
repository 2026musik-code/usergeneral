import React, { useState } from 'react';
import { Terminal, Copy, CheckCircle2 } from 'lucide-react';
import { generateUUID } from '../lib/vless';

export default function WorkerGenerator() {
  const [uuid, setUuid] = useState(generateUUID());
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

  const workerCode = `/**
 * Custom VLESS Proxy Node for Cloudflare Workers
 * Build Name: USER GENERAL
 * 
 * VLESS Protocol implementation written from scratch.
 * Uses native Cloudflare Sockets API (cloudflare:sockets).
 * 100% Original Code.
 */

import { connect } from "cloudflare:sockets";

const expectedUserID = '${uuid}';

export default {
    async fetch(request, env, ctx) {
        try {
            const currentUUID = env.UUID || expectedUserID;
            const upgradeHeader = request.headers.get('Upgrade');
            
            // Handle normal HTTP requests to the worker
            if (!upgradeHeader || upgradeHeader !== 'websocket') {
                return new Response('USER GENERAL VLESS Node Active.\\n\\nStatus: Online\\nUUID: ' + currentUUID, {
                    status: 200,
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                });
            }
            
            // Handle WebSocket Upgrade
            return await handleVLESSWebSocket(request, currentUUID);
        } catch (err) {
            return new Response(err.toString(), { status: 500 });
        }
    },
};

/**
 * Custom Core VLESS Protocol Handler
 */
async function handleVLESSWebSocket(request, expectedUUID) {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    
    server.accept();

    let tcpSocket = null;
    let vlessResponseHeader = new Uint8Array([0, 0]); // VLESS Version 0, 0 bytes add-on

    server.addEventListener('message', async (event) => {
        const message = event.data;
        if (!(message instanceof ArrayBuffer)) return;

        const buffer = new Uint8Array(message);
        
        // --- VLESS PROTOCOL PARSING ---
        // Minimum viable packet check
        if (buffer.byteLength < 24) return;

        // 1. Verify UUID (Bytes 1-16)
        const incomingUUID = stringifyUUID(buffer.slice(1, 17));
        if (incomingUUID !== expectedUUID) {
            server.close(1008, "Invalid UUID");
            return;
        }

        // 2. Parse Routing Information
        const addonLen = buffer[17];
        const cmdOffset = 18 + addonLen;
        
        const cmd = buffer[cmdOffset]; // 1 = TCP, 2 = UDP
        const port = (buffer[cmdOffset + 1] << 8) | buffer[cmdOffset + 2];
        const addrType = buffer[cmdOffset + 3];

        let addrOffset = cmdOffset + 4;
        let hostname = "";

        // Determine destination address
        if (addrType === 1) { // IPv4
            hostname = buffer.slice(addrOffset, addrOffset + 4).join('.');
            addrOffset += 4;
        } else if (addrType === 2) { // Domain Name
            const domainLen = buffer[addrOffset];
            hostname = new TextDecoder().decode(buffer.slice(addrOffset + 1, addrOffset + 1 + domainLen));
            addrOffset += 1 + domainLen;
        } else if (addrType === 3) { // IPv6
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
                ipv6.push((buffer[addrOffset + i * 2] << 8 | buffer[addrOffset + i * 2 + 1]).toString(16));
            }
            hostname = ipv6.join(':');
            addrOffset += 16;
        }

        // Raw payload payload
        const payloadData = buffer.slice(addrOffset);

        // --- CLOUDFLARE SOCKET ROUTING ---
        if (!tcpSocket) {
            try {
                // Open outbound connection
                tcpSocket = connect({ hostname, port });
                
                // Forward initial payload
                const writer = tcpSocket.writable.getWriter();
                await writer.write(payloadData);
                writer.releaseLock();

                // Pipe inbound responses back to WebSockets
                tcpSocket.readable.pipeTo(new WritableStream({
                    async write(chunk) {
                        if (vlessResponseHeader) {
                            // Attack VLESS handshake to the first packet
                            const combined = new Uint8Array(vlessResponseHeader.length + chunk.length);
                            combined.set(vlessResponseHeader, 0);
                            combined.set(chunk, vlessResponseHeader.length);
                            server.send(combined);
                            vlessResponseHeader = null; // Clear flag
                        } else {
                            server.send(chunk);
                        }
                    }
                }));
            } catch (err) {
                server.close(1011, "Proxy connection failed");
            }
        } else {
            // Already connected, just pass the chunk forward
            const writer = tcpSocket.writable.getWriter();
            await writer.write(payloadData);
            writer.releaseLock();
        }
    });

    return new Response(null, {
        status: 101,
        webSocket: client,
    });
}

function stringifyUUID(buffer) {
    const hex = [...buffer].map(b => b.toString(16).padStart(2, '0')).join('');
    return \`\${hex.slice(0,8)}-\${hex.slice(8,12)}-\${hex.slice(12,16)}-\${hex.slice(16,20)}-\${hex.slice(20)}\`;
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
          Set your preferred UUID below to inject it into the payload.
        </p>

        <div className="space-y-2 mb-2 max-w-xl">
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
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold rounded-lg transition-colors border border-indigo-100 text-sm shadow-sm flex-shrink-0 text-center"
            >
              Regenerate
            </button>
          </div>
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
