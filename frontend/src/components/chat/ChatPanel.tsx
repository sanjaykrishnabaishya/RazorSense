import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal, Paperclip, Loader2, CheckCircle2, RefreshCcw, Package, PackageX, AlertTriangle, CreditCard, Search, Clock, HelpCircle, FileText, ChevronRight, Mic, Square, X, ShieldCheck, Video, FileCheck, Sparkles, Bot, Plus } from 'lucide-react';
import { ChatMessage } from '../../types/support';
import PurchaseSearch from '../workflow/PurchaseSearch';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ProactiveDeliveryBanner from './ProactiveDeliveryBanner';
import TicketReceiptCard from './TicketReceiptCard';
import InlineResolutionCard from './InlineResolutionCard';
import BentoCard from './BentoCard';
import TicketHistoryWidget from './TicketHistoryWidget';
import RazorSenseLogo from '../common/RazorSenseLogo';
import EnterpriseAgentsSection from './EnterpriseAgentsSection';

import { audioBufferToWav } from '../../utils/wav';

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://127.0.0.1:8000';
  }
  return 'https://razorsense-backend.onrender.com';
};

export default function ChatPanel({ messages, setMessages }: { messages: ChatMessage[], setMessages: any }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Widget state (Simulated global state for the purchase widget)
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState('refund');
  const [chatStep, setChatStep] = useState(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [token, setToken] = useState<string>('9999999999');
  const [checklist, setChecklist] = useState({});
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert to WAV format seamlessly!
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const wavBuffer = audioBufferToWav(audioBuffer);
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

        const reader = new FileReader();
        reader.readAsDataURL(wavBlob);
        reader.onloadend = () => {
          const audioBase64 = reader.result as string;
          // Auto-display user voice note bubble with audio player
          setMessages((prev: any) => [...prev, {
            id: Date.now().toString(),
            role: 'user',
            kind: 'image',
            text: '🎤 Voice message sent',
            imageUrl: null,
            base64: audioBase64,
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
          // Direct 1-shot dispatch to Krish
          sendText("I have sent a voice message. Please listen to it.", audioBase64);
          setSelectedFile(null);
          setFilePreview(null);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(reader.result as string);
        setFilePreview(URL.createObjectURL(file));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    // Pre-warm backend and auto-login on mount
    const API = getApiUrl();
    
    // Fire-and-forget pre-warm ping to ensure backend is hot
    fetch(`${API}/health`).catch(() => {});

    fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '9999999999' })
    })
    .then(res => res.json())
    .then(data => setToken(data.access_token))
    .catch(err => console.error("Login failed", err));
  }, []);

  const sendText = async (text: string, mediaOverride?: string) => {
    const API = getApiUrl();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      kind: 'text',
      text: text,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    if (text !== "[POLL]" && text !== "I have uploaded an image." && text !== "I have sent a voice message. Please listen to it.") {
      setMessages((prev: any) => [...prev, userMsg]);
      setInput('');
      setChatStep(prev => prev + 1);
    }

    let currentToken = token || '9999999999';

    setInput('');
    setSelectedFile(null);
    setFilePreview(null);
    setChatStep(prev => prev + 1);
    
    let history = messages.map((m: any) => ({
      role: m.role,
      text: m.text,
      media: m.base64 || undefined
    }));

    setIsLoading(true);

    // ── Streaming via SSE ──
    const streamMsgId = (Date.now() + 1).toString();
    setMessages((prev: any) => [...prev, {
      id: streamMsgId,
      role: 'assistant',
      kind: 'text',
      text: '',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }]);

    const processWidgets = async (raw: string) => {
      let display = raw;

      // ── TICKET widget ──
      const ticketMatch = display.match(/\[TICKET:\s*(.*?)\]/);
      if (ticketMatch) {
        const ticketId = ticketMatch[1].trim();
        display = display.replace(/\[TICKET:\s*.*?\]/, '').trim();
        let ticketDetails = null;
        try {
          const tr = await fetch(`${API}/api/tickets`, { headers: { Authorization: `Bearer ${currentToken}` } });
          if (tr.ok) {
            const tickets = await tr.json();
            ticketDetails = tickets.find((t: any) => t.ticket_id === ticketId) || null;
          }
        } catch {}
        setMessages((prev: any) => [...prev, {
          id: (Date.now() + 2).toString(), role: 'assistant', kind: 'widget_ticket',
          text: 'I have created a support ticket for this issue.',
          ticket_id: ticketId, merchant: ticketDetails?.merchant || 'RazorSense Support',
          status: ticketDetails?.status || 'In Review', ticket_details: ticketDetails,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      }

      // ── ORDER WIDGET ──
      const orderMatch = display.match(/\[ORDER_WIDGET:\s*(.*?)\]/);
      if (orderMatch) {
        const ids = orderMatch[1].split(',').map((s: string) => s.trim()).filter(Boolean);
        display = display.replace(/\[ORDER_WIDGET:\s*.*?\]/, '').trim();

        let widgetTitle: string | undefined = undefined;
        const titleMatch = display.match(/\[ORDER_WIDGET_TITLE:\s*(.*?)\]/);
        if (titleMatch) {
          widgetTitle = titleMatch[1].trim();
          display = display.replace(/\[ORDER_WIDGET_TITLE:\s*.*?\]/, '').trim();
        }

        const orders: any[] = [];
        for (const oid of ids) {
          try {
            const or = await fetch(`${API}/api/orders/${oid}`, { headers: { Authorization: `Bearer ${currentToken}` } });
            if (or.ok) orders.push(await or.json());
          } catch {}
        }
        if (orders.length > 0) {
          setMessages((prev: any) => [...prev, {
            id: (Date.now() + 4).toString(), role: 'assistant', kind: 'widget_order_select',
            orders, title: widgetTitle, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
        }
      }

      // ── QUICK OPTIONS widget ──
      const quickMatch = display.match(/\[QUICK_OPTIONS:\s*(.*?)\]/);
      if (quickMatch) {
        const options = quickMatch[1].split(',').map((s: string) => s.trim()).filter(Boolean);
        display = display.replace(/\[QUICK_OPTIONS:\s*.*?\]/, '').trim();
        setMessages((prev: any) => [...prev, {
          id: (Date.now() + 5).toString(), role: 'assistant', kind: 'widget_quick_options',
          options, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      }

      // ── ADVANCED SEARCH widget ──
      if (display.includes('[SHOW_ADVANCED_SEARCH]')) {
        display = display.replace('[SHOW_ADVANCED_SEARCH]', '').trim();
        setMessages((prev: any) => [...prev, {
          id: (Date.now() + 3).toString(), role: 'assistant', kind: 'widget_search',
          text: 'Here is the advanced search panel:',
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      }

      // ── INLINE RESOLUTION widget ──
      const inlineMatch = display.match(/\[INLINE_RESOLUTION:\s*(.*?)\]/);
      if (inlineMatch) {
        const orderId = inlineMatch[1].trim();
        display = display.replace(/\[INLINE_RESOLUTION:\s*.*?\]/, '').trim();
        let targetOrder = null;
        try {
          const or = await fetch(`${API}/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${currentToken}` } });
          if (or.ok) targetOrder = await or.json();
        } catch {}
        setMessages((prev: any) => [...prev, {
          id: (Date.now() + 6).toString(), role: 'assistant', kind: 'widget_inline_resolution',
          order: targetOrder, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      }

      // ── TICKET HISTORY widget ──
      if (display.includes('[SHOW_TICKET_HISTORY]')) {
        display = display.replace('[SHOW_TICKET_HISTORY]', '').trim();
        // If display text contains ticket bullet lines, condense to clean welcome intro
        if (display.includes('* **Ticket #') || display.includes('Ticket #')) {
          display = 'Here are your active support tickets and dispute dossiers from our Sentinel Engine records:';
        }
        let tickets: any[] = [];
        try {
          const tr = await fetch(`${API}/api/tickets`, { headers: { Authorization: `Bearer ${currentToken}` } });
          if (tr.ok) tickets = await tr.json();
        } catch {}
        setMessages((prev: any) => [...prev, {
          id: (Date.now() + 7).toString(), role: 'assistant', kind: 'widget_history',
          tickets: tickets,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      }

      // Comprehensive marker clean-up to ensure zero bracket tags leak into the message bubble
      display = display
        .replace(/\[ORDER_WIDGET:\s*.*?\]/g, '')
        .replace(/\[ORDER_WIDGET_TITLE:\s*.*?\]/g, '')
        .replace(/\[SHOW_ADVANCED_SEARCH\]/g, '')
        .replace(/\[SHOW_TICKET_HISTORY\]/g, '')
        .replace(/\[QUICK_OPTIONS:\s*.*?\]/g, '')
        .replace(/\[INLINE_RESOLUTION:\s*.*?\]/g, '')
        .replace(/\[TICKET:\s*.*?\]/g, '')
        .trim();

      // Update message bubble with clean text (markers stripped)
      setMessages((prev: any) => prev.map((m: any) =>
        m.id === streamMsgId ? { ...m, text: display } : m
      ));
    };

    try {
      const res = await fetch(`${API}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          message: text,
          checklist: checklist,
          media: mediaOverride || selectedFile,
          history: history
        })
      });

      if (!res.ok || !res.body) {
        throw new Error(`Streaming returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          // Unescape the newlines that were escaped in the backend
          const chunk = line.slice(6).replace(/\\n/g, '\n');
          if (chunk === '[DONE]') {
            setIsLoading(false);
            await processWidgets(fullText);
            return;
          }
          if (chunk.startsWith('[ERROR]')) {
            setMessages((prev: any) => prev.map((m: any) =>
              m.id === streamMsgId ? { ...m, text: chunk.replace('[ERROR] ', '') } : m
            ));
            setIsLoading(false);
            return;
          }
          fullText += chunk;
          // Stream text live but don't parse widgets mid-stream (wait for [DONE])
          setMessages((prev: any) => prev.map((m: any) =>
            m.id === streamMsgId ? { ...m, text: fullText } : m
          ));
        }
      }
    } catch (err) {
      console.warn("Stream error, falling back to direct chat API:", err);
      // Fallback to robust non-streaming endpoint if streaming fails or disconnects
      try {
        const fallbackRes = await fetch(`${API}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentToken}`
          },
          body: JSON.stringify({
            message: text,
            checklist: checklist,
            media: mediaOverride || selectedFile,
            history: history
          })
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          await processWidgets(data.reply || '');
          return;
        }
      } catch (fallbackErr) {
        console.error("Fallback chat error:", fallbackErr);
      }

      setMessages((prev: any) => prev.map((m: any) =>
        m.id === streamMsgId ? { ...m, text: "I'm having a little trouble reaching my systems right now. Please try again in a moment!" } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const addBotMessage = (kind: string, text: string) => {
    setMessages((prev: any) => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      kind,
      text,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }]);
  };

  const handleSend = () => {
    if (!input.trim() && !selectedFile) return;
    if (selectedFile && filePreview) {
      setMessages((prev: any) => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        kind: 'image',
        text: filePreview === "AUDIO" ? 'Sent a voice message 🎤' : 'Uploaded an attachment',
        imageUrl: filePreview === "AUDIO" ? null : filePreview,
        base64: selectedFile,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    }
    
    let defaultText = "I have uploaded an image.";
    if (filePreview === "AUDIO") defaultText = "I have sent a voice message. Please listen to it.";
    
    sendText(input || defaultText, selectedFile || undefined);
    setSelectedFile(null);
    setFilePreview(null);
    setInput('');
  };

  const handlePostPurchaseClick = () => {
    setMessages((prev: any) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        kind: 'text',
        text: 'I need post-purchase support for my delivered order',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        kind: 'widget_post_purchase_bar',
        text: 'I can help with refunds, replacements, returns, wrong item received, missing items, or exchanges. What would you like to do?',
        options: [
          { label: '⚡ Refund', prompt: 'I want a refund for my order' },
          { label: '🔄 Replacement', prompt: 'I want to replace an item from my order' },
          { label: '📦 Wrong Item', prompt: 'I received the wrong item in my delivery' },
          { label: '❗ Missing Item', prompt: 'An item is missing from my delivery / order package' },
          { label: '↩ Return', prompt: 'I want to return an item' },
          { label: '🔄 Exchange', prompt: 'I want to exchange my item' },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const renderComposer = (isDocked: boolean) => (
    <div className={`relative flex flex-col glass-3d rounded-2xl transition-all p-1.5 mx-auto w-full max-w-4xl ${isDocked ? 'focus-within:border-cyan-400/40' : 'focus-within:border-cyan-400/40 border-white/15 shadow-lg'}`}>
      {filePreview && (
        <div className="relative self-start m-2">
          {filePreview === "AUDIO" ? (
             <div className="h-10 px-3.5 rounded-xl border border-blue-400/30 flex items-center bg-blue-500/15 text-cyan-300 text-xs font-semibold">
               🎤 Voice Note Ready for Krish
             </div>
          ) : selectedFile?.includes('data:video/') ? (
             <div className="h-16 px-3 rounded-xl border border-purple-400/30 flex items-center gap-2 bg-purple-500/15 text-purple-200 text-xs font-semibold">
               <Video size={16} /> Unboxing Video Attached
             </div>
          ) : (
             <img src={filePreview} alt="Preview" className="h-16 rounded-xl object-contain border border-white/10" />
          )}
          <button 
            onClick={() => { setFilePreview(null); setSelectedFile(null); }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-400 cursor-pointer"
          >
            <PackageX size={12} />
          </button>
        </div>
      )}
      <div className="flex items-end w-full">
        <label className="p-2.5 text-slate-400 hover:text-white hover:bg-white/[0.08] transition rounded-xl cursor-pointer shrink-0" title="Attach defect photo or unboxing video">
          <Paperclip size={18} />
          <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
        </label>
        
        <button 
          onClick={toggleRecording}
          className={`p-2.5 transition-all rounded-xl shrink-0 cursor-pointer ${isRecording ? 'text-rose-400 animate-pulse bg-rose-500/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'}`}
          title={isRecording ? "Stop recording" : "Record voice note"}
        >
          {isRecording ? <Square size={18} /> : <Mic size={18} />}
        </button>
        
        {isRecording ? (
          <div className="flex-1 py-2.5 px-3 flex items-center gap-2 text-rose-400 text-xs font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span>Recording voice note... Speak now (tap square to send)</span>
          </div>
        ) : (
          <textarea 
            placeholder="Ask Krish anything or describe your order issue..."
            className="flex-1 max-h-28 min-h-[42px] py-2 px-2 text-[14px] bg-transparent focus:outline-none resize-none custom-scrollbar text-white placeholder-slate-400"
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        )}
        
        <button 
          onClick={handleSend}
          disabled={!input.trim() && !selectedFile}
          className="p-2.5 m-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-20 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer active:scale-95 shadow-sm"
          title="Send message"
        >
          <SendHorizontal size={17} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-transparent relative w-full">
      
      {/* Messages / Home Area */}
      <div className={`flex-1 ${messages.length === 0 ? 'w-full' : 'overflow-y-auto p-4 custom-scrollbar'} flex flex-col relative z-10`}>
        
        {messages.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-start max-w-6xl mx-auto">
            {/* Live App Bot Avatar & Single Greeting */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="mb-6 flex flex-col items-center select-none"
            >
              {/* Krish Bot Icon: Transparent BG, Sized Generously (w-36 h-36), Floating Animation & Interactive Cursor Tilt/Pop-up */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0], y: -10 }}
                className="w-28 h-28 sm:w-36 sm:h-36 mb-3 flex items-center justify-center filter drop-shadow-[0_16px_32px_rgba(6,182,212,0.35)] cursor-pointer select-none"
              >
                <img
                  src="/krish.png"
                  alt="Krish AI"
                  className="w-full h-full object-contain"
                  onError={(e) => (e.currentTarget.src = '/robot.png')}
                />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white text-center mb-4">
                Hi! I'm Krish 👋
              </h1>
            </motion.div>

            {/* Chat box in center flow on home page (Widescreen max-w-4xl) */}
            <div className="w-full max-w-4xl mb-6 px-1">
              {renderComposer(false)}
            </div>

            {/* Proactive Multi-Delivery Highlight Card */}
            <div className="w-full max-w-4xl mb-6 px-1">
              <ProactiveDeliveryBanner sendText={sendText} token={token} apiUrl={getApiUrl()} />
            </div>

            {/* Autonomous Agents Built for Enterprise Scale */}
            <div className="w-full max-w-6xl px-1">
              <EnterpriseAgentsSection
                sendText={sendText}
                onPostPurchaseClick={handlePostPurchaseClick}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-24 max-w-4xl mx-auto w-full">
            {messages.map((m: any) => {
              const isUser = m.role === 'user';
              return (
                <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                     <div className="w-7 h-7 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mr-2.5 mt-1 shrink-0 overflow-hidden text-cyan-300 shadow-sm">
                       <img
                         src="/krish.png"
                         alt="Krish AI"
                         className="w-[115%] h-[115%] object-contain"
                         onError={(e) => (e.currentTarget.src = '/robot.png')}
                       />
                     </div>
                  )}
                  
                  <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    {m.kind === 'text' && (
                      m.text ? (
                        <div className={`p-4 text-[14.5px] leading-[1.6] shadow-xl markdown-container ${isUser ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm font-medium' : 'bg-[#0e1018]/90 text-white/90 rounded-2xl rounded-tl-sm border border-white/[0.08] backdrop-blur-xl'}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                        </div>
                      ) : !isUser ? (
                        <div className="flex gap-1.5 px-2 py-3 items-center h-[44px]">
                          <motion.div className="w-2 h-2 rounded-full bg-white/50" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }} />
                          <motion.div className="w-2 h-2 rounded-full bg-white/50" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.15 }} />
                          <motion.div className="w-2 h-2 rounded-full bg-white/50" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} />
                        </div>
                      ) : null
                    )}

                    {m.kind === 'image' && (
                      <div className={`p-2 shadow-lg ${isUser ? 'bg-white rounded-2xl rounded-tr-sm' : 'bg-[#111] rounded-2xl rounded-tl-sm border border-white/[0.05]'}`}>
                        {m.imageUrl === null ? (
                          <div className={`px-4 py-3 flex flex-col gap-2 font-medium ${isUser ? 'text-black' : 'text-white'}`}>
                            <div className="flex items-center gap-2">🎤 Voice Message</div>
                            {m.base64 && <audio src={m.base64} controls className="w-full mt-1" />}
                          </div>
                        ) : (
                          <img src={m.imageUrl} alt="attachment" className="max-w-[250px] rounded-xl object-contain" />
                        )}
                      </div>
                    )}

                    {m.kind === 'widget_post_purchase_bar' && (
                      <div className="flex flex-col gap-2 mt-1 w-full max-w-xl">
                        <div className="p-3.5 text-[14px] leading-relaxed bg-[#0e1018] text-white/90 rounded-2xl rounded-tl-sm border border-white/[0.08] shadow-md">
                          {m.text}
                        </div>
                        {/* Interactive Post-Purchase Options Bar */}
                        <div className="flex flex-wrap items-center gap-2 p-2 bg-[#0a0d14]/90 border border-white/[0.08] rounded-2xl shadow-md">
                          {m.options?.map((opt: any, i: number) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.96 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              onClick={() => sendText(opt.prompt)}
                              className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-cyan-500/20 border border-white/[0.08] hover:border-cyan-400/40 text-white/90 hover:text-cyan-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-[0_4px_16px_rgba(6,182,212,0.25)]"
                            >
                              <span>{opt.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.kind === 'widget_order_select' && (
                      <OrderSelectWidget orders={m.orders} sendText={sendText} title={m.title} />
                    )}

                    {m.kind === 'widget_quick_options' && (
                      <div className="flex flex-col gap-2 mt-2 w-full max-w-md">
                        <span className="text-[11px] font-semibold tracking-wider uppercase text-white/40">Select an option:</span>
                        <div className="flex flex-wrap gap-2">
                          {m.options.map((opt: string, i: number) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.04, y: -2 }}
                              whileTap={{ scale: 0.96 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                              onClick={() => sendText(opt)}
                              className="bg-[#18181b] hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/60 text-white/90 hover:text-white text-[13px] font-medium py-2.5 px-4 rounded-xl transition-colors shadow-md hover:shadow-[0_6px_20px_rgba(59,130,246,0.25)] flex items-center gap-2 text-left"
                            >
                              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                              <span>{opt}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.kind === 'widget_search' && (
                      <div className="flex flex-col gap-3 w-full">
                        <div className="p-4 text-[15px] leading-[1.5] shadow-lg bg-[#111] text-white rounded-2xl rounded-tl-sm border border-white/[0.05] self-start max-w-fit">
                          {m.text}
                        </div>
                        <div className="w-[800px] max-w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl mt-2">
                          <PurchaseSearch 
                            query={query} setQuery={setQuery}
                            results={results} setResults={setResults}
                            selectedIssue={selectedIssue} setSelectedIssue={setSelectedIssue}
                            setStage={() => {}}
                            token={token}
                            sendText={sendText}
                          />
                        </div>
                      </div>
                    )}

                    {m.kind === 'widget_history' && (
                      <div className="flex flex-col gap-2.5 w-full">
                        {m.text && (
                          <div className="p-3.5 text-[14px] leading-relaxed bg-[#0e1018] text-white/90 rounded-2xl rounded-tl-sm border border-white/[0.08] shadow-md max-w-fit">
                            {m.text}
                          </div>
                        )}
                        <TicketHistoryWidget
                          tickets={m.tickets || []}
                          onSelectTicket={(t) => setSelectedTicket(t)}
                          onRaiseNewIssue={() => sendText("Raise a New Issue")}
                          onEscalateTicket={(t) => {
                            sendText(`I am not satisfied with the resolution on ticket #${t.ticket_id} (${t.product || t.merchant}). Can we review this?`);
                          }}
                        />
                      </div>
                    )}

                    {m.kind === 'widget_ticket' && (
                      <div className="flex flex-col gap-2 w-full">
                        {m.text && (
                          <div className="p-4 text-[15px] leading-[1.5] shadow-lg bg-[#111] text-white rounded-2xl rounded-tl-sm border border-white/[0.05] self-start max-w-fit markdown-container">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                          </div>
                        )}
                        <TicketReceiptCard
                          ticket={m.ticket_details || {
                            ticket_id: m.ticket_id || "RZ-99413",
                            order_id: m.order_id || "N/A",
                            merchant: m.merchant || "RazorSense Support",
                            product: m.product || "Delivered Purchase",
                            status: m.status || "Investigation Active",
                            action_taken: m.action_taken || "Logged claim for review.",
                            date: m.date || new Date().toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
                          }}
                          onOpenDetails={(t) => setSelectedTicket(t)}
                        />
                      </div>
                    )}

                    {m.kind === 'widget_inline_resolution' && (
                      <InlineResolutionCard order={m.order} sendText={sendText} />
                    )}

                    <span className="text-[11px] text-white/30 mt-1.5 px-1">{m.timestamp}</span>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Docked composer ONLY when messages.length > 0 */}
      {messages.length > 0 && (
        <div className="pt-2 pb-2 px-1 bg-transparent shrink-0 z-30">
          {renderComposer(true)}
        </div>
      )}

      {/* Sentinel Audit Dossier Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-gradient-to-b from-[#13151f] via-[#0e1017] to-[#0a0b0f] border border-white/[0.12] rounded-3xl w-full max-w-lg shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden relative"
          >
            {/* Holographic accent glow at top */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500" />
            
            <button 
              onClick={() => setSelectedTicket(null)} 
              className="absolute top-5 right-5 text-white/40 hover:text-white transition p-1.5 rounded-full hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    Sentinel Audit Dossier
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Two-Tier Deterministic Engine Verified
                  </p>
                </div>
              </div>

              {/* Security Telemetry Banner */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block mb-1">
                    Fraud Risk Score
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold text-sm">
                      {selectedTicket.fraud_score !== undefined ? `${selectedTicket.fraud_score} / 100` : '15 / 100'}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400/90 px-2 py-0.5 rounded-md bg-emerald-500/10">
                      {selectedTicket.risk_level || 'LOW RISK'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block mb-1">
                    Settlement SLA
                  </span>
                  <span className="text-white font-semibold text-sm">
                    T+1 Working Day
                  </span>
                </div>
              </div>

              {/* Data Rows */}
              <div className="space-y-2.5 text-xs bg-black/40 p-4 rounded-2xl border border-white/[0.05]">
                <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                  <span className="text-white/40">Ticket Reference</span>
                  <span className="text-white font-mono font-bold">#{selectedTicket.ticket_id}</span>
                </div>

                {selectedTicket.order_id && selectedTicket.order_id !== 'N/A' && (
                  <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                    <span className="text-white/40">Linked Order</span>
                    <span className="text-white font-mono">#{selectedTicket.order_id}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                  <span className="text-white/40">Product / Item</span>
                  <span className="text-white font-medium text-right max-w-[65%] truncate">{selectedTicket.product || 'N/A'}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                  <span className="text-white/40">Merchant Partner</span>
                  <span className="text-white font-semibold">{selectedTicket.merchant}</span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
                  <span className="text-white/40">Resolution Status</span>
                  <span className="text-blue-400 font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                    {selectedTicket.status}
                  </span>
                </div>

                <div className="pt-1">
                  <span className="text-white/40 block mb-1">Official Action Taken:</span>
                  <p className="text-white/90 leading-relaxed bg-white/[0.03] p-2.5 rounded-xl border border-white/[0.05]">
                    {selectedTicket.action_taken}
                  </p>
                </div>

                {selectedTicket.policy_rule_cited && (
                  <div className="pt-1">
                    <span className="text-white/40 block mb-1">Merchant Policy SOP:</span>
                    <p className="text-white/70 text-[11px] leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                      {selectedTicket.policy_rule_cited}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Button */}
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full mt-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-medium transition text-xs cursor-pointer"
              >
                Close Audit Dossier
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

function OrderSelectWidget({ orders, sendText, title }: { orders: any[], sendText: (text: string) => void, title?: string }) {
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

  const handleSelect = (o: any) => {
    setSelectedOrderId(o.order_id);
    const t = (title || '').toLowerCase();
    if (t.includes("revoke") || t.includes("mandate")) {
      sendText(`Revoke bank mandate for order ${o.order_id} (${o.product})`);
    } else if (t.includes("renewal") || t.includes("48-hour")) {
      sendText(`Claim 48-hour renewal refund for order ${o.order_id} (${o.product})`);
    } else if (t.includes("subscription")) {
      sendText(`Revoke bank mandate for order ${o.order_id} (${o.product})`);
    } else if (t.includes("replace")) {
      sendText(`I want to replace order ${o.order_id} (${o.product})`);
    } else if (t.includes("refund")) {
      sendText(`I want a refund for order ${o.order_id} (${o.product})`);
    } else if (t.includes("return")) {
      sendText(`I want to return order ${o.order_id} (${o.product})`);
    } else if (t.includes("exchange")) {
      sendText(`I want to exchange order ${o.order_id} (${o.product})`);
    } else if (t.includes("wrong")) {
      sendText(`I received the wrong item for order ${o.order_id} (${o.product})`);
    } else if (t.includes("missing")) {
      sendText(`An item is missing from order ${o.order_id} (${o.product})`);
    } else if (t.includes("recent") || t.includes("find") || t.includes("purchase")) {
      sendText(`Please show me the details and status for order ${o.order_id} (${o.product})`);
    } else {
      sendText(`I'm selecting order ${o.order_id} (${o.product})`);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {title && (
        <span className="text-[11px] uppercase tracking-wider font-semibold text-white/50 pl-1">
          {title}
        </span>
      )}
      <div className="flex flex-col gap-3 mt-0.5 w-full max-w-md">
        {orders.map((o: any) => {
          const isSelected = selectedOrderId === o.order_id;
          return (
            <motion.div 
              key={o.order_id} 
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => handleSelect(o)} 
              className={`bg-[#111] p-4 rounded-xl cursor-pointer transition-colors flex flex-col gap-3 group relative overflow-hidden border ${isSelected ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.25)]' : 'border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.07] hover:shadow-[0_8px_24px_rgba(0,0,0,0.6),0_0_16px_rgba(6,182,212,0.12)]'}`}
            >
               <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-400 to-blue-500 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
               <div className="flex justify-between items-start pl-2">
                 <div>
                   <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/10">
                     {o.merchant}
                   </span>
                   <h4 className="text-white font-medium text-sm mt-1.5 leading-snug group-hover:text-cyan-200 transition-colors">{o.product}</h4>
                 </div>
                 <span className="text-white/50 text-[11px] font-mono shrink-0 ml-2">#{o.order_id}</span>
               </div>
               
               <div className="grid grid-cols-3 gap-2 text-white/50 text-[11px] bg-black/40 p-2.5 rounded-lg border border-white/5 ml-2">
                 <div className="flex flex-col">
                   <span className="text-[9px] uppercase tracking-wider text-white/30">Delivered</span>
                   <span className="text-white/80">{new Date(o.order_date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[9px] uppercase tracking-wider text-white/30">Status</span>
                   <span className={o.status === 'Delivered' ? 'text-emerald-400 font-medium' : 'text-blue-400 font-medium'}>{o.status}</span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[9px] uppercase tracking-wider text-white/30">Paid Via</span>
                   <span className="text-white/80 truncate">{o.payment_mode || 'Online'}</span>
                 </div>
               </div>

               <div className="flex justify-between items-center pl-2 pt-1 border-t border-white/5">
                 <span className="text-white font-semibold text-sm">₹{o.price ? o.price.toLocaleString() : '—'}</span>
                 <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={(e) => {
                     e.stopPropagation();
                     handleSelect(o);
                   }}
                   className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-1.5 px-3.5 rounded-lg transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                 >
                   <span>{isSelected ? 'Selected' : 'Select Order'}</span>
                   <ChevronRight size={14} />
                 </motion.button>
               </div>
            </motion.div>
          );
        })}
      </div>

      <motion.button 
        whileHover={{ scale: 1.02, x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => sendText("My order is not here in the list. Please help me find it using Advanced Search.")}
        className="mt-2 text-[13px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5 self-start underline underline-offset-4 py-1 group cursor-pointer"
      >
        <Search size={14} className="group-hover:scale-110 transition-transform" />
        <span>Not here in the list? Search all purchases</span>
      </motion.button>
    </div>
  );
}
