import { motion } from 'framer-motion';
import { X, Copy, QrCode, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface Props {
  address: string;
  onClose: () => void;
}

export default function ReceiveModal({ address, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 5, 8, 0.8)', backdropFilter: 'blur(16px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Background Glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2), transparent)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ background: '#050508', borderRadius: 32, padding: 40, width: '100%', maxWidth: 420, position: 'relative', border: '1px solid rgba(124, 58, 237, 0.3)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#888', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex' }}>
          <X size={16} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
           <div style={{ display: 'inline-flex', background: 'rgba(124, 58, 237, 0.1)', padding: 16, borderRadius: 20, marginBottom: 16, border: '1px solid rgba(124, 58, 237, 0.2)' }}>
              <QrCode size={32} color="#FBBF24" />
           </div>
           <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 900, marginBottom: 8, color: '#fff' }}>Receive Assets</h2>
           <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.5 }}>
             Scan the QR code or copy the address below to receive funds securely into your Sentinel Vault.
           </p>
        </div>

        {/* Dummy QR Code Block */}
        <div style={{ background: '#111', width: 180, height: 180, margin: '0 auto 32px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
           <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #222 0, #222 10px, #111 10px, #111 20px)', borderRadius: 8, border: '2px solid rgba(251, 191, 36, 0.3)' }} />
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
           <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#FBBF24', letterSpacing: '0.5px', wordBreak: 'break-all', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {address}
           </p>
           <button onClick={handleCopy} style={{ flexShrink: 0, background: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', border: copied ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid transparent', padding: '10px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8, color: copied ? '#22c55e' : '#fff' }}>
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{copied ? 'Copied' : 'Copy'}</span>
           </button>
        </div>

      </motion.div>
    </motion.div>
  );
}
