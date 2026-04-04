import { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Lock, ShieldCheck, Globe } from 'lucide-react';
import api from '../utils/api';

interface Props { onAuth: (user: any, initAssets?: any) => void; }

export default function AuthPage({ onAuth }: Props) {
  const [loading, setLoading] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sKey, setSKey] = useState('');

  const doSignupLogin = async () => {
    if (mode === 'login' && !sKey.trim()) return; // require key for login
    if (mode === 'signup' && !sName.trim()) return; // require name for signup

    setLoading('signing-in');
    try {
      if (mode === 'login' && sKey) localStorage.setItem('ai_tradex_importKey', sKey.trim());
      
      const res = await api.post('/auth/login', {
        provider: 'custom',
        profile: { 
           name: mode === 'login' ? 'Imported Wallet' : sName || 'Crypto Trader', 
           email: mode === 'signup' ? sEmail || 'trader@aitradex.io' : '' 
        }
      });
      localStorage.setItem('ai_tradex_user', JSON.stringify(res.data.session));
      onAuth(res.data.session);
    } finally { setLoading(''); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Aurora blobs */}
      <div className="aurora-blob" style={{ position:'absolute', top:'-15%', left:'-10%', width:900, height:900, borderRadius:'50%', background:'radial-gradient(circle,rgba(157,78,221,0.2),transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }} />
      <div className="aurora-blob" style={{ position:'absolute', bottom:'-20%', right:'-10%', width:1100, height:1100, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,245,255,0.08),transparent 70%)', filter:'blur(80px)', pointerEvents:'none', animationDelay:'-8s' }} />

      {/* Nav */}
      <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'28px 56px', position:'relative', zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ background:'linear-gradient(135deg,#9D4EDD,#00F5FF)', padding:10, borderRadius:14 }}><Cpu color="#fff" size={20} /></div>
          <span className="neon-text" style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:900, letterSpacing:'-1px' }}>AI_TRADEX</span>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ flex:1, display:'flex', gap:80, alignItems:'center', justifyContent:'center', padding:'0 56px', position:'relative', zIndex:10 }}>
        {/* Left — hero text */}
        <motion.div initial={{ opacity:0, x:-30 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }} style={{ flex:1, maxWidth:560 }}>
          <div style={{ display:'inline-block', padding:'6px 18px', borderRadius:100, border:'1px solid rgba(157,78,221,0.3)', background:'rgba(157,78,221,0.08)', fontSize:10, fontWeight:900, letterSpacing:'0.35em', textTransform:'uppercase', color:'#9D4EDD', marginBottom:32 }}>
            ✦ SENTINEL AI · V2.0 CORE ACTIVE
          </div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(48px,6vw,88px)', fontWeight:900, lineHeight:0.9, letterSpacing:'-3px', margin:'0 0 28px' }}>
            DECENTRALISED.<br/>
            <span style={{ background:'linear-gradient(135deg,#9D4EDD,#C77DFF,#00F5FF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>AI POWERED.</span>
          </h1>
          <p style={{ color:'#9ca3af', fontSize:17, lineHeight:1.7, marginBottom:48, maxWidth:480 }}>
            The first explainable crypto wallet. Every transaction scanned by Sentinel AI before execution. Non-custodial, real-time, unstoppable.
          </p>
          <div style={{ display:'flex', gap:32, opacity:0.4 }}>
            {[[<Zap size={14}/>,'Instant Finality'],[<Lock size={14}/>,'Non-Custodial'],[<ShieldCheck size={14}/>,'Sentinel Audited'],[<Globe size={14}/>,'Multi-Chain']].map(([icon,l],i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:10, fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', color:'#6b7280' }}>{icon}{l}</div>
            ))}
          </div>
        </motion.div>

        {/* Right — auth card simplified with dual tabs */}
        <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}
          className="glass-card" style={{ width:420, padding:48, borderRadius:44 }}>
          
          <div style={{ display:'flex', gap:24, marginBottom:32, borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setMode('login')} style={{ flex:1, paddingBottom:12, background:'none', border:'none', borderBottom:mode==='login'?'2px solid #00F5FF':'2px solid transparent', color:mode==='login'?'#fff':'#6b7280', fontSize:14, fontWeight:900, cursor:'pointer', transition:'all 0.2s', letterSpacing:'1px', textTransform:'uppercase' }}>Login</button>
            <button onClick={() => setMode('signup')} style={{ flex:1, paddingBottom:12, background:'none', border:'none', borderBottom:mode==='signup'?'2px solid #9D4EDD':'2px solid transparent', color:mode==='signup'?'#fff':'#6b7280', fontSize:14, fontWeight:900, cursor:'pointer', transition:'all 0.2s', letterSpacing:'1px', textTransform:'uppercase' }}>Sign Up</button>
          </div>

          {mode === 'signup' ? (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
              <p style={{ color:'#4b5563', fontSize:11, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:24 }}>Create a new identity</p>
              <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#9ca3af', marginBottom:6 }}>NAME</label>
              <input type="text" placeholder="e.g. Satoshi" value={sName} onChange={e=>setSName(e.target.value)} style={{ width:'100%', padding:'16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, color:'#fff', marginBottom:16 }} onKeyDown={e=>{if(e.key==='Enter')doSignupLogin();}} />

              <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#9ca3af', marginBottom:6 }}>EMAIL (Optional)</label>
              <input type="email" placeholder="e.g. satoshi@bitcoin.org" value={sEmail} onChange={e=>setSEmail(e.target.value)} style={{ width:'100%', padding:'16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, color:'#fff', marginBottom:36 }} onKeyDown={e=>{if(e.key==='Enter')doSignupLogin();}} />
            </motion.div>
          ) : (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
              <p style={{ color:'#4b5563', fontSize:11, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:24 }}>Login via Private Key</p>
              <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#9ca3af', marginBottom:6 }}>PRIVATE KEY</label>
              <input type="password" placeholder="e.g. 0xabcdef..." value={sKey} onChange={e=>setSKey(e.target.value)} style={{ width:'100%', padding:'16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, color:'#fff', marginBottom:36 }} onKeyDown={e=>{if(e.key==='Enter')doSignupLogin();}} />
            </motion.div>
          )}

          <button onClick={doSignupLogin} disabled={!!loading || (mode==='login'&&!sKey) || (mode==='signup'&&!sName)}
            style={{ width:'100%', padding:'18px', background:'linear-gradient(135deg,#9D4EDD,#00F5FF)', border:'none', borderRadius:20, cursor:'pointer', marginBottom:16, fontWeight:900, fontSize:15, color:'#1f2937', transition:'all 0.2s', boxShadow:'0 4px 30px rgba(157,78,221,0.5)', opacity: ((mode==='login'&&!sKey)||(mode==='signup'&&!sName)) ? 0.3 : 1 }}
            onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.02)')} onMouseLeave={e=>(e.currentTarget.style.transform='')}>
            {loading ? 'Initializing Vault...' : 'Enter Wallet & Get Keys'}
          </button>
          
          <button className="btn-secondary" style={{ width:'100%', padding:'18px', fontSize:12, borderRadius:20 }} onClick={() => onAuth({ userId: 'demo_123', name: 'Demo Mode', email: 'demo@aitradex.io', provider: 'quick' })}>Quick Launch (Demo)</button>

          <p style={{ textAlign:'center', marginTop:24, fontSize:10, color:'#374151', fontWeight:700, lineHeight:1.8 }}>
            Non-custodial · Your keys, your crypto<br/>Protected by Sentinel AI
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
