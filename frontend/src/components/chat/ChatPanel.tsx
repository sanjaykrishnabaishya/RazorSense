import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal, Paperclip, Loader2, CheckCircle2, RefreshCcw, Package, PackageX, AlertTriangle, CreditCard, Search, Clock, HelpCircle, FileText, ChevronRight, Mic, Square, X } from 'lucide-react';
import { ChatMessage } from '../../types/support';
import PurchaseSearch from '../workflow/PurchaseSearch';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  const [token, setToken] = useState<string | null>(null);
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
          setSelectedFile(reader.result as string);
          setFilePreview("AUDIO");
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

    let currentToken = token;
    if (!currentToken) {
      try {
        const loginRes = await fetch(`${API}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: '9999999999' })
        });
        const loginData = await loginRes.json();
        currentToken = loginData.access_token;
        setToken(currentToken);
      } catch (err) {
        addBotMessage('text', 'Server is booting up. Please try again in 5 seconds.');
        return;
      }
    }

    if (!currentToken) {
      addBotMessage('text', 'Could not authenticate. Please try again.');
      return;
    }

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
            orders, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
        }
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
        // Fallback to non-streaming if SSE fails
        const data = await res.json().catch(() => null);
        setMessages((prev: any) => prev.map((m: any) =>
          m.id === streamMsgId ? { ...m, text: data?.reply || data?.detail || 'Something went wrong. Please try again.' } : m
        ));
        setIsLoading(false);
        return;
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

  return (
    <div className="flex flex-col h-full bg-transparent relative w-full">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col relative z-10">
        
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center justify-center pt-8 pb-20 mt-auto mb-auto"
          >
            <motion.div 
              animate={{ y: ["-10px", "10px"], rotate: [-2, 2] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="w-48 h-48 mb-6 shrink-0"
            >
              {/* Fallback to /robot.png if krish.png is not ready */}
              <img src="/krish.png" alt="Krish AI" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]" onError={(e) => e.currentTarget.src='/robot.png'} />
            </motion.div>
            
            <h2 className="text-[32px] font-[800] text-white mb-2 tracking-tight">Hi! I'm Krish 👋</h2>
            <p className="text-white/50 mb-10 text-[16px]">Tell me what happened, and I'll look into it for you.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl px-2">
              <IssuePrompt icon={RefreshCcw} label="I want a refund" onClick={() => sendText("I want a refund")} color="text-emerald-400" />
              <IssuePrompt icon={Package} label="I need a replacement" onClick={() => sendText("I need a replacement")} color="text-blue-400" />
              <IssuePrompt icon={PackageX} label="Received wrong item" onClick={() => sendText("I received the wrong item")} color="text-purple-400" />
              <IssuePrompt icon={AlertTriangle} label="Return item" onClick={() => sendText("I want to return an item")} color="text-orange-400" />
              <IssuePrompt icon={CreditCard} label="Payment issue" onClick={() => sendText("I have a payment issue")} color="text-red-400" />
              <IssuePrompt icon={Search} label="Find a purchase" onClick={() => sendText("Can you help me find a purchase?")} color="text-cyan-400" />
              <IssuePrompt icon={Clock} label="Ticket History" onClick={() => sendText("Show my ticket history")} color="text-pink-400" />
              <IssuePrompt icon={HelpCircle} label="Other Issue" onClick={() => sendText("I have an issue that I need help with.")} color="text-zinc-300" />
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6 pb-32">
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
                     <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 mt-1 shrink-0 overflow-hidden border border-white/10">
                       <img src="/krish.png" alt="Bot" className="w-[120%] h-[120%] object-contain" onError={(e) => e.currentTarget.src='/robot.png'} />
                     </div>
                  )}
                  
                  <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    {m.kind === 'text' && (
                      m.text ? (
                        <div className={`p-4 text-[15px] leading-[1.5] shadow-lg markdown-container ${isUser ? 'bg-white text-black rounded-2xl rounded-tr-sm font-medium' : 'bg-[#111] text-white rounded-2xl rounded-tl-sm border border-white/[0.05]'}`}>
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

                    {m.kind === 'widget_order_select' && (
                      <OrderSelectWidget orders={m.orders} sendText={sendText} />
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
                      <div className="flex flex-col gap-3 w-full">
                        <div className="p-4 text-[15px] leading-[1.5] shadow-lg bg-[#111] text-white rounded-2xl rounded-tl-sm border border-white/[0.05] self-start max-w-fit">
                          {m.text}
                        </div>
                        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 shadow-2xl mt-2 space-y-3">
                          <div className="flex justify-between items-center p-4 bg-[#111] rounded-xl border border-white/5">
                            <div>
                              <p className="text-white font-medium text-[14px]">Ticket #RZ-99412</p>
                              <p className="text-white/40 text-[12px]">Amazon • Wireless Earbuds</p>
                            </div>
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[12px] font-bold rounded-full">In Review</span>
                          </div>
                          <div className="flex justify-between items-center p-4 bg-[#111] rounded-xl border border-white/5">
                            <div>
                              <p className="text-white font-medium text-[14px]">Ticket #RZ-88102</p>
                              <p className="text-white/40 text-[12px]">Zomato • Late Delivery</p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[12px] font-bold rounded-full">Resolved</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {m.kind === 'widget_ticket' && (
                      <div className="flex flex-col gap-3 w-full">
                        <div className="p-4 text-[15px] leading-[1.5] shadow-lg bg-[#111] text-white rounded-2xl rounded-tl-sm border border-white/[0.05] self-start max-w-fit">
                          {m.text}
                        </div>
                        <div className="w-full max-w-md bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-2xl p-6 shadow-2xl mt-2 relative overflow-hidden">
                           <FileText className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
                           <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><CheckCircle2 className="text-emerald-400" /> Ticket Created</h3>
                           <div className="space-y-2 text-[13px]">
                             <div className="flex justify-between"><span className="text-white/50">Ticket ID</span><span className="text-white font-mono">{m.ticket_id || "RZ-99413"}</span></div>
                             <div className="flex justify-between"><span className="text-white/50">Status</span><span className="text-blue-400 font-semibold">{m.status || "Investigation Active"}</span></div>
                             <div className="flex justify-between"><span className="text-white/50">Merchant</span><span className="text-white">{m.merchant || "Unknown"}</span></div>
                             <div className="flex justify-between"><span className="text-white/50">Date</span><span className="text-white">{new Date().toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</span></div>
                           </div>
                           <button onClick={() => setSelectedTicket(m.ticket_details)} className="w-full mt-5 bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 rounded-xl transition text-[13px]">View Full Details</button>
                        </div>
                      </div>
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

      {/* Composer */}
      <div className="p-4 pb-4 bg-transparent sticky bottom-0 z-20">
        <div className="relative flex flex-col border border-white/[0.1] rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] focus-within:border-white/30 transition-colors p-1.5 mx-auto max-w-3xl">
          {filePreview && (
            <div className="relative self-start m-2">
              {filePreview === "AUDIO" ? (
                 <div className="h-12 px-4 rounded-xl border border-white/10 flex items-center bg-blue-500/20 text-blue-400">
                   🎤 Voice Note Recorded
                 </div>
              ) : (
                 <img src={filePreview} alt="Preview" className="h-20 rounded-xl object-contain border border-white/10" />
              )}
              <button 
                onClick={() => { setFilePreview(null); setSelectedFile(null); }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              >
                <PackageX size={12} />
              </button>
            </div>
          )}
          <div className="flex items-end w-full">
            <label className="p-3 text-white/40 hover:text-white transition rounded-xl cursor-pointer shrink-0">
              <Paperclip size={20} />
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
            </label>
            
            <button 
              onClick={toggleRecording}
              className={`p-3 transition rounded-xl shrink-0 ${isRecording ? 'text-red-500 animate-pulse' : 'text-white/40 hover:text-white'}`}
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
            </button>
            
            <textarea 
              placeholder={isRecording ? "Recording... (Click square to stop)" : "Message Krish..."}
              disabled={isRecording}
              className="flex-1 max-h-32 min-h-[44px] py-3 text-[15px] bg-transparent focus:outline-none resize-none custom-scrollbar text-white placeholder-white/30"
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
            <button 
              onClick={handleSend}
              disabled={!input.trim() && !selectedFile}
              className="p-3 m-1 bg-white hover:bg-gray-200 text-black rounded-xl disabled:opacity-30 transition-all shadow-sm shrink-0"
            >
              <SendHorizontal size={18} />
            </button>
          </div>
        </div>
        <p className="text-center text-white/30 text-[11px] mt-4">RazorSense AI can make mistakes. Please verify important information.</p>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/[0.05] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
            <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><CheckCircle2 className="text-emerald-400 w-6 h-6" /> Ticket Details</h3>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-3 gap-2 border-b border-white/10 pb-3">
                  <span className="text-white/50">Ticket ID</span>
                  <span className="col-span-2 text-white font-mono">{selectedTicket.ticket_id}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-white/10 pb-3">
                  <span className="text-white/50">Order ID</span>
                  <span className="col-span-2 text-white font-mono">{selectedTicket.order_id || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-white/10 pb-3">
                  <span className="text-white/50">Product</span>
                  <span className="col-span-2 text-white">{selectedTicket.product || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-white/10 pb-3">
                  <span className="text-white/50">Merchant</span>
                  <span className="col-span-2 text-white">{selectedTicket.merchant}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-white/10 pb-3">
                  <span className="text-white/50">Issue</span>
                  <span className="col-span-2 text-white">{selectedTicket.issue}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-white/10 pb-3">
                  <span className="text-white/50">Action Taken</span>
                  <span className="col-span-2 text-white">{selectedTicket.action_taken}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-white/10 pb-3">
                  <span className="text-white/50">Status</span>
                  <span className="col-span-2 text-blue-400 font-semibold">{selectedTicket.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-white/50">Date</span>
                  <span className="col-span-2 text-white">{selectedTicket.date}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function IssuePrompt({ icon: Icon, label, onClick, color }: any) {
  return (
    <motion.button 
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-5 rounded-2xl border border-white/[0.05] bg-[#111]/50 backdrop-blur-sm transition-colors text-center h-full hover:border-white/20"
    >
      <Icon size={24} className={`mb-3 ${color}`} />
      <span className="text-[13px] font-semibold text-white/90">{label}</span>
    </motion.button>
  );
}

function OrderSelectWidget({ orders, sendText }: { orders: any[], sendText: (text: string) => void }) {
  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

  const handleSubmit = () => {
    const order = orders.find(o => o.order_id === selectedOrderId);
    if (order) {
      sendText(`I select order ${order.order_id} (${order.product})`);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="p-4 text-[15px] leading-[1.5] shadow-lg bg-[#111] text-white rounded-2xl rounded-tl-sm border border-white/[0.05] self-start max-w-fit">
        I found these recent orders. Please select the one you need help with:
      </div>
      <div className="flex flex-col gap-3 mt-2 w-full max-w-md">
        {orders.map((o: any) => {
          const isSelected = selectedOrderId === o.order_id;
          return (
            <div 
              key={o.order_id} 
              onClick={() => setSelectedOrderId(o.order_id)} 
              className={`bg-[#111] p-4 rounded-xl cursor-pointer transition flex justify-between items-center group relative overflow-hidden border ${isSelected ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
            >
               <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
               <div className="flex flex-col gap-1 w-full pl-2">
                 <h4 className="text-white font-medium text-sm transition">{o.product}</h4>
                 <div className="flex justify-between items-center w-full pr-4">
                   <p className="text-white/60 text-[12px] font-mono">#{o.order_id}</p>
                   <p className="text-white/80 text-[12px] font-semibold">{o.merchant}</p>
                 </div>
                 <div className="grid grid-cols-2 gap-2 text-white/40 text-[11px] mt-2 bg-black/20 p-2 rounded-lg border border-white/5">
                   <div className="flex flex-col">
                     <span className="text-[9px] uppercase tracking-wider text-white/30">Ordered On</span>
                     <span>{new Date(o.order_date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[9px] uppercase tracking-wider text-white/30">Status</span>
                     <span className={o.status === 'Delivered' ? 'text-emerald-400/80' : 'text-blue-400/80'}>{o.status}</span>
                   </div>
                   <div className="flex flex-col col-span-2 border-t border-white/5 pt-1 mt-1">
                     <span className="text-[9px] uppercase tracking-wider text-white/30">Paid Via</span>
                     <span>{o.payment_mode || 'Online'}</span>
                   </div>
                 </div>
               </div>
               <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center border transition ${isSelected ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 border-white/10 text-white/30 group-hover:bg-white/10'}`}>
                 <CheckCircle2 className="w-4 h-4" />
               </div>
            </div>
          );
        })}
      </div>
      
      {selectedOrderId && (
        <button 
          onClick={handleSubmit}
          className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg w-full max-w-md flex items-center justify-center gap-2"
        >
          This is my purchase
        </button>
      )}

      <button 
        onClick={() => sendText("My order is not here in the list. Please help me find it using Advanced Search.")}
        className="mt-2 text-[13px] text-white/60 hover:text-white transition underline underline-offset-4 self-start"
      >
        Not here in the list
      </button>
    </div>
  );
}
