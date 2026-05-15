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
    <div className="min-h-screen bg-brand-bg text-brand-text pb-28 md:pb-10">
      <div className="w-full px-4 md:px-6 pt-6 md:pt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-brand-text tracking-tight">Staff</h2>
            <p className="text-brand-muted font-semibold mt-1 text-sm">
              {staff.length > 0
                ? `${staff.length} member${staff.length !== 1 ? "s" : ""} on the team.`
                : "Add the people who handle bookings."}
            </p>
          </div>
        </div>

        {/* Add form */}
        <form
          onSubmit={addStaff}
          className="bg-brand-surface rounded-2xl p-5 md:p-6 border border-brand-border/20 space-y-3"
        >
          <label className="block text-[11px] font-black uppercase tracking-widest text-brand-muted">
            Add new staff
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Staff name (e.g. Ali)"
              className="flex-1 min-w-0 h-14 bg-brand-bg border border-brand-border/40 rounded-xl px-5 text-base font-semibold text-brand-text placeholder:text-brand-muted focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/40 outline-none"
            />
            <button
              type="submit"
              disabled={adding || !newName.trim()}
              className="h-14 px-6 rounded-xl bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-muted disabled:opacity-70 text-base font-black text-white whitespace-nowrap shrink-0 transition-all"
            >
              {adding ? "Adding…" : "Add staff"}
            </button>
          </div>
        </form>

        {/* List */}
        <div className="bg-brand-elevated rounded-xl border border-brand-border/20 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-brand-muted text-sm font-semibold">Loading…</div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-center text-brand-muted text-sm font-semibold">
              No staff yet. Add one above.
            </div>
          ) : (
            <ul className="divide-y divide-brand-border/10">
              {staff.map((s) => (
                <li
                  key={s.id}
                  className="px-4 sm:px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-brand-hover flex items-center justify-center font-bold text-sm text-brand-primary shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </div>

                    {editingId === s.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(s.id)}
                        autoFocus
                        className="flex-1 min-w-0 h-9 bg-brand-bg border border-brand-border/40 rounded-lg px-3 text-sm font-semibold text-brand-text"
                      />
                    ) : (
                      <p className="flex-1 min-w-0 truncate text-sm font-bold text-brand-text">{s.name}</p>
                    )}

                    <span
                      className={`shrink-0 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${
                        s.is_active
                          ? "bg-brand-success/15 text-brand-success border border-brand-success/20"
                          : "bg-brand-border/40 text-brand-muted border border-brand-border/30"
                      }`}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex gap-2 justify-end sm:justify-start shrink-0">
                    {editingId === s.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(s.id)}
                          disabled={busyRow === s.id}
                          className="h-8 px-3 rounded-lg bg-brand-primary text-[11px] font-black text-white whitespace-nowrap"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="h-8 px-3 rounded-lg bg-brand-hover text-[11px] font-black text-brand-text whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(s)}
                          className="h-8 px-3 rounded-lg bg-brand-hover text-[11px] font-black text-brand-text hover:bg-brand-border whitespace-nowrap"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(s)}
                          disabled={busyRow === s.id}
                          className={`h-8 px-3 rounded-lg text-[11px] font-black whitespace-nowrap ${
                            s.is_active
                              ? "bg-brand-border/40 text-brand-muted hover:bg-brand-border"
                              : "bg-brand-success/20 text-brand-success hover:bg-brand-success/30"
                          }`}
                        >
                          {s.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
