import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-content py-20 text-center">
      <h1 className="font-display text-display-md font-semibold text-ink">404</h1>
      <p className="mt-3 text-inkSoft">Stranica ne postoji.</p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-sm bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-forest-700"
      >
        Natrag na registar
      </Link>
    </div>
  );
}
