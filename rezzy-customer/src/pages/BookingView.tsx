import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import type { Booking } from '@/types';
import { Spinner } from '@/components/Spinner';
import { Icons } from '@/components/Icons';

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'completed') return 'completed';
  if (s === 'cancelled') return 'cancelled';
  return 'booked';
}

export default function BookingView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/booking/${id}`)
      .then((res) => setBooking(res.data?.data ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="m-screen"><Spinner /></div>;
  if (!booking) return (
    <div className="m-screen">
      <div className="m-appbar"><button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={18} /> Back</button></div>
      <div className="m-scroll"><p style={{ textAlign: 'center', color: 'var(--text-3)' }}>Booking not found.</p></div>
    </div>
  );

  const status = String(booking.status || 'Booked');
  const cls = statusClass(status);
  const ref = booking.booking_reference || `BK${String(booking.id).padStart(5, '0')}`;
  const services = booking.services ?? [];

  return (
    <div className="m-screen">
      <div className="m-appbar"><button className="c-back" onClick={() => navigate(-1)}><Icons.ChevronLeft size={18} /> Back</button></div>
      <div className="m-scroll">
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, margin: '0 auto 12px', display: 'grid', placeItems: 'center', background: 'var(--mint-soft)', color: 'var(--mint-300)' }}>
            <Icons.Check size={40} />
          </div>
          <h2 style={{ margin: 0 }}>{cls === 'booked' ? 'Booking Confirmed!' : status}</h2>
          <p style={{ color: 'var(--text-3)', margin: '4px 0' }}>#{ref}</p>
          <span className={`c-status ${cls}`}>{status}</span>
        </div>

        <div className="c-card">
          <h3 style={{ margin: '0 0 8px' }}>{booking.shop?.name || 'Shop'}</h3>
          {booking.shop?.location && <p style={{ color: 'var(--text-3)', fontSize: 13, margin: 0 }}>{booking.shop.location}</p>}
        </div>

        <div className="c-card">
          <div className="c-field-label" style={{ margin: '0 0 8px' }}>Appointment details</div>
          <div className="c-row"><span className="k">Customer</span><span className="v">{booking.customer?.name || booking.customer_name || 'Guest'}</span></div>
          <div className="c-row"><span className="k">Date</span><span className="v">{booking.show_date || booking.date}</span></div>
          <div className="c-row"><span className="k">Time</span><span className="v">{booking.start_time ? `${booking.start_time}${booking.end_time ? ` – ${booking.end_time}` : ''}` : 'TBD'}</span></div>
        </div>

        {services.length > 0 && (
          <div className="c-card">
            <div className="c-field-label" style={{ margin: '0 0 8px' }}>Services booked</div>
            {services.map((s, i) => (
              <div key={i} className="c-row"><span className="k">{s.title || s.name}</span><span className="v">AED {parseFloat(String(s.price ?? 0)).toFixed(2)}</span></div>
            ))}
            <div className="c-row" style={{ borderTop: '1px solid var(--border-3)' }}>
              <span className="k" style={{ fontWeight: 700, color: 'var(--text-1)' }}>Total</span>
              <span className="v" style={{ color: 'var(--mint-300)', fontSize: 16 }}>AED {Number(booking.charges || 0).toFixed(2)}</span>
            </div>
          </div>
        )}

        <button className="c-btn c-btn-block" style={{ margin: '8px 16px 24px', width: 'calc(100% - 32px)' }} onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
