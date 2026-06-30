import React, { useState, useEffect } from 'react';
import { Wifi, Globe, Server, AlertCircle } from 'lucide-react';

const NetworkMonitor = () => {
  const [nodes, setNodes] = useState([
    { id: 'internal', name: 'API Gateway', url: '/api/system/metrics', latency: 0, status: 'unknown' },
    { id: 'google', name: 'Google DNS', url: 'https://dns.google/resolve?name=google.com', latency: 0, status: 'unknown' },
    { id: 'cloudflare', name: 'Cloudflare', url: 'https://cloudflare-dns.com/dns-query?name=cloudflare.com', latency: 0, status: 'unknown', headers: { accept: 'application/dns-json' } }
  ]);

  useEffect(() => {
    const measureLatency = async () => {
      const updatedNodes = await Promise.all(nodes.map(async (node) => {
        const start = performance.now();
        try {
          const options = node.headers ? { headers: node.headers, cache: 'no-cache' } : { cache: 'no-cache' };
          // For external URLs we use no-cors to avoid CORS blocking if they don't support it, 
          // but for DNS endpoints they usually support CORS.
          // Wait, dns.google and cloudflare-dns.com support CORS.
          const res = await fetch(node.url, options);
          const end = performance.now();
          const latency = Math.round(end - start);
          
          return {
            ...node,
            latency,
            status: res.ok || res.type === 'opaque' ? (latency > 500 ? 'warning' : 'online') : 'error'
          };
        } catch (err) {
          return {
            ...node,
            latency: 999,
            status: 'offline'
          };
        }
      }));
      
      setNodes(updatedNodes);
    };

    measureLatency();
    const iv = setInterval(measureLatency, 5000);
    return () => clearInterval(iv);
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'online': return 'text-[#00FF66] bg-[#00FF66]/20';
      case 'warning': return 'text-[#F7931A] bg-[#F7931A]/20';
      case 'offline': case 'error': return 'text-[#FF3366] bg-[#FF3366]/20';
      default: return 'text-textMuted bg-white/10';
    }
  };

  const getStatusDot = (status) => {
    switch(status) {
      case 'online': return 'bg-[#00FF66] shadow-[0_0_8px_#00FF66]';
      case 'warning': return 'bg-[#F7931A] shadow-[0_0_8px_#F7931A]';
      case 'offline': case 'error': return 'bg-[#FF3366] shadow-[0_0_8px_#FF3366]';
      default: return 'bg-textMuted';
    }
  };

  return (
    <div className="glass-panel p-5 rounded-xl border border-border h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center">
          <Wifi className="w-4 h-4 text-[#00FF66]" />
        </div>
        <div>
          <h2 className="font-mono text-sm font-bold text-[#00FF66] tracking-tight">Net Latency</h2>
          <p className="font-sans text-[10px] text-textMuted uppercase tracking-wider">Ping Tracker</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 flex flex-col justify-center">
        {nodes.map((node) => (
          <div key={node.id} className="flex items-center justify-between p-2.5 rounded-lg bg-black/20 border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${getStatusDot(node.status)}`} />
              <div className="flex flex-col">
                <span className="font-mono text-xs font-bold text-textPrimary">{node.name}</span>
              </div>
            </div>
            
            <div className={`font-mono text-xs px-2 py-1 rounded-md ${getStatusColor(node.status)}`}>
              {node.status === 'offline' || node.status === 'error' ? 'ERR' : `${node.latency} ms`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkMonitor;
