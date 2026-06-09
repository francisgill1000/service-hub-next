import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/Spinner';
import { Icons } from '@/components/Icons';
import { getCatalog, createCatalog, updateCatalog } from '@/lib/catalogs';
import { fileToCompressedDataUrl } from '@/lib/image';

type Form = { title: string; description: string; price: string };

export default function ServiceEdit() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({ title: '', description: '', price: '' });
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const imageInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew) return;
    getCatalog(Number(id))
      .then((d) => {
        setForm({ title: d.title || d.name || '', description: d.description || '', price: String(d.price ?? '') });
        if (d.image) setImage(d.image);
      })
      .catch(() => setError('Failed to load service.'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const change = (key: keyof Form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Please enter a service title.'); return; }
    if (!form.description.trim()) { setError('Please enter a service description.'); return; }
    if (!form.price || parseFloat(form.price) <= 0) { setError('Please enter a valid price.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: form.price,
      };
      if (image && image.startsWith('data:')) payload.image = image;
      if (isNew) await createCatalog(payload);
      else await updateCatalog(Number(id), payload);
      navigate('/services');
    } catch (e: unknown) {
      const d = (e as { response?: { data?: { message?: string } } })?.response?.data;
      setError(d?.message || 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="m-screen"><Spinner label="Loading service…" /></div>;

  return (
    <div className="m-screen"><div className="m-scroll">
      <button className="c-back" onClick={() => navigate('/services')}><Icons.ChevronLeft size={16} /> Back</button>
      <h1 className="c-auth-title" style={{ textAlign: 'left', margin: '0 16px 16px' }}>{isNew ? 'Add Service' : 'Edit Service'}</h1>

      {error && <div className="c-error-box">{error}</div>}

      <div style={{ padding: '0 16px' }}>
        <label className="c-field-label" htmlFor="image">Image</label>
        <button type="button" className="c-img-pick" onClick={() => imageInput.current?.click()}>
          {image ? (
            <img src={image} alt="Service" />
          ) : (
            <span className="c-img-pick-empty">
              <span className="ic"><Icons.Image size={26} /></span>
              <span className="t">Upload service image</span>
              <span className="h">PNG or JPG</span>
            </span>
          )}
        </button>
        <input id="image" ref={imageInput} type="file" accept="image/*" hidden
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImage(await fileToCompressedDataUrl(f, { maxDim: 1280 })); }} />

        <label className="c-field-label" htmlFor="title">Title</label>
        <div className="c-input-row">
          <input id="title" type="text" placeholder="Service title" value={form.title}
            onChange={(e) => { change('title', e.target.value); setError(''); }} />
        </div>

        <label className="c-field-label" htmlFor="description">Description</label>
        <div className="c-input-row" style={{ alignItems: 'flex-start' }}>
          <textarea id="description" rows={3} placeholder="Describe this service" value={form.description}
            onChange={(e) => { change('description', e.target.value); setError(''); }}
            style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-1)', resize: 'vertical', font: 'inherit' }} />
        </div>

        <label className="c-field-label" htmlFor="price">Price (AED)</label>
        <div className="c-input-row">
          <input id="price" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={form.price}
            onChange={(e) => { change('price', e.target.value); setError(''); }} />
        </div>

        <button className="c-btn c-btn-block" disabled={saving} onClick={() => void handleSave()}>
          {saving ? 'Saving…' : isNew ? 'Create Service' : 'Save Changes'}
        </button>
      </div>
    </div></div>
  );
}
