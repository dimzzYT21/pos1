"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

export default function Orders() {
  const supabase = createClient();
  const [orders,setOrders]=useState<any[]>([]);
  const [message,setMessage]=useState("Memuat...");
  useEffect(()=>{
    (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){ setMessage("Silakan login untuk melihat riwayat pesanan Anda."); return; }
      const {data,error}=await supabase.from("orders").select("*").eq("customer_id",user.id).order("created_at",{ascending:false});
      if(error) setMessage(error.message); else {setOrders(data||[]); setMessage("");}
    })();
  },[]);
  return <><Nav/><main className="container">
    <h1>Riwayat Pesanan</h1>
    {message && <div className="card">{message}</div>}
    {!message && <div className="table-wrap"><table>
      <thead><tr><th>No. Pesanan</th><th>Tanggal</th><th>Total</th><th>Pembayaran</th><th>Status</th></tr></thead>
      <tbody>{orders.map(o=><tr key={o.id}>
        <td>{o.order_number}</td><td>{new Date(o.created_at).toLocaleString("id-ID")}</td>
        <td>Rp {Number(o.total).toLocaleString("id-ID")}</td><td>{o.payment_method}</td><td><span className="badge green">{o.status}</span></td>
      </tr>)}</tbody>
    </table></div>}
  </main></>;
}