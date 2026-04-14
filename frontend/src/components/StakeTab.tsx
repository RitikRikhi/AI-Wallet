import { motion } from 'framer-motion';
import { Lock, Coins, TrendingUp, Wallet, ShieldCheck, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  atxBalance: number;
}

export default function StakeTab({ atxBalance }: Props) {
  const [stakeAmt, setStakeAmt] = useState('');
  const [lockPeriod, setLockPeriod] = useState(30);
  const [staked, setStaked] = useState(false);
  const [earned, setEarned] = useState(0);

  // Simulated compounding yield ticker
  useEffect(() => {
    let interval: any;
    if (staked) {
      interval = setInterval(() => {
         const apy = lockPeriod === 90 ? 0.124 : lockPeriod === 60 ? 0.09 : 0.05;
         const perSecondYield = (parseFloat(stakeAmt) * apy) / (365 * 24 * 3600);
         setEarned(e => e + perSecondYield);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [staked, stakeAmt, lockPeriod]);

  const handleStake = () => {
    if (!stakeAmt || parseFloat(stakeAmt) <= 0 || parseFloat(stakeAmt) > atxBalance) {
      alert("Invalid stake amount.");
      return;
    }
    setStaked(true);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        
        {/* Main Stake Panel */}
        <div style={{ background: '#050508', borderRadius: 28, padding: 40, border: '1px solid rgba(124, 58, 237, 0.2)', position: 'relative', overflow: 'hidden' }}>
          {/* Background glow */}
          <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(124,58,237,0.15), transparent)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, position: 'relative', zIndex: 10 }}>
            <div style={{ background: 'rgba(124, 58, 237, 0.15)', padding: 10, borderRadius: 12 }}><Lock color="#FBBF24" size={20} /></div>
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px' }}>ATX Vault Staking</h2>
              <p style={{ fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure Yield Generation</p>
            </div>
          </div>

          {!staked ? (
             <div style={{ position: 'relative', zIndex: 10 }}>
                {/* Duration selectors */}
                <p style={{ fontSize: 11, color: '#aaa', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Lock-Up Period</p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                   {[
                     { d: 30, a: '5.0%' },
                     { d: 60, a: '9.0%' },
                     { d: 90, a: '12.4%'}
                   ].map(p => (
                     <button key={p.d} onClick={() => setLockPeriod(p.d)} style={{ flex: 1, padding: '16px', borderRadius: 16, border: lockPeriod === p.d ? '2px solid #7C3AED' : '2px solid rgba(255,255,255,0.05)', background: lockPeriod === p.d ? 'rgba(124,58,237,0.1)' : 'rgba(0,0,0,0.3)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                       <p style={{ fontSize: 18, fontWeight: 900, color: lockPeriod === p.d ? '#FBBF24' : '#fff' }}>{p.d} Days</p>
                       <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa' }}>{p.a} APY</p>
                     </button>
                   ))}
                </div>

                <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 16, padding: '24px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.04)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: '#888', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Amount to Stake</span>
                      <span style={{ fontSize: 11, color: '#fff', fontWeight: 900 }}>Available: {atxBalance.toFixed(2)} ATX</span>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input 
                        type="number" 
                        value={stakeAmt} 
                        onChange={e => setStakeAmt(e.target.value)} 
                        placeholder="0.00" 
                        style={{ flex: 1, background: 'none', border: 'none', color: '#fff', fontSize: 32, fontWeight: 900, outline: 'none' }} 
                      />
                      <button onClick={() => setStakeAmt(atxBalance.toString())} style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#FBBF24', padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 900, cursor: 'pointer' }}>MAX</button>
                   </div>
                </div>

                <button onClick={handleStake} className="btn-primary" style={{ width: '100%', padding: '20px', fontSize: 12, background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', boxShadow: '0 10px 30px rgba(124, 58, 237, 0.4)' }}>
                  <ShieldCheck size={16} /> Confirm & Lock Assets
                </button>
             </div>
          ) : (
            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '40px 0' }}>
               <div style={{ width: 80, height: 80, margin: '0 auto 24px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed rgba(34,197,94,0.4)', animation: 'spin 10s linear infinite' }}>
                 <Lock color="#22c55e" size={32} style={{ animation: 'spin 10s linear infinite reverse' }} />
               </div>
               <h3 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#22c55e' }}>Assets Locked</h3>
               <p style={{ color: '#aaa', fontSize: 14, marginBottom: 32 }}>{stakeAmt} ATX successfully locked for {lockPeriod} Days.</p>
               
               <div style={{ background: 'rgba(255,255,255,0.02)', padding: 24, borderRadius: 20, display: 'inline-block', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: 10, color: '#888', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Live Compounding Yield</p>
                  <p style={{ fontSize: 32, fontFamily: 'monospace', fontWeight: 900, color: '#FBBF24' }}>+{earned.toFixed(6)}</p>
               </div>
            </div>
          )}
        </div>

        {/* Stats Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ background: '#050508', padding: 32, borderRadius: 28, border: '1px solid rgba(6, 182, 212, 0.2)', flex: 1, position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', top: 0, right: 0, width: 150, height: 150, background: 'radial-gradient(circle, rgba(6,182,212,0.1), transparent)', borderRadius: '50%', filter: 'blur(30px)' }} />
            <TrendingUp size={24} color="#06B6D4" style={{ marginBottom: 16, position: 'relative', zIndex: 10 }} />
            <p style={{ fontSize: 10, color: '#888', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, position: 'relative', zIndex: 10 }}>Calculated APY</p>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 36, fontWeight: 900, color: '#fff', position: 'relative', zIndex: 10 }}>{lockPeriod === 90 ? '12.4' : lockPeriod === 60 ? '9.0' : '5.0'}%</p>
          </div>
          
          <div style={{ background: '#050508', padding: 32, borderRadius: 28, border: '1px solid rgba(251, 191, 36, 0.2)', flex: 1, position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', top: 0, right: 0, width: 150, height: 150, background: 'radial-gradient(circle, rgba(251,191,36,0.1), transparent)', borderRadius: '50%', filter: 'blur(30px)' }} />
            <Coins size={24} color="#FBBF24" style={{ marginBottom: 16, position: 'relative', zIndex: 10 }} />
            <p style={{ fontSize: 10, color: '#888', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, position: 'relative', zIndex: 10 }}>Total ATX Staked</p>
            <p style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 36, fontWeight: 900, color: '#fff', position: 'relative', zIndex: 10 }}>{staked ? parseFloat(stakeAmt).toFixed(2) : '0.00'}</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px 24px', borderRadius: 16, display: 'flex', gap: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Zap size={16} color="#7C3AED" />
            <p style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5 }}>Smart contracts are audited continuously by the Sentinel AI Network.</p>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
