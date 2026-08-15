const { google } = require('googleapis');
const config = require('../config');

let calendarClient;

function getClient() {
  if (calendarClient) return calendarClient;

  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_REFRESH_TOKEN) return null;

  const oauth2 = new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI
  );
  oauth2.setCredentials({ refresh_token: config.GOOGLE_REFRESH_TOKEN });
  calendarClient = google.calendar({ version: 'v3', auth: oauth2 });
  return calendarClient;
}

async function listEvents(timeMin, timeMax) {
  const cal = getClient();
  if (!cal) return [];

  try {
    const res = await cal.events.list({
      calendarId: config.GOOGLE_CALENDAR_ID,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    return res.data.items || [];
  } catch (err) {
    console.error('Erro Google Calendar:', err.message);
    return [];
  }
}

function dayRange(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  return { start, end };
}

async function getEventsToday() {
  const { start, end } = dayRange(0);
  return listEvents(start, end);
}

async function getEventsTomorrow() {
  const { start, end } = dayRange(1);
  return listEvents(start, end);
}

async function getUpcoming(minutes = 15) {
  const now = new Date();
  const soon = new Date(now.getTime() + minutes * 60_000);
  return listEvents(now, soon);
}

async function createEvent({ title, description, startTime, endTime }) {
  const cal = getClient();
  if (!cal) throw new Error('Google Calendar não configurado');

  const res = await cal.events.insert({
    calendarId: config.GOOGLE_CALENDAR_ID,
    resource: {
      summary: title,
      description,
      start: { dateTime: startTime, timeZone: config.TIMEZONE },
      end: { dateTime: endTime, timeZone: config.TIMEZONE },
    },
  });
  return res.data;
}

function formatEvent(event) {
  const allDay = !event.start.dateTime;
  const start = event.start.dateTime || event.start.date;
  const end = event.end.dateTime || event.end.date;

  let timeStr = 'Dia todo';
  if (!allDay) {
    const fmt = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    timeStr = `${fmt(start)} – ${fmt(end)}`;
  }

  return {
    id: event.id,
    title: event.summary || 'Sem título',
    description: event.description || '',
    location: event.location || '',
    timeStr,
    start,
    end,
    allDay,
    link: event.htmlLink,
  };
}

// Returns auth URL for first-time setup
function getAuthUrl() {
  if (!config.GOOGLE_CLIENT_ID) return null;
  const oauth2 = new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI
  );
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent',
  });
}

async function exchangeCode(code) {
  const oauth2 = new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI
  );
  const { tokens } = await oauth2.getToken(code);
  return tokens;
}

module.exports = { getEventsToday, getEventsTomorrow, getUpcoming, createEvent, formatEvent, getAuthUrl, exchangeCode };
