import { useState, useRef, useCallback } from 'react';
import { voice } from '../services/api';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VoiceButton({ className = '' }) {
  const [state, setState] = useState('idle'); // idle | listening | thinking | speaking
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const recognitionRef = useRef(null);

  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = 1.02;
    utter.onend = () => setState('idle');
    setState('speaking');
    window.speechSynthesis.speak(utter);
  }, []);

  const handleResult = useCallback(async (text) => {
    setTranscript(text);
    setState('thinking');
    try {
      const { response: reply } = await voice.command(text);
      setResponse(reply);
      speak(reply);
    } catch (err) {
      const msg = 'Não consegui processar agora.';
      setResponse(msg);
      speak(msg);
    }
  }, [speak]);

  function startListening() {
    if (!SpeechRecognition) {
      alert('Reconhecimento de voz não suportado neste navegador. Use Safari no iPhone.');
      return;
    }
    setTranscript('');
    setResponse('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setState('listening');
    recognition.onerror = () => setState('idle');
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      handleResult(text);
    };
    recognition.onend = () => {
      setState(s => (s === 'listening' ? 'idle' : s));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stop() {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setState('idle');
  }

  const busy = state !== 'idle';

  return (
    <div className={`voice-widget ${className}`}>
      <button
        className={`voice-btn ${state}`}
        onClick={busy ? stop : startListening}
        aria-label="Comando de voz"
        title="Comando de voz"
      >
        {state === 'idle' && '🎙️'}
        {state === 'listening' && '🔴'}
        {state === 'thinking' && <span className="spinner" style={{ width: 14, height: 14 }} />}
        {state === 'speaking' && '🔊'}
      </button>

      {busy && (transcript || response) && (
        <div className="voice-bubble">
          {transcript && <div className="voice-bubble-you">"{transcript}"</div>}
          {state === 'thinking' && <div className="voice-bubble-status">Pensando...</div>}
          {response && <div className="voice-bubble-reply">{response}</div>}
        </div>
      )}
    </div>
  );
}
