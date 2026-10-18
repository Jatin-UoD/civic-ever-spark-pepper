import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/canteen/demo-accounts";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("customer@canteenx.dev");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [pending, setPending] = useState(false);

  async function submit(nextEmail = email, nextPassword = password) {
    setPending(true);
    try {
      const result = mode === "up"
        ? await authClient.signUp.email({ email: nextEmail, password: nextPassword, name: name || "New guest" })
        : await authClient.signIn.email({ email: nextEmail, password: nextPassword });
      if (result.error) {
        toast.error(result.error.message ?? "Sign-in failed");
        return;
      }
      await navigate({ to: "/browse" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-4 py-10 lg:grid-cols-2">
      <div>
        <Link to="/" className="font-display text-2xl font-semibold">Canteen<span className="text-chili">X</span></Link>
        <h1 className="mt-6 font-display text-4xl font-semibold">Sign in to order ahead.</h1>
        <p className="mt-3 text-muted">Google, X, or email. Demo kitchens already have staff and admin accounts.</p>
      </div>
      <div className="rounded-3xl border border-line bg-foam p-5">
        <div className="grid grid-cols-2 gap-2 rounded-full bg-cream p-1">
          <button type="button" className={`rounded-full py-2 text-sm font-semibold ${mode === "in" ? "bg-ink text-foam" : ""}`} onClick={() => setMode("in")}>Sign in</button>
          <button type="button" className={`rounded-full py-2 text-sm font-semibold ${mode === "up" ? "bg-ink text-foam" : ""}`} onClick={() => setMode("up")}>Create account</button>
        </div>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {mode === "up" ? (
            <label className="block text-sm font-medium">
              Name
              <input className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-3" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          ) : null}
          <label className="block text-sm font-medium">
            Email
            <input type="email" className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-3" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input type="password" className="mt-1 w-full rounded-2xl border border-line bg-cream px-3 py-3" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </label>
          <button type="submit" disabled={pending} className="w-full rounded-full bg-chili py-3 font-semibold text-foam disabled:opacity-60">
            {pending ? "Please wait…" : mode === "up" ? "Create account" : "Continue"}
          </button>
        </form>
        <div className="my-4 text-center text-xs uppercase tracking-widest text-muted">or</div>
        <div className="space-y-2">
          {GROK_PROVIDERS.map((provider) => (
            <button
              key={provider.providerId}
              type="button"
              className="w-full rounded-full border border-line py-3 text-sm font-semibold"
              onClick={() => signIn(provider.providerId, { callbackURL: "/browse" })}
            >
              Continue with {provider.label}
            </button>
          ))}
        </div>
        <div className="mt-5">
          <p className="text-sm font-semibold">Demo accounts</p>
          <p className="text-xs text-muted">Password for all of them: {DEMO_PASSWORD}</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="rounded-2xl border border-line px-3 py-2 text-left"
                onClick={() => {
                  setMode("in");
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                  void submit(account.email, DEMO_PASSWORD);
                }}
              >
                <span className="block text-sm font-semibold">{account.role}</span>
                <span className="block text-xs text-muted">{account.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
