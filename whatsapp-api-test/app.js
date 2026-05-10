
require('dotenv').config();

const sendWhatsAppMessage = async () => {
  const url = 'https://graph.facebook.com/v25.0/1013905338482929/messages';
  
  // Replace this with the token from image_d5d21d.jpg

  const payload = {
    messaging_product: "whatsapp",
    to: "971554501483",
    type: "template",
    template: {
      name: "hello_world",
      language: {
        code: "en_US"
      }
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Meta API Error:', JSON.stringify(data, null, 2));
    } else {
      console.log('Message Sent Successfully:', data);
    }
  } catch (error) {
    console.error('Network or Script Error:', error);
  }
};

sendWhatsAppMessage();