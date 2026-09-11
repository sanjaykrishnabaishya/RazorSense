import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal, Paperclip, Loader2, CheckCircle2, RefreshCcw, Package, PackageX, AlertTriangle, CreditCard, Search, Clock, HelpCircle, FileText, ChevronRight, Mic, Square, X } from 'lucide-react';
import { ChatMessage } from '../../types/support';
import PurchaseSearch from '../workflow/PurchaseSearch';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { audioBufferToWav } from '../../utils/wav';

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
    // Auto-login on mount
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
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
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

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

        // ── ADVANCED SEARCH widget ──
        if (display.includes('[SHOW_ADVANCED_SEARCH]')) {
          display = display.replace('[SHOW_ADVANCED_SEARCH]', '').trim();
          setMessages((prev: any) => [...prev, {
            id: (Date.now() + 3).toString(), role: 'assistant', kind: 'widget_search',
            text: 'Here is the advanced search panel:',
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

        // Update message bubble with clean text (markers stripped)
        setMessages((prev: any) => prev.map((m: any) =>
          m.id === streamMsgId ? { ...m, text: display } : m
        ));
      };

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
      console.error("Stream error:", err);
      setMessages((prev: any) => prev.map((m: any) =>
        m.id === streamMsgId ? { ...m, text: `Network error: ${err}` } : m
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
f u n c t i o n   O r d e r S e l e c t W i d g e t ( {   o r d e r s ,   s e n d T e x t   } :   {   o r d e r s :   a n y [ ] ,   s e n d T e x t :   ( t e x t :   s t r i n g )   = >   v o i d   } )   { 
     c o n s t   [ s e l e c t e d O r d e r I d ,   R e a c t _ u s e S t a t e ]   =   R e a c t . u s e S t a t e < s t r i n g   |   n u l l > ( n u l l ) ; 
     
     c o n s t   h a n d l e S u b m i t   =   ( )   = >   { 
         c o n s t   o r d e r   =   o r d e r s . f i n d ( o   = >   o . o r d e r _ i d   = = =   s e l e c t e d O r d e r I d ) ; 
         i f   ( o r d e r )   { 
             s e n d T e x t ( " I   s e l e c t   o r d e r   "   +   o r d e r . o r d e r _ i d   +   "   ( "   +   o r d e r . p r o d u c t   +   " ) " ) ; 
         } 
     } ; 
 
     r e t u r n   ( 
         < d i v   c l a s s N a m e = " f l e x   f l e x - c o l   g a p - 3   w - f u l l " > 
             < d i v   c l a s s N a m e = " p - 4   t e x t - [ 1 5 p x ]   l e a d i n g - [ 1 . 5 ]   s h a d o w - l g   b g - [ # 1 1 1 ]   t e x t - w h i t e   r o u n d e d - 2 x l   r o u n d e d - t l - s m   b o r d e r   b o r d e r - w h i t e / [ 0 . 0 5 ]   s e l f - s t a r t   m a x - w - f i t " > 
                 I   f o u n d   t h e s e   r e c e n t   o r d e r s .   P l e a s e   s e l e c t   t h e   o n e   y o u   n e e d   h e l p   w i t h : 
             < / d i v > 
             < d i v   c l a s s N a m e = " f l e x   f l e x - c o l   g a p - 3   m t - 2   w - f u l l   m a x - w - m d " > 
                 { o r d e r s . m a p ( ( o :   a n y )   = >   { 
                     c o n s t   i s S e l e c t e d   =   s e l e c t e d O r d e r I d   = = =   o . o r d e r _ i d ; 
                     r e t u r n   ( 
                         < d i v   
                             k e y = { o . o r d e r _ i d }   
                             o n C l i c k = { ( )   = >   R e a c t _ u s e S t a t e ( o . o r d e r _ i d ) }   
                             c l a s s N a m e = { ` b g - [ # 1 1 1 ]   p - 4   r o u n d e d - x l   c u r s o r - p o i n t e r   t r a n s i t i o n   f l e x   j u s t i f y - b e t w e e n   i t e m s - c e n t e r   g r o u p   r e l a t i v e   o v e r f l o w - h i d d e n   b o r d e r   $ { i s S e l e c t e d   ?   " b o r d e r - b l u e - 5 0 0   b g - b l u e - 5 0 0 / 5 "   :   " b o r d e r - w h i t e / 1 0   h o v e r : b o r d e r - w h i t e / 2 0   h o v e r : b g - w h i t e / 5 " } ` } 
                         > 
                               < d i v   c l a s s N a m e = { ` a b s o l u t e   l e f t - 0   t o p - 0   b o t t o m - 0   w - 1   b g - g r a d i e n t - t o - b   f r o m - b l u e - 5 0 0   t o - i n d i g o - 5 0 0   t r a n s i t i o n - o p a c i t y   $ { i s S e l e c t e d   ?   " o p a c i t y - 1 0 0 "   :   " o p a c i t y - 0   g r o u p - h o v e r : o p a c i t y - 1 0 0 " } ` } > < / d i v > 
                               < d i v   c l a s s N a m e = " f l e x   f l e x - c o l   g a p - 1   w - f u l l   p l - 2 " > 
                                   < h 4   c l a s s N a m e = " t e x t - w h i t e   f o n t - m e d i u m   t e x t - s m   t r a n s i t i o n " > { o . p r o d u c t } < / h 4 > 
                                   < d i v   c l a s s N a m e = " f l e x   j u s t i f y - b e t w e e n   i t e m s - c e n t e r   w - f u l l   p r - 4 " > 
                                       < p   c l a s s N a m e = " t e x t - w h i t e / 6 0   t e x t - [ 1 2 p x ]   f o n t - m o n o " > # { o . o r d e r _ i d } < / p > 
                                       < p   c l a s s N a m e = " t e x t - w h i t e / 8 0   t e x t - [ 1 2 p x ]   f o n t - s e m i b o l d " > { o . m e r c h a n t } < / p > 
                                   < / d i v > 
                                   < d i v   c l a s s N a m e = " g r i d   g r i d - c o l s - 2   g a p - 2   t e x t - w h i t e / 4 0   t e x t - [ 1 1 p x ]   m t - 2   b g - b l a c k / 2 0   p - 2   r o u n d e d - l g   b o r d e r   b o r d e r - w h i t e / 5 " > 
                                       < d i v   c l a s s N a m e = " f l e x   f l e x - c o l " > 
                                           < s p a n   c l a s s N a m e = " t e x t - [ 9 p x ]   u p p e r c a s e   t r a c k i n g - w i d e r   t e x t - w h i t e / 3 0 " > O r d e r e d   O n < / s p a n > 
                                           < s p a n > { n e w   D a t e ( o . o r d e r _ d a t e ) . t o L o c a l e D a t e S t r i n g ( " e n - G B " ,   { d a y :   " n u m e r i c " ,   m o n t h :   " s h o r t " ,   y e a r :   " n u m e r i c " } ) } < / s p a n > 
                                       < / d i v > 
                                       < d i v   c l a s s N a m e = " f l e x   f l e x - c o l " > 
                                           < s p a n   c l a s s N a m e = " t e x t - [ 9 p x ]   u p p e r c a s e   t r a c k i n g - w i d e r   t e x t - w h i t e / 3 0 " > S t a t u s < / s p a n > 
                                           < s p a n   c l a s s N a m e = { o . s t a t u s   = = =   " D e l i v e r e d "   ?   " t e x t - e m e r a l d - 4 0 0 / 8 0 "   :   " t e x t - b l u e - 4 0 0 / 8 0 " } > { o . s t a t u s } < / s p a n > 
                                       < / d i v > 
                                       < d i v   c l a s s N a m e = " f l e x   f l e x - c o l   c o l - s p a n - 2   b o r d e r - t   b o r d e r - w h i t e / 5   p t - 1   m t - 1 " > 
                                           < s p a n   c l a s s N a m e = " t e x t - [ 9 p x ]   u p p e r c a s e   t r a c k i n g - w i d e r   t e x t - w h i t e / 3 0 " > P a i d   V i a < / s p a n > 
                                           < s p a n > { o . p a y m e n t _ m o d e   | |   " O n l i n e " } < / s p a n > 
                                       < / d i v > 
                                   < / d i v > 
                               < / d i v > 
                               < d i v   c l a s s N a m e = { ` h - 8   w - 8   s h r i n k - 0   r o u n d e d - f u l l   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   b o r d e r   t r a n s i t i o n   $ { i s S e l e c t e d   ?   " b g - b l u e - 5 0 0 / 2 0   b o r d e r - b l u e - 5 0 0 / 5 0   t e x t - b l u e - 4 0 0   s h a d o w - [ 0 _ 0 _ 1 5 p x _ r g b a ( 5 9 , 1 3 0 , 2 4 6 , 0 . 5 ) ] "   :   " b g - w h i t e / 5   b o r d e r - w h i t e / 1 0   t e x t - w h i t e / 3 0   g r o u p - h o v e r : b g - w h i t e / 1 0 " } ` } > 
                                   < C h e c k C i r c l e 2   c l a s s N a m e = " w - 4   h - 4 "   / > 
                               < / d i v > 
                         < / d i v > 
                     ) ; 
                 } ) } 
             < / d i v > 
             
             { s e l e c t e d O r d e r I d   & &   ( 
                 < b u t t o n   
                     o n C l i c k = { h a n d l e S u b m i t } 
                     c l a s s N a m e = " m t - 2   b g - b l u e - 6 0 0   h o v e r : b g - b l u e - 5 0 0   t e x t - w h i t e   f o n t - s e m i b o l d   p y - 3   p x - 6   r o u n d e d - x l   t r a n s i t i o n   s h a d o w - l g   w - f u l l   m a x - w - m d   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   g a p - 2 " 
                 > 
                     T h i s   i s   m y   p u r c h a s e 
                 < / b u t t o n > 
             ) } 
 
             < b u t t o n   
                 o n C l i c k = { ( )   = >   s e n d T e x t ( " M y   o r d e r   i s   n o t   h e r e   i n   t h e   l i s t .   P l e a s e   c o n n e c t   m e   t o   a   h u m a n   e x e c u t i v e . " ) } 
                 c l a s s N a m e = " m t - 2   t e x t - [ 1 3 p x ]   t e x t - w h i t e / 6 0   h o v e r : t e x t - w h i t e   t r a n s i t i o n   u n d e r l i n e   u n d e r l i n e - o f f s e t - 4   s e l f - s t a r t " 
             > 
                 N o t   h e r e   i n   t h e   l i s t 
             < / b u t t o n > 
         < / d i v > 
     ) ; 
 }  
 