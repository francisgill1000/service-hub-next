import api from './api';

export type AssistantTurn = { role: 'user' | 'assistant'; content: string };
export type AssistantReply = {
  transcript: string;
  reply_text: string;
  reply_audio_url: string | null;
  history: AssistantTurn[];
};

export async function postText(text: string, history: AssistantTurn[]): Promise<AssistantReply> {
  const { data } = await api.post('/shop/assistant/text', { text, history });
  return data;
}

export async function postVoice(audio: Blob, history: AssistantTurn[]): Promise<AssistantReply> {
  const form = new FormData();
  const ext = audio.type.includes('ogg') ? 'ogg' : audio.type.includes('mp4') ? 'mp4' : 'webm';
  form.append('audio', audio, `voice.${ext}`);
  form.append('history', JSON.stringify(history));
  const { data } = await api.post('/shop/assistant/voice', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
