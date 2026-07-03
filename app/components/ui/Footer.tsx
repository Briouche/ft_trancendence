export default function Footer() {
  return (
    <footer className="py-3.5 border-t border-primary text-sm text-secondary grid grid-cols-3 items-center">
      <div />

      <div className="flex items-center justify-center gap-4">
        <a href="/privacy_policy">Privacy Policy</a>
        <a href="/terms_of_service">Terms of Service</a>
      </div>

      <p className="text-right">
        Fait avec ❤️ en Belgique — {new Date().getFullYear()}
      </p>
    </footer>
  );
}
