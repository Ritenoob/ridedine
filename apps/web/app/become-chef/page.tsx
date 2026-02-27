"use client";
import type React from "react";
import Link from "next/link";
import { useState } from "react";
import { getSupabaseClient } from "../../lib/supabaseClient";

const CUISINE_OPTIONS = ["Italian","Mexican","Indian","Chinese","Japanese","Thai","Mediterranean","American","Middle Eastern","Other"];

export default function BecomeChefPage() {
  const [step, setStep] = useState<"form"|"success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", bio: "", cuisines: [] as string[], address: "",
  });

  const toggleCuisine = (c: string) =>
    setForm(f => ({ ...f, cuisines: f.cuisines.includes(c) ? f.cuisines.filter(x=>x!==c) : [...f.cuisines, c] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const sb = getSupabaseClient();
    // Create auth user
    const { data: authData, error: authErr } = await sb.auth.signUp({ email: form.email, password: form.password });
    if (authErr) { setError(authErr.message); setLoading(false); return; }
    const userId = authData.user?.id;
    if (!userId) { setError("Sign-up failed. Please try again."); setLoading(false); return; }
    // Create profile
    await sb.from("profiles").upsert({ id: userId, name: form.name, email: form.email, role: "chef" });
    // Create chef application
    const { error: chefErr } = await sb.from("chefs").insert({
      id: userId, bio: form.bio, cuisine_types: form.cuisines, address: form.address, status: "pending",
    });
    if (chefErr) { setError(chefErr.message); setLoading(false); return; }
    setStep("success");
    setLoading(false);
  };

  if (step === "success") return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand">🍜 RidenDine</Link>
      </nav>
      <div className="page" style={{ maxWidth: 560, textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
        <h1 className="page-title">Application Submitted!</h1>
        <p className="page-subtitle" style={{ marginBottom: 24 }}>
          Your chef application is now under review. We&apos;ll notify you at <strong>{form.email}</strong> once approved.
        </p>
        <Link href="/" className="btn btn-primary btn-lg">Back to Home</Link>
      </div>
    </div>
  );

  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand">🍜 RidenDine</Link>
        <div className="nav-links">
          <Link href="/chefs" className="nav-link">Browse Chefs</Link>
          <Link href="/account" className="btn btn-primary btn-sm">Sign In</Link>
        </div>
      </nav>
      <div className="page" style={{ maxWidth: 640 }}>
        <div className="page-header">
          <h1 className="page-title">Become a Chef</h1>
          <p className="page-subtitle">Share your passion for cooking and earn from home</p>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} className="card card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="form-label">Full Name</label>
            <input className="form-input" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your full name" />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="you@example.com" />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required minLength={6} value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="form-label">Bio</label>
            <textarea className="form-input" rows={3} required value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} placeholder="Tell customers about yourself and your cooking style..." style={{ resize: "vertical" }} />
          </div>
          <div>
            <label className="form-label">Cuisine Types</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {CUISINE_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => toggleCuisine(c)}
                  className={`btn btn-sm ${form.cuisines.includes(c) ? "btn-primary" : "btn-outline"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Service Area / Address</label>
            <input className="form-input" required value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="e.g. Downtown San Francisco, CA" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading || form.cuisines.length === 0}>
            {loading ? "Submitting..." : "Apply to Become a Chef →"}
          </button>
          {form.cuisines.length === 0 && <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Please select at least one cuisine type</p>}
        </form>
      </div>
    </div>
  );
}
