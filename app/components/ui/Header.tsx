export default function Header() {
  return (
    <header className="grid grid-cols-3 items-center py-4">
      <div />

      <a
        href="/"
        className="flex items-center justify-center text-2xl font-bold text-primary"
      >
        jeudecartes.super.be
      </a>

      <nav className="flex items-center justify-end gap-3">
        <a
          href="/log in"
          className="px-4 py-2 rounded-2xl border border-primary text-secondary hover:text-accent hover:border-accent transition-colors"
        >
          Log in
        </a>
        <a
          href="/sign up"
          className="px-4 py-2 rounded-2xl bg-primary text-white hover:bg-accent transition-colors"
        >
          Sign up
        </a>
      </nav>
    </header>
  );
}
