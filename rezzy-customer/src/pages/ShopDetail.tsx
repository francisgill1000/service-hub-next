import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { toggleFavourite } from '@/lib/shops';
import { buildBookingPayload } from '@/lib/booking';
import { generateDates, formatLocalDate, dow } from '@/lib/date';
import type { Shop } from '@/types';
import { Spinner } from '@/components/Spinner';
import { Icons } from '@/components/Icons';

export default function ShopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dates = useMemo(() => generateDates(31), []);
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShop = async () => {
    try {
      const res = await api.get(`/shops/${id}`, { params: { date: formatLocalDate(selectedDate) } });
      const data: Shop = res.data?.data ?? res.data;
      if (data && !Array.isArray(data.catalogs)) data.catalogs = [];
      setShop(data);
    } catch { /* not found handled below */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchShop(); /* eslint-disable-next-line */ }, [id, selectedDate]);

  const total = useMemo(() => {
    if (!shop?.catalogs) return 0;
    return selectedServices.reduce((sum, sid) => {
      const s = shop.catalogs!.find((c) => c.id === sid);
      return sum + (s?.price != null ? parseFloat(String(s.price)) : 0);
    }, 0);
  }, [shop, selectedServices]);

  const toggleService = (sid: number) =>
    setSelectedServices((prev) => (prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid]));

  // The shop API exposes time slots for the chosen date; fall back to none.
  const slots: string[] = ((shop as unknown as { slots?: string[] })?.slots) ?? [];

  const handleBook = async () => {
    if (!shop || booking || !selectedTime) return;
    setBooking(true);
    setError(null);
    try {
      const payload = buildBookingPayload(formatLocalDate(selectedDate), selectedTime, shop.catalogs ?? [], selectedServices);
      const res = await api.post(`/shops/${shop.id}/book`, payload);
      const bookingId = res.data?.data?.id ?? res.data?.id;
      navigate(`/booking/${bookingId}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Something went wrong. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="m-screen"><Spinner /></div>;
  if (!shop) return (
    <div className="m-screen">
      <div className="m-appbar"><button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={18} /> Back</button></div>
      <div className="m-scroll"><p style={{ textAlign: 'center', color: 'var(--text-3)' }}>Business not found.</p></div>
    </div>
  );

  return (
    <div className="m-screen">
      <div className="m-appbar">
        <button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={18} /> Back</button>
        <span className="c-fav on" role="button" aria-label="Toggle favourite" onClick={() => void toggleFavourite(shop.id)}>
          <Icons.HeartFilled size={22} />
        </span>
      </div>

      <div className="m-scroll">
        {shop.hero_image || shop.logo
          ? <img src={shop.hero_image || shop.logo} alt="" style={{ width: 'calc(100% - 32px)', height: 180, objectFit: 'cover', borderRadius: 'var(--r-lg)', margin: '0 16px 12px' }} />
          : null}
        <h2 style={{ margin: '0 16px', fontSize: 22 }}>{shop.name}</h2>
        {shop.location && <p style={{ margin: '4px 16px 16px', color: 'var(--text-3)', fontSize: 13 }}>{shop.location}</p>}

        <div className="m-section-title" style={{ padding: '0 16px' }}><h3>Select date</h3></div>
        <div className="c-date-strip">
          {dates.map((d) => {
            const active = formatLocalDate(d) === formatLocalDate(selectedDate);
            return (
              <button key={formatLocalDate(d)} className={`c-date-cell ${active ? 'active' : ''}`} onClick={() => { setSelectedDate(d); setSelectedTime(''); }}>
                <div className="dow">{dow(d)}</div>
                <div className="dnum">{d.getDate()}</div>
              </button>
            );
          })}
        </div>

        {slots.length > 0 && (
          <>
            <div className="m-section-title" style={{ padding: '0 16px' }}><h3>Select time</h3></div>
            <div className="c-slot-grid">
              {slots.map((t) => (
                <button key={t} className={`c-slot ${selectedTime === t ? 'active' : ''}`} onClick={() => setSelectedTime(t)}>{t}</button>
              ))}
            </div>
          </>
        )}

        {(shop.catalogs?.length ?? 0) > 0 && (
          <>
            <div className="m-section-title" style={{ padding: '16px 16px 0' }}><h3>Services</h3></div>
            <div style={{ margin: '8px 16px', border: '1px solid var(--border-1)', borderRadius: 'var(--r-lg)', overflow: 'hidden' }}>
              {shop.catalogs!.map((s) => (
                <div key={s.id} className={`c-service ${selectedServices.includes(s.id) ? 'on' : ''}`} onClick={() => toggleService(s.id)}>
                  <span>{s.title || s.name}</span>
                  <span className="price">AED {parseFloat(String(s.price ?? 0)).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {error && <p className="c-error-box" style={{ margin: '0 16px 12px' }}>{error}</p>}
      </div>

      <div className="c-book-bar">
        <span className="total">AED {total.toFixed(2)}</span>
        <button className="c-btn c-btn-block" style={{ flex: 1 }} disabled={booking || !selectedTime} onClick={() => void handleBook()}>
          {booking ? 'Booking…' : 'Book Now'}
        </button>
      </div>
    </div>
  );
}
