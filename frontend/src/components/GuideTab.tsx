import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, BrainCircuit, Activity, Lock, ArrowRightLeft, Sparkles, Terminal } from 'lucide-react';
import { useState } from 'react';

export default function GuideTab() {
  const [sec, setSec] = useState<'why' | 'features' | 'demo'>('why');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
         {[
           { id: 'why', label: 'Why We Are Unique', icon: <Sparkles size={16} /> },
           { id: 'features', label: 'Platform Features', icon: <Activity size={16} /> }
         ].map(t => (
           <button key={t.id} onClick={() => setSec(t.id as any)} style={{ padding: '12px 24px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, background: sec === t.id ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255,255,255,0.02)', border: sec === t.id ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid rgba(255,255,255,0.05)', color: sec === t.id ? '#FBBF24' : '#888', fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s', fontSize: 13 }}>
             {t.icon} {t.label}
           </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        {sec === 'why' && (
          <motion.div key="why" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div style={{ background: '#050508', borderRadius: 24, padding: 40, border: '1px solid rgba(124, 58, 237, 0.2)', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1), transparent)', borderRadius: '50%', filter: 'blur(40px)' }} />
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 28, fontWeight: 900, marginBottom: 12, color: '#fff', position: 'relative', zIndex: 10 }}>
                The Sentinel AI Advantage
              </h2>
              <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.8, maxWidth: 800, position: 'relative', zIndex: 10 }}>
                Standard Web3 wallets are dangerously blind. They happily execute whatever transaction you sign, even if it’s interacting with a universally known phishing contract, a recently compromised protocol, or a honey-pot drainer. Sentinel AI shifts the paradigm entirely; it is the world's first non-custodial wallet with a fully integrated neural bridge. Sentinel evaluates every single outgoing transaction against a continuously evolving global threat matrix in real-time, effectively stopping hacks *before* your funds ever leave the device.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.04)' }}>
                <BrainCircuit size={28} color="#06B6D4" style={{ marginBottom: 20 }} />
                <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 900, marginBottom: 10, color: '#fff' }}>1. Dynamic ML Node Scanning</h3>
                <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6 }}>
                  While traditional "secure" wallets rely exclusively on static, easily bypassed blocklists, Sentinel deploys deep dynamic pattern recognition. Our ML nodes evaluate incredibly granular behavioral signatures at the time of execution. Are you suddenly sending a violently large round number to an address you've never interacted with? Has your network velocity increased unnaturally by 400% in the last hour? Are you operating from an unusual device signature mixed with a TOR exit node? The risk score is uniquely calculated per-session, ensuring zero-day threat prevention.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.04)' }}>
                <Activity size={28} color="#FBBF24" style={{ marginBottom: 20 }} />
                <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 900, marginBottom: 10, color: '#fff' }}>2. Vector-RAG Explanations</h3>
                <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6 }}>
                  Security is useless without clarity. When our backend flags a transaction, we don't just output a generic "Error 401: Suspicious Activity". We leverage a highly advanced Python-based Retrieval-Augmented Generation (RAG) architecture. It matches the specific ML anomaly vectors (like anomalous velocity + device mismatch) against an embedded database of 1.2 Million specific threat reports. Rather than blocking you silently, Sentinel generates a deeply tailored, human-readable explanation of exactly *why* the transaction was restricted, empowering you to understand the specific psychological or technical attack vector in play.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {sec === 'features' && (
          <motion.div key="features" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
               
               <div style={{ background: '#050508', padding: 32, borderRadius: 24, border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                  <Lock size={24} color="#FBBF24" style={{ marginBottom: 16 }} />
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 900, marginBottom: 10, color: '#fff' }}>ATX Vault Staking</h3>
                  <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6 }}>
                    Instead of letting Governance Tokens sit idle and vulnerable, users can lock ATX into our fully audited, continuous-monitoring staking contracts. The staking tab features a deeply realistic interface including live simulated compounding yield that updates per-second, and APY scaling dynamically based on customizable lock-up periods (30, 60, or 90 days), driving maximum capital efficiency while maintaining strict AI oversight on the contract balance.
                  </p>
               </div>

               <div style={{ background: '#050508', padding: 32, borderRadius: 24, border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                  <ArrowRightLeft size={24} color="#06B6D4" style={{ marginBottom: 16 }} />
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 900, marginBottom: 10, color: '#fff' }}>Atomic Exchange</h3>
                  <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6 }}>
                    A zero-slippage, instant swap facility engineered right into the dashboard. Trade fluidly between ATX, SOL, USDC, ETH and other major assets without ever connecting to a risky third-party decentralized exchange. Crucially, every single atomic swap request is simultaneously piped through the Sentinel intelligence layer to guarantee the recipient liquidity pool hasn't been suddenly compromised by malicious actors.
                  </p>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.02)', padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.04)', gridColumn: '1 / -1' }}>
                  <ShieldCheck size={24} color="#7C3AED" style={{ marginBottom: 16 }} />
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 900, marginBottom: 10, color: '#fff' }}>Global Intelligence Hub</h3>
                  <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6 }}>
                    A transparent, real-time ledger of network-wide security activity. As everyday users interact with the network, Sentinel logs major threats globally. Think of it as a localized herd immunity: If a newly deployed drainer contract successfully attacks User A on the other side of the world, User B is automatically and immediately protected from interacting with that contract because the decentralized ML model updates the Threat Matrix asynchronously for everyone.
                  </p>
               </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </motion.div>
  );
}
