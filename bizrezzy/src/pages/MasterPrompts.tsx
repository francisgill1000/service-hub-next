import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/Spinner';
import { EmptyState } from '@/components/EmptyState';
import { Icons } from '@/components/Icons';
import { useShop } from '@/context/ShopContext';
import {
  getBotPrompts,
  createBotPrompt,
  updateBotPrompt,
  activateBotPrompt,
  deleteBotPrompt,
} from '@/lib/botPrompts';
import type { BotPrompt } from '@/types';

export default function MasterPrompts() {
  const navigate = useNavigate();
  const { shop } = useShop();
  const [prompts, setPrompts] = useState<BotPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  // add form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBody, setNewBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState('');

  // inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editBody, setEditBody] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const refresh = async () => {
    const list = await getBotPrompts();
    setPrompts(list);
  };

  useEffect(() => {
    if (shop && !shop.is_master) { navigate('/'); return; }
    let alive = true;
    getBotPrompts()
      .then((list) => { if (alive) setPrompts(list); })
      .catch(() => { if (alive) setError('Could not load prompts.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [shop, navigate]);

  const handleActivate = async (p: BotPrompt) => {
    setBusyId(p.id);
    try {
      await activateBotPrompt(p.id);
      await refresh();
    } catch {
      setError('Could not switch the active prompt.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (p: BotPrompt) => {
    setBusyId(p.id);
    try {
      await deleteBotPrompt(p.id);
      await refresh();
    } catch {
      setError('Could not delete that prompt.');
    } finally {
      setBusyId(null);
    }
  };

  const handleStartEdit = (p: BotPrompt) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditBody(p.body || '');
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (editingId == null) return;
    if (!editName.trim()) { setEditError('A name is required.'); return; }
    if (!editBody.trim()) { setEditError('The prompt text is required.'); return; }
    setSavingEdit(true);
    setEditError('');
    try {
      await updateBotPrompt(editingId, { name: editName.trim(), body: editBody.trim() });
      setEditingId(null);
      await refresh();
    } catch {
      setEditError('Could not save the changes.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) { setAddError('A name is required.'); return; }
    if (!newBody.trim()) { setAddError('The prompt text is required.'); return; }
    setSaving(true);
    setAddError('');
    try {
      await createBotPrompt({ name: newName.trim(), body: newBody.trim() });
      setNewName(''); setNewBody(''); setShowAdd(false);
      await refresh();
    } catch {
      setAddError('Could not save the prompt.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="m-screen"><div className="m-scroll">
      <div className="c-page-head" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingTop: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="c-page-title">Bot Prompts</h1>
          <p className="c-page-sub">Switch the sales number's persona for live testing. Only this number is affected.</p>
        </div>
        <button className="c-icon-btn" aria-label="Back to businesses" onClick={() => navigate('/master')}>
          <Icons.Check size={18} />
        </button>
      </div>

      {error && <div className="c-error-box">{error}</div>}

      <button className="c-btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: 'calc(100% - 32px)', margin: '0 16px 12px' }}
        onClick={() => { setShowAdd((v) => !v); setAddError(''); }}>
        <Icons.Plus size={15} /> {showAdd ? 'Cancel' : 'Add prompt'}
      </button>

      {showAdd && (
        <div className="c-master-card" style={{ marginBottom: 14 }}>
          {addError && <div className="c-error-box" style={{ margin: '0 0 12px' }}>{addError}</div>}

          <label className="c-field-label" htmlFor="bp-name">Prompt name</label>
          <div className="c-input-row" style={{ marginBottom: 12 }}>
            <input id="bp-name" type="text" placeholder="e.g. Salon" value={newName}
              onChange={(e) => { setNewName(e.target.value); setAddError(''); }} />
          </div>

          <label className="c-field-label" htmlFor="bp-body">Prompt text</label>
          <div className="c-input-row c-input-area" style={{ marginBottom: 14 }}>
            <textarea id="bp-body" rows={6} placeholder="You are a friendly salon booking assistant…" value={newBody}
              onChange={(e) => { setNewBody(e.target.value); setAddError(''); }} />
          </div>

          <button className="c-btn c-btn-block" disabled={saving} onClick={() => void handleCreate()}>
            {saving ? 'Saving…' : 'Save prompt'}
          </button>
        </div>
      )}

      {loading ? (
        <Spinner label="Loading prompts…" />
      ) : prompts.length === 0 ? (
        <EmptyState title="No prompts yet" />
      ) : (
        prompts.map((p) => (
          <div key={p.id} className="c-master-card">
            <div className="c-master-top">
              <span className="c-master-name">
                {p.name}
                {p.is_default && <em> · default</em>}
              </span>
              {p.is_active
                ? <span className="c-master-wa on"><Icons.Check size={13} /> Active</span>
                : (
                  <button className="c-btn-ghost" style={{ padding: '4px 12px' }}
                    aria-label={`Use ${p.name}`} disabled={busyId === p.id}
                    onClick={() => void handleActivate(p)}>
                    {busyId === p.id ? '…' : 'Use'}
                  </button>
                )}
            </div>

            {editingId === p.id ? (
              <div style={{ marginTop: 12 }}>
                {editError && <div className="c-error-box" style={{ margin: '0 0 12px' }}>{editError}</div>}

                <label className="c-field-label" htmlFor={`edit-name-${p.id}`}>Prompt name</label>
                <div className="c-input-row" style={{ marginBottom: 12 }}>
                  <input id={`edit-name-${p.id}`} type="text" value={editName}
                    onChange={(e) => { setEditName(e.target.value); setEditError(''); }} />
                </div>

                <label className="c-field-label" htmlFor={`edit-body-${p.id}`}>Prompt text</label>
                <div className="c-input-row c-input-area" style={{ marginBottom: 12 }}>
                  <textarea id={`edit-body-${p.id}`} rows={6} value={editBody}
                    onChange={(e) => { setEditBody(e.target.value); setEditError(''); }} />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="c-btn" style={{ flex: 1 }} disabled={savingEdit} onClick={() => void handleSaveEdit()}>
                    {savingEdit ? 'Saving…' : 'Save changes'}
                  </button>
                  <button className="c-btn-ghost" style={{ padding: '0 16px' }} onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {p.body && (
                  <div className="c-master-meta" style={{ display: 'block', whiteSpace: 'pre-wrap', opacity: 0.8 }}>
                    {p.body.length > 160 ? p.body.slice(0, 160) + '…' : p.body}
                  </div>
                )}

                {!p.is_default && (
                  <div className="c-master-meta" style={{ gap: 8 }}>
                    <button className="c-icon-btn" aria-label={`Edit ${p.name}`} disabled={busyId === p.id}
                      onClick={() => handleStartEdit(p)}>
                      <Icons.Edit size={14} />
                    </button>
                    <button className="c-icon-btn" aria-label={`Delete ${p.name}`} disabled={busyId === p.id}
                      onClick={() => void handleDelete(p)}>
                      <Icons.Trash size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))
      )}
    </div></div>
  );
}
