import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Copy,
  FileImage,
  ImagePlus,
  Layers3,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Settings2,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Thread = { id: string; title: string; meta: string; messages: ChatMessage[] };

type AttachedImage = { name: string; dataUrl: string };

const starterThreads: Thread[] = [
  { id: "welcome", title: "Untitled conversation", meta: "Just now", messages: [] },
  {
    id: "systems",
    title: "Designing resilient systems",
    meta: "Yesterday",
    messages: [{ role: "user", content: "How should I think about resilience in a distributed system?" }],
  },
  {
    id: "launch",
    title: "Launch narrative",
    meta: "Nov 20",
    messages: [{ role: "user", content: "Help me sharpen a product launch story." }],
  },
];

const promptCards = [
  { icon: Code2, label: "Build with me", text: "Help me design and implement a clean solution" },
  { icon: BarChart3, label: "Think it through", text: "Break down a complex decision with tradeoffs" },
  { icon: FileImage, label: "Create a visual", text: "Turn an idea into a polished image concept" },
];

export default function Home() {
  const [threads, setThreads] = useState(starterThreads);
  const [activeId, setActiveId] = useState("welcome");
  const [mode, setMode] = useState<"chat" | "create">("chat");
  const [input, setInput] = useState("");
  const [creativePrompt, setCreativePrompt] = useState("");
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeThread = threads.find(thread => thread.id === activeId) ?? threads[0];
  const chatMutation = trpc.ai.chat.useMutation();
  const analyzeMutation = trpc.ai.analyzeImage.useMutation();
  const imageMutation = trpc.ai.generateImage.useMutation();
  const isWorking = chatMutation.isPending || analyzeMutation.isPending || imageMutation.isPending;

  const setMessages = (messages: ChatMessage[]) => {
    setThreads(current => current.map(thread => thread.id === activeId ? { ...thread, messages } : thread));
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if ((!trimmed && !attachedImage) || isWorking) return;
    const userText = trimmed || "Analyze the attached image.";
    const imageToAnalyze = attachedImage;
    const next = [
      ...activeThread.messages,
      { role: "user" as const, content: imageToAnalyze ? `${userText} [${imageToAnalyze.name}]` : userText },
    ];
    setMessages(next);
    setInput("");
    setAttachedImage(null);
    if (activeThread.title === "Untitled conversation") {
      setThreads(current => current.map(thread => thread.id === activeId ? {
        ...thread,
        title: userText.slice(0, 32) + (userText.length > 32 ? "…" : ""),
      } : thread));
    }
    try {
      const result = imageToAnalyze
        ? await analyzeMutation.mutateAsync({ dataUrl: imageToAnalyze.dataUrl, question: userText })
        : await chatMutation.mutateAsync({ messages: next });
      setMessages([...next, { role: "assistant", content: result.content }]);
    } catch {
      const error = imageToAnalyze ? analyzeMutation.error : chatMutation.error;
      const detail = error instanceof Error && error.message ? ` ${error.message}` : "";
      setMessages([...next, {
        role: "assistant",
        content: `I couldn’t complete that turn.${detail} Please try again — your message is still here.`,
      }]);
    }
  };

  const handleAttachment = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setAttachedImage({ name: file.name, dataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!creativePrompt.trim() || isWorking) return;
    try {
      await imageMutation.mutateAsync({ prompt: creativePrompt.trim() });
    } catch {
      // The error state is rendered beside the result panel.
    }
  };

  const copyMessage = async (content: string, key: string) => {
    await navigator.clipboard?.writeText(content);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1500);
  };

  const isEmpty = activeThread.messages.length === 0;
  const generatedUrl = imageMutation.data?.url;
  const assistantCount = useMemo(
    () => activeThread.messages.filter(message => message.role === "assistant").length,
    [activeThread.messages],
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><span /></div>
          <div><div className="brand-name">ADEER</div><div className="brand-caption">INTELLIGENCE STUDIO</div></div>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><X size={16} /></button>
        </div>
        <button className="new-thread" onClick={() => {
          const id = `thread-${Date.now()}`;
          setThreads([{ id, title: "Untitled conversation", meta: "Just now", messages: [] }, ...threads]);
          setActiveId(id);
          setMode("chat");
          setSidebarOpen(false);
        }}><Plus size={16} /> New thread <span>⌘ K</span></button>

        <div className="sidebar-section">
          <div className="section-label"><span>WORKSPACES</span><MoreHorizontal size={14} /></div>
          <button className="workspace-item active"><Layers3 size={16} /><span>General intelligence</span><span className="live-dot" /></button>
          <button className="workspace-item"><WandSparkles size={16} /><span>Creative lab</span></button>
        </div>
        <div className="sidebar-section thread-section">
          <div className="section-label"><span>RECENT THREADS</span><Search size={14} /></div>
          {threads.map(thread => <button key={thread.id} className={`thread-item ${thread.id === activeId ? "selected" : ""}`} onClick={() => {
            setActiveId(thread.id);
            setMode("chat");
            setSidebarOpen(false);
          }}><MessageSquare size={15} /><span><strong>{thread.title}</strong><small>{thread.meta}</small></span></button>)}
        </div>
        <div className="sidebar-footer">
          <button className="profile-row"><div className="avatar">A</div><span><strong>Alex Morgan</strong><small>Personal workspace</small></span><ChevronDown size={15} /></button>
          <button className="settings-row"><Settings2 size={15} /> Workspace settings</button>
        </div>
      </aside>

      <main className="main-stage">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><Menu size={19} /></button>
          <div className="breadcrumb"><span>GENERAL INTELLIGENCE</span><span className="slash">/</span><strong>{activeThread.title}</strong></div>
          <div className="top-actions"><span className="status-chip"><span className="status-pulse" /> SYSTEMS NOMINAL</span><button className="icon-button" aria-label="Help"><CircleHelp size={18} /></button></div>
        </header>

        <div className="workspace-grid">
          <section className="conversation-panel">
            <div className="conversation-scroll">
              {isEmpty ? <div className="empty-state">
                <div className="eyebrow"><span className="eyebrow-line" /> READY WHEN YOU ARE <span className="eyebrow-line" /></div>
                <h1>Make the next move<br /><em>clearer.</em></h1>
                <p className="empty-copy">Ask anything, work through an idea, or make something visual. Adeer is built to help you move from question to useful output.</p>
                <div className="prompt-grid">{promptCards.map(card => <button key={card.label} className="prompt-card" onClick={() => card.label === "Create a visual" ? setMode("create") : setInput(card.text)}><div className="prompt-icon"><card.icon size={17} /></div><span><strong>{card.label}</strong><small>{card.text}</small></span><ArrowUp size={15} className="prompt-arrow" /></button>)}</div>
                <div className="capability-row"><span><Check size={13} /> Answers</span><span><Check size={13} /> Code</span><span><Check size={13} /> Analysis</span><span><Check size={13} /> Visuals</span></div>
              </div> : <div className="message-list">
                {activeThread.messages.map((message, index) => <div key={`${message.role}-${index}`} className={`message-row ${message.role}`}>
                  <div className="message-avatar">{message.role === "assistant" ? <Sparkles size={15} /> : "A"}</div>
                  <div className="message-body"><div className="message-meta"><span>{message.role === "assistant" ? "ADEER" : "YOU"}</span><span className="message-time">{message.role === "assistant" ? "ANSWER" : "PROMPT"}</span></div>
                    {message.role === "assistant" ? <div className="markdown-body"><Streamdown>{message.content}</Streamdown></div> : <p>{message.content}</p>}
                    {message.role === "assistant" && <button className="copy-action" onClick={() => copyMessage(message.content, `msg-${index}`)}>{copied === `msg-${index}` ? <Check size={13} /> : <Copy size={13} />} {copied === `msg-${index}` ? "Copied" : "Copy answer"}</button>}
                  </div>
                </div>)}
                {(chatMutation.isPending || analyzeMutation.isPending) && <div className="thinking-row"><div className="message-avatar"><Sparkles size={15} /></div><div><div className="message-meta"><span>ADEER</span><span className="message-time">{analyzeMutation.isPending ? "READING IMAGE" : "THINKING"}</span></div><div className="thinking-indicator"><i /><i /><i /></div></div></div>}
              </div>}
            </div>

            <div className="composer-wrap">
              <div className="composer-mode"><button className={mode === "chat" ? "mode-active" : ""} onClick={() => setMode("chat")}><Bot size={14} /> Ask Adeer</button><button className={mode === "create" ? "mode-active" : ""} onClick={() => setMode("create")}><ImagePlus size={14} /> Create visual</button><span className="composer-hint">{mode === "chat" ? "Shift + Enter for new line" : "Describe the image you want to make"}</span></div>
              {mode === "chat" ? <form className="composer" onSubmit={event => { event.preventDefault(); sendMessage(input); }}>
                <button type="button" className="attach-button" onClick={() => fileRef.current?.click()} aria-label="Attach an image"><Paperclip size={18} /></button>
                <input ref={fileRef} type="file" hidden accept="image/*" onChange={event => handleAttachment(event.target.files?.[0])} />
                {attachedImage && <button type="button" className="attachment-chip" onClick={() => setAttachedImage(null)} title="Remove attachment"><FileImage size={13} /> {attachedImage.name}<X size={12} /></button>}
                <input value={input} onChange={event => setInput(event.target.value)} placeholder={attachedImage ? "Ask about this image…" : "Ask a question, explore an idea, or paste some code…"} disabled={isWorking} />
                <button type="submit" className="send-button" disabled={(!input.trim() && !attachedImage) || isWorking} aria-label="Send message"><ArrowUp size={18} /></button>
              </form> : <div className="composer creative-composer"><WandSparkles size={18} className="creative-icon" /><input value={creativePrompt} onChange={event => setCreativePrompt(event.target.value)} onKeyDown={event => { if (event.key === "Enter") generate(); }} placeholder="A cinematic editorial still of…" disabled={isWorking} /><button className="generate-button" onClick={generate} disabled={!creativePrompt.trim() || isWorking}>{imageMutation.isPending ? "Creating…" : "Generate"}<ArrowUp size={16} /></button></div>}
              <div className="composer-footnote"><span><span className="tiny-dot" /> Adeer can be wrong. Verify important details.</span><span>{activeThread.messages.length} turns · {assistantCount} answers</span></div>
              <div className="made-by">Made by:Abderrahmen Trabelsi</div>
            </div>
          </section>

          <aside className="insight-panel">
            <div className="insight-heading"><span>CAPABILITY DECK</span><button className="icon-button" aria-label="More options"><MoreHorizontal size={16} /></button></div>
            <div className="signal-card"><div className="signal-header"><span className="signal-icon"><Sparkles size={16} /></span><span><strong>Core intelligence</strong><small>GENERAL PURPOSE MODEL</small></span><span className="signal-live">LIVE</span></div><div className="signal-bars">{Array.from({ length: 12 }, (_, index) => <span key={index} />)}</div><p>Clear answers, practical reasoning, and structured thinking for open-ended work.</p></div>
            <div className="deck-block"><div className="section-label"><span>MODES</span></div><button className={`deck-mode ${mode === "chat" ? "deck-selected" : ""}`} onClick={() => setMode("chat")}><div className="deck-mode-icon blue"><Bot size={16} /></div><span><strong>Ask anything</strong><small>Q&A · reasoning · code</small></span><span className="deck-check">{mode === "chat" && <Check size={13} />}</span></button><button className={`deck-mode ${mode === "create" ? "deck-selected" : ""}`} onClick={() => setMode("create")}><div className="deck-mode-icon violet"><ImagePlus size={16} /></div><span><strong>Create visuals</strong><small>Prompt · refine · generate</small></span><span className="deck-check">{mode === "create" && <Check size={13} />}</span></button></div>
            <div className="deck-block trust-block"><div className="section-label"><span>TRUST LAYER</span><span className="green-label">ACTIVE</span></div><p>Answers are designed to be useful, not overconfident. For medical, legal, financial, or time-sensitive decisions, treat the output as a starting point and verify it.</p><div className="trust-meter"><span style={{ width: "82%" }} /></div><div className="meter-caption"><span>CALIBRATION</span><strong>82%</strong></div></div>
            {generatedUrl && <div className="result-card"><div className="section-label"><span>LAST CREATION</span><button className="icon-button" onClick={() => copyMessage(generatedUrl, "image")} aria-label="Copy image URL"><Copy size={13} /></button></div><img src={generatedUrl} alt="Generated visual" /><a href={generatedUrl} target="_blank" rel="noreferrer">Open full-size preview ↗</a></div>}
            {imageMutation.isError && <div className="error-note">The visual service could not finish this request. {imageMutation.error instanceof Error ? imageMutation.error.message : "Try a simpler prompt or retry."}</div>}
            <div className="panel-footer"><span>ADEER / 01</span><span>v0.1.0</span></div>
          </aside>
        </div>
      </main>
    </div>
  );
}
