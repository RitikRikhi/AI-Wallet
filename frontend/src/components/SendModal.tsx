import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, ShieldAlert, AlertCircle, CheckCircle2, ArrowRightLeft, RefreshCw } from 'lucide-react';
import api from '../utils/api';

interface Props {
  wallet: { address: string; assets: Record<string, number> };
  onClose: () => void;
  onSuccess: (assets: Record<string, number>, atxEarned: number) => void;
  onToast: (ok: boolean, msg: string) => void;
}

type Step = 'form' | 'scanning' | 'result' | 'done';

const ASSET_PRICES: Record<string, number> = { SOL: 151.20, ETH: 3421.50, BTC: 65120.40, USDC: 1.00, ATX: 0.85 };

export default function SendModal({ wallet, onClose, onSuccess, onToast }: Props) {
  const [step, setStep]           = useState<Step>('form');
  const [recipient, setRecipient] = useState('');
  const [asset, setAsset]         = useState('SOL');
  const [amount, setAmount]       = useState('');
  const [fraudResult, setFraudResult] = useState<any>(null);
  const [confirming, setConfirming]   = useState(false);

  const usdValue = parseFloat(amount || '0') * (ASSET_PRICES[asset] || 1);

  const scanTransaction = async () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      onToast(false, 'Fill in recipient address and amount');
      return;
    }
    setStep('scanning');
    try {
      const res = await api.post('/send-crypto', { recipientAddress: recipient, asset, amount: parseFloat(amount), confirmed: false });
      setFraudResult(res.data);
      setStep('result');
    } catch (e: any) {
      onToast(false, e.response?.data?.error || 'Scan failed');
      setStep('form');
    }
  };

  const confirmSend = async () => {
    setConfirming(true);
    try {
      const res = await api.post('/send-crypto', { recipientAddress: recipient, asset, amount: parseFloat(amount), confirmed: true });
      if (res.data.status === 'confirmed') {
        onSuccess(res.data.assets, res.data.atxEarned);
        onToast(true, `Sent ${amount} ${asset} · Earned ${res.data.atxEarned} ATX`);
        setStep('done');
      }
    } catch (e: any) {
      onToast(false, e.response?.data?.error || 'Transaction failed');
    } finally { setConfirming(false); }
  };

  const riskColor = (score: number) => score >= 70 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#22c55e';
  const riskLabel = (score: number) => score >= 70 ? 'HIGH RISK — BLOCKED' : score >= 30 ? 'MODERATE RISK' : 'LOW RISK — SAFE';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'rgba(2,2,5,0.95)', backdropFilter:'blur(24px)' }}>
      <motion.div initial={{ scale:0.92, y:24 }} animate={{ scale:1, y:0 }} exit={{ scale:0.92, opacity:0 }}
        className="glass-card" style={{ borderRadius:48, padding:52, maxWidth:520, width:'100%', position:'relative' }}>

        <button onClick={onClose} style={{ position:'absolute', top:24, right:24, background:'rgba(255,255,255,0.05)', border:'none', borderRadius:12, padding:10, cursor:'pointer', color:'#6b7280' }}>
          <X size={18} />
        </button>

        {/* FORM */}
        {step === 'form' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:36 }}>
              <div style={{ background:'rgba(157,78,221,0.15)', padding:10, borderRadius:14 }}><ArrowRightLeft color="#9D4EDD" size={22}/></div>
              <div>
                <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:26, fontWeight:900, letterSpacing:'-1px', marginBottom:2 }}>Send Crypto</h2>
                <p style={{ fontSize:10, color:'#4b5563', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase' }}>Sentinel AI scans before sending</p>
              </div>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:10, color:'#6b7280', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Recipient Wallet Address</label>
              <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="0x... or wallet address"
                style={{ width:'100%', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:'16px 20px', color:'#fff', fontFamily:'monospace', fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:28 }}>
              <div>
                <label style={{ fontSize:10, color:'#6b7280', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Asset</label>
                <select value={asset} onChange={e => setAsset(e.target.value)}
                  style={{ width:'100%', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:'16px 20px', color:'#fff', fontSize:14, fontWeight:900, outline:'none', cursor:'pointer' }}>
                  {Object.keys(wallet.assets).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, color:'#6b7280', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', display:'block', marginBottom:8 }}>Amount</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  style={{ width:'100%', background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:'16px 20px', color:'#fff', fontSize:20, fontWeight:900, outline:'none', boxSizing:'border-box' }} />
              </div>
            </div>

            <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, padding:'14px 20px', marginBottom:28, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:11, color:'#6b7280', fontWeight:700 }}>Available: {wallet.assets[asset]?.toFixed(4)} {asset}</span>
              <span style={{ fontSize:11, color:'#9D4EDD', fontWeight:900 }}>≈ ${usdValue.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
            </div>

            <button className="btn-primary" style={{ width:'100%', padding:'18px', fontSize:12 }} onClick={scanTransaction}>
              <ShieldCheck size={16} /> Scan with Sentinel AI
            </button>
            <p style={{ textAlign:'center', marginTop:16, fontSize:10, color:'#374151', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em' }}>AI fraud check runs before any funds move</p>
          </div>
        )}

        {/* SCANNING */}
        {step === 'scanning' && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(157,78,221,0.1)', border:'2px solid rgba(157,78,221,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px', animation:'glow-pulse 2s infinite' }}>
              <RefreshCw color="#9D4EDD" size={32} style={{ animation:'spin 1s linear infinite' }} />
            </div>
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:900, marginBottom:12 }}>Scanning Transaction…</h3>
            <p style={{ color:'#6b7280', fontSize:14 }}>Sentinel AI is cross-referencing 1.2M fraud vectors</p>
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:28 }}>
              {['Address verification','Amount analysis','Pattern matching','Risk scoring'].map((l,i)=>(
                <div key={l} style={{ padding:'6px 14px', background:'rgba(157,78,221,0.08)', border:'1px solid rgba(157,78,221,0.15)', borderRadius:100, fontSize:9, color:'#9D4EDD', fontWeight:900, letterSpacing:'0.1em', textTransform:'uppercase', animation:`fadeIn 0.5s ${i*0.3}s both` }}>{l}</div>
              ))}
            </div>
          </div>
        )}

        {/* RESULT */}
        {step === 'result' && fraudResult && (
          <div>
            {/* Risk banner */}
            <div style={{ background:`${riskColor(fraudResult.riskScore)}12`, border:`1px solid ${riskColor(fraudResult.riskScore)}33`, borderRadius:20, padding:'20px 24px', marginBottom:28, display:'flex', alignItems:'center', gap:16 }}>
              {fraudResult.riskScore >= 70 ? <ShieldAlert color="#ef4444" size={28}/> : fraudResult.riskScore >= 30 ? <AlertCircle color="#f59e0b" size={28}/> : <CheckCircle2 color="#22c55e" size={28}/>}
              <div>
                <p style={{ fontSize:13, fontWeight:900, color: riskColor(fraudResult.riskScore), letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:2 }}>{riskLabel(fraudResult.riskScore)}</p>
                <p style={{ fontSize:12, color:'#9ca3af' }}>Risk Score: <strong style={{ color:riskColor(fraudResult.riskScore) }}>{fraudResult.riskScore}/100</strong></p>
              </div>
              {/* Gauge */}
              <div style={{ marginLeft:'auto', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <svg width={60} height={60} viewBox="0 0 60 60">
                  <circle cx={30} cy={30} r={24} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6}/>
                  <circle cx={30} cy={30} r={24} fill="none" stroke={riskColor(fraudResult.riskScore)} strokeWidth={6} strokeDasharray={`${(fraudResult.riskScore/100)*150.8} 150.8`} strokeLinecap="round" transform="rotate(-90 30 30)" style={{ transition:'stroke-dasharray 1s ease' }}/>
                  <text x={30} y={35} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={900}>{fraudResult.riskScore}</text>
                </svg>
              </div>
            </div>

            {/* Fraud flags */}
            {fraudResult.fraudFlags?.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:10, color:'#6b7280', fontWeight:900, letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:12 }}>Detected Signals</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {fraudResult.fraudFlags.map((f: any, i: number) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, padding:'12px 16px' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background: f.severity==='CRITICAL'?'#ef4444':f.severity==='HIGH'?'#f97316':f.severity==='MEDIUM'?'#f59e0b':'#22c55e', flexShrink:0, marginTop:4 }}/>
                      <div>
                        <p style={{ fontSize:11, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', color:f.severity==='CRITICAL'?'#ef4444':f.severity==='HIGH'?'#f97316':f.severity==='MEDIUM'?'#f59e0b':'#22c55e', marginBottom:2 }}>{f.severity}</p>
                        <p style={{ fontSize:13, color:'#d1d5db' }}>{f.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI explanation */}
            {fraudResult.explanation && (
              <div style={{ background:'rgba(0,245,255,0.04)', border:'1px solid rgba(0,245,255,0.12)', borderRadius:16, padding:'16px 20px', marginBottom:28, fontSize:13, color:'#9ca3af', lineHeight:1.7, fontStyle:'italic' }}>
                "{fraudResult.explanation}"
              </div>
            )}

            {/* tx summary */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:28 }}>
              {[['Sending',`${amount} ${asset}`],['To',`${recipient.slice(0,10)}...`],['USD Value',`$${usdValue.toFixed(2)}`],['Network Fee','~$0.03']].map(([l,v])=>(
                <div key={l} style={{ background:'rgba(255,255,255,0.02)', borderRadius:14, padding:'12px 16px' }}>
                  <p style={{ fontSize:10, color:'#6b7280', fontWeight:900, textTransform:'uppercase', marginBottom:4 }}>{l}</p>
                  <p style={{ fontWeight:900, fontSize:14 }}>{v}</p>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:12 }}>
              <button className="btn-secondary" style={{ flex:1, padding:'16px' }} onClick={onClose}>Cancel</button>
              {fraudResult.status !== 'blocked' && (
                <button className="btn-primary" style={{ flex:2, padding:'16px', fontSize:11, background: fraudResult.status === 'warning' ? 'linear-gradient(135deg,#f59e0b,#ef4444)' : undefined }}
                  onClick={confirmSend} disabled={confirming}>
                  {confirming ? 'Processing…' : fraudResult.status === 'warning' ? '⚠️ Proceed Anyway' : 'Confirm Send'}
                </button>
              )}
            </div>
            {fraudResult.riskScore >= 70 && <p style={{ textAlign:'center', marginTop:14, fontSize:11, color:'#ef4444', fontWeight:900 }}>This transaction has been automatically blocked by Sentinel AI.</p>}
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(34,197,94,0.1)', border:'2px solid rgba(34,197,94,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
              <CheckCircle2 color="#22c55e" size={36}/>
            </div>
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:28, fontWeight:900, marginBottom:12 }}>Transaction Confirmed</h3>
            <p style={{ color:'#6b7280', fontSize:14, marginBottom:32 }}>Your {asset} has been sent successfully and recorded on the immutable ledger.</p>
            <button className="btn-primary" style={{ width:'100%', padding:'16px' }} onClick={onClose}>Close</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
