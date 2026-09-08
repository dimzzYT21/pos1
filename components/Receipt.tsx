"use client";
import type { CartItem } from "@/lib/types";

export default function Receipt({
  orderNumber, items, subtotal, tax, total, paymentMethod, customerName, createdAt
}: {
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  customerName?: string | null;
  createdAt?: string;
}) {
  return (
    <div className="card receipt-print" style={{ maxWidth: 420, margin: "20px auto" }}>
      <div style={{ textAlign: "center" }}>
        <h2>POS STORE</h2>
        <div className="muted">Struk Pembelian</div>
      </div>
      <hr />
      <div className="muted">No: {orderNumber}</div>
      {createdAt && <div className="muted">{new Date(createdAt).toLocaleString("id-ID")}</div>}
      {customerName && <div>Pelanggan: {customerName}</div>}
      <hr />
      {items.map(i => (
        <div className="row" key={i.id}>
          <span>{i.name} × {i.qty}</span>
          <span>Rp {(i.price * i.qty).toLocaleString("id-ID")}</span>
        </div>
      ))}
      <hr />
      <div className="row"><span>Subtotal</span><b>Rp {subtotal.toLocaleString("id-ID")}</b></div>
      <div className="row"><span>Pajak</span><b>Rp {tax.toLocaleString("id-ID")}</b></div>
      <div className="row"><span>Total</span><b>Rp {total.toLocaleString("id-ID")}</b></div>
      <div style={{ marginTop: 10 }}>Pembayaran: <b>{paymentMethod}</b></div>
      <p style={{ textAlign:"center" }}>Terima kasih 🙏</p>
      <div className="no-print" style={{ textAlign:"center" }}>
        <button className="btn" onClick={() => window.print()}>🖨️ Print Struk</button>
      </div>
    </div>
  );
}