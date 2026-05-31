import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '@/components/Icons';
import { useShop } from '@/context/ShopContext';
import { updateShop } from '@/lib/shops';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

type Row = { day: string; day_of_week: number; is_open: boolean; start_time: string; end_time: string };

function buildRows(workingHours: Array<{ day_of_week?: number; day?: string; start_time?: string; end_time?: string }>): Row[] {
  return DAYS.map((day, i) => {
    const dayNum = i + 1;
    const found = workingHours.find((d) => d.day_of_week === dayNum || d.day?.toLowerCase() === day.toLowerCase());
    return found
      ? { day, day_of_week: dayNum, is_open: true, start_time: found.start_time || '09:00', end_time: found.end_time || '18:00' }
      : { day, day_of_week: dayNum, is_open: false, start_time: '09:00', end_time: '18:00' };
  });
}

export default function WorkingHours() {
  const navigate = useNavigate();
  const { shop, token, loginShop } = useShop();
  const [rows, setRows] = useState<Row[]>(buildRows([]));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const data = (shop?.working_hours as Array<{ day_of_week?: number; day?: string; start_time?: string; end_time?: string }>) || [];
    if (data.length > 0) setRows(buildRows(data));
  }, [shop]);

  const updateDay = (index: number, key: keyof Row, value: Row[keyof Row]) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  };

  const handleSave = async () => {
    if (!shop?.id) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const working_hours = rows
        .filter((r) => r.is_open)
        .map((r) => ({ day_of_week: r.day_of_week, start_time: r.start_time, end_time: r.end_time, slot_duration: 30 }));
      const updated = await updateShop(shop.id, { working_hours } as { working_hours: typeof working_hours });
      if (updated && token) loginShop(updated, token);
      setMessage('Working hours updated.');
    } catch (e: unknown) {
      const d = (e as { response?: { data?: { message?: string } } })?.response?.data;
      setError(d?.message || 'Failed to save working hours.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="m-screen"><div className="m-scroll">
      <button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={16} /> Back</button>
      <h1 className="c-auth-title" style={{ textAlign: 'left', margin: '0 16px 16px' }}>Working Hours</h1>

      {error && <div className="c-error-box">{error}</div>}
      {message && <div className="c-card" style={{ color: 'var(--mint-300)' }}>{message}</div>}

      <div className="c-card">
        {rows.map((r, i) => (
          <div key={r.day} className="c-day-row">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, width: 130 }}>
              <input type="checkbox" checked={r.is_open} onChange={(e) => updateDay(i, 'is_open', e.target.checked)} />
              <span className="c-day-name" style={{ width: 'auto' }}>{r.day}</span>
            </label>
            {r.is_open ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <select className="c-time-input" value={r.start_time} onChange={(e) => updateDay(i, 'start_time', e.target.value)} aria-label={`${r.day} open`}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span style={{ color: 'var(--text-3)' }}>–</span>
                <select className="c-time-input" value={r.end_time} onChange={(e) => updateDay(i, 'end_time', e.target.value)} aria-label={`${r.day} close`}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ) : (
              <span className="c-row-sub" style={{ marginLeft: 'auto' }}>Closed</span>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: '0 16px' }}>
        <button className="c-btn c-btn-block" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Saving…' : 'Save Working Hours'}
        </button>
      </div>
    </div></div>
  );
}
