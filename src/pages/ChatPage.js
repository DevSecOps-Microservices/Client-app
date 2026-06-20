import React, { useState, useEffect, useRef } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { chatApi } from '../services/api';
import './Pages.css';

export default function ChatPage() {
  const { keycloak } = useKeycloak();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);
  const user = keycloak.tokenParsed;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = async () => {
    setLoading(true);
    try {
      const res = await chatApi.start({
        utilisateurId: user?.sub,
        utilisateurNom: user?.given_name || user?.preferred_username,
        messageInitial: 'Bonjour, j\'ai besoin d\'aide.',
      });
      const data = res.data;
      setConversationId(data.conversationId);
      setMessages([
        { role: 'bot', content: data.reponseBot || 'Bonjour ! Comment puis-je vous aider ?' },
      ]);
      setStarted(true);
    } catch (e) {
      setMessages([{ role: 'bot', content: 'Bonjour ! Je suis votre assistant support. Comment puis-je vous aider ?' }]);
      setStarted(true);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await chatApi.send({ conversationId, message: userMsg });
      setMessages(m => [...m, { role: 'bot', content: res.data.message }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'bot', content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Support IA</h1>
          <p className="page-sub">Assistant intelligent pour résoudre vos problèmes</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {!started && (
            <div className="chat-welcome">
              <div className="chat-bot-icon">🤖</div>
              <h2>Assistant Support IT</h2>
              <p>Je suis là pour vous aider à diagnostiquer et résoudre vos incidents informatiques.</p>
              <button className="btn btn-primary" onClick={startChat} disabled={loading}>
                {loading ? 'Connexion…' : '💬 Démarrer la conversation'}
              </button>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              {msg.role === 'bot' && <div className="msg-avatar bot-avatar">🤖</div>}
              <div className="msg-bubble">
                <p>{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="msg-avatar user-avatar">
                  {user?.given_name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          ))}

          {loading && started && (
            <div className="chat-message bot">
              <div className="msg-avatar bot-avatar">🤖</div>
              <div className="msg-bubble typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {started && (
          <div className="chat-input-area">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Décrivez votre problème… (Entrée pour envoyer)"
              rows={2}
              disabled={loading}
            />
            <button
              className="btn btn-primary send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
