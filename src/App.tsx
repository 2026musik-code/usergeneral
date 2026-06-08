import React, { useState } from 'react';
import { Settings, Terminal, Activity } from 'lucide-react';
import VlessGenerator from './components/VlessGenerator';
import WorkerGenerator from './components/WorkerGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'vless' | 'worker'>('vless');

  return (
    <div className="w-full h-[100dvh] bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Header Navigation */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 flex-shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-xl shadow-sm shrink-0">
            UG
          </div>
          <span className="font-bold text-lg md:text-xl tracking-tight text-slate-800 leading-none">USER GENERAL</span>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs md:text-sm font-medium text-slate-600 hidden sm:block">Network Online</span>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-400 uppercase">General User</p>
              <p className="text-sm font-bold text-slate-700 leading-none">admin_vless</p>
            </div>
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm shrink-0"></div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        
        {/* Mobile Tab Bar */}
        <div className="md:hidden flex items-center justify-around bg-white border-b border-slate-200 p-2 z-10 shrink-0">
          <button
            onClick={() => setActiveTab('vless')}
            className={`flex-1 flex flex-col items-center justify-center p-2 mx-1 rounded-xl transition-all ${
              activeTab === 'vless' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">VLESS Config</span>
          </button>
          <button
            onClick={() => setActiveTab('worker')}
            className={`flex-1 flex flex-col items-center justify-center p-2 mx-1 rounded-xl transition-all ${
              activeTab === 'worker' 
                ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Terminal className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Worker Gen</span>
          </button>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 p-6 flex-col gap-1 flex-shrink-0 z-10 shadow-[1px_0_10px_rgba(0,0,0,0.02)] relative">
          <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest mt-2">Main Menu</div>
          
          <button
            onClick={() => setActiveTab('vless')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${
              activeTab === 'vless' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            VLESS Configs
          </button>

          <button
            onClick={() => setActiveTab('worker')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors ${
              activeTab === 'worker' 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Terminal className="w-5 h-5 shrink-0" />
            Worker Gen
          </button>

          <div className="mt-8 text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Deployment</div>
          <div className="px-4 py-4 bg-slate-900 rounded-xl text-white flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-xs font-medium">Cloudflare Pages</span>
            </div>
            <div className="text-[10px] text-slate-400 break-all">v-general-ws.pages.dev</div>
            <div className="h-1.5 w-full bg-slate-700 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-orange-400 w-full"></div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto lg:overflow-y-scroll relative w-full h-full pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
            {activeTab === 'vless' ? <VlessGenerator /> : <WorkerGenerator />}
          </div>
        </main>
      </div>

      {/* Footer Bar */}
      <footer className="py-2.5 md:h-10 bg-slate-100 border-t border-slate-200 flex items-center px-4 md:px-8 justify-between flex-shrink-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <span>Session: Active</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="hidden sm:inline">IP: 104.16.24.1 (Cloudflare Edge)</span>
        </div>
        <div className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase text-right">
          v2.4.1 Build
        </div>
      </footer>
    </div>
  );
}
