import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) return setError("Username is required");
    try {
      const res = await login(username);
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-apple-bg">
      <div className="w-full max-w-sm rounded-2xl border border-apple-border bg-white px-8 py-10 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Sign in
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full rounded-lg border border-apple-border px-4 py-3 text-sm focus:border-apple-blue focus:outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-apple-blue py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Continue"}
          </button>
        </form>

        {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default LoginPage;
