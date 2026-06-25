"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Key } from "lucide-react";

const ROLES = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Super Admin" },
];

interface AppUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
}

export default function KullanicilarPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [saving, setSaving] = useState(false);
  const [editingPw, setEditingPw] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleAdd() {
    if (!newEmail || !newPassword) { alert("E-posta ve şifre zorunludur"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); setSaving(false); return; }
    setShowAdd(false);
    setNewEmail(""); setNewPassword(""); setNewRole("user");
    setSaving(false);
    fetchUsers();
  }

  async function handleRoleChange(id: string, role: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  }

  async function handlePasswordChange(id: string) {
    if (!newPw) { alert("Yeni şifre girin"); return; }
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPw }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    setEditingPw(null);
    setNewPw("");
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`"${email}" kullanıcısını silmek istiyor musunuz?\nBu işlem geri alınamaz.`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  function roleBadge(role: string) {
    if (role === "superadmin") return "bg-purple-100 text-purple-700 border-purple-200";
    if (role === "admin") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-gray-100 text-gray-600 border-gray-200";
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kullanıcı Yönetimi</h2>
          <p className="text-gray-500 text-sm mt-1">Kullanıcı ekle/sil, rol ve şifre yönetimi</p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition"
        >
          <Plus size={16} />
          Kullanıcı Ekle
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Yeni Kullanıcı</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">E-posta</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Şifre</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Rol</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="bg-gray-900 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {saving ? "Ekleniyor..." : "Ekle"}
            </button>
            <button onClick={() => setShowAdd(false)} className="text-sm text-gray-500 px-4">İptal</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Yükleniyor...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">E-posta</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Rol</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Kayıt</th>
                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Son Giriş</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4 font-medium text-gray-800 truncate max-w-[200px]">
                    {user.email}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`text-xs font-medium border px-2.5 py-1 rounded-full focus:outline-none cursor-pointer ${roleBadge(user.role)}`}
                    >
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {new Date(user.created_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString("tr-TR")
                      : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {editingPw === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="password"
                            value={newPw}
                            onChange={(e) => setNewPw(e.target.value)}
                            placeholder="Yeni şifre"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handlePasswordChange(user.id)}
                            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handlePasswordChange(user.id)}
                            className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => { setEditingPw(null); setNewPw(""); }}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingPw(user.id)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition"
                          title="Şifre değiştir"
                        >
                          <Key size={13} />
                          Şifre
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.id, user.email ?? "")}
                        className="text-gray-300 hover:text-red-500 transition"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">Kullanıcı bulunamadı.</p>
          )}
        </div>
      )}
    </div>
  );
}
