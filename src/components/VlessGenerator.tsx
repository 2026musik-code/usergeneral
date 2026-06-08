import React, { useState } from 'react';
import { Copy, RefreshCw, CheckCircle2, QrCode } from 'lucide-react';
import { generateUUID, generateVlessLink } from '../lib/vless';
import { QRCodeSVG } from 'qrcode.react';

export default function VlessGenerator() {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [formData, setFormData] = useState({
    uuid: generateUUID(),
    address: 'your-worker.workers.dev',
    port: '443',
    sni: 'your-worker.workers.dev',
    encryption: 'none',
    type: 'ws',
    host: 'your-worker.workers.dev',
    path: '/vless',
    security: 'tls',
    remarks: 'CF-VLESS-WORKER'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCopy = async () => {
    const link = generateVlessLink(formData);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const link = generateVlessLink(formData);

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-700 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all";
  const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-wide";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col xl:flex-row gap-6 w-full">
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-slate-100 pb-4 mb-5 md:mb-6 flex items-center justify-between">
          <h2 className="font-bold text-base md:text-lg text-slate-800">VLESS WebSocket Config</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 flex-1 w-full">
          <div className="space-y-2 col-span-1 sm:col-span-2">
            <label className={labelClass}>UUID</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text" 
                name="uuid"
                value={formData.uuid} 
                onChange={handleChange}
                className={inputClass}
              />
              <button 
                onClick={() => setFormData({ ...formData, uuid: generateUUID() })}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200 flex items-center justify-center gap-2 flex-shrink-0 shadow-sm font-semibold text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="sm:hidden">Regenerate</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Address (Domain/IP)</label>
            <input 
              type="text" 
              name="address"
              value={formData.address} 
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Port</label>
            <input 
              type="text" 
              name="port"
              value={formData.port} 
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>SNI / Hostname</label>
            <input 
              type="text" 
              name="sni"
              value={formData.sni} 
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>WebSocket Host</label>
            <input 
              type="text" 
              name="host"
              value={formData.host} 
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>WebSocket Path</label>
            <input 
              type="text" 
              name="path"
              value={formData.path} 
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Security</label>
            <select 
              name="security"
              value={formData.security} 
              onChange={handleChange}
              className={`${inputClass} appearance-none font-sans`}
            >
              <option value="tls">TLS</option>
              <option value="none">None</option>
            </select>
          </div>

          <div className="space-y-2 col-span-1 sm:col-span-2">
            <label className={labelClass}>Remarks</label>
            <input 
              type="text" 
              name="remarks"
              value={formData.remarks} 
              onChange={handleChange}
              className={`${inputClass} font-sans`}
            />
          </div>
        </div>
      </div>

      <div className="w-full xl:w-96 bg-indigo-900 rounded-2xl shadow-xl p-6 flex flex-col gap-6 text-white overflow-hidden relative shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full filter blur-[60px] opacity-20 -mr-16 -mt-16"></div>
        <div className="relative flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold">URI Output</h3>
            <p className="text-indigo-300 text-xs mt-1">Ready to copy or scan</p>
          </div>
          <button 
            onClick={() => setShowQR(!showQR)}
            className="p-2 bg-indigo-800 hover:bg-indigo-700 rounded-lg transition-colors text-indigo-100"
            title="Toggle QR Code"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative group flex-1 flex flex-col min-h-[160px] justify-center">
          {showQR ? (
            <div className="bg-white p-4 rounded-xl self-center flex items-center justify-center">
               <QRCodeSVG value={link} size={200} level="M" includeMargin={false} />
            </div>
          ) : (
            <textarea 
              readOnly
              value={link}
              className="w-full flex-1 h-full min-h-[160px] bg-indigo-950/50 border border-indigo-700/50 rounded-xl p-4 text-indigo-100 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
            ></textarea>
          )}
        </div>
        
        <div className="mt-auto flex flex-col gap-3 relative">
          <button 
            onClick={handleCopy}
            className="w-full py-3 bg-white text-indigo-900 font-bold rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-indigo-900/50 focus:outline-none"
          >
            {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied!' : 'Copy VLESS URL'}
          </button>
        </div>
      </div>
    </div>
  );
}
