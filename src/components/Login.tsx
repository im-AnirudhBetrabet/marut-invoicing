import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
export default function Login({ onLogin }: { onLogin: () => void }) {
  const [password,setPassword] = useState(""); const [visible,setVisible] = useState(false);
  const [error,setError] = useState(""); const [busy,setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({password}), credentials:"same-origin" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      onLogin();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in."); }
    finally { setBusy(false); }
  }
  return <main className="login-screen">
    <div className="login-botanical botanical-left"/>
    <section className="login-card">
      <img className="login-logo" src="/brand/marut-logo-gold.png" alt="MARUT"/>
      <div className="login-kicker">PRIVATE WORKSPACE</div>
      <h1>Invoice Studio</h1>
      <p>Generate beautifully considered invoices for MARUT.</p>
      <form onSubmit={submit}>
        <label className="password-wrap"><LockKeyhole size={17}/><input autoFocus type={visible?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter team password" required autoComplete="current-password"/><button type="button" className="eye-button" onClick={()=>setVisible(!visible)} aria-label="Toggle password visibility">{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button></label>
        {error && <div className="login-error">{error}</div>}
        <button className="primary-button login-button" disabled={busy || !password}>{busy?"Verifying…":<>Access Invoice Studio <ArrowRight size={17}/></>}</button>
      </form>
      <div className="private-note"><ShieldCheck size={15}/> Private tool for authorised MARUT team members</div>
    </section>
    <div className="login-wordmark">MARUT <span>·</span> FRESH MICROGREENS</div>
  </main>;
}