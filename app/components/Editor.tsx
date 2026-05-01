"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Bold, BookOpen, ChevronDown, ChevronLeft, ChevronRight, Code, Download, Eye,
  FileCode2, FileText, Folder, Heading1, Heading2, Heading3, HelpCircle, Italic, LayoutGrid,
  Lightbulb, Link2, List, ListOrdered, MessageCircle, MessageSquare, Minus, Pause, PenLine,
  Play, Plus, Quote, RefreshCw, RotateCcw, RotateCw, Send, Settings, Sparkles, Strikethrough,
  Table2, Target, Underline, Upload, User, PlayCircle, Check, X
} from "lucide-react";

type Flashcard = { question: string; answer: string };
type QuizItem = { question: string; options: string[]; answer: number; hint: string; };
type MindMapData = { title: string; nodes: string[]; };
type ChatMessage = { role: "user" | "ai"; content: string; };
type GenerationCount = 15 | 25 | 30;

type ApiResponse = {
  result?: string;
  error?: string;
  cards?: Flashcard[];
  summary?: string;
  quiz?: QuizItem[];
  mindmap?: MindMapData;
  reply?: string;
};

type HistoryItem = {
  fileKey: string;
  fileName: string;
  title: string;
  subject?: string; 
  createdAt: number;
  cards: Flashcard[];
  summaryHtml: string;
  quizItems: QuizItem[];
  mindmapData: MindMapData | null;
  chatMessages: ChatMessage[];
  rawText: string;
  generationCount?: GenerationCount;
};

type TabName = "Note" | "Mind Map" | "Flashcards" | "Quiz" | "Documents" | "Chat";

const STORAGE_KEY = "pdf_ai_history_dashboard_v1";

const navItems: { label: TabName; icon: any }[] = [
  { label: "Note", icon: PenLine }, { label: "Mind Map", icon: LayoutGrid },
  { label: "Flashcards", icon: BookOpen }, { label: "Quiz", icon: HelpCircle },
  { label: "Documents", icon: Folder }, { label: "Chat", icon: MessageCircle },
];

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function markdownToHtml(text: string) {
  if (!text) return "";
  let safe = escapeHtml(text);

  // 1. Ubah tanda # menjadi Heading dengan styling CSS Tailwind yang rapi
  safe = safe.replace(/^###\s+(.*)/gm, '<h3 class="text-lg font-bold text-white mt-5 mb-2">$1</h3>');
  safe = safe.replace(/^##\s+(.*)/gm, '<h2 class="text-xl font-extrabold text-indigo-400 mt-6 mb-3">$1</h2>');
  safe = safe.replace(/^#\s+(.*)/gm, '<h1 class="text-2xl font-black text-[#5546ED] mt-8 mb-4">$1</h1>');

  // 2. Ubah tanda bintang menjadi Bold & Italic
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>');
  safe = safe.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 3. Proses tiap baris agar peluru (bullet) dan angka tertata rapi
  return safe.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "<br/>";
    
    // Jika baris ini sudah diubah jadi Heading (H1/H2/H3), biarkan saja
    if (trimmed.startsWith("<h")) return trimmed;
    
    // Deteksi Bullet Points (* atau -)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return `<div class="ml-5 flex gap-3 mb-2"><span class="text-[#5546ED] font-black mt-0.5">•</span> <span class="leading-relaxed">${trimmed.substring(2)}</span></div>`;
    }
    
    // Deteksi Angka List (1. 2. 3. dst)
    if (/^\d+\.\s/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+\.)\s(.*)/);
      if (numMatch) {
        return `<div class="ml-5 flex gap-2 mb-2"><span class="text-indigo-400 font-black">${numMatch[1]}</span> <span class="leading-relaxed">${numMatch[2]}</span></div>`;
      }
    }
    
    // Paragraf biasa
    return `<p class="mb-3 leading-relaxed">${trimmed}</p>`;
  }).join("");
}

function stripExtension(fileName: string) { return fileName.replace(/\.[^/.]+$/, ""); }

interface EditorProps {
  initialFile: File | null;
  initialYoutubeUrl?: string | null;
  initialFileKey: string | null;
  initialSubject?: string;
  initialGenerationCount?: GenerationCount;
  isManualMode?: boolean;
  initialTitle?: string; // <--- PROPS BARU UNTUK MODE MANUAL
  onBack: () => void;
}

export default function Editor({ initialFile, initialYoutubeUrl, initialFileKey, initialSubject, initialGenerationCount = 15, isManualMode, initialTitle, onBack }: EditorProps) {
  const [activeTab, setActiveTab] = useState<TabName>("Note");
  const [title, setTitle] = useState("Catatan Baru");
  const [result, setResult] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [mindmapData, setMindmapData] = useState<MindMapData | null>(null);
  const [summaryHtml, setSummaryHtml] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeFileKey, setActiveFileKey] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  const [showGenerationLoading, setShowGenerationLoading] = useState(() => Boolean(initialFile || initialYoutubeUrl));
