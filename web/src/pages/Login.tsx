import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        setSignupSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (signupSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Check your email</h1>
          <p>
            We sent a confirmation link to <strong>{email}</strong>. Confirm
            it, then sign in.
          </p>
          <button
            type="button"
            onClick={() => {
              setSignupSuccess(false);
              setMode("signin");
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>{mode === "signin" ? "Welcome back" : "Create an account"}</h1>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
