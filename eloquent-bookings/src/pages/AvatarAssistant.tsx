import { useNavigate, useParams } from 'react-router-dom';
import { Icons } from '@/components/Icons';

/**
 * The LiveAvatar hosted embed — a self-contained, voice-driven AI avatar
 * (its own AI brain + microphone, configured in the LiveAvatar dashboard).
 * It is separate from the text Live Chat. Shown full-screen on its own route.
 */
const AVATAR_EMBED_URL =
  'https://embed.liveavatar.com/v1/1ce0277e-a403-4fd7-9666-d329893021d3?orientation=vertical';

export default function AvatarAssistant() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="m-screen c-avatar-screen">
      <div className="m-appbar">
        <button className="c-back" onClick={() => navigate(`/shop/${id}`)}>
          <Icons.ChevronLeft size={18} /> Back
        </button>
        <span className="c-avatar-title">AI assistant</span>
      </div>
      <div className="c-avatar-stage">
        <iframe
          className="c-avatar-frame"
          src={AVATAR_EMBED_URL}
          allow="microphone"
          title="AI assistant"
        />
      </div>
    </div>
  );
}
