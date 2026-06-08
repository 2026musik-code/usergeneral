import React, { useState } from 'react';
import { Terminal, Copy, CheckCircle2 } from 'lucide-react';
import { generateUUID } from '../lib/vless';

// @ts-ignore
import workerCodeRaw from '../worker.js?raw';

export default function WorkerGenerator() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(workerCodeRaw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 w-full">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-4 md:mb-6 flex items-center justify-between">
          <h2 className="font-bold text-base md:text-lg text-slate-800">Cloudflare Pages Worker Code (Nautica Edition)</h2>
        </div>
        
        <p className="text-slate-600 text-xs md:text-sm mb-6 leading-relaxed max-w-3xl">
          The following code is the complete, unmodified Nortica/edgetunnel VLESS Cloudflare Worker script.
          It includes an embedded dashboard and a robust VLESS parser that fixes the 500 server errors.
        </p>

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
            <li className="pt-2 text-xs text-indigo-700"><em>PENTING: Server proxy VLESS terpasang beserta otomatisasi dashboard pada web Cloudflare Anda. Buka langsung URL worker Anda di browser untuk melihat dashboard.</em></li>
          </ol>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="text-[10px] md:text-xs font-bold text-slate-400 font-mono uppercase tracking-widest break-all">src/worker.js</span>
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
            <code>{workerCodeRaw}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
