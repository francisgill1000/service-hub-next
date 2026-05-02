"use client";

import React, { useState, useEffect } from "react";
import api from "@/utils/api";
import { useShop } from "@/context/ShopContext";
import { notify } from "@/utils/alerts";

export default function StaffList() {
  const { shop } = useShop();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [busyRow, setBusyRow] = useState(null);

  useEffect(() => {
    if (shop?.id) fetchStaff();
  }, [shop?.id]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/shops/${shop.id}/staff`);
      setStaff(data.data || []);
    } catch (e) {
      console.error("Error fetching staff:", e);
      await notify({ icon: "error", title: "Error", text: "Failed to load staff" });
    } finally {
      setLoading(false);
    }
  };

  const addStaff = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const { data } = await api.post(`/shops/${shop.id}/staff`, { name: newName.trim() });
      setStaff((s) => [...s, data.data]);
      setNewName("");
    } catch (e) {
      await notify({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Could not add staff",
      });
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditingName(s.name);
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) return;
    setBusyRow(id);
    try {
      const { data } = await api.put(`/shops/${shop.id}/staff/${id}`, {
        name: editingName.trim(),
      });
      setStaff((s) => s.map((x) => (x.id === id ? data.data : x)));
      setEditingId(null);
    } catch (e) {
      await notify({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Could not save",
      });
    } finally {
      setBusyRow(null);
    }
  };

  const toggleActive = async (s) => {
    setBusyRow(s.id);
    try {
      const { data } = await api.put(`/shops/${shop.id}/staff/${s.id}`, {
        is_active: !s.is_active,
      });
      setStaff((arr) => arr.map((x) => (x.id === s.id ? data.data : x)));
    } catch (e) {
      await notify({
        icon: "error",
        title: "Error",
        text: e?.response?.data?.message || "Could not toggle",
      });
    } finally {
      setBusyRow(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d141d] text-[#dce3f0] pb-28 md:pb-10">
      <div className="w-full px-4 md:px-6 pt-6 md:pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Staff</h2>
            <p className="text-[#8b90a0] font-semibold mt-1 text-sm">
              {staff.length > 0
                ? `${staff.length} member${staff.length !== 1 ? "s" : ""} on the team.`
                : "Add the people who handle bookings."}
            </p>
          </div>
        </div>

        {/* Add form */}
        <form
          onSubmit={addStaff}
          className="bg-[#151c25] rounded-xl p-4 md:p-5 border border-[#414755]/20 flex gap-3"
        >
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New staff name (e.g. Ali)"
            className="flex-1 h-11 bg-[#080f17] border border-[#414755]/40 rounded-xl px-4 text-sm font-semibold text-white placeholder:text-[#8b90a0] focus:ring-2 focus:ring-[#4b8eff]/20 focus:border-[#4b8eff]/40 outline-none"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="h-11 px-4 rounded-xl bg-[#4b8eff] hover:bg-[#4b8eff]/90 disabled:opacity-50 text-sm font-black text-white"
          >
            {adding ? "Adding…" : "Add staff"}
          </button>
        </form>

        {/* List */}
        <div className="bg-[#19202a] rounded-xl border border-[#414755]/20 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#8b90a0] text-sm font-semibold">Loading…</div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-center text-[#8b90a0] text-sm font-semibold">
              No staff yet. Add one above.
            </div>
          ) : (
            <ul className="divide-y divide-[#414755]/10">
              {staff.map((s) => (
                <li key={s.id} className="px-5 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2e353f] flex items-center justify-center font-bold text-sm text-[#4b8eff] shrink-0">
                    {s.name.charAt(0).toUpperCase()}
                  </div>

                  {editingId === s.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(s.id)}
                      autoFocus
                      className="flex-1 h-9 bg-[#080f17] border border-[#414755]/40 rounded-lg px-3 text-sm font-semibold text-white"
                    />
                  ) : (
                    <p className="flex-1 text-sm font-bold text-white">{s.name}</p>
                  )}

                  <span
                    className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${
                      s.is_active
                        ? "bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/20"
                        : "bg-[#414755]/40 text-[#8b90a0] border border-[#414755]/30"
                    }`}
                  >
                    {s.is_active ? "Active" : "Inactive"}
                  </span>

                  {editingId === s.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(s.id)}
                        disabled={busyRow === s.id}
                        className="h-8 px-3 rounded-lg bg-[#4b8eff] text-[11px] font-black text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="h-8 px-3 rounded-lg bg-[#2e353f] text-[11px] font-black text-[#dce3f0]"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(s)}
                        className="h-8 px-3 rounded-lg bg-[#2e353f] text-[11px] font-black text-[#dce3f0] hover:bg-[#414755]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(s)}
                        disabled={busyRow === s.id}
                        className={`h-8 px-3 rounded-lg text-[11px] font-black ${
                          s.is_active
                            ? "bg-[#414755]/40 text-[#8b90a0] hover:bg-[#414755]"
                            : "bg-[#4edea3]/20 text-[#4edea3] hover:bg-[#4edea3]/30"
                        }`}
                      >
                        {s.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
