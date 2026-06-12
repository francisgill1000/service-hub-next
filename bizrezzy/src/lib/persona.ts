import api from './api';

export type PersonaInfo = {
  persona: string | null;
  default_prompt: string;
  effective_prompt: string;
  using_custom: boolean;
  /** Live services/prices/hours — appended automatically to every reply. */
  business_facts: string;
};

/** The shop's AI assistant system prompt (drives WhatsApp + Live Chat replies). */
export async function getPersona(): Promise<PersonaInfo> {
  const { data } = await api.get('/shop/persona');
  return data;
}

/** Save a custom persona; pass empty/null to reset to the category default. */
export async function savePersona(persona: string | null): Promise<PersonaInfo> {
  const { data } = await api.put('/shop/persona', { persona });
  return data;
}
