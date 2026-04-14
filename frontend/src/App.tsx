import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, LayoutDashboard, TrendingUp, ArrowRightLeft,
  ShieldCheck, History, Copy, Key, RefreshCw,
  Fingerprint, Globe, Activity, Lock, ArrowUpRight,
  CheckCircle2, AlertCircle, X, BrainCircuit, BookOpen, Zap
} from 'lucide-react';
import api from './utils/api';
import SendModal from './components/SendModal';
import ReceiveModal from './components/ReceiveModal';
import AuthPage from './components/AuthPage';
import GuideTab from './components/GuideTab';
import StakeTab from './components/StakeTab';

/* ─── Types ─────────────────────────────────── */
interface UserProfile { userId: string; name: string; email: string; avatar?: string; provider: string; }
interface WalletData  { address: string; assets: Record<string, number>; totalUSD?: number; }
interface Transaction {
  id: string; type: 'send'|'swap'|'receive'; asset: string; toAsset?: string;
  amount: number; receivedAmount?: number; from?: string; to?: string;
  txHash?: string; timestamp: string; riskScore: number;
  fraudFlags: any[]; status: string; atxEarned?: number;
}
type DashTab = 'dash'|'market'|'swap'|'sentinel'|'history'|'hub'|'guide'|'stake';

const ASSET_PRICES: Record<string,number> = { SOL:151.20, ETH:3421.50, BTC:65120.40, USDC:1.00, ATX:0.85, TRUMP:15.42 };
const ASSET_META: Record<string,{name:string;color:string;change:string;spark:string}> = {
  SOL: { name:'Solana',   color:'#9945FF', change:'+12.4%', spark:'M0,28 C10,22 20,32 30,12 S50,4 60,18 S75,10 80,6' },
  ETH: { name:'Ethereum', color:'#627EEA', change:'-2.1%',  spark:'M0,12 C10,22 20,18 30,28 S50,32 60,22 S75,34 80,26' },
  BTC: { name:'Bitcoin',  color:'#F7931A', change:'+0.8%',  spark:'M0,22 C10,28 20,18 30,14 S50,8 60,16 S75,18 80,12' },
  USDC:{ name:'USD Coin', color:'#2775CA', change:'+0.0%',  spark:'M0,20 L80,20' },
  ATX: { name:'AI_TRADEX',color:'#FFFFFF', change:'+38.2%', spark:'M0,35 C10,28 20,24 30,18 S50,10 60,8 S75,4 80,2' },
  TRUMP: { name:'Trump Coin', color:'#E31837', change:'+47.5%', spark:'M0,28 C10,22 20,32 30,12 S50,4 60,18 S75,10 80,6' },
};

const EXCHANGE_RATES: Record<string,Record<string,number>> = {
  SOL: {ETH:0.0442,BTC:0.00232,USDC:151.20,ATX:177.9, TRUMP:9.8},
  ETH: {SOL:22.62,BTC:0.0526,USDC:3421.5,ATX:4025.3, TRUMP:221.8},
  BTC: {SOL:430.6,ETH:19.0,USDC:65120,ATX:76611, TRUMP:4223.1},
  USDC:{SOL:0.00661,ETH:0.000292,BTC:0.0000154,ATX:1.18, TRUMP:0.064},
  ATX: {SOL:0.00562,ETH:0.000248,BTC:0.0000131,USDC:0.85, TRUMP:0.055},
  TRUMP: {SOL:0.10, ETH:0.0045, BTC:0.00023, USDC:15.42, ATX:18.14},
};

function short(s?:string){ if(!s) return '0x...'; return s.slice(0,8)+'…'+s.slice(-6); }

