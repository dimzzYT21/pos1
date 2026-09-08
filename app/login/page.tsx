"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function Login() {
  const supabase = createClient();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [register,setRegister]=useState(false);
  const [message,setMessage]=useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const result = register
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return setMessage(result.error.message);
    if (register) setMessage("Registrasi berhasil. Cek email jika verifikasi diaktifkan.");
    else location.href = "/admin";
  };

  return <main className="container">
    <div className="card form" style={{margin:"60px auto"}}>
      <h1>{register ? "Daftar Akun" : "Login"}</h1>
      {message && <div className="alert">{message}</div>}
      <form className="form" onSubmit={submit}>
        <input className="input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password minimal 6 karakter" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required />
        <button className="btn">{register ? "Daftar" : "Masuk"}</button>
      </form>
      <button className="btn secondary" onClick={()=>setRegister(!register)}>
        {register ? "Sudah punya akun? Login" : "Buat akun pelanggan"}
      </button>
      <Link href="/">← Kembali ke kasir</Link>
    </div>
  </main>;
}