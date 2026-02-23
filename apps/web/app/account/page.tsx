"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";
import type { Profile, SavedAddress } from "@home-chef/shared";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auth form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Address editing
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null | undefined>(undefined);
  const [addressLabel, setAddressLabel] = useState("");
  const [addressText, setAddressText] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const sb = getSupabaseClient();
    const { data } = await sb.auth.getSession();
    if (!data.session) {
      setLoading(false);
      return;
    }
    setUser(data.session.user);

    const { data: p } = await sb
      .from("profiles")
      .select("*")
      .eq("id", data.session.user.id)
      .single();
    setProfile(p);
    setName(p?.name || "");
    setPhone(p?.phone || "");

    const { data: addrs } = await sb
      .from("saved_addresses")
      .select("*")
      .eq("user_id", data.session.user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setAddresses(addrs || []);
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAuthLoading(true);
    const sb = getSupabaseClient();
    const fn = isSignUp
      ? sb.auth.signUp({ email, password })
      : sb.auth.signInWithPassword({ email, password });
    const { data, error: authErr } = await fn;
    if (authErr) {
      setError(authErr.message);
      setAuthLoading(false);
      return;
    }
    setUser(data.user);
    if (data.user) {
      await loadData();
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await getSupabaseClient().auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const sb = getSupabaseClient();
      const { error } = await sb
        .from("profiles")
        .update({
          name,
          phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, name, phone });
      setEditingProfile(false);
      alert("Profile updated successfully");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const startEditAddress = (address: SavedAddress | null) => {
    if (address) {
      setEditingAddress(address);
      setAddressLabel(address.label);
      setAddressText(address.address);
      setIsDefault(address.is_default);
    } else {
      setEditingAddress(null);
      setAddressLabel("");
      setAddressText("");
      setIsDefault(false);
    }
  };

  const saveAddress = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const sb = getSupabaseClient();
      if (editingAddress) {
        const { error } = await sb
          .from("saved_addresses")
          .update({
            label: addressLabel,
            address: addressText,
            is_default: isDefault,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingAddress.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from("saved_addresses").insert({
          user_id: profile.id,
          label: addressLabel,
          address: addressText,
          is_default: isDefault,
        });
        if (error) throw error;
      }

      await loadData();
      setEditingAddress(undefined);
      alert(`Address ${editingAddress ? "updated" : "added"} successfully`);
    } catch (err) {
      console.error("Error saving address:", err);
      alert("Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const sb = getSupabaseClient();
      const { error } = await sb
        .from("saved_addresses")
        .delete()
        .eq("id", addressId);

      if (error) throw error;

      await loadData();
      alert("Address deleted successfully");
    } catch (err) {
      console.error("Error deleting address:", err);
      alert("Failed to delete address");
    }
  };

  if (loading) return <main style={{ padding: 32 }}><p>Loading...</p></main>;

  if (!user)
    return (
      <main style={{ maxWidth: 440, margin: "60px auto", padding: 32 }}>
        <Link href="/dashboard" style={{ color: "#FF7A00", textDecoration: "none" }}>
          ← Back
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "16px 0 4px" }}>
          {isSignUp ? "Create Account" : "Sign In"}
        </h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
          Access your orders and account details
        </p>
        {error && (
          <div
            style={{
              padding: 12,
              background: "#ffebee",
              color: "#c62828",
              borderRadius: 6,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 12,
              border: "1px solid #ddd",
              borderRadius: 6,
              fontSize: 15,
              boxSizing: "border-box",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 16,
              border: "1px solid #ddd",
              borderRadius: 6,
              fontSize: 15,
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            disabled={authLoading}
            style={{
              width: "100%",
              padding: 13,
              background: "#FF7A00",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {authLoading ? "..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{
            marginTop: 12,
            background: "none",
            border: "none",
            color: "#FF7A00",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "No account? Create one"}
        </button>
      </main>
    );

  return (
    <main style={{ maxWidth: 700, margin: "0 auto", padding: 32 }}>
      <Link href="/dashboard" style={{ color: "#FF7A00", textDecoration: "none" }}>
        ← Back
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: "16px 0 24px" }}>
        My Account
      </h1>

      {/* Profile Section */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Profile Information</h2>
          {!editingProfile && (
            <button
              onClick={() => setEditingProfile(true)}
              style={{
                background: "none",
                border: "none",
                color: "#FF7A00",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Edit
            </button>
          )}
        </div>
        <div style={{ background: "#f8f8f8", borderRadius: 10, padding: 24 }}>
          <InfoRow label="Email" value={user.email ?? "—"} />
          {editingProfile ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    fontSize: 15,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone"
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    fontSize: 15,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    setEditingProfile(false);
                    setName(profile?.name || "");
                    setPhone(profile?.phone || "");
                  }}
                  style={{
                    flex: 1,
                    padding: 10,
                    background: "white",
                    color: "#666",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: 10,
                    background: "#FF7A00",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          ) : (
            <>
              <InfoRow label="Name" value={name || "Not set"} />
              <InfoRow label="Phone" value={phone || "Not set"} />
            </>
          )}
        </div>
      </section>

      {/* Saved Addresses Section */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Saved Addresses</h2>
          <button
            onClick={() => startEditAddress(null)}
            style={{
              background: "none",
              border: "none",
              color: "#FF7A00",
              cursor: "pointer",
              fontSize: 24,
              lineHeight: "20px",
            }}
          >
            +
          </button>
        </div>

        {addresses.map((addr) => (
          <div
            key={addr.id}
            style={{
              background: "#f8f8f8",
              borderRadius: 10,
              padding: 20,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 16 }}>{addr.label}</strong>
                {addr.is_default && (
                  <span
                    style={{
                      background: "#FF7A00",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Default
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => startEditAddress(addr)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#FF7A00",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteAddress(addr.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#f44336",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            <p style={{ color: "#666", margin: 0 }}>{addr.address}</p>
          </div>
        ))}

        {addresses.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
            <p>No saved addresses</p>
          </div>
        )}

        {/* Address Form */}
        {editingAddress !== undefined && (
          <div
            style={{
              background: "#f8f8f8",
              borderRadius: 10,
              padding: 24,
              marginTop: 16,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              {editingAddress ? "Edit Address" : "New Address"}
            </h3>
            <input
              type="text"
              value={addressLabel}
              onChange={(e) => setAddressLabel(e.target.value)}
              placeholder="Label (e.g., Home, Work)"
              style={{
                width: "100%",
                padding: 12,
                marginBottom: 12,
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 15,
                boxSizing: "border-box",
              }}
            />
            <textarea
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="Address"
              rows={3}
              style={{
                width: "100%",
                padding: 12,
                marginBottom: 12,
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 15,
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <label style={{ display: "flex", alignItems: "center", marginBottom: 16, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                style={{ marginRight: 8, cursor: "pointer" }}
              />
              <span>Set as default address</span>
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setEditingAddress(undefined)}
                style={{
                  flex: 1,
                  padding: 10,
                  background: "white",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveAddress}
                disabled={saving || !addressLabel || !addressText}
                style={{
                  flex: 1,
                  padding: 10,
                  background: "#FF7A00",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Navigation Links */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Link href="/orders">
          <button style={navBtn}>My Orders</button>
        </Link>
        <Link href="/chefs">
          <button style={navBtn}>Browse Chefs</button>
        </Link>
        <button
          onClick={handleSignOut}
          style={{
            ...navBtn,
            background: "#fff",
            color: "#f44336",
            border: "1px solid #f44336",
          }}
        >
          Sign Out
        </button>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: 15 }}>{value}</div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: "100%",
  padding: "13px 20px",
  background: "#FF7A00",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  textAlign: "left",
};
