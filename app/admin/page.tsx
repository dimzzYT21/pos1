"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/client";

export default function Admin() {
  const supabase=createClient();
  const [allowed,setAllowed]=useState<boolean|null>(null);
  const [stats,setStats]=useState({orders:0,revenue:0,products:0});
  const [orders,setOrders]=useState<any[]>([]);
  const [products,setProducts]=useState<any[]>([]);
  const [form,setForm]=useState({name:"",sku:"",price:"",stock:"",category:"",image_url:""});
  const [msg,setMsg]=useState("");

  const load=async()=>{
    const [{data:ord},{data:prod}]=await Promise.all([
      supabase.from("orders").select("*").order("created_at",{ascending:false}).limit(50),
      supabase.from("products").select("*").order("created_at",{ascending:false})
    ]);
    setOrders(ord||[]); setProducts(prod||[]);
    setStats({
      orders:(ord||[]).length,
      revenue:(ord||[]).reduce((s:any,o:any)=>s+Number(o.total),0),
      products:(prod||[]).length
    });
  };

  useEffect(()=>{
    (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){ location.href="/login"; return; }
      const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).single();
      if(profile?.role!=="admin"){ setAllowed(false); return; }
      setAllowed(true); await load();
    })();
  },[]);

  const addProduct=async(e:React.FormEvent)=>{
    e.preventDefault(); setMsg("");
    const {error}=await supabase.from("products").insert({
      name:form.name, sku:form.sku, price:Number(form.price), stock:Number(form.stock),
      category:form.category||null, image_url:form.image_url||null
    });
    if(error) setMsg(error.message); else {setForm({name:"",sku:"",price:"",stock:"",category:"",image_url:""}); await load();}
  };

  const updateStatus=async(id:string,status:string)=>{
    const {error}=await supabase.from("orders").update({status}).eq("id",id);
    if(error) setMsg(error.message); else await load();
  };

  if(allowed===null) return <><Nav/><main className="container"><div className="card">Memeriksa akses...</div></main></>;
  if(!allowed) return <><Nav/><main className="container"><div className="card"><h2>Akses ditolak</h2><p>Akun ini bukan admin.</p><LogoutButton/></div></main></>;

  return <><Nav/><main className="container">
    <div className="row"><div><h1>Admin Dashboard</h1><p className="muted">Kelola produk dan pesanan.</p></div><LogoutButton/></div>
    {msg && <div className="alert" style={{margin:"12px 0"}}>{msg}</div>}
    <div className="grid grid-3" style={{margin:"20px 0"}}>
      <div className="card"><div className="muted">Pesanan terakhir</div><div className="kpi">{stats.orders}</div></div>
      <div className="card"><div className="muted">Omzet terakhir</div><div className="kpi">Rp {stats.revenue.toLocaleString("id-ID")}</div></div>
      <div className="card"><div className="muted">Jumlah produk</div><div className="kpi">{stats.products}</div></div>
    </div>

    <div className="grid grid-2">
      <section className="card">
        <h2>Tambah Produk</h2>
        <form className="form" onSubmit={addProduct}>
          <input className="input" placeholder="Nama produk" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
          <input className="input" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} required />
          <input className="input" type="number" placeholder="Harga" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required />
          <input className="input" type="number" placeholder="Stok" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} required />
          <input className="input" placeholder="Kategori" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
          <input className="input" placeholder="URL gambar (opsional)" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} />
          <button className="btn success">Simpan Produk</button>
        </form>
      </section>

      <section className="card">
        <h2>Produk</h2>
        <div className="table-wrap"><table><thead><tr><th>Produk</th><th>SKU</th><th>Harga</th><th>Stok</th></tr></thead>
        <tbody>{products.map(p=><tr key={p.id}><td>{p.name}</td><td>{p.sku}</td><td>Rp {Number(p.price).toLocaleString("id-ID")}</td><td>{p.stock}</td></tr>)}</tbody>
        </table></div>
      </section>
    </div>

    <section className="card" style={{marginTop:20}}>
      <h2>Pesanan</h2>
      <div className="table-wrap"><table><thead><tr><th>No</th><th>Pelanggan</th><th>Total</th><th>Pembayaran</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>{orders.map(o=><tr key={o.id}>
        <td>{o.order_number}</td><td>{o.customer_name||"-"}</td><td>Rp {Number(o.total).toLocaleString("id-ID")}</td>
        <td>{o.payment_method}</td><td><span className="badge">{o.status}</span></td>
        <td>
          <select className="select" value={o.status} onChange={e=>updateStatus(o.id,e.target.value)}>
            <option value="paid">paid</option><option value="processing">processing</option><option value="completed">completed</option><option value="cancelled">cancelled</option>
          </select>
        </td>
      </tr>)}</tbody></table></div>
    </section>
  </main></>;
}