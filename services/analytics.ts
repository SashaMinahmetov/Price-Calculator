import { TelegramUser } from '../types';

// Вставьте сюда URL вашего веб-приложения Google Apps Script (или любого другого вебхука)
// Например: "https://script.google.com/macros/s/AKfycbx.../exec"
const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyGdYBJxtUsku6Hawf0v2knCvZuMsU_mccgeZt31OL2MC8q9YRJwxS69OuDlWNEDQ61zQ/exec"; 

export const logUserVisit = async (user: TelegramUser) => {
  if (!WEBHOOK_URL) {
    console.log("Analytics: Webhook URL not set. User data:", user);
    return;
  }

  // Проверяем, отправляли ли мы уже данные в этой сессии, чтобы не дублировать
  const sessionKey = `logged_session_${user.id}`;
  if (sessionStorage.getItem(sessionKey)) {
    return; 
  }

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors', // Важно для Google Apps Script
      headers: {
        'Content-Type': 'text/plain', // Используем text/plain чтобы избежать preflight OPTIONS запроса
      },
      body: JSON.stringify({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name || '',
        username: user.username || '',
        language_code: user.language_code || '',
        timestamp: new Date().toISOString(),
        platform: window.Telegram?.WebApp?.platform || 'unknown'
      }),
    });
    
    // Помечаем, что отправили
    sessionStorage.setItem(sessionKey, 'true');
    console.log("Analytics: User visit logged");
  } catch (error) {
    console.error("Analytics: Failed to log visit", error);
  }
};