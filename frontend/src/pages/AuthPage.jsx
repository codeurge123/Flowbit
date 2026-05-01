import { useState } from "react";
import { FiCheck } from "react-icons/fi";
import { Link, Navigate, useLocation } from "react-router-dom";
import heroImg from "../assets/hero.png";
import { useApp } from "../context/useApp";

export function AuthPage({ mode }) {
  const { user, authenticate } = useApp();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  if (user) return <Navigate to={location.state?.from?.pathname || "/dashboard"} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authenticate(mode, form);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-visual" style={{ backgroundImage: `linear-gradient(rgba(8, 68, 155, .92), rgba(6, 65, 152, .95)), url(${heroImg})` }}>
          <div className="auth-brand">
            <span className="brand-mark"><FiCheck /></span>
            <strong>Flowbit</strong>
          </div>
          <h1>Streamline your team's velocity with precision.</h1>
          <p>Experience project management where clarity meets execution. Securely managed, enterprise-grade workflow infrastructure.</p>
          <div className="security-note">
            <strong>Enterprise grade security</strong>
            <span>JWT authentication, role-based access, and project-scoped team data.</span>
          </div>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <h2>{isSignup ? "Create an account" : "Welcome back"}</h2>
          <p>{isSignup ? "Start organizing your team's workflow today." : "Sign in to manage your projects and tasks."}</p>
          {isSignup && (
            <label>
              Full name
              <input required minLength="2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="John Doe" />
            </label>
          )}
          <label>
            Work email
            <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="john@company.com" />
          </label>
          <label>
            Password
            <input required minLength="6" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="••••••••" />
          </label>
          {isSignup && (
            <label className="terms-row">
              <input required type="checkbox" /> I agree to the Terms of Service and Privacy Policy.
            </label>
          )}
          {error && <p className="error-text">{error}</p>}
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
          </button>
          <Link className="link-btn" to={isSignup ? "/signin" : "/signup"}>
            {isSignup ? "Already have an account? Login here" : "Need an account? Create one"}
          </Link>
        </form>
      </section>
    </main>
  );
}
