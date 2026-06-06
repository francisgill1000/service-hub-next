import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '@/layout/AppBar';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Icons } from '@/components/Icons';
import { listCatalogs, deleteCatalog } from '@/lib/catalogs';
import type { Service } from '@/types';

export default function Services() {
  const navigate = useNavigate();
  const [catalogs, setCatalogs] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchCatalogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCatalogs(await listCatalogs());
    } catch {
      setError('Could not load services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchCatalogs(); }, [fetchCatalogs]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this service? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteCatalog(id);
      setCatalogs((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError('Failed to delete service.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="m-screen">
      <AppBar
        title="Services"
        actions={<button className="c-btn" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => navigate('/services/new')}>+ Add</button>}
      />
      <div className="m-scroll">
        {error && <div className="c-error-box">{error}</div>}

        {loading ? (
          <Spinner label="Loading services…" />
        ) : catalogs.length > 0 ? (
          catalogs.map((c) => (
            <div key={c.id} className="c-svc-card">
              <div className="c-svc-media">
                {c.image ? (
                  <img src={c.image} alt={c.title || c.name || 'Service'} />
                ) : (
                  <div className="c-svc-media-empty"><Icons.Image size={28} /><span>No image</span></div>
                )}
                <span className="c-svc-price">AED {Number(c.price ?? 0).toFixed(2)}</span>
              </div>
              <div className="c-svc-body">
                <div className="c-row-title">{c.title || c.name}</div>
                <div className="c-row-sub">{c.description || 'No description provided.'}</div>
              </div>
              <div className="c-svc-actions">
                <button className="c-btn-ghost" onClick={() => navigate(`/services/${c.id}/edit`)}>
                  <Icons.Edit size={14} /> Edit
                </button>
                <button className="c-btn-ghost" style={{ color: 'var(--danger)' }} disabled={deletingId === c.id} onClick={() => void handleDelete(c.id)}>
                  <Icons.Trash size={14} /> {deletingId === c.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No services yet"
            subtitle="Add the services your business offers."
            action={<button className="c-btn" onClick={() => navigate('/services/new')}>Add a Service</button>}
          />
        )}
      </div>
    </div>
  );
}
