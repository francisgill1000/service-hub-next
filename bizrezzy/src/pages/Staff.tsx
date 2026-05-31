import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Icons } from '@/components/Icons';
import { useShop } from '@/context/ShopContext';
import { getStaff, addStaff, updateStaff } from '@/lib/shops';
import type { StaffMember } from '@/types';

export default function Staff() {
  const navigate = useNavigate();
  const { shop } = useShop();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchStaff = useCallback(async () => {
    if (!shop?.id) return;
    setLoading(true);
    try {
      setStaff(await getStaff(shop.id));
    } catch {
      setError('Could not load staff.');
    } finally {
      setLoading(false);
    }
  }, [shop?.id]);

  useEffect(() => { void fetchStaff(); }, [fetchStaff]);

  const handleAdd = async () => {
    if (!newName.trim() || !shop?.id) return;
    setAdding(true);
    setError('');
    try {
      const member = await addStaff(shop.id, newName.trim());
      setStaff((prev) => [...prev, member]);
      setNewName('');
    } catch {
      setError('Failed to add staff.');
    } finally {
      setAdding(false);
    }
  };

  const rename = async (member: StaffMember) => {
    if (!shop?.id) return;
    const val = window.prompt(`Update name for ${member.name}`, member.name);
    if (!val?.trim() || val.trim() === member.name) return;
    setBusyId(member.id);
    try {
      const updated = await updateStaff(shop.id, member.id, { name: val.trim() });
      setStaff((prev) => prev.map((s) => (s.id === member.id ? updated : s)));
    } catch {
      setError('Could not rename staff.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (member: StaffMember) => {
    if (!shop?.id) return;
    setBusyId(member.id);
    try {
      const updated = await updateStaff(shop.id, member.id, { is_active: !member.is_active });
      setStaff((prev) => prev.map((s) => (s.id === member.id ? updated : s)));
    } catch {
      setError('Could not update staff.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="m-screen"><div className="m-scroll">
      <button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={16} /> Back</button>
      <h1 className="c-auth-title" style={{ textAlign: 'left', margin: '0 16px 16px' }}>Staff</h1>

      {error && <div className="c-error-box">{error}</div>}

      <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
        <div className="c-input-row" style={{ flex: 1, margin: 0 }}>
          <input type="text" placeholder="New staff name" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); }} />
        </div>
        <button className="c-btn" disabled={adding || !newName.trim()} onClick={() => void handleAdd()}>
          {adding ? 'Adding…' : 'Add'}
        </button>
      </div>

      {loading ? (
        <Spinner label="Loading staff…" />
      ) : staff.length > 0 ? (
        <div className="c-card" style={{ padding: '0 16px' }}>
          {staff.map((m) => (
            <div key={m.id} className="c-list-row">
              <div className="c-avatar" style={{ width: 40, height: 40, fontSize: 16, margin: 0, borderRadius: 12 }}>
                {(m.name || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="c-row-title">{m.name}</div>
                <span className={m.is_active !== false ? 'c-chip c-chip-completed' : 'c-chip c-chip-cancelled'}>
                  {m.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              <button className="c-icon-btn" aria-label="Rename" disabled={busyId === m.id} onClick={() => void rename(m)}>
                <Icons.User size={16} />
              </button>
              <button className="c-btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} disabled={busyId === m.id} onClick={() => void toggleActive(m)}>
                {m.is_active !== false ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No staff yet" subtitle="Add your team members to assign them to bookings." />
      )}
    </div></div>
  );
}
