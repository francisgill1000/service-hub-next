import { useState } from 'react';
import { Icons } from '@/components/Icons';
import { VoiceAssistantPanel } from './VoiceAssistantPanel';

export function VoiceAssistantFab() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="va-fab" aria-label="Voice assistant" onClick={() => setOpen(true)}>
        <Icons.Mic size={22} />
      </button>
      {open && <VoiceAssistantPanel onClose={() => setOpen(false)} />}
    </>
  );
}
