export const SUPPORT_WHATSAPP_NUMBER = '971557369629';
export const SUPPORT_WHATSAPP_MESSAGE = 'Hi Rezzy team, I need some help.';

export function openWhatsAppSupport(message = SUPPORT_WHATSAPP_MESSAGE) {
  if (typeof window === 'undefined') return;
  const number = SUPPORT_WHATSAPP_NUMBER.replace(/[^0-9]/g, '');
  const text = encodeURIComponent(message);
  const url = `https://wa.me/${number}?text=${text}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
