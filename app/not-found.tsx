import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">404</p>
      <h1 className="mt-4 text-3xl font-bold text-white">This part of Mirai does not exist.</h1>
      <Link className="mt-8 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white" href="/">
        Back home
      </Link>
    </main>
  );
}
