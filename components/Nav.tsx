import Link from "next/link";

export default function Nav() {
  return (
    <nav className="nav no-print">
      <strong>POS Store</strong>
      <div className="nav-links">
        <Link href="/">Kasir</Link>
        <Link href="/orders">Riwayat</Link>
        <Link href="/login">Login</Link>
        <Link href="/admin">Admin</Link>
      </div>
    </nav>
  );
}