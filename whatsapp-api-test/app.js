const sendWhatsAppMessage = async () => {
  const url = 'https://graph.facebook.com/v25.0/1013905338482929/messages';
  
  // Replace this with the token from image_d5d21d.jpg
  const accessToken = 'EAAPzxLWBXaUBRddHXIxoHrTNYUaBSFtiS9QTZA4bqlpe5PAjGGMJtJuOv1Yeix8njWXkkbwUdMZBGvNiASsRD9vgYfjQ6fLgNEaYvAqqhiWlapivRIhNd2vFj4V0G2iLvl9HERgHYvp1lVX4KwJ2fxMVc8KV1TuGHwBXwD9cgITwnCk429eV7OR7MStJA7ZBFbJ5losqCS1QTpNCP11d1L2ZAIcNFC30tdlRBKTp4QueHRw1WCZBW8SgiIBZAsucnDQGsH4JrtmS8O1UHQoNIZCJrAW'; 

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
        'Authorization': `Bearer ${accessToken}`,
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