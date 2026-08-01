import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Orbit,
  Rocket,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // Navigate immediately after tokens/user are set — do not wait on UI teardown.
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#07081a] text-white">
      {/* Ambient innovation canvas */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#4f46e5_0%,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#db2777_0%,_transparent_40%),radial-gradient(ellipse_at_bottom_left,_#0891b2_0%,_transparent_40%)] opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="login-float login-pulse-glow absolute -left-24 top-16 size-72 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="login-float-delayed login-pulse-glow absolute -right-16 top-1/3 size-80 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="login-float absolute bottom-10 left-1/3 size-64 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="login-orbit absolute left-1/2 top-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="login-orbit absolute left-1/2 top-1/2 size-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/10 [animation-direction:reverse] [animation-duration:18s]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-svh max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Brand / story panel */}
        <div className="hidden space-y-8 lg:block">
          <div className="login-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="size-3.5 text-amber-300" />
            Intelligent CRM for growing businesses
          </div>

          <div className="login-rise-2 space-y-4">
            <h1 className="login-shimmer-text bg-gradient-to-r from-white via-cyan-200 to-fuchsia-200 bg-clip-text text-5xl font-bold tracking-tight text-transparent xl:text-6xl">
              Ameya Biz Shree
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-white/75">
              Where business clarity meets imaginative execution — customers,
              deals, revenue, and renewals in one luminous workspace.
            </p>
          </div>

          <div className="login-rise-3 grid gap-3">
            {[
              {
                icon: Rocket,
                title: "Launch faster",
                text: "Move from opportunity to invoice without friction.",
                tint: "from-fuchsia-500/30 to-rose-500/20",
              },
              {
                icon: Orbit,
                title: "Orbit your growth",
                text: "Collections, renewals, and cash flow in one view.",
                tint: "from-cyan-500/30 to-blue-500/20",
              },
              {
                icon: Zap,
                title: "Innovate daily",
                text: "A modern OS built for operators who move markets.",
                tint: "from-violet-500/30 to-indigo-500/20",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10"
              >
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.tint} ring-1 ring-white/15 transition-transform duration-300 group-hover:scale-105`}
                >
                  <item.icon className="size-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-sm text-white/65">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auth card */}
        <div className="login-rise-4 mx-auto w-full max-w-[440px]">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/10 p-6 shadow-[0_20px_80px_rgba(79,70,229,0.35)] backdrop-blur-xl sm:p-8">
            <div
              className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-fuchsia-400/30 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-12 -left-8 size-40 rounded-full bg-cyan-400/25 blur-2xl"
              aria-hidden
            />

            <div className="relative mb-8 space-y-4 text-center lg:text-left">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30 lg:mx-0">
                <Sparkles className="size-7" aria-hidden />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80 lg:hidden">
                  Ameya Biz Shree
                </p>
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-[1.7rem]">
                  Begin your journey
                </h2>
                <p className="text-sm text-white/65">
                  Sign in to step into the innovation workspace
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="relative space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-400/30 bg-rose-500/15 px-3.5 py-3 text-sm text-rose-100"
                >
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-cyan-300/80"
                    aria-hidden
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@ameya.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                    className="h-12 rounded-xl border-white/15 bg-white/10 pl-10 text-white placeholder:text-white/40 focus-visible:border-cyan-300/50 focus-visible:ring-cyan-400/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fuchsia-300/80"
                    aria-hidden
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-12 rounded-xl border-white/15 bg-white/10 pl-10 pr-11 text-white placeholder:text-white/40 focus-visible:border-fuchsia-300/50 focus-visible:ring-fuchsia-400/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg bg-black/45 p-1.5 text-fuchsia-200 shadow-sm ring-1 ring-white/20 transition-colors hover:bg-black/60 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-white/65">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-white/30 accent-violet-500"
                />
                Remember me
              </label>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:brightness-110 hover:shadow-xl hover:shadow-fuchsia-500/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Entering…
                  </>
                ) : (
                  <>
                    Enter Ameya Biz Shree
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="relative mt-6 text-center text-xs text-white/45">
              Secure access · Built for innovators
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
