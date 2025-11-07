// components/Footer.jsx
export default function Footer() {
  return (
    <footer className="bg-black text-gray-400 py-8 text-center border-t border-white/10">

      <p>
        © {new Date().getFullYear()} 90+5 Store — El tiempo se rompe aquí.
      </p>
      <p className="text-sm mt-2">
        Hecho con <span>⚽</span> y hambre de goles.
      </p>
    </footer>
  );
}