const [loadingProgress, setLoadingProgress] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");
  // States UI
  const [currentFlashIdx, setCurrentFlashIdx] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [mindmapZoom, setMindmapZoom] = useState(1);
  const [isRegeneratingMap, setIsRegeneratingMap] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25 * 60); 
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // EFEK SIMULASI PROGRESS BAR DINAMIS
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showGenerationLoading) {
      setLoadingProgress(0);
      interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 98) return 98; // Mentok di 98% sampai proses beneran selesai
          // Di bawah 50% akan sangat cepat, di atas 50% akan melambat natural
          const increment = prev < 50 ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 3) + 1;
          return Math.min(prev + increment, 98);
        });
      }, 600);
    } else {
      setLoadingProgress(100); // Langsung 100% jika loading selesai
    }
    return () => clearInterval(interval);
  }, [showGenerationLoading]);

  useEffect(() => { return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }; }, [pdfUrl]);

  // Load History & Setup Awal
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsedHistory = saved ? JSON.parse(saved) : [];
      setHistory(parsedHistory); 
      setIsHistoryLoaded(true);

      if (isManualMode && initialFileKey) {
        // Jika mode tulis manual, siapkan lembar kosong dengan fileKey yang diberikan
        setActiveFileKey(initialFileKey);
        setActiveFileName("Catatan Manual");
        setTitle(initialTitle || "Catatan Baru");
        setSummaryHtml("");
        setCards([]);
        setQuizItems([]);
        setMindmapData(null);
        setRawText("");
        setPdfUrl(null);
        setActiveTab("Note");
      } else if (initialFile) {
        processFile(initialFile, parsedHistory, true);
      } else if (initialYoutubeUrl) {
        processYoutubeUrl(initialYoutubeUrl, parsedHistory, true);
      } else if (initialFileKey) {
        const item = parsedHistory.find((h: HistoryItem) => h.fileKey === initialFileKey);
        if (item) loadHistoryItem(item);
      }
    } catch { setHistory([]); setIsHistoryLoaded(true); }
  }, [initialFile, initialYoutubeUrl, initialFileKey, isManualMode, initialTitle, initialGenerationCount]);

  useEffect(() => {
    if (isHistoryLoaded) try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch {}
  }, [history, isHistoryLoaded]);

  useEffect(() => {
    if (activeTab === "Note" && summaryRef.current && summaryRef.current.innerHTML !== summaryHtml) {
      summaryRef.current.innerHTML = summaryHtml;
    }
  }, [summaryHtml, activeTab, activeFileKey]);

  useEffect(() => {
    if (activeTab === "Chat") chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeTab, isChatting]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    else if (timeLeft === 0) setIsTimerRunning(false);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (sec: number) => `${Math.floor(sec / 60).toString().padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;
  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => { setIsTimerRunning(false); setTimeLeft(timerDuration); };
  
  const handleSetTimer = (minutes: number) => {
    const newSeconds = minutes * 60;
    setTimerDuration(newSeconds);
    setTimeLeft(newSeconds);
    setIsTimerRunning(false);
    setShowTimerSettings(false); // Tutup menu setting otomatis setelah memilih
  };
  

  const getFileKey = (file: File) => `${file.name}__${file.size}__${file.lastModified}`;

  const upsertHistory = (item: HistoryItem, contextHistory: HistoryItem[] = history) => {
    const nextHist = [...contextHistory];
    const idx = nextHist.findIndex((h) => h.fileKey === item.fileKey);
    if (idx >= 0) nextHist[idx] = { ...nextHist[idx], ...item, createdAt: nextHist[idx].createdAt };
    else nextHist.unshift(item);
    const finalHist = nextHist.slice(0, 50);
    setHistory(finalHist);
    return finalHist;
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setActiveFileKey(item.fileKey); setActiveFileName(item.fileName); setTitle(item.title || stripExtension(item.fileName));
    setResult(""); setCards(item.cards || []); setQuizItems(item.quizItems || []);
    setMindmapData(item.mindmapData || null); setSummaryHtml(item.summaryHtml || "");
    setChatMessages(item.chatMessages || []); setRawText(item.rawText || ""); setPdfUrl(null);
    setCurrentFlashIdx(0); setFlashFlipped(false); setCurrentQuizIdx(0); setSelectedAnswer(null); setShowHint(false); setMindmapZoom(1); setActiveTab("Note");
  };

  const syncCurrentHistory = (nextValues?: Partial<HistoryItem>) => {
    if (!activeFileKey) return;
    const currentItem = history.find((h) => h.fileKey === activeFileKey);
    if (!currentItem) {
      // Jika belum ada di history (contoh: baru mulai tulis manual), buat baru
      upsertHistory({
        fileKey: activeFileKey,
        fileName: activeFileName || "Catatan Manual",
        title: title || "Catatan Baru",
        subject: initialSubject || "Subjek Umum",
        createdAt: Date.now(),
        cards: cards,
        summaryHtml: summaryHtml,
        quizItems: quizItems,
        mindmapData: mindmapData,
        chatMessages: chatMessages,
        rawText: rawText,
        generationCount: initialGenerationCount,
        ...nextValues
      });
      return;
    }
    upsertHistory({ ...currentItem, title, cards, summaryHtml, quizItems, mindmapData, chatMessages, rawText, ...nextValues });
  };

  const handleSummaryInput = () => {
    const html = summaryRef.current?.innerHTML ?? "";
    const text = summaryRef.current?.innerText ?? ""; // Mengambil teks tanpa HTML
    setSummaryHtml(html); 
    setRawText(text); // SINKRONKAN KE STATE RAWTEXT
    syncCurrentHistory({ summaryHtml: html, rawText: text });
  };

  const handleTitleChange = (value: string) => {
    setTitle(value); syncCurrentHistory({ title: value });
  };

  const applyFormat = (cmd: string, val?: string) => {
    summaryRef.current?.focus(); document.execCommand(cmd, false, val); handleSummaryInput();
  };

  const ToolbarButton = ({ icon: Icon, command, value }: { icon: any, command?: string, value?: string }) => (
    <button onMouseDown={(e) => e.preventDefault()} onClick={() => { if (command === "createLink") { const url = window.prompt("URL:"); if (url) applyFormat(command, url); } else if (command) applyFormat(command, value); }} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors">
      <Icon className="h-[14px] w-[14px]" />
    </button>
  );

  const generateAIPayload = async (
    textToProcess: string,
    fileKey: string,
    fileName: string,
    fallbackTitle: string,
    contextHistory: HistoryItem[],
    preserveExistingSummary = false
  ) => {
    const truncatedText = textToProcess.slice(0, 4000);
    setRawText(truncatedText);

    const [flashRes, summaryRes, quizRes, mindmapRes] = await Promise.all([
      fetch("/api/flashcard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: truncatedText, mode: "flashcard", count: initialGenerationCount }) }),
      fetch("/api/flashcard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: truncatedText, mode: "summary" }) }),
      fetch("/api/flashcard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: truncatedText, mode: "quiz", count: initialGenerationCount }) }),
      fetch("/api/flashcard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: truncatedText, mode: "mindmap" }) })
    ]);

    const [flashRaw, summaryRaw, quizRaw, mindmapRaw] = await Promise.all([flashRes.text(), summaryRes.text(), quizRes.text(), mindmapRes.text()]);

    let flashData: ApiResponse = {}; let summaryData: ApiResponse = {}; let quizData: ApiResponse = {}; let mapData: ApiResponse = {};
    try { flashData = JSON.parse(flashRaw); } catch {}
    try { summaryData = JSON.parse(summaryRaw); } catch {}
    try { quizData = JSON.parse(quizRaw); } catch {}
    try { mapData = JSON.parse(mindmapRaw); } catch {}

    const finalCards = flashData.cards || [];
    const finalSummaryHtml = markdownToHtml(summaryData.summary ?? "");
    const finalQuizItems = quizData.quiz || [];
    const finalMindmap = mapData.mindmap || null;

    setCards(finalCards); 
    if (!preserveExistingSummary) {
      setSummaryHtml(finalSummaryHtml); 
    }
    setQuizItems(finalQuizItems); 
    setMindmapData(finalMindmap);
    setChatMessages([]); setResult(""); 
    
    if (!preserveExistingSummary) setActiveTab("Note");

    const finalSubject = initialSubject || "Subjek Umum";

    upsertHistory({
      fileKey, 
      fileName, 
      title: preserveExistingSummary ? title : fallbackTitle, 
      subject: finalSubject, 
      createdAt: Date.now(),
      cards: finalCards, 
      summaryHtml: preserveExistingSummary ? summaryHtml : finalSummaryHtml,
      quizItems: finalQuizItems, 
      mindmapData: finalMindmap, 
      chatMessages: [], 
      rawText: truncatedText,
      generationCount: initialGenerationCount,
    }, contextHistory);
  };

  // =========================================================================
  // FUNGSI BARU: GENERATE DARI CATATAN MANUAL
  // =========================================================================
  const generateFromCurrentNote = async () => {
    // KUNCI PERBAIKAN: Ambil teks dari innerText, jika kosong ambil dari state rawText
    const currentText = summaryRef.current?.innerText || rawText || "";
    
    // Debug untuk memastikan teks terbaca (bisa dihapus nanti)
    console.log("Teks yang terbaca AI:", currentText);

    if (currentText.trim().length < 50) {
      alert("Tuliskan catatan yang agak panjang dulu ya (minimal 50 karakter) agar AI bisa mempelajarinya!");
      return;
    }

    setLoading(true);
    try {
      // Kirim currentText yang sudah kita ambil tadi
      await generateAIPayload(
        currentText, 
        activeFileKey!, 
        "Catatan Manual", 
        title, 
        history,
        true
      );
    } catch (err) {
      alert("Gagal generate konten AI. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (file: File, contextHistory: HistoryItem[], useFullScreenLoading = false) => {
    const fileKey = getFileKey(file);
    let cached = contextHistory.find((h) => h.fileKey === fileKey);

    if (useFullScreenLoading) setShowGenerationLoading(true);
    setLoading(true); setResult(""); setActiveFileKey(fileKey); setActiveFileName(file.name); setTitle(stripExtension(file.name));
    setPdfUrl(URL.createObjectURL(file));

    if (cached && (cached.generationCount ?? 15) === initialGenerationCount) {
      if (initialSubject && cached.subject !== initialSubject) {
        cached = { ...cached, subject: initialSubject };
        upsertHistory(cached, contextHistory);
      }
      loadHistoryItem(cached); 
      setPdfUrl(URL.createObjectURL(file)); 
      setLoading(false); 
      if (useFullScreenLoading) setShowGenerationLoading(false);
      return;
    }

    try {
      setCards([]); setQuizItems([]); setMindmapData(null); setSummaryHtml(""); setChatMessages([]);
      let text = ""; const fileNameLower = file.name.toLowerCase();

      if (fileNameLower.endsWith(".pdf")) {
        const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer(); const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i); const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
      } else if (fileNameLower.endsWith(".pptx")) {
        const JSZip = (await import("jszip")).default; const zip = new JSZip(); const loadedZip = await zip.loadAsync(file);
        const slideFiles = Object.keys(loadedZip.files).filter(name => name.startsWith("ppt/slides/slide") && name.endsWith(".xml"));
        for (const slide of slideFiles) {
          const content = await loadedZip.file(slide)?.async("string");
          if (content) {
            const matches = content.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
            if (matches) text += matches.map((m: string) => m.replace(/<a:t[^>]*>/, "").replace(/<\/a:t>/, "")).join(" ") + "\n";
          }
        }
        if (!text.trim()) throw new Error("Tidak ada teks di PPTX ini.");
      } else throw new Error("Format file tidak didukung.");

      await generateAIPayload(text, fileKey, file.name, stripExtension(file.name), contextHistory);
    } catch (err: any) { setResult(err?.message ?? "Terjadi error"); } finally { setLoading(false); if (useFullScreenLoading) setShowGenerationLoading(false); }
  };

  const processYoutubeUrl = async (url: string, contextHistory: HistoryItem[], useFullScreenLoading = false) => {
    let cached = contextHistory.find((h) => h.fileKey === url);
    if (useFullScreenLoading) setShowGenerationLoading(true);
    setLoading(true); setResult(""); setActiveFileKey(url); setActiveFileName("Mengekstrak YouTube..."); setTitle("Loading..."); setPdfUrl(null);

    if (cached && (cached.generationCount ?? 15) === initialGenerationCount) {
      if (initialSubject && cached.subject !== initialSubject) {
        cached = { ...cached, subject: initialSubject };
        upsertHistory(cached, contextHistory);
      }
      loadHistoryItem(cached); 
      setLoading(false); 
      if (useFullScreenLoading) setShowGenerationLoading(false);
      return;
    }

    try {
      setCards([]); setQuizItems([]); setMindmapData(null); setSummaryHtml(""); setChatMessages([]);
      const res = await fetch("/api/youtube", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil YouTube");

      const actualTitle = data.title || "Catatan YouTube";
      setActiveFileName("YouTube Video"); setTitle(actualTitle);

      await generateAIPayload(data.text, url, "YouTube Video", actualTitle, contextHistory);
    } catch (err: any) { setResult(err?.message ?? "Gagal memproses link YouTube."); } finally { setLoading(false); if (useFullScreenLoading) setShowGenerationLoading(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; await processFile(file, history); e.target.value = "";
  };

  const nextFlash = () => { setFlashFlipped(false); setCurrentFlashIdx((prev) => (prev + 1) % cards.length); };
  const prevFlash = () => { setFlashFlipped(false); setCurrentFlashIdx((prev) => (prev - 1 + cards.length) % cards.length); };
  const nextQuiz = () => { setSelectedAnswer(null); setShowHint(false); setCurrentQuizIdx((prev) => (prev + 1) % quizItems.length); };
  const prevQuiz = () => { setSelectedAnswer(null); setShowHint(false); setCurrentQuizIdx((prev) => (prev - 1 + quizItems.length) % quizItems.length); };

  const regenerateMindmap = async () => {
    if (!rawText || !activeFileKey) return; setIsRegeneratingMap(true);
    try {
      const res = await fetch("/api/flashcard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: rawText, mode: "mindmap" }) });
      const data = await res.json();
      if (data.mindmap) { setMindmapData(data.mindmap); syncCurrentHistory({ mindmapData: data.mindmap }); }
    } catch (err) {} finally { setIsRegeneratingMap(false); }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !activeFileKey) return;
    const newMessages: ChatMessage[] = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newMessages); setIsChatting(true);
    try {
      const res = await fetch("/api/flashcard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: rawText, mode: "chat", messages: newMessages.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })) }) });
      const data = await res.json();
      if (data.reply) {
        const finalMessages: ChatMessage[] = [...newMessages, { role: "ai", content: data.reply }];
        setChatMessages(finalMessages); syncCurrentHistory({ chatMessages: finalMessages });
      }
    } catch (error) { setChatMessages([...newMessages, { role: "ai", content: "Maaf, error." }]); } finally { setIsChatting(false); }
  };

  const handleSendChatForm = (e: React.FormEvent) => { e.preventDefault(); sendMessage(chatInput); setChatInput(""); };

  // --- UI MODAL PREMIUM (Dipisah agar bisa dipanggil dari banyak tempat) ---
  const upgradeModalUI = showUpgradeModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4 animate-in fade-in duration-300">
      <div className="bg-[#1f2029] border border-white/10 rounded-[28px] shadow-2xl w-full max-w-[600px] max-h-[92dvh] overflow-y-auto relative p-6 md:p-10 animate-in zoom-in-95 duration-300 text-left">
        {/* Close Button */}
        <button onClick={() => setShowUpgradeModal(false)} className="absolute top-6 right-6 text-white/40 hover:text-white transition">
          <X className="h-6 w-6" />
        </button>

        {/* Headers */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-3">Upgrade to Premium</h2>
        <p className="text-white/70 text-center mb-10 text-[15px]">Join <b className="text-white">1,000,000+</b> students learning smarter with belajar.ai</p>

        {/* Features List */}
        <div className="space-y-4 mb-10 max-w-[480px] mx-auto">
          <div className="flex items-start gap-3"><Check className="h-5 w-5 text-white shrink-0" /><p className="text-white/90 text-sm"><b className="text-white">Unlimited uploads</b> — PDFs, lectures, videos — all processed by AI</p></div>
          <div className="flex items-start gap-3"><Check className="h-5 w-5 text-white shrink-0" /><p className="text-white/90 text-sm"><b className="text-white">Unlimited quizzes & flashcards</b> — Auto-generated from your material</p></div>
          <div className="flex items-start gap-3"><Check className="h-5 w-5 text-white shrink-0" /><p className="text-white/90 text-sm"><b className="text-white">AI tutor 24/7</b> — Ask anything, understand everything</p></div>
          <div className="flex items-start gap-3"><Check className="h-5 w-5 text-white shrink-0" /><p className="text-white/90 text-sm"><b className="text-white">Unlimited study podcasts</b> — Learn on the go, anytime</p></div>
          <div className="flex items-start gap-3"><Check className="h-5 w-5 text-white shrink-0" /><p className="text-white/90 text-sm"><b className="text-white">Faster AI</b> — Notes and edits in seconds</p></div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div onClick={() => setSelectedPlan("annual")} className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 border-2 ${selectedPlan === "annual" ? "bg-[#5a8b5e]/20 border-[#6fb073]" : "bg-white/5 border-transparent hover:bg-white/10"}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7c5fba] text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">50% off</div>
            <div className="text-center mt-2">
              <div className="text-white font-bold mb-2">Annual</div>
              <div className="text-3xl font-extrabold text-white mb-2">Rp 30.000 <span className="text-sm text-white/50 font-medium">/ mo</span></div>
              <div className="text-xs text-white/60">billed yearly · Rp 1.000/day</div>
            </div>
          </div>
          <div onClick={() => setSelectedPlan("monthly")} className={`rounded-2xl p-5 cursor-pointer transition-all duration-200 border-2 mt-2 md:mt-0 ${selectedPlan === "monthly" ? "bg-[#5a8b5e]/20 border-[#6fb073]" : "bg-[#2a2c36] border-transparent hover:bg-[#333541]"}`}>
            <div className="text-center mt-2">
              <div className="text-white font-bold mb-2">Monthly</div>
              <div className="text-3xl font-extrabold text-white mb-2">Rp 60.000 <span className="text-sm text-white/50 font-medium">/ mo</span></div>
              <div className="text-xs text-white/60">billed monthly · Rp 2.000/day</div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8869c9] to-[#6d54a5] hover:opacity-90 text-white font-bold text-lg flex items-center justify-center gap-2 transition-opacity shadow-lg shadow-purple-900/20">
          <Sparkles className="h-5 w-5" /> Upgrade Now
        </button>
        <p className="text-center text-white/40 text-xs mt-6">Join 1 million people studying smarter with belajar.ai</p>
      </div>
    </div>
  );

  // --- TAMPILAN LAYAR LOADING KETIKA PROSES AI BERJALAN ---
  if (showGenerationLoading) {
    return (
      <div className="h-screen overflow-hidden bg-[#11131f] text-white flex items-center justify-center px-6 relative">
        <div className="w-full max-w-[420px] text-center">
          <div className="relative mx-auto mb-8 h-24 w-24">
            <div className="absolute inset-0 rounded-[28px] border border-[#5546ED]/30 bg-[#5546ED]/10 shadow-2xl shadow-[#5546ED]/20" />
            <div className="absolute inset-3 rounded-[22px] bg-[#202438] border border-white/10 flex items-center justify-center">
              <RefreshCw className="h-9 w-9 text-[#7c6cff] animate-spin" />
            </div>
          </div>
          
          <h1 className="text-[28px] font-black tracking-tight mb-3">Sedang membuat materi belajar</h1>
          <p className="text-white/55 text-[15px] leading-relaxed mb-7">
            AI sedang mengekstrak dokumen, membuat ringkasan, flashcards, quiz, dan mind map.
          </p>

          {/* PROGRESS BAR DINAMIS */}
          <div className="mb-2 flex justify-between text-xs font-bold text-white/50">
            <span>Memproses AI...</span>
            <span>{loadingProgress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#5546ED] to-[#7c6cff] transition-all duration-500 ease-out" 
              style={{ width: `${loadingProgress}%` }} 
            />
          </div>

          {/* TOMBOL UPGRADE SAAT LOADING */}
          <button 
            onClick={() => setShowUpgradeModal(true)} 
            className="mt-8 px-5 py-2.5 rounded-full bg-[#7c5fba]/10 border border-[#7c5fba]/20 text-[#cbb8fc] hover:text-white text-sm font-semibold hover:bg-[#7c5fba]/20 transition flex items-center justify-center gap-2 mx-auto shadow-lg shadow-purple-500/5"
          >
            <Sparkles className="h-4 w-4" /> Upgrade ke Pro buat proses lebih cepat
          </button>

        </div>
        
        {/* Render Modal jika di-klik */}
        {upgradeModalUI}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] md:h-screen overflow-auto md:overflow-hidden bg-[#11131f] text-white">
      <div className="flex min-h-[100dvh] md:h-full flex-col md:flex-row p-2 md:p-3 gap-3">
        {/* SIDEBAR */}
        <aside className="w-full md:w-[260px] shrink-0 rounded-[20px] md:rounded-[24px] border border-white/10 bg-gradient-to-b from-[#202438] to-[#1b1f2d] shadow-2xl overflow-hidden flex flex-col">
          <div className="px-4 md:px-5 pt-4 md:pt-5 pb-3 md:pb-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg border border-white/15 bg-white/5 flex items-center justify-center"><Sparkles className="h-4 w-4 text-white" /></div>
              <div className="text-[17px] font-extrabold tracking-tight">belajar.ai</div>
            </div>
          </div>
          <div className="p-2 md:p-3 border-b border-white/10"><button onClick={onBack} className="w-full rounded-[14px] py-2.5 md:py-3 px-4 flex items-center gap-3 text-left hover:bg-white/5 transition"><ArrowLeft className="h-5 w-5 text-white/80" /><span className="text-[15px] font-bold">Kembali</span></button></div>
          <nav className="p-2 md:p-3 md:flex-1 overflow-x-auto"><div className="flex md:block gap-2 md:space-y-1.5 min-w-max md:min-w-0">{navItems.map((item) => { const Icon = item.icon; const active = item.label === activeTab; return (<button key={item.label} onClick={() => setActiveTab(item.label)} className={`shrink-0 md:w-full rounded-[14px] px-3 md:px-4 py-2.5 flex items-center gap-2 md:gap-3 text-left transition ${active ? "bg-[#5546ED] text-white shadow-lg shadow-[#5546ED]/20" : "hover:bg-white/5 text-white/70"}`}><Icon className={`h-4 w-4 ${active ? "text-white" : "text-white/80"}`} /><span className="text-[13px] md:text-[14px] font-semibold whitespace-nowrap">{item.label}</span></button>); })}</div></nav>
          <div className="hidden md:block p-4 border-t border-white/10"><button onClick={() => setShowUpgradeModal(true)} className="w-full rounded-[14px] bg-[#5546ED] hover:bg-[#4A28C1] transition py-3 text-[14px] font-bold flex items-center justify-center gap-2 text-white shadow-lg shadow-[#5546ED]/20"><Sparkles className="h-4 w-4" />Upgrade</button></div>
          <div className="hidden md:block px-4 pb-4 relative">
  
  {/* 1. PLACEHOLDER (Tak Terlihat) */}
  <div className="invisible p-3 pointer-events-none">
    <div className="flex items-center gap-2.5">
      <Target className="h-4 w-4" />
      <div>
        <div className="font-semibold text-[13px]">Focus</div>
        <div className="text-[20px] mt-0.5">25:00</div>
      </div>
    </div>
  </div>

  {/* 2. KOTAK TIMER UTAMA (SUDAH DIPERBAIKI) */}
  {/* Perhatikan: z-[60] ditambahkan, dan bg-black/20 dipindah ke kondisi false */}
  <div className={`absolute bottom-4 left-4 right-4 rounded-[16px] border border-white/10 transition-all duration-300 origin-bottom z-[60] ${isTimerOpen ? 'p-0 overflow-hidden bg-[#1b1f2d] shadow-[0_-15px_40px_rgba(0,0,0,0.7)]' : 'p-3 bg-black/20'}`}>
    
    {/* Header Focus - Tetap Sama */}
    <div onClick={() => setIsTimerOpen(!isTimerOpen)} className={`flex items-center justify-between text-white/70 cursor-pointer transition-colors ${isTimerOpen ? 'p-3 border-b border-white/10 bg-white/5 hover:bg-white/10' : 'hover:text-white'}`}>
      <div className="flex items-center gap-2.5">
        {isTimerOpen && (<div className="h-6 w-6 rounded-md bg-white/5 flex items-center justify-center border border-white/10"><Target className="h-3 w-3" /></div>)}
        {!isTimerOpen && <Target className="h-4 w-4" />}
        <div>
          <div className={`${isTimerOpen ? 'text-[10px] text-white/50 font-semibold uppercase tracking-wider' : 'font-semibold text-[13px]'}`}>Focus</div>
          {!isTimerOpen && <div className="text-[20px] font-extrabold text-white tracking-tight mt-0.5">{formatTime(timeLeft)}</div>}
        </div>
      </div>
      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isTimerOpen ? 'rotate-180' : ''}`} />
    </div>
    
    {/* Isi Timer - Tetap Sama */}
    {/* Isi Timer */}
    {isTimerOpen && (
      <div className="p-5 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* Render Teks Waktu ATAU Menu Pilihan Waktu */}
        {showTimerSettings ? (
          <div className="w-full mb-4 flex flex-col items-center animate-in fade-in">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Pilih Durasi Fokus</div>
            <div className="flex justify-center gap-2 w-full">
              {[15, 25, 50].map((mins) => (
                <button 
                  key={mins} 
                  onClick={() => handleSetTimer(mins)} 
                  className={`flex-1 py-2 rounded-[10px] text-[13px] font-bold transition-all ${timerDuration === mins * 60 ? 'bg-[#5546ED] text-white shadow-md shadow-[#5546ED]/20' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-[36px] font-black tracking-tighter text-white mb-4 font-mono leading-none">
            {formatTime(timeLeft)}
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Tombol Reset */}
          <button onClick={resetTimer} className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition text-white/70 hover:text-white">
            <RotateCcw className="h-4 w-4" />
          </button>
          
          {/* Tombol Play/Pause */}
          <button onClick={toggleTimer} className="h-12 w-12 rounded-full bg-[#5546ED] hover:bg-[#4A28C1] flex items-center justify-center transition shadow-lg shadow-[#5546ED]/20 text-white">
            {isTimerRunning ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
          </button>
          
          {/* Tombol Settings */}
          <button 
            onClick={() => setShowTimerSettings(!showTimerSettings)} 
            className={`h-10 w-10 rounded-full border border-white/10 flex items-center justify-center transition ${showTimerSettings ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    )}
    
  </div>
</div>
        </aside>

        {/* MAIN AREA */}
        <main className="flex-1 min-h-[65dvh] md:min-h-0 rounded-[20px] md:rounded-[24px] border border-white/10 bg-[#1b1f2d] shadow-2xl overflow-hidden relative">
          <div className="h-full flex flex-col">
            
            {activeTab === "Note" && (
              <div className="px-3 md:px-6 pt-4 md:pt-6 pb-2">
                <div className="w-full max-w-[650px] mx-auto rounded-[20px] border border-white/10 bg-[#232738] p-3 flex flex-col items-center shadow-lg overflow-x-auto">
                  <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2"><div className="flex items-center gap-1"><ToolbarButton icon={RotateCcw} command="undo" /><ToolbarButton icon={RotateCw} command="redo" /></div><div className="h-5 w-[1px] bg-white/10" /><div className="flex items-center gap-1"><ToolbarButton icon={Bold} command="bold" /><ToolbarButton icon={Italic} command="italic" /><ToolbarButton icon={Underline} command="underline" /><ToolbarButton icon={Strikethrough} command="strikeThrough" /><ToolbarButton icon={Code} command="formatBlock" value="pre" /></div><div className="h-5 w-[1px] bg-white/10" /><div className="flex items-center gap-1"><ToolbarButton icon={Heading1} command="formatBlock" value="h1" /><ToolbarButton icon={Heading2} command="formatBlock" value="h2" /><ToolbarButton icon={Heading3} command="formatBlock" value="h3" /><ToolbarButton icon={Quote} command="formatBlock" value="blockquote" /></div><div className="h-5 w-[1px] bg-white/10" /><div className="flex items-center gap-1"><ToolbarButton icon={List} command="insertUnorderedList" /><ToolbarButton icon={ListOrdered} command="insertOrderedList" /></div></div>
                  <div className="flex justify-center items-center gap-3 mt-2 pt-2 border-t border-white/5 w-full max-w-[300px]"><ToolbarButton icon={Link2} command="createLink" /><ToolbarButton icon={Table2} command="insertHTML" value="<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>" /><ToolbarButton icon={FileCode2} command="formatBlock" value="pre" /></div>
                </div>
              </div>
            )}

            {activeTab !== "Note" && activeTab !== "Chat" && activeTab !== "Mind Map" && activeTab !== "Documents" && (
              <div className="px-3 md:px-6 pt-4 md:pt-5 pb-2 shrink-0"><div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 md:px-6 py-4 min-h-[70px] flex items-center justify-between gap-3 text-white/80"><div className="text-xs md:text-sm uppercase tracking-[0.18em] md:tracking-[0.24em] font-bold truncate">{activeTab}</div><button onClick={() => fileInputRef.current?.click()} className="shrink-0 rounded-[12px] border border-white/10 bg-white/5 px-3 md:px-4 py-2 text-[13px] font-semibold hover:bg-white/10 transition flex items-center gap-2"><Upload className="h-3.5 w-3.5" />Upload</button></div></div>
            )}

            {activeTab === "Chat" && activeFileKey && (
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#1b1f2d] z-10"><button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-2 text-[13px] font-medium text-white/80 transition"><BookOpen className="h-3.5 w-3.5 text-white/50" />Semua chapter<ChevronDown className="h-3.5 w-3.5 ml-1 opacity-50" /></button><div className="text-[13px] font-medium text-white/50 truncate max-w-[300px]">{title}</div></div>
            )}

            <div className={`flex-1 overflow-hidden ${activeTab === 'Chat' || activeTab === 'Mind Map' ? 'flex flex-col' : 'px-3 md:px-6 pb-4 md:pb-6'}`}>
              <div className={`w-full h-full ${activeTab === 'Chat' || activeTab === 'Mind Map' ? 'flex flex-col' : 'max-w-[700px] mx-auto py-2 overflow-auto'}`}>
                
                {activeTab === "Note" && (
                  <div className="mt-2">
                    <div className="mb-6"><input value={title} onChange={(e) => handleTitleChange(e.target.value)} className="w-full bg-transparent border-none outline-none text-white font-bold tracking-tight leading-[1.1] text-[28px] md:text-[32px] placeholder:text-white/30" placeholder="Judul catatan..." /></div>
                    {activeFileKey || !loading ? (<div ref={summaryRef} contentEditable suppressContentEditableWarning onInput={handleSummaryInput} className="outline-none text-white/80 leading-[1.7] text-[15px] md:text-[16px] min-h-[400px] pb-20 [&_h1]:text-[28px] [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-white/90 [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1.5 [&_li]:leading-[1.7] [&_b]:text-white [&_b]:font-bold [&_strong]:text-white [&_strong]:font-bold [&_blockquote]:border-l-4 [&_blockquote]:border-white/20 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-white/60 [&_pre]:bg-black/30 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_code]:font-mono [&_code]:text-[13px]" />) : (<div className="rounded-[16px] border border-dashed border-white/15 bg-white/[0.02] p-6 text-white/60 min-h-[300px] flex items-center justify-center text-center text-[15px]">{loading ? "Sedang memproses dokumen..." : "Mulai mengetik atau upload PDF/PPTX/Link YouTube untuk generate ringkasan."}</div>)}
                  </div>
                )}

                {activeTab === "Mind Map" && (
                  <div className="relative w-full h-full bg-[#1b1f2d] flex flex-col">
                    <div className="absolute top-5 right-5 z-20"><button onClick={regenerateMindmap} disabled={isRegeneratingMap || !activeFileKey} className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-white/[0.03] border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition disabled:opacity-50 text-[13px]"><RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingMap ? "animate-spin" : ""}`} /> {isRegeneratingMap ? "Regenerating..." : "Regenerate"}</button></div>
                    <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-[12px] p-1 shadow-lg"><button onClick={() => setMindmapZoom(z => Math.max(0.4, z - 0.2))} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"><Minus className="w-4 h-4" /></button><button onClick={() => setMindmapZoom(z => Math.min(2, z + 0.2))} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition"><Plus className="w-4 h-4" /></button></div>
                    {mindmapData ? (
                      <div className="flex-1 w-full h-full overflow-auto flex items-start justify-center pt-16 pb-32 px-6 cursor-grab active:cursor-grabbing"><div style={{ transform: `scale(${mindmapZoom})`, transformOrigin: 'top center' }} className="transition-transform duration-300 flex flex-col items-center gap-8 relative w-full max-w-[500px]"><div className="absolute top-8 bottom-8 w-[2px] border-l-[2px] border-dashed border-white/10 left-1/2 -translate-x-1/2 z-0" /><div className="relative z-10 bg-[#5546ED]/10 border border-[#5546ED]/30 px-6 py-4 rounded-[16px] shadow-lg max-w-[340px] text-center"><h3 className="font-bold text-white text-[15px] leading-snug">{mindmapData.title}</h3></div>{mindmapData.nodes.map((node, i) => (<div key={i} className="relative z-10 flex items-center justify-center w-full"><div className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#1b1f2d] border-[2px] border-white/20 z-10" /><div className="bg-[#202438] border border-white/10 px-5 py-3 rounded-[12px] shadow-md max-w-[300px] w-full text-center hover:border-white/20 transition-colors z-20"><p className="text-white/80 font-medium text-[13px] leading-relaxed">{node}</p></div></div>))}</div></div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <LayoutGrid className="h-16 w-16 text-white/10 mb-4" />
                        <p className="text-white/40 italic mb-6 text-sm">{loading ? "Mengekstrak Mind Map..." : "Belum ada Mind Map."}</p>
                        <button 
                          onClick={generateFromCurrentNote} 
                          disabled={loading} 
                          className="bg-[#5546ED] hover:bg-[#4A28C1] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all"
                        >
                          {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} Generate dari Catatan
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "Flashcards" && (
                  <div className="h-full py-4 flex flex-col items-center justify-center px-4">
                    {cards.length > 0 ? (
                      <div className="w-full max-w-[600px] flex flex-col gap-5 md:gap-6"><div className="flex items-center justify-between gap-2 md:gap-6 w-full"><button onClick={prevFlash} className="h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center border border-white/10 bg-white/[0.03] hover:bg-white/10 transition shrink-0"><ChevronLeft className="h-5 w-5 text-white/40" /></button><div onClick={() => setFlashFlipped(!flashFlipped)} className="flex-1 aspect-[3/4] sm:aspect-[4/3] max-h-[360px] rounded-[20px] md:rounded-[24px] border border-white/10 bg-[#252736] shadow-xl p-4 md:p-6 cursor-pointer relative flex flex-col transition-all hover:scale-[1.01]"><div className="relative w-full flex justify-end h-8"><div className="absolute left-1/2 -translate-x-1/2 top-0"><div className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-bold tracking-[0.1em] text-white/80 uppercase shadow-sm">{flashFlipped ? "Answer" : "Question"}</div></div></div><div className="flex-1 flex items-center justify-center p-2 md:p-4"><h2 className="text-[19px] sm:text-[24px] md:text-[28px] font-medium text-white/90 text-center leading-snug break-words">{flashFlipped ? cards[currentFlashIdx].answer : cards[currentFlashIdx].question}</h2></div><div className="w-full flex justify-center pb-1"><div className="flex items-center gap-1.5 text-white/40 text-[12px] md:text-[13px] font-medium">Tap to flip</div></div></div><button onClick={nextFlash} className="h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center border border-white/10 bg-white/[0.03] hover:bg-white/10 transition shrink-0"><ChevronRight className="h-5 w-5 text-white/40" /></button></div><div className="w-full px-11 md:px-[60px]"><div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[#5546ED] transition-all duration-300" style={{ width: `${((currentFlashIdx + 1) / cards.length) * 100}%` }} /></div></div></div>
                    ) : (
                      <div className="text-center">
                        <BookOpen className="h-16 w-16 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 italic mb-6 text-sm">{loading ? "Membuat Flashcards..." : "Belum ada Flashcards."}</p>
                        <button 
                          onClick={generateFromCurrentNote} 
                          disabled={loading} 
                          className="bg-[#5546ED] hover:bg-[#4A28C1] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all"
                        >
                          {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} Generate dari Catatan
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "Quiz" && (
                  <div className="h-full py-4 flex flex-col items-center justify-center px-4">
                    {quizItems.length > 0 ? (
                      <div className="w-full max-w-[600px] flex items-center gap-2 md:gap-4">
                        <button onClick={prevQuiz} className="h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 transition shrink-0"><ChevronLeft className="h-5 w-5 text-white/40" /></button>
                        <div className="flex-1 flex flex-col items-center">
                          <div className="w-full rounded-[20px] md:rounded-[24px] border border-white/10 bg-[#202438] p-4 md:p-6 mb-5 md:mb-6 shadow-md min-h-[140px] md:min-h-[160px] flex items-center justify-center text-center"><h2 className="text-[16px] md:text-[20px] font-bold text-white/90 leading-snug break-words">{quizItems[currentQuizIdx].question}</h2></div>
                          <div className="w-full grid gap-3">
                            {quizItems[currentQuizIdx].options.map((opt, idx) => {
                              const labels = ["A", "B", "C", "D"]; const isSelected = selectedAnswer === idx; const isCorrect = idx === quizItems[currentQuizIdx].answer;
                              let borderClass = "border-white/10 bg-white/[0.03]";
                              if (selectedAnswer !== null) { if (isCorrect) borderClass = "border-green-500 bg-green-500/10"; else if (isSelected) borderClass = "border-red-500 bg-red-500/10"; }
                              return (<button key={idx} onClick={() => selectedAnswer === null && setSelectedAnswer(idx)} className={`group flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-[16px] border transition-all text-left ${borderClass} ${selectedAnswer === null ? "hover:bg-white/[0.07] hover:border-white/20" : ""}`}><div className={`h-8 w-8 shrink-0 rounded-md flex items-center justify-center font-bold text-[13px] border border-white/10 bg-white/5 transition-colors ${isSelected ? "bg-white/20" : ""}`}>{labels[idx]}</div><span className="text-[13px] md:text-[15px] font-medium text-white/80 break-words">{opt}</span></button>);
                            })}
                          </div>
                          <div className="mt-6 w-full flex flex-col items-center"><button onClick={() => setShowHint(!showHint)} className="px-5 py-2.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold flex items-center gap-2 hover:bg-orange-500/20 transition text-sm"><Lightbulb className="h-4 w-4" /> Tampilkan Petunjuk <span className="text-[11px] opacity-60 font-normal ml-1">(XP -50%)</span></button>{showHint && <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/10 text-white/70 italic text-center text-[13px]">"{quizItems[currentQuizIdx].hint}"</div>}</div>
                        </div>
                        <button onClick={nextQuiz} className="h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 transition shrink-0"><ChevronRight className="h-5 w-5 text-white/40" /></button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <HelpCircle className="h-16 w-16 text-white/10 mx-auto mb-4" />
                        <p className="text-white/40 italic mb-6 text-sm">{loading ? "Membuat Kuis..." : "Belum ada Kuis."}</p>
                        <button 
                          onClick={generateFromCurrentNote} 
                          disabled={loading} 
                          className="bg-[#5546ED] hover:bg-[#4A28C1] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all"
                        >
                          {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />} Generate dari Catatan
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "Chat" && (
                  <div className="flex-1 flex flex-col w-full h-full relative">
                    {!activeFileKey ? (<div className="flex-1 flex items-center justify-center text-white/30 italic px-6 text-center text-[13px]">Tulis catatan atau upload dokumen agar AI bisa menjawab pertanyaanmu.</div>) : (
                      <>
                        <div className="flex-1 overflow-y-auto px-3 md:px-6 pt-5 md:pt-6 pb-24">
                          {chatMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center w-full max-w-[600px] mx-auto animate-in fade-in duration-500"><div className="h-[56px] w-[56px] rounded-[16px] bg-[#5546ED]/10 border border-[#5546ED]/20 flex items-center justify-center mb-4 shadow-md shadow-[#5546ED]/5"><MessageSquare className="h-6 w-6 text-[#5546ED]" /></div><h2 className="text-[22px] font-bold text-white mb-2 text-center px-4">{title}</h2><p className="text-white/50 mb-8 text-center max-w-[450px] leading-relaxed text-sm">Tanyakan tentang catatan ini untuk mendapatkan penjelasan, ringkasan, atau informasi tambahan.</p><div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">{["Jelaskan konsep utama", "Buat ringkasan singkat", "Poin-poin penting?", "Berikan contoh soal"].map((prompt, idx) => (<button key={idx} onClick={() => sendMessage(prompt)} className="text-left rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.06] hover:border-white/10 transition text-white/60 hover:text-white/90 text-[13px] leading-relaxed">{prompt}</button>))}</div></div>
                          ) : (
                            <div className="space-y-5 max-w-[650px] mx-auto">
                              {chatMessages.map((msg, i) => (<div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}><div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center shadow-md ${msg.role === "user" ? "bg-[#5546ED]" : "bg-[#202438] border border-white/10"}`}>{msg.role === "user" ? <User className="h-4 w-4 text-white" /> : <Sparkles className="h-4 w-4 text-white/80" />}</div><div className={`max-w-[84%] md:max-w-[75%] rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-[#5546ED] text-white" : "bg-[#202438] border border-white/10 text-white/80"} text-[14px] break-words`}>{msg.role === "ai" ? (<div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} className="[&_p]:mb-2 last:[&_p]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_li]:mb-1 [&_strong]:font-bold [&_strong]:text-white" />) : (<p>{msg.content}</p>)}</div></div>))}
                              {isChatting && (<div className="flex gap-3"><div className="h-8 w-8 shrink-0 rounded-full bg-[#202438] border border-white/10 flex items-center justify-center shadow-md"><Sparkles className="h-4 w-4 text-white/80" /></div><div className="rounded-xl px-4 py-4 bg-[#202438] border border-white/10 text-white/50 flex items-center gap-1.5"><div className="h-1.5 w-1.5 bg-white/40 rounded-full animate-bounce" /><div className="h-1.5 w-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} /><div className="h-1.5 w-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} /></div></div>)}
                              <div ref={chatEndRef} />
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 bg-gradient-to-t from-[#1b1f2d] via-[#1b1f2d] to-transparent"><form onSubmit={handleSendChatForm} className="max-w-[650px] mx-auto flex gap-2.5 items-center relative"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ketik pertanyaan..." disabled={isChatting} className="min-w-0 flex-1 rounded-[16px] bg-[#232738] border border-white/10 px-4 md:px-5 py-3 text-[14px] text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 focus:bg-[#2a2f42] transition disabled:opacity-50 shadow-lg" /><button type="submit" disabled={!chatInput.trim() || isChatting} className="h-[46px] w-[46px] md:h-[48px] md:w-[48px] shrink-0 rounded-[16px] bg-[#5546ED] hover:bg-[#4A28C1] flex items-center justify-center transition disabled:opacity-50 shadow-lg shadow-[#5546ED]/10"><Send className="h-4 w-4 text-white ml-0.5" /></button></form></div>
                      </>
                    )}
                  </div>
                )}

                {activeTab === "Documents" && (
                  <div className="py-5 px-6 max-w-[700px] mx-auto h-full flex flex-col">
                    <div className="mb-6"><h2 className="text-2xl font-black text-white mb-2">Documents</h2><div className="flex items-center gap-3 text-white/50 text-[13px] font-medium"><div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> {title}</div><div className="flex items-center gap-1.5"><Folder className="h-3.5 w-3.5" /> 1 documents</div></div></div>
                    <div className="rounded-[16px] border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between mb-6 shadow-sm"><div className="flex items-center gap-3 overflow-hidden"><div className="h-10 w-10 shrink-0 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">{activeFileName === "YouTube Video" ? (<PlayCircle className="h-5 w-5 text-red-500" />) : (<FileText className="h-5 w-5 text-white/70" />)}</div><div className="overflow-hidden"><div className="font-bold text-white text-[15px] truncate">{activeFileName || "Document"}</div><div className="text-white/40 text-[12px] mt-0.5">{activeFileName === "YouTube Video" ? "Video Link" : `Dokumen • ${(rawText.length / 1024).toFixed(2)} KB`}</div></div></div><button className="h-8 w-8 shrink-0 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition text-white/70 hover:text-white"><Download className="h-4 w-4" /></button></div>
                    <div className="flex flex-col flex-1 min-h-0"><div className="flex items-center gap-2 text-white font-bold text-[15px] mb-2"><Eye className="h-4 w-4" />Preview:</div><div className="text-white/90 font-bold text-[13px] mb-3 truncate">{activeFileName || "Document"}</div><div className="flex-1 rounded-[16px] border border-white/10 bg-[#11131f] overflow-hidden flex flex-col shadow-inner relative">
                        {activeFileName === "YouTube Video" ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 p-5"><div className="h-14 w-14 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mb-4"><PlayCircle className="h-7 w-7 text-red-500" /></div><h3 className="text-white font-bold text-[15px] mb-2">Video YouTube Berhasil Diproses</h3><p className="text-white/50 text-[13px] text-center max-w-sm mb-5 leading-relaxed">Teks dari video ini telah diekstrak dan dipelajari oleh AI. Kamu bisa melihat rangkuman atau menanyakannya di tab Chat.</p><a href={activeFileKey || "#"} target="_blank" rel="noreferrer" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-5 rounded-[12px] transition flex items-center gap-2 text-[13px] shadow-lg shadow-red-500/20"><Play className="h-3.5 w-3.5 fill-current" /> Buka Video di YouTube</a></div>
                        ) : pdfUrl && activeFileName.toLowerCase().endsWith(".pdf") ? (
                          <iframe src={`${pdfUrl}#toolbar=0`} className="w-full h-full border-none" title="PDF Preview" />
                        ) : (
                          <div className="p-5 overflow-auto h-full flex flex-col"><div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 p-3 rounded-lg mb-4 text-[13px] flex-shrink-0">💡 Preview visual hanya tersedia untuk PDF. Untuk format lain, kami menampilkan teks asli yang berhasil diekstrak oleh sistem.</div><pre className="text-white/50 text-[13px] font-mono whitespace-pre-wrap leading-relaxed">{rawText || "Tidak ada teks yang dapat ditampilkan."}</pre></div>
                        )}
                      </div></div>
                  </div>
                )}
                
                {result && <pre className="mt-4 mx-6 p-3 rounded-lg bg-black/20 text-white/60 text-[12px] whitespace-pre-wrap border border-white/10">{result}</pre>}
              </div>
            </div>
          </div>
        </main>
      </div>

      <input ref={fileInputRef} type="file" accept=".pdf, .pptx" onChange={handleUpload} className="hidden" />
    {upgradeModalUI}
    </div>
  );
}
