import { Alert, Linking } from 'react-native';

// Edit these to change the support destination across the app.
export const SUPPORT_WHATSAPP_NUMBER = '971557369629'; // country code + number, no '+' or spaces
export const SUPPORT_WHATSAPP_MESSAGE = 'Hi Rezzy team, I need some help.';

export async function openWhatsAppSupport(message = SUPPORT_WHATSAPP_MESSAGE) {
  const number = SUPPORT_WHATSAPP_NUMBER.replace(/[^0-9]/g, '');
  const text = encodeURIComponent(message);
  const appUrl = `whatsapp://send?phone=${number}&text=${text}`;
  const webUrl = `https://wa.me/${number}?text=${text}`;

  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    await Linking.openURL(canOpen ? appUrl : webUrl);
  } catch (err) {
    Alert.alert('Unable to open WhatsApp', 'Please install WhatsApp or contact us directly.');
  }
}
