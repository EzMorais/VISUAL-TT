require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  TIMEZONE: process.env.TIMEZONE || 'America/Sao_Paulo',

  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback',
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID || 'primary',

  WHATSAPP_PHONE: process.env.WHATSAPP_PHONE,
  TAILSCALE_IP: process.env.TAILSCALE_IP,

  BRIEFING_HOUR: parseInt(process.env.BRIEFING_HOUR || '7'),
  DB_PATH: process.env.DB_PATH || './data/personal-os.db',
};
