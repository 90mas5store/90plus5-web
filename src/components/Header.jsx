// components/Header.jsx
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full flex items-center justify-between p-6 z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="90+5"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="text-white text-lg font-semibold tracking-widest">
            90+5 Store
          </span>
        </Link>
      </div>

      <nav className="hidden sm:flex items-center gap-6 text-gray-300 text-sm">
        <Link href="/" className="hover:text-white transition">
          Inicio
        </Link>
        <Link href="/catalogo" className="hover:text-white transition">
          Catálogo
        </Link>
        <Link href="/contacto" className="hover:text-white transition">
          Contacto
        </Link>
      </nav>
    </header>
  );
}
