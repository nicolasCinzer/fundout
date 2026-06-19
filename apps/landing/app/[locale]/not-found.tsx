export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="font-heading text-6xl font-bold">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Page not found.
      </p>
      <a
        href="/"
        className="mt-8 text-primary underline underline-offset-4 hover:opacity-80"
      >
        Go home
      </a>
    </main>
  );
}
