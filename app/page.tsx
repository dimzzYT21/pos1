"use client";

import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import Receipt from "@/components/Receipt";
import { createClient } from "@/lib/supabase/client";
import type { CartItem, Product } from "@/lib/types";

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").eq("is_active", true).order("name");
    setProducts((data || []) as Product[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter(p =>
    `${p.name} ${p.sku} ${p.category || ""}`.toLowerCase().includes(search.toLowerCase())
  );
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.11);
  const total = subtotal + tax;

  const add = (p: Product) => {
    setCart(old => {
      const existing = old.find(i => i.id === p.id);
      if (existing) {
        if (existing.qty >= p.stock) return old;
        return old.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...old, { ...p, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(old => old.flatMap(i => {
      if (i.id !== id) return [i];
      const qty = i.qty + delta;
      if (qty <= 0) return [];
      if (qty > i.stock) return [i];
      return [{ ...i, qty }];
    }));
  };

  const checkout = async () => {
    if (!cart.length) return alert("Keranjang masih kosong.");
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: order, error } = await supabase.from("orders").insert({
        customer_id: user?.id || null,
        customer_name: customerName || null,
        subtotal, tax, total,
        payment_method: payment,
        status: "paid"
      }).select().single();
      if (error) throw error;

      const { error: itemError } = await supabase.from("order_items").insert(
        cart.map(i => ({
          order_id: order.id,
          product_id: i.id,
          product_name: i.name,
          price: i.price,
          qty: i.qty,
          line_total: i.price * i.qty
        }))
      );
      if (itemError) throw itemError;

      for (const i of cart) {
        await supabase.rpc("decrement_stock", { product_id: i.id, amount: i.qty });
      }

      setReceipt({ ...order, items: cart });
      setCart([]);
      setCustomerName("");
      await load();
    } catch (e: any) {
      alert(e.message || "Checkout gagal.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Nav />
      <main className="container">
        <section className="hero">
          <h1>Kasir POS</h1>
          <p className="muted">Pilih produk, masukkan ke keranjang, lalu proses pembayaran.</p>
        </section>

        {receipt && (
          <div>
            <Receipt {...receipt} />
            <div className="no-print" style={{textAlign:"center", marginBottom:20}}>
              <button className="btn secondary" onClick={() => setReceipt(null)}>Kembali ke Kasir</button>
            </div>
          </div>
        )}

        {!receipt && <div className="checkout-layout">
          <section>
            <div className="card" style={{marginBottom:16}}>
              <input className="input" placeholder="Cari produk / SKU / kategori..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {loading ? <div className="card">Memuat produk...</div> : (
              <div className="product-grid">
                {filtered.map(p => (
                  <div className="card product-card" key={p.id}>
                    <div className="product-image">
                      {p.image_url ? <img src={p.image_url} alt={p.name} /> : "🛒"}
                    </div>
                    <div><b>{p.name}</b><div className="muted">{p.sku} · {p.category || "Umum"}</div></div>
                    <div className="price">{rupiah(p.price)}</div>
                    <div className="muted">Stok: {p.stock}</div>
                    <button className="btn" disabled={p.stock < 1} onClick={() => add(p)}>Tambah</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="card cart">
            <h2>Keranjang</h2>
            {!cart.length ? <p className="muted">Belum ada produk.</p> : cart.map(i => (
              <div key={i.id} style={{padding:"10px 0", borderBottom:"1px solid #eee"}}>
                <div className="row"><b>{i.name}</b><span>{rupiah(i.price*i.qty)}</span></div>
                <div className="row" style={{marginTop:7}}>
                  <div>
                    <button className="btn secondary" onClick={() => updateQty(i.id,-1)}>-</button>{" "}
                    <b>{i.qty}</b>{" "}
                    <button className="btn secondary" onClick={() => updateQty(i.id,1)}>+</button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{marginTop:14}} className="grid">
              <input className="input" placeholder="Nama pelanggan (opsional)" value={customerName} onChange={e=>setCustomerName(e.target.value)} />
              <select className="select" value={payment} onChange={e=>setPayment(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="qris">QRIS</option>
                <option value="transfer">Transfer</option>
                <option value="card">Kartu</option>
              </select>
              <div className="row"><span>Subtotal</span><b>{rupiah(subtotal)}</b></div>
              <div className="row"><span>Pajak 11%</span><b>{rupiah(tax)}</b></div>
              <div className="row"><span>Total</span><b>{rupiah(total)}</b></div>
              <button className="btn success" disabled={!cart.length || saving} onClick={checkout}>
                {saving ? "Memproses..." : "Bayar & Cetak Struk"}
              </button>
            </div>
          </aside>
        </div>}
      </main>
    </>
  );
}