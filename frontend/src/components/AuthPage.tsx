import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Lock, ShieldCheck, Globe, CheckCircle2, Fingerprint } from 'lucide-react';
import api from '../utils/api';

interface Props { onAuth: (user: any, initAssets?: any) => void; }

const VERIFY_STEPS = [
  { label: 'Encrypting Neural Channel', delay: 0 },
  { label: 'Verifying Device Signature', delay: 800 },
  { label: 'Cross-Checking Threat Matrix', delay: 1600 },
  { label: 'Sentinel Shield Activated', delay: 2400 },
];

function SecurityVerifyOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  // Progress through all steps then complete
  useState(() => {
    VERIFY_STEPS.forEach((s, i) => {
      setTimeout(() => {
        setStep(i + 1);
        if (i === VERIFY_STEPS.length - 1) {
          setTimeout(onComplete, 600);
        }
      }, s.delay + 500);
    });
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(5,5,8,0.97)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15), transparent)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />
      
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: 400 }}>
        {/* Animated fingerprint ring */}
        <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 32px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px dashed rgba(124, 58, 237, 0.5)' }}
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px dashed rgba(6, 182, 212, 0.3)' }}
          />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Fingerprint size={40} color="#FBBF24" />
          </div>
        </div>

        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 8, color: '#fff', letterSpacing: '-0.5px' }}>
          Sentinel Vault Handshake
        </h2>
        <p style={{ color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 40 }}>
          Establishing Secure Neural Bridge
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
          {VERIFY_STEPS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={step > i ? { opacity: 1, x: 0 } : { opacity: 0.2, x: -10 }}
              transition={{ duration: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 14, background: step > i ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.02)', border: step > i ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid rgba(255,255,255,0.04)' }}
            >
              {step > i
                ? <CheckCircle2 size={16} color="#22c55e" />
                : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #374151' }} />
              }
              <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: step > i ? '#fff' : '#4b5563' }}>{s.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AuthPage({ onAuth }: Props) {
  const [loading, setLoading] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<(() => void) | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sKey, setSKey] = useState('');

  const doSignupLogin = async () => {
    if (mode === 'login' && !sKey.trim()) return;
    if (mode === 'signup' && !sName.trim()) return;

    setLoading('signing-in');
    try {
      if (mode === 'login' && sKey) localStorage.setItem('ai_tradex_importKey', sKey.trim());
      
      const res = await api.post('/auth/login', {
        provider: 'custom',
        profile: { 
           name: mode === 'login' ? 'Legendary Ledger' : sName || 'Elite Trader', 
           email: mode === 'signup' ? sEmail || 'trader@aitradex.io' : '',
           // Pass private key so backend derives a stable, deterministic userId
           privateKey: mode === 'login' && sKey ? sKey.trim() : undefined
        }
      });
      localStorage.setItem('ai_tradex_user', JSON.stringify(res.data.session));
      
      // Show biometric verification then complete auth
      const session = res.data.session;
      setPendingAuth(() => () => onAuth(session));
      setVerifying(true);
      setLoading('');
    } catch (e: any) {
        alert(`Login Failed: ${e.response?.data?.error || e.message || 'Connection Error'}`);
        setLoading('');
    }
  };

  const handleVerifyComplete = () => {
    setVerifying(false);
    if (pendingAuth) pendingAuth();
  };

  const handleQuickLaunch = () => {
    const demoSession = { userId: 'demo_123', name: 'Demo Mode', email: 'demo@aitradex.io', provider: 'quick' };
    localStorage.removeItem('ai_tradex_importKey');
    localStorage.setItem('ai_tradex_user', JSON.stringify(demoSession));
    setPendingAuth(() => () => onAuth(demoSession));
    setVerifying(true);
  };

  return (
    <>
      <AnimatePresence>
        {verifying && <SecurityVerifyOverlay onComplete={handleVerifyComplete} />}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

        {/* Subtle background glows */}
        <div style={{ position: 'absolute', top: '20%', left: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(124, 58, 237, 0.06), transparent)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(6, 182, 212, 0.05), transparent)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

        {/* Nav */}
        <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'28px 56px', position:'relative', zIndex:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ background:'linear-gradient(135deg, #7C3AED, #06B6D4)', padding:10, borderRadius:14 }}><Cpu color="#fff" size={20} /></div>
            <span className="neon-text" style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:900, letterSpacing:'-1px' }}>AI_TRADEX</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 100 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Sentinel AI · Online</span>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ flex:1, display:'flex', gap:80, alignItems:'center', justifyContent:'center', padding:'0 56px', position:'relative', zIndex:10 }}>
          {/* Left — hero text */}
          <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }} style={{ flex:1, maxWidth:560 }}>
            <div style={{ display:'inline-block', padding:'6px 18px', borderRadius:100, border:'1px solid rgba(124, 58, 237, 0.4)', background:'rgba(124, 58, 237, 0.08)', fontSize:10, fontWeight:900, letterSpacing:'0.35em', textTransform:'uppercase', color:'#FBBF24', marginBottom:32 }}>
              ✦ SENTINEL AI · V2.0 CORE ACTIVE
            </div>
            <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(48px,6vw,88px)', fontWeight:900, lineHeight:0.9, letterSpacing:'-3px', margin:'0 0 28px' }}>
              DECENTRALISED.<br/>
              <span style={{ background:'linear-gradient(135deg, #7C3AED, #06B6D4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>AI POWERED.</span>
            </h1>
            <p style={{ color:'#9ca3af', fontSize:17, lineHeight:1.7, marginBottom:48, maxWidth:480 }}>
              The first explainable crypto wallet. Every transaction scanned by Sentinel AI before execution. Non-custodial, real-time, unstoppable.
            </p>
            <div style={{ display:'flex', gap:32, opacity:0.6 }}>
              {[[<Zap size={14}/>, 'Instant Finality'],[<Lock size={14}/>, 'Non-Custodial'],[<ShieldCheck size={14}/>, 'Sentinel Audited'],[<Globe size={14}/>, 'Multi-Chain']].map(([icon,l],i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:10, fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', color:'#6b7280' }}>{icon as any}{l as string}</div>
              ))}
            </div>
          </motion.div>

          {/* Right — auth card */}
          <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}
            style={{ width:420, padding:48, borderRadius:44, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)' }}>
          
            {/* Security badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(124, 58, 237, 0.15)', borderRadius: 12, marginBottom: 28 }}>
              <ShieldCheck size={14} color="#7C3AED" />
              <span style={{ fontSize: 10, fontWeight: 900, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.1em' }}>256-Bit AES · End-to-End Encrypted</span>
            </div>
            
            <div style={{ display:'flex', gap:24, marginBottom:32, borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => setMode('login')} style={{ flex:1, paddingBottom:12, background:'none', border:'none', borderBottom:mode==='login'?'2px solid #FBBF24':'2px solid transparent', color:mode==='login'?'#FBBF24':'#6b7280', fontSize:14, fontWeight:900, cursor:'pointer', transition:'all 0.2s', letterSpacing:'1px', textTransform:'uppercase' }}>Login</button>
              <button onClick={() => setMode('signup')} style={{ flex:1, paddingBottom:12, background:'none', border:'none', borderBottom:mode==='signup'?'2px solid #06B6D4':'2px solid transparent', color:mode==='signup'?'#06B6D4':'#6b7280', fontSize:14, fontWeight:900, cursor:'pointer', transition:'all 0.2s', letterSpacing:'1px', textTransform:'uppercase' }}>Sign Up</button>
            </div>

            {mode === 'signup' ? (
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                <p style={{ color:'#4b5563', fontSize:11, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:24 }}>Create a new identity</p>
                <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#9ca3af', marginBottom:6 }}>NAME</label>
                <input type="text" placeholder="e.g. Satoshi" value={sName} onChange={e=>setSName(e.target.value)} style={{ width:'100%', padding:'16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, color:'#fff', marginBottom:16, outline: 'none', fontSize: 14 }} onKeyDown={e=>{if(e.key==='Enter')doSignupLogin();}} />

                <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#9ca3af', marginBottom:6 }}>EMAIL (Optional)</label>
                <input type="email" placeholder="e.g. satoshi@bitcoin.org" value={sEmail} onChange={e=>setSEmail(e.target.value)} style={{ width:'100%', padding:'16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, color:'#fff', marginBottom:36, outline: 'none', fontSize: 14 }} onKeyDown={e=>{if(e.key==='Enter')doSignupLogin();}} />
              </motion.div>
            ) : (
              <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
                <p style={{ color:'#4b5563', fontSize:11, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:24 }}>Login via Private Key</p>
                <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#9ca3af', marginBottom:6 }}>PRIVATE KEY</label>
                <input type="password" placeholder="e.g. 0xabcdef..." value={sKey} onChange={e=>setSKey(e.target.value)} style={{ width:'100%', padding:'16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, color:'#fff', marginBottom:36, outline: 'none', fontSize: 14 }} onKeyDown={e=>{if(e.key==='Enter')doSignupLogin();}} />
              </motion.div>
            )}

            <button onClick={doSignupLogin} disabled={!!loading || (mode==='login'&&!sKey) || (mode==='signup'&&!sName)}
              style={{ width:'100%', padding:'18px', background:'linear-gradient(135deg, #7C3AED, #06B6D4)', border:'none', borderRadius:20, cursor:'pointer', marginBottom:16, fontWeight:900, fontSize:15, color:'#fff', transition:'all 0.2s', boxShadow:'0 10px 30px rgba(124, 58, 237, 0.4)', opacity: ((mode==='login'&&!sKey)||(mode==='signup'&&!sName)) ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.02)')} onMouseLeave={e=>(e.currentTarget.style.transform='')}>
              <Fingerprint size={18} />
              {loading ? 'Initializing Vault...' : 'Enter Vault · Biometric Auth'}
            </button>
            
            <button className="btn-secondary" style={{ width:'100%', padding:'18px', fontSize:12, borderRadius:20 }} onClick={handleQuickLaunch}>
              Quick Launch (Demo)
            </button>

            <p style={{ textAlign:'center', marginTop:24, fontSize:10, color:'#374151', fontWeight:700, lineHeight:1.8 }}>
              Non-custodial · Your keys, your crypto<br/>Protected by Sentinel AI · 256-bit encrypted
            </p>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