/* ═══════════════════════════════════════════ */
export default function App() {
  const [user,    setUser]    = useState<UserProfile|null>(()=>{ 
    try {
        if (window.location.search.includes('reset=1')) {
            localStorage.clear();
            window.history.replaceState({}, '', window.location.pathname);
            return null;
        }
        const s = localStorage.getItem('ai_tradex_user'); 
        return s ? JSON.parse(s) : null; 
    } catch { return null; } 
  });
  const [wallet,  setWallet]  = useState<WalletData|null>(null);
  const [tab,     setTab]     = useState<DashTab>('dash');
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showSeed,setShowSeed]= useState(false);
  const [showKeys,setShowKeys]= useState(false);
  const [mnemonic,setMnemonic]= useState('');
  const [privKey, setPrivKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState<{ok:boolean;msg:string}|null>(null);
  const [txHistory,setTxHistory]= useState<Transaction[]>([]);
  const [swapFrom,setSwapFrom]= useState('SOL');
  const [swapTo,  setSwapTo]  = useState('ETH');
  const [swapAmt, setSwapAmt] = useState('5');
  const [explanation,setExplanation]= useState('');

  const [status,  setStatus]  = useState('Booting Sentinel AI…');
  const [lastFlags, setLastFlags] = useState<string[]>([]);

  function pushToast(ok:boolean,msg:string){ setToast({ok,msg}); setTimeout(()=>setToast(null),4000); }

  const [hubData, setHubData] = useState<any[]>([]);

  useEffect(()=>{ 
    if(user) {
        fetchWallet();
        fetchHub();
        // Polling loop for cross-wallet updates
        const interval = setInterval(() => { fetchWallet(); fetchHub(); }, 5000);
        return () => clearInterval(interval);
    }
  },[user]);

  const fetchHub = async () => { try { const r = await api.get('/system-hub'); setHubData(r.data.chain||[]); } catch(e) {} };

  const fetchWallet = async () => {
    try{
      const r = await api.get('/wallet-info');
      setWallet(prev => {
         if (JSON.stringify(prev) === JSON.stringify(r.data)) return prev;
         return r.data;
      }); 
      const t = await api.get('/transactions');
      const newTxs = t.data.transactions||[];
      if (txHistory.length > 0 && newTxs.length > txHistory.length) {
          const fresh = newTxs[0];
          if (fresh.type === 'receive') {
              pushToast(true, `Incoming Wealth! Received ${fresh.amount} ${fresh.asset} 🚀`);
          }
      }
      setTxHistory(newTxs);
    } catch { 
      if (!wallet) createWallet(); 
    }
  };

  const createWallet = async () => {
    setLoading(true);
    setStatus('Synchronizing with nodes…');
    console.log('Starting createWallet() sequence...');
    try{
      const importKey = localStorage.getItem('ai_tradex_importKey');
      if (importKey) {
        setStatus('Decrypting Secure Vault Terminal…');
        console.log('Importing existing wallet key...');
        await api.post('/import-wallet', { mode: 'private', privateKey: importKey });
        localStorage.removeItem('ai_tradex_importKey');
        const info = await api.get('/wallet-info');
        setWallet(info.data);
        setMnemonic('Imported Private Vault — Seed secured by hardware-level isolation.');
        setPrivKey(importKey);
      } else {
        setStatus('AI Oracle: Mapping Fresh Entropy…');
        console.log('Generating fresh wallet...');
        const r = await api.post('/generate', {});
        setStatus('Sentinel AI: Aligning Guard Vectors…');
        const info = await api.get('/wallet-info');
        setWallet(info.data);
        setMnemonic(r.data.mnemonic||'witch collapse practice feed shame open despair creek road again ice least');
        setPrivKey('0x'+Array.from({length:64},()=>Math.floor(Math.random()*16).toString(16)).join(''));
      }
      setStatus('Success! AI Vault Online ■');
      console.log('Wallet initialization complete!');
      setShowKeys(true);
    } catch (e: any) { 
        console.error('Wallet creation error detail:', e);
        const errorText = e.response?.data?.error || e.message || 'Server timeout';
        pushToast(false, `Wallet Init Failed: ${errorText}`); 
        setStatus(`Failure: ${errorText}`);
        // Force back to onboarding if fatal
        if (errorText.includes('offline') || errorText.includes('Network')) {
            localStorage.clear();
            window.location.reload();
        }
    }
    finally{ setLoading(false); }
  };


  const doSwap = async () => {
    setLoading(true);
    try{
      const r = await api.post('/swap',{fromAsset:swapFrom,toAsset:swapTo,amount:parseFloat(swapAmt)});
      setWallet(w=>({...w!,assets:r.data.assets}));
      setTxHistory(h=>[r.data.transaction,...h]);
      pushToast(true,`Swapped ${swapAmt} ${swapFrom} → ${swapTo} · +${r.data.atxEarned} ATX`);
    } catch(e:any){ pushToast(false,e.response?.data?.error||'Swap rejected'); }
    finally{ setLoading(false); }
  };

  const doAudit = async () => {
    // If no specific flags, we pass a safe indication or generic
    const reasons = lastFlags.length > 0 ? lastFlags : ['A new transaction was initiated'];
    
    setExplanation('Sentinel AI is decrypting security vectors via global ML nodes…');
    try{
      const r = await api.post('/explain', { reasons });
      setExplanation(r.data.explanation);
    } catch { 
      setExplanation('Sentinel AI: Neural link establishing...'); 
    }
  };

  const handleSendSuccess = (assets:Record<string,number>,_atx:number) => {
    setWallet(w=>({...w!,assets}));
    api.get('/transactions').then(r=>setTxHistory(r.data.transactions||[]));
  };

  const handleAuditMeta = (flags: string[]) => {
      setLastFlags(flags);
  };

  const totalUSD = wallet ? Object.entries(wallet.assets).reduce((s,[sym,amt])=>s+amt*(ASSET_PRICES[sym]||0),0) : 0;

  /* If no user — show auth */
  // Removed unused doImport logic

  if(!user) return <AuthPage onAuth={(u: any, initAssets?: any) => {
    setUser(u);
    if(initAssets) localStorage.setItem('ai_tradex_initAssets', JSON.stringify(initAssets));
  }} />;

  /* Onboarding screen is bypassed, show a loader ONLY if we are actually loading or have no wallet yet */
  if (user && !wallet) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#050508',flexDirection:'column'}}>
        <RefreshCw size={32} color="#FFFFFF" style={{animation:'spin 1s linear infinite',marginBottom:16}}/>
        <p style={{color:'#6b7280',fontSize:12,fontWeight:900,letterSpacing:'0.2em',textTransform:'uppercase'}}>{ status }</p>
        {!loading && (
            <button onClick={() => window.location.reload()} style={{marginTop:24,background:'none',border:'1px solid #374151',color:'#374151',padding:'8px 16px',borderRadius:10,fontSize:10,fontWeight:900,cursor:'pointer'}}>FORCE RESTART</button>
        )}
      </div>
    );
  }

  /* ── Dashboard ── */
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{display:'flex',minHeight:'100vh'}}>

      {/* Sidebar */}
      <aside className="glass-panel" style={{width:280,padding:'32px 20px',display:'flex',flexDirection:'column',position:'sticky',top:0,height:'100vh'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:44}}>
          <div style={{background:'linear-gradient(135deg,#222,#555)',padding:9,borderRadius:13}}><Cpu color="#fff" size={18}/></div>
          <span className="neon-text" style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:900,letterSpacing:'-0.5px'}}>AI_TRADEX</span>
        </div>

        {/* User */}
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:18,marginBottom:28}}>
          <img src={user.avatar||`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} width={36} height={36} style={{borderRadius:'50%',border:'2px solid rgba(255,255,255,0.3)'}} alt=""/>
          <div style={{overflow:'hidden'}}>
            <p style={{fontWeight:900,fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis', color: '#fff'}}>{(user.name === 'Guest' || !user.name) ? 'Legendary Ledger' : user.name}</p>
            <p style={{fontSize:10,color:'#FFFFFF',fontWeight:700,display:'flex',alignItems:'center',gap:4}}>
              <span style={{fontSize:12}}>{user.provider==='google'?'🔵':user.provider==='MetaMask'?'🦊':user.provider==='Phantom'?'👻':'🟠'}</span>via {user.provider}
            </p>
          </div>
        </div>

        <nav style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
          {([
            ['dash','Overview',<LayoutDashboard size={18}/>],
            ['hub','Intelligence Hub',<Activity size={18}/>],
            ['sentinel','Sentinel AI',<ShieldCheck size={18}/>],
            ['market','Terminal',<TrendingUp size={18}/>],
            ['swap','Exchange',<ArrowRightLeft size={18}/>],
            ['stake','Vault Staking',<Lock size={18}/>],
            ['history','Ledger',<History size={18}/>],
            ['guide','Platform Guide',<BrainCircuit size={18}/>]
          ] as const).map(([id,label,icon])=>(
            <div key={id} className={`sidebar-link${tab===id?' active':''}`} onClick={()=>setTab(id)}>
              {icon}<span style={{fontSize:11,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.15em'}}>{label} {id==='hub'&&<span style={{fontSize:8,background:'#FFFFFF',color:'#fff',padding:'2px 4px',borderRadius:4,marginLeft:4}}>LIVE</span>}</span>
            </div>
          ))}

          {/* Quick Profile Switcher for Demo */}
          <div style={{marginTop:32,padding:16,background:'rgba(200,200,200,0.04)',border:'1px solid rgba(200,200,200,0.1)',borderRadius:18}}>
            <p style={{fontSize:9,fontWeight:900,color:'#AAAAAA',textTransform:'uppercase',marginBottom:12,letterSpacing:'0.15em'}}>✦ Multi-Wallet Demo Mode</p>
            <button onClick={()=>{
              const current = JSON.parse(localStorage.getItem('ai_tradex_user') || '{}');
              const next = current.userId === 'sender_demo' ? { userId: 'receiver_demo', name: 'Receiver Subnet', provider:'demo' } : { userId: 'sender_demo', name: 'Sender Subnet', provider:'demo' };
              localStorage.setItem('ai_tradex_user', JSON.stringify(next));
              window.location.reload();
            }} style={{width:'100%',padding:'10px',background:'rgba(200,200,200,0.1)',border:'1px solid rgba(200,200,200,0.3)',borderRadius:10,color:'#AAAAAA',fontSize:10,fontWeight:900,cursor:'pointer',transition:'all 0.2s'}}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(200,200,200,0.2)')} onMouseLeave={e=>(e.currentTarget.style.background='rgba(200,200,200,0.1)')}>
              Switch Identity & Sync
            </button>
          </div>

          <div className="sidebar-link" onClick={()=>{localStorage.clear();window.location.reload();}} style={{marginTop:'auto',color:'#ef4444'}}>
            <X size={18}/><span style={{fontSize:11,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.15em'}}>Logout</span>
          </div>
        </nav>

        <div style={{borderTop:'1px solid rgba(255,255,255,0.03)',paddingTop:20}}>
          <p style={{textAlign:'center',fontSize:9,fontWeight:900,letterSpacing:'0.2em',textTransform:'uppercase',color:'#6b7280',marginBottom:8}}>ATX Balance</p>
          <p style={{textAlign:'center',fontSize:22,fontWeight:900,color:'#FFFFFF'}}>{(wallet?.assets.ATX||0).toFixed(2)} <span style={{fontSize:12,color:'#4b5563'}}>ATX</span></p>
          <p style={{textAlign:'center',fontSize:11,color:'#22c55e',fontWeight:700,marginTop:4}}>≈ ${((wallet?.assets.ATX||0)*0.85).toFixed(2)}</p>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:12}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#22c55e',animation:'pulse 2s infinite'}}/><span style={{fontSize:11,fontWeight:700,color:'rgba(34,197,94,0.8)'}}>All Systems Live</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,padding:'32px 40px',overflowY:'auto'}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:44}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
              <h1 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:32,fontWeight:900,letterSpacing:'-1.5px'}}>
                {{hub:'Intel_Hub',dash:'Dashboard',market:'Market Terminal',swap:'Bridge/Swap',sentinel:'AI Sentinel',history:'Vault Ledger',guide:'Guide & Educational',stake:'ATX Staking'}[tab]}
              </h1>
              <div style={{background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:8,padding:'4px 10px',fontSize:10,fontWeight:900,color:'#FFFFFF',textTransform:'uppercase',letterSpacing:'0.1em'}}>{(user.name === 'Guest' || !user.name) ? 'Legendary Ledger' : user.name}</div>
            </div>
            <p style={{color:'#4b5563',fontSize:10,fontWeight:900,letterSpacing:'0.2em',textTransform:'uppercase'}}>AI Secure · Oracle Validated · {short(wallet?.address)}</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button onClick={()=>setShowSend(true)} className="btn-primary" style={{padding:'12px 24px',fontSize:10}}>
              <ArrowRightLeft size={14}/> Send Funds
            </button>
            <div style={{textAlign:'right'}}>
              <p style={{fontSize:9,color:'#374151',fontWeight:900,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:3}}>Active Node</p>
              <p style={{fontFamily:'monospace',fontSize:12,fontWeight:700,color:'#FFFFFF',cursor:'pointer'}} onClick={()=>navigator.clipboard.writeText(wallet?.address||'')}>{short(wallet?.address||'0x0000000000000000')}</p>
            </div>
            <button onClick={()=>setShowKeys(true)} style={{width:48,height:48,borderRadius:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFFFFF',transition:'all 0.2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.borderColor='rgba(255,255,255,0.3)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.03)';e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'}}>
              <Key size={18}/>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {tab==='hub'      && <HubTab key="h" hubData={hubData} />}
          {tab==='dash'     && <DashTab key="d" wallet={wallet!} totalUSD={totalUSD} onShowKeys={()=>setShowKeys(true)} onSend={()=>setShowSend(true)} onReceive={()=>setShowReceive(true)} txHistory={txHistory.slice(0,3)} user={user} lastFlags={lastFlags} />}
          {tab==='guide'    && <GuideTab key="g" />}
          {tab==='stake'    && <StakeTab key="st" atxBalance={wallet?.assets.ATX || 0} />}
          {tab==='market'   && <MarketTab key="m" />}
          {tab==='swap'     && <SwapTab key="s" wallet={wallet!} swapFrom={swapFrom} setSwapFrom={setSwapFrom} swapTo={swapTo} setSwapTo={setSwapTo} swapAmt={swapAmt} setSwapAmt={setSwapAmt} onSwap={doSwap} loading={loading}/>}
          {tab==='sentinel' && <SentinelTab key="se" explanation={explanation} onAudit={doAudit} txHistory={txHistory} />}
          {tab==='history'  && <HistoryTab key="h" txHistory={txHistory} />}
        </AnimatePresence>
      </main>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showSend && wallet && (
          <SendModal key="send" wallet={wallet} onClose={()=>setShowSend(false)} onSuccess={handleSendSuccess} onToast={pushToast} onAuditMetadata={handleAuditMeta}/>
        )}
        {showReceive && wallet && (
          <ReceiveModal key="receive" address={wallet.address} onClose={()=>setShowReceive(false)} />
        )}
        {showSeed && (
          <SeedModal key="seed" mnemonic={mnemonic} onClose={()=>setShowSeed(false)} onCopy={()=>pushToast(true,'Phrase copied!')}/>
        )}
        {showKeys && wallet && (
          <KeysModal key="keys" address={wallet.address} privateKey={privKey} onClose={()=>setShowKeys(false)} onCopy={(t:string)=>pushToast(true,t+' copied!')}/>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast" initial={{y:80,opacity:0}} animate={{y:0,opacity:1}} exit={{y:80,opacity:0}}
            style={{position:'fixed',bottom:32,right:32,zIndex:999,display:'flex',alignItems:'center',gap:14,background:'rgba(10,10,15,0.95)',border:`1px solid ${toast.ok?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`,borderRadius:20,padding:'16px 24px',backdropFilter:'blur(20px)',boxShadow:'0 20px 60px rgba(0,0,0,0.7)'}}>
            {toast.ok?<CheckCircle2 color="#22c55e" size={20}/>:<AlertCircle color="#ef4444" size={20}/>}
            <span style={{fontWeight:700,fontSize:14}}>{toast.msg}</span>
            <button onClick={()=>setToast(null)} style={{background:'none',border:'none',color:'#6b7280',cursor:'pointer',padding:0,marginLeft:8}}><X size={16}/></button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Dashboard Tab ──────────────────────────── */
function DashTab({wallet,totalUSD,onShowKeys,onSend,onReceive,txHistory,user,lastFlags}:any) {
  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} style={{display:'flex',flexDirection:'column',gap:24}}>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20}}>
        <div style={{ background: 'linear-gradient(145deg, #111 0%, #000 100%)', borderRadius: 28, padding: 36, position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,255,255,0.2), transparent)', borderRadius: '50%', filter: 'blur(40px)' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
             <Cpu color="#FFFFFF" size={32} />
             <div style={{ letterSpacing: '0.3em', fontSize: 10, fontWeight: 900, color: '#6b7280', textTransform: 'uppercase' }}>Black Card Vault</div>
          </div>
          <p style={{ fontSize:10, fontWeight:900, letterSpacing:'0.3em', textTransform:'uppercase', color:'#6b7280', marginBottom:8 }}>Portfolio Valuation</p>
          <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:56, fontWeight:900, letterSpacing:'-2px', marginBottom:20, color: '#fff' }}>
            ${totalUSD.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
          </h2>
          
          <div style={{ display: 'flex', gap: 24, marginBottom: 36, overflowX: 'auto', paddingBottom: 8 }}>
            {Object.entries(wallet.assets).map(([sym, amt]) => (
                <div key={sym} style={{ minWidth: 'max-content' }}>
                    <p style={{fontSize: 9, color: '#6b7280', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2}}>{sym}</p>
                    <p style={{color: '#fff', fontWeight: 900, fontFamily: "'Space Grotesk',sans-serif", fontSize: 13}}>{Number(amt).toFixed(Number(amt) < 1 ? 4 : 2)}</p>
                </div>
            ))}
          </div>

          <div style={{display:'flex',gap:12, position: 'relative', zIndex: 10}}>
            <button className="btn-primary" style={{flex:1,fontSize:10}} onClick={onSend}><ArrowRightLeft size={14}/> Send</button>
            <button className="btn-secondary" style={{flex:1,fontSize:10}} onClick={onReceive}>Receive</button>
            <button onClick={onShowKeys} className="btn-secondary" style={{width:56,padding:0}}><Fingerprint size={20}/></button>
          </div>
          <div style={{ position: 'absolute', bottom: 20, right: 36, fontSize: 13, fontFamily: 'monospace', color: '#4b5563', fontWeight: 700, letterSpacing: '3px' }}>**** **** **** {(wallet.address || '0000').slice(-4)}</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="glass" style={{padding:28,borderRadius:32,background:'rgba(255,255,255,0.02)',borderColor:'rgba(255,255,255,0.06)'}}>
              <ShieldCheck color="#22c55e" size={20} style={{marginBottom:20}}/>
              <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:900,marginBottom:4}}>Authenticated</p>
              <p style={{fontSize:10,color:'#22c55e',fontWeight:900,letterSpacing:'0.2em',textTransform:'uppercase'}}>Sentinel Shield</p>
            </div>
            <div className="glass" style={{padding:28,borderRadius:32,background:'rgba(255,255,255,0.02)',borderColor:'rgba(255,255,255,0.06)'}}>
              <Activity color="#fff" size={20} style={{marginBottom:20}}/>
              <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:18,fontWeight:900,marginBottom:4}}>98%</p>
              <p style={{fontSize:10,color:'#aaa',fontWeight:900,letterSpacing:'0.2em',textTransform:'uppercase'}}>Health Score</p>
            </div>
          </div>
          <div className="glass" style={{padding:24,borderRadius:32, position:'relative', overflow:'hidden'}}>
            <div style={{position:'absolute', bottom:0, left:0, padding:8, background:'rgba(255,255,255,0.05)', width:'100%', borderTop:'1px solid rgba(255,255,255,0.02)', overflow:'hidden'}}>
                <div className="marquee-content" style={{color:'#FFFFFF', fontSize:9, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.15em', whiteSpace:'nowrap'}}>
                  SENTINEL LOG: Scanning address heuristics... [OK] • { txHistory[0]?.type === 'receive' ? `SUCCESS: Received ${txHistory[0].amount} ${txHistory[0].asset} √` : (lastFlags[0] || 'Idle Shield Active') } • RAG-V2.5 Neural Path: Active • Zero-knowledge proof verified...
                </div>
            </div>
            <p style={{fontSize:10,color:'#4b5563',fontWeight:900,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:14}}>Latest Intelligence Feed</p>
            {txHistory.length > 0 ? (
              <div style={{display:'flex',alignItems:'center',gap:10, marginBottom:16}}>
                <div style={{width:32,height:32,borderRadius:10,background: txHistory[0].type==='send'?'rgba(239,68,68,0.1)': txHistory[0].type==='receive' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                   {txHistory[0].type === 'receive' ? <ArrowUpRight size={14} color="#22c55e"/> : <ArrowRightLeft size={14} color={txHistory[0].type==='send'?'#ef4444':'#FFFFFF'}/>}
                </div>
                <div><p style={{fontWeight:700,fontSize:13}}>{txHistory[0].type==='send'?`Sent ${txHistory[0].amount} ${txHistory[0].asset}`: txHistory[0].type==='receive' ? `Received ${txHistory[0].amount} ${txHistory[0].asset}` : `${txHistory[0].amount} ${txHistory[0].asset} → ${txHistory[0].toAsset}`}</p>
                <p style={{fontSize:10,color:'#4b5563',fontWeight:700}}>{txHistory[0].type==='receive'?'Incoming Wealth':'Risk Score: '+txHistory[0].riskScore}</p></div>
              </div>
            ) : <p style={{fontSize:12,color:'#374151', marginBottom:16}}>Sentinel AI awaiting telemetry...</p>}
          </div>
        </div>
      </div>

      {/* ATX Token card */}
      <div className="glass" style={{padding:32,borderRadius:36,background:'linear-gradient(135deg,rgba(255,255,255,0.08),rgba(200,200,200,0.04))',border:'1px solid rgba(255,255,255,0.15)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <p style={{fontSize:10,color:'#FFFFFF',fontWeight:900,letterSpacing:'0.3em',textTransform:'uppercase',marginBottom:6}}>AI_TRADEX Governance Token</p>
          <p style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:36,fontWeight:900,marginBottom:4}}>{(wallet.assets.ATX||0).toFixed(2)} <span style={{fontSize:16,color:'#4b5563'}}>ATX</span></p>
          <p style={{fontSize:14,color:'#22c55e',fontWeight:700}}>+38.2% (24h) · ≈ ${((wallet.assets.ATX||0)*0.85).toFixed(2)}</p>
        </div>
        <div style={{textAlign:'right'}}>
          <p style={{fontSize:10,color:'#6b7280',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.2em',marginBottom:8}}>Earned by trading</p>
          <p style={{fontSize:12,color:'#FFFFFF',fontWeight:700}}>Stake for 12% APY</p>
          <p style={{fontSize:11,color:'#4b5563',marginTop:4}}>Voting power active</p>
        </div>
      </div>

      {/* Asset grid */}
      <div>
        <p style={{fontSize:10,fontWeight:900,color:'#374151',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:14,paddingLeft:4}}>Ecosystem Assets</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14}}>
          {Object.entries(wallet.assets).filter(([s])=>s!=='ATX').map(([sym,amt]:any)=>{
            const m=ASSET_META[sym];
            return (
              <div key={sym} className="glass" style={{padding:28,borderRadius:32,cursor:'pointer',transition:'all 0.3s ease'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='';e.currentTarget.style.transform=''}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:48,height:48,borderRadius:18,background:'#000',border:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:m.color,boxShadow:`0 0 20px -5px ${m.color}44`}}>{sym[0]}</div>
                    <div><p style={{fontWeight:900,fontSize:17,letterSpacing:'-0.5px',marginBottom:2}}>{m.name}</p><p style={{fontSize:9,color:'#4b5563',fontWeight:900,letterSpacing:'0.2em',textTransform:'uppercase'}}>{sym}_NETWORK</p></div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <p style={{fontWeight:900,fontSize:20,letterSpacing:'-0.5px'}}>${ASSET_PRICES[sym].toLocaleString()}</p>
                    <p style={{fontSize:10,fontWeight:900,color:m.change.startsWith('+')?'#22c55e':'#ef4444'}}>{m.change} 24h</p>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between'}}>
                  <div style={{flex:1,height:44,marginRight:24}}>
                    <svg viewBox="0 0 80 40" style={{width:'100%',height:'100%',overflow:'visible'}}>
                      <path d={m.spark} fill="none" strokeWidth="2.5" stroke={m.color} strokeLinecap="round" strokeLinejoin="round" className="sparkline-path" opacity={0.6}/>
                    </svg>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <p style={{fontSize:9,color:'#6b7280',fontWeight:900,textTransform:'uppercase',marginBottom:3}}>Holding Value</p>
                    <p style={{fontWeight:900,fontSize:18,letterSpacing:'-0.5px'}}>{(amt as number).toFixed(amt<1?4:2)} <span style={{fontSize:11,color:'#4b5563'}}>{sym}</span></p>
                    <p style={{fontSize:11,color:'#22c55e',fontWeight:900,marginTop:2}}>≈ ${(amt * ASSET_PRICES[sym]).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Market Tab ─────────────────────────────── */
function MarketTab() {
  return (
    <motion.div initial={{opacity:0,scale:0.98}} animate={{opacity:1,scale:1}} exit={{opacity:0}}>
      <div className="glass-card" style={{borderRadius:44,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:'rgba(255,255,255,0.015)'}}>
              {['Asset','Price','24h Trend','Risk','Volume','Action'].map(h=>(
                <th key={h} style={{padding:'24px 28px',textAlign:'left',fontSize:10,fontWeight:900,color:'#4b5563',letterSpacing:'0.2em',textTransform:'uppercase'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(ASSET_META).map(([sym,m])=>(
              <tr key={sym} style={{borderBottom:'1px solid rgba(255,255,255,0.03)',transition:'background 0.2s'}}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.015)')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                <td style={{padding:'22px 28px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:40,height:40,borderRadius:14,background:'#000',border:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:m.color,fontSize:13}}>{sym}</div>
                    <div><p style={{fontWeight:900,fontSize:15,marginBottom:1}}>{m.name}</p><p style={{fontSize:9,color:'#4b5563',fontWeight:900,letterSpacing:'0.15em',textTransform:'uppercase'}}>L1 Asset</p></div>
                  </div>
                </td>
                <td style={{padding:'22px 28px'}}><p style={{fontWeight:900,fontSize:17}}>${ASSET_PRICES[sym].toLocaleString()}</p><p style={{fontSize:10,fontWeight:900,color:m.change.startsWith('+')?'#22c55e':'#ef4444'}}>{m.change}</p></td>
                <td style={{padding:'22px 28px'}}><svg viewBox="0 0 80 40" style={{width:110,height:44}}><path d={m.spark} fill="none" strokeWidth="2" stroke={m.color} opacity={0.5} strokeLinecap="round"/></svg></td>
                <td style={{padding:'22px 28px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:100,height:4,background:'rgba(255,255,255,0.05)',borderRadius:10,overflow:'hidden'}}><div style={{width:'82%',height:'100%',background:'#AAAAAA',borderRadius:10}}/></div>
                    <span style={{fontSize:10,fontWeight:900,color:'#AAAAAA'}}>Low</span>
                  </div>
                </td>
                <td style={{padding:'22px 28px',color:'#6b7280',fontSize:14,fontWeight:700}}>${(ASSET_PRICES[sym]*1234).toLocaleString().slice(0,8)}M</td>
                <td style={{padding:'22px 28px'}}><button style={{background:'none',border:'none',color:'#4b5563',cursor:'pointer',fontSize:10,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.15em',display:'flex',alignItems:'center',gap:6,transition:'color 0.2s'}} onMouseEnter={e=>(e.currentTarget.style.color='#FFFFFF')} onMouseLeave={e=>(e.currentTarget.style.color='#4b5563')}>Trade <ArrowUpRight size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ─── Swap Tab ───────────────────────────────── */
function SwapTab({wallet,swapFrom,setSwapFrom,swapTo,setSwapTo,swapAmt,setSwapAmt,onSwap,loading}:any) {
  const est = () => { const a=parseFloat(swapAmt)||0; return (a*(EXCHANGE_RATES[swapFrom]?.[swapTo]||0)*0.997).toFixed(4); };
  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{maxWidth:540,margin:'0 auto',paddingTop:12}}>
      <div className="glass-card" style={{padding:48,borderRadius:52}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:40}}>
          <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:26,fontWeight:900,letterSpacing:'-1px',display:'flex',alignItems:'center',gap:12}}><ArrowRightLeft color="#FFFFFF" size={24}/> Atomic_Swap</h2>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:14,padding:'7px 14px'}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#FFFFFF',animation:'pulse 2s infinite'}}/>
            <span style={{fontSize:10,fontWeight:900,color:'#FFFFFF',textTransform:'uppercase',letterSpacing:'0.1em'}}>Sentinel Live</span>
          </div>
        </div>
        <div style={{background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:28,padding:24,marginBottom:6}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><span style={{fontSize:10,color:'#4b5563',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.2em'}}>Supply</span><span style={{fontSize:11,color:'#FFFFFF',fontWeight:900}}>Bal: {wallet.assets[swapFrom]?.toFixed(4)}</span></div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <input type="number" value={swapAmt} onChange={e=>setSwapAmt(e.target.value)} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:40,fontWeight:900,color:'#fff',fontFamily:"'Space Grotesk',sans-serif"}}/>
            <select value={swapFrom} onChange={e=>setSwapFrom(e.target.value)} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:18,padding:'10px 16px',color:'#fff',fontWeight:900,fontSize:14,outline:'none',fontFamily:'inherit',textTransform:'uppercase',cursor:'pointer'}}>
              {Object.keys(wallet.assets).map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'center',position:'relative',zIndex:2,margin:'-2px 0'}}>
          <button style={{background:'linear-gradient(135deg,#222,#555)',border:'6px solid #030305',borderRadius:20,padding:12,cursor:'pointer',transition:'transform 0.4s ease'}}
            onClick={()=>{const t=swapFrom;setSwapFrom(swapTo);setSwapTo(t);}}
            onMouseEnter={e=>(e.currentTarget.style.transform='rotate(180deg)')} onMouseLeave={e=>(e.currentTarget.style.transform='')}>
            <ArrowRightLeft color="#fff" size={20} style={{transform:'rotate(90deg)'}}/>
          </button>
        </div>
        <div style={{background:'rgba(0,0,0,0.5)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:28,padding:24,marginTop:6,marginBottom:28}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><span style={{fontSize:10,color:'#4b5563',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.2em'}}>Receive</span><span style={{fontSize:10,color:'#4b5563',fontWeight:900,textTransform:'uppercase'}}>Est. Rate</span></div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <input readOnly value={est()} style={{flex:1,background:'none',border:'none',outline:'none',fontSize:40,fontWeight:900,color:'#AAAAAA',fontFamily:"'Space Grotesk',sans-serif"}}/>
            <select value={swapTo} onChange={e=>setSwapTo(e.target.value)} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:18,padding:'10px 16px',color:'#fff',fontWeight:900,fontSize:14,outline:'none',fontFamily:'inherit',textTransform:'uppercase',cursor:'pointer'}}>
              {Object.keys(wallet.assets).map(a=><option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <button className="btn-primary" style={{width:'100%',padding:'20px',fontSize:11,borderRadius:20}} onClick={onSwap} disabled={loading}>
          {loading?'Confirming via Sentinel AI…':'Execute Atomic Swap'}
        </button>
        <p style={{textAlign:'center',fontSize:9,color:'#374151',fontWeight:900,letterSpacing:'0.25em',textTransform:'uppercase',marginTop:16}}>0.3% fee · Secured via Sentinel AI · RAG-V2</p>
      </div>
    </motion.div>
  );
}

/* ─── Sentinel Tab ───────────────────────────── */
function SentinelTab({explanation,onAudit,txHistory}:any) {
  const flaggedTxs = txHistory.filter((t:any)=>t.riskScore>0);
  return (
    <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0}} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
      <div className="glass-card" style={{padding:44,borderRadius:44,position:'relative',overflow:'hidden',borderColor:'rgba(200,200,200,0.12)'}}>
        <ShieldCheck style={{position:'absolute',top:-20,right:-20,opacity:0.04}} size={180} color="#AAAAAA"/>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:32}}>
          <Cpu color="#AAAAAA" size={20}/><h3 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:20,fontWeight:900}}>Sentinel Intelligence</h3>
        </div>
        {explanation?(
          <div>
            <div style={{background:'rgba(200,200,200,0.06)',borderLeft:'4px solid #AAAAAA',borderRadius:16,padding:'20px 24px',marginBottom:20}}>
              <p style={{fontSize:10,fontWeight:900,color:'#AAAAAA',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:12}}>Neural Reasoning Path</p>
              <p style={{color:'#d1d5db',fontSize:14,fontStyle:'italic',lineHeight:1.7}}>"{explanation}"</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['Confidence','99.2%'],['Model','RAG-V2'],['Vectors','1.2M'],['Latency','~12ms']].map(([l,v])=>(
                <div key={l} className="glass" style={{padding:'12px 16px',borderRadius:14,textAlign:'center'}}>
                  <p style={{fontSize:9,color:'#4b5563',fontWeight:900,textTransform:'uppercase',marginBottom:4}}>{l}</p>
                  <p style={{fontSize:16,fontWeight:900}}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        ):(
          <div style={{border:'2px dashed rgba(255,255,255,0.05)',borderRadius:24,padding:'60px 20px',textAlign:'center',opacity:0.35}}>
            <ShieldCheck size={36} color="#374151" style={{margin:'0 auto 12px'}}/>
            <p style={{fontSize:11,color:'#374151',fontWeight:900,letterSpacing:'0.25em',textTransform:'uppercase'}}>No Threat Logs</p>
          </div>
        )}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {[{icon:<Globe size={18}/>,title:'Oracle Feed',desc:'Live from 40+ global nodes',active:true},{icon:<Activity size={18}/>,title:'Anomaly Detect',desc:'Real-time vector variance engine'},{icon:<Lock size={18}/>,title:'Anti-Phish AI',desc:'URL & signature inspection'}].map(({icon,title,desc,active})=>(
          <div key={title} className="glass" style={{padding:'24px 28px',borderRadius:24,cursor:'pointer',borderColor:active?'rgba(200,200,200,0.15)':'',background:active?'rgba(200,200,200,0.03)':'',transition:'all 0.2s'}}
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.03)')} onMouseLeave={e=>(e.currentTarget.style.background=active?'rgba(200,200,200,0.03)':'')}>
            <div style={{color:active?'#AAAAAA':'#4b5563',marginBottom:12}}>{icon}</div>
            <p style={{fontWeight:900,fontSize:15,marginBottom:4}}>{title}</p>
            <p style={{fontSize:10,color:'#4b5563',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em'}}>{desc}</p>
          </div>
        ))}
        <button className="btn-primary" style={{padding:'18px',fontSize:11,borderRadius:20}} onClick={onAudit}>Execute System Audit</button>
        {flaggedTxs.length>0&&<div className="glass" style={{padding:'18px 22px',borderRadius:20,background:'rgba(239,68,68,0.05)',borderColor:'rgba(239,68,68,0.15)'}}>
          <p style={{fontSize:10,color:'#ef4444',fontWeight:900,textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:6}}>⚠️ Flagged Transactions: {flaggedTxs.length}</p>
          <p style={{fontSize:12,color:'#6b7280'}}>Review these transactions in the Ledger tab</p>
        </div>}
      </div>
    </motion.div>
  );
}

/* ─── History Tab ────────────────────────────── */
function HistoryTab({txHistory}:{txHistory:Transaction[]}) {
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
      {txHistory.length===0?(
        <div style={{textAlign:'center',padding:'80px 0',opacity:0.4}}>
          <History size={48} color="#374151" style={{margin:'0 auto 16px'}}/>
          <p style={{fontSize:12,color:'#374151',fontWeight:900,letterSpacing:'0.25em',textTransform:'uppercase'}}>No transactions yet</p>
        </div>
      ):(
        <div className="glass-card" style={{borderRadius:44,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:'rgba(255,255,255,0.015)'}}>
                {['Type','Asset','Amount','To/From','Risk','Status','ATX Earned'].map(h=>(
                  <th key={h} style={{padding:'20px 24px',textAlign:'left',fontSize:10,fontWeight:900,color:'#4b5563',letterSpacing:'0.15em',textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txHistory.map(tx=>(
                <tr key={tx.id} style={{borderBottom:'1px solid rgba(255,255,255,0.03)',transition:'background 0.2s'}}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.01)')} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                  <td style={{padding:'18px 24px'}}>
                    <span style={{padding:'4px 12px',borderRadius:8,fontSize:10,fontWeight:900,textTransform:'uppercase',background:tx.type==='send'?'rgba(239,68,68,0.1)': tx.type==='receive'?'rgba(34,197,94,0.1)':'rgba(255,255,255,0.1)',color:tx.type==='send'?'#ef4444':tx.type==='receive'?'#22c55e':'#FFFFFF'}}>{tx.type}</span>
                  </td>
                  <td style={{padding:'18px 24px',fontWeight:900,fontSize:15}}>{tx.asset}{tx.toAsset&&<span style={{color:'#4b5563',fontSize:12}}> → {tx.toAsset}</span>}</td>
                  <td style={{padding:'18px 24px',fontWeight:900}}>{tx.amount.toFixed(4)}</td>
                  <td style={{padding:'18px 24px',fontFamily:'monospace',fontSize:11,color:'#6b7280'}}>{tx.type==='send'?tx.to?.slice(0,12)+'…':tx.from?.slice(0,12)+'…'}</td>
                  <td style={{padding:'18px 24px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:tx.riskScore>=70?'#ef4444':tx.riskScore>=30?'#f59e0b':'#22c55e'}}/>
                      <span style={{fontSize:12,fontWeight:900,color:tx.riskScore>=70?'#ef4444':tx.riskScore>=30?'#f59e0b':'#22c55e'}}>{tx.riskScore}</span>
                    </div>
                  </td>
                  <td style={{padding:'18px 24px'}}><span style={{padding:'4px 10px',borderRadius:8,fontSize:10,fontWeight:900,background:'rgba(34,197,94,0.1)',color:'#22c55e'}}>{tx.status}</span></td>
                  <td style={{padding:'18px 24px',color:'#FFFFFF',fontWeight:900}}>+{tx.atxEarned||0} ATX</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Hub Tab ─────────────────────────── */
function HubTab({hubData}:any) {
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:24}}>
        <p style={{fontSize:11,fontWeight:900,color:'#FFFFFF',textTransform:'uppercase',letterSpacing:'0.2em'}}>Global System Transaction Feed (Full Ledger)</p>
        <p style={{fontSize:10,color:'#4b5563'}}>Real-time Oracle Events · Blocks: {hubData.length}</p>
      </div>
      <div style={{display:'grid',gap:12}}>
        {hubData.map(block => (
          <div key={block.hash} className="glass" style={{padding:'20px 24px',borderRadius:20,display:'flex',alignItems:'center',gap:24,border:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{width:48,height:48,borderRadius:14,background:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFFFFF'}}>
              <Cpu size={24}/>
            </div>
            <div style={{flex:1}}>
               <p style={{fontSize:9,color:'#4b5563',fontWeight:900,letterSpacing:'0.1em',marginBottom:4}}>BLOCK #{block.index} · {new Date(block.timestamp).toLocaleTimeString()}</p>
               <p style={{fontWeight:900,fontSize:14}}>{block.data.type === 'send' ? `Wealth Transfer: ${block.data.amount} ${block.data.asset}` : 'Genesis System Initialization'}</p>
               <p style={{fontSize:11,color:'#6b7280',fontFamily:'monospace',marginTop:4}}>HASH: {block.hash.slice(0,32)}...</p>
            </div>
            <div style={{textAlign:'right'}}>
              <p style={{fontSize:10,color:'#4b5563',fontWeight:900,letterSpacing:'0.1em',marginBottom:4}}>RELAYED BY</p>
              <p style={{fontSize:12,fontWeight:700,color:'#FFFFFF'}}>{block.data.from ? short(block.data.from) : 'SENTINEL_NODE'}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Seed Modal ─────────────────────────────── */
function SeedModal({mnemonic,onClose,onCopy}:any) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'rgba(2,2,5,0.97)',backdropFilter:'blur(24px)'}}>
      <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} className="glass-card" style={{borderRadius:48,padding:48,maxWidth:500,width:'100%',textAlign:'center',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,0.05)',border:'none',borderRadius:10,padding:8,cursor:'pointer',color:'#6b7280'}}><X size={16}/></button>
        <p style={{fontSize:12,fontWeight:900,letterSpacing:'0.3em',color:'#FFFFFF',marginBottom:8,textTransform:'uppercase'}}>BACKUP_SEED_PHRASE</p>
        <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:28,fontWeight:900,marginBottom:12}}>Master Recovery Key</h2>
        <p style={{color:'#6b7280',fontSize:11,fontWeight:700,letterSpacing:'0.2em',marginBottom:28,textTransform:'uppercase'}}>Write these 12 words offline. NEVER share.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:28}}>
          {mnemonic.split(' ').map((w:string,i:number)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:'10px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'rgba(255,255,255,0.5)',fontSize:10,fontWeight:900}}>{i+1}</span>
              <span style={{fontFamily:'monospace',fontSize:13,fontWeight:700}}>{w}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" style={{width:'100%',marginBottom:10}} onClick={()=>{navigator.clipboard.writeText(mnemonic);onCopy();}}>
          <Copy size={14}/> Copy Phrase
        </button>
        <button className="btn-secondary" style={{width:'100%'}} onClick={onClose}>I've Saved My Phrase</button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Keys Modal ─────────────────────────────── */
function KeysModal({address,privateKey,onClose,onCopy}:any) {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:'fixed',inset:0,zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'rgba(2,2,5,0.97)',backdropFilter:'blur(24px)'}}>
      <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} className="glass-card" style={{borderRadius:48,padding:48,maxWidth:500,width:'100%',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:20,right:20,background:'rgba(255,255,255,0.05)',border:'none',borderRadius:10,padding:8,cursor:'pointer',color:'#6b7280'}}><X size={16}/></button>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:32}}>
          <div style={{background:'rgba(200,200,200,0.15)',padding:8,borderRadius:12}}><Fingerprint color="#AAAAAA" size={20}/></div>
          <h2 style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:26,fontWeight:900,letterSpacing:'-1px'}}>Vault Keys</h2>
        </div>
        <label style={{fontSize:10,fontWeight:900,color:'#6b7280',letterSpacing:'0.2em',textTransform:'uppercase',display:'block',marginBottom:8}}>Public Address</label>
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:'14px 18px',marginBottom:24,fontFamily:'monospace',fontSize:11,wordBreak:'break-all',cursor:'pointer',position:'relative'}}
          onClick={()=>{navigator.clipboard.writeText(address);onCopy('Address');}}>
          {address}<Copy size={14} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'#FFFFFF'}}/>
        </div>
        <label style={{fontSize:10,fontWeight:900,color:'#ef4444',letterSpacing:'0.2em',textTransform:'uppercase',display:'block',marginBottom:8}}>⚠️ Secret Private Key</label>
        <div style={{background:'rgba(239,68,68,0.05)',border:'1px solid rgba(239,68,68,0.15)',borderRadius:16,padding:'14px 18px',marginBottom:8,fontFamily:'monospace',fontSize:11,wordBreak:'break-all',filter:'blur(5px)',transition:'filter 0.5s',cursor:'pointer',position:'relative'}}
          onMouseEnter={e=>(e.currentTarget.style.filter='blur(0)')} onMouseLeave={e=>(e.currentTarget.style.filter='blur(5px)')}
          onClick={()=>{navigator.clipboard.writeText(privateKey);onCopy('Key');}}>
          {privateKey}<Copy size={14} style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',color:'#ef4444'}}/>
        </div>
        <p style={{color:'#374151',fontSize:10,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:28}}>Hover to reveal · Click to copy</p>
        <button className="btn-secondary" style={{width:'100%'}} onClick={onClose}>Close Vault</button>
      </motion.div>
    </motion.div>
  );
}
