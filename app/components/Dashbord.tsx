"use client";
import OneSignal from 'react-onesignal';
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Edit2,
  FileText,
  Flame,
  Folder,
  Home as HomeIcon,
  LayoutGrid,
  List as ListIcon,
  Rocket,
  Search,
  Sparkles,
  Upload,
  PlayCircle,
  X,
  Settings,
  Calendar,
  UploadCloud,
  Plus,
  Camera, 
  LogOut, 
  Mail, 
  Key, 
  Lock, 
  Link as LinkIcon, // Karena Link sering bentrok dengan Next.js Link
  MessageCircle,
  Check,
  MoreVertical,
  Trash2,
  Star,    // <-- TAMBAHKAN INI
  Users
} from "lucide-react";

type Flashcard = { question: string; answer: string };
type QuizItem = { question: string; options: string[]; answer: number; hint: string; };
type MindMapData = { title: string; nodes: string[]; };
type ChatMessage = { role: "user" | "ai"; content: string; };
type GenerationCount = 15 | 25 | 30;
type UserProfile = { name: string; email: string };

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
};

const STORAGE_KEY = "pdf_ai_history_dashboard_v1";
const USER_PROFILE_KEY = "belajar_ai_user_profile_v1";

interface DashboardProps {
  onUpload: (file: File, subject: string, generationCount: GenerationCount) => void;
  onUploadYoutube: (url: string, subject: string, generationCount: GenerationCount) => void;
  onWriteManual: (title: string, subject: string) => void; // <--- TAMBAHKAN INI
  onOpenNote: (fileKey: string) => void;
  onGoToLanding: () => void;
}

// ==========================================
// DATA MOCKUP UNTUK STUDY GUIDES
// ==========================================
const STUDY_GUIDES_DATA = [
  // Arts
  { id: 1, title: "Introduction to Arts", category: "Arts", img: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80", isLocked: false, rating: 4.8, enrolled: "12.5k" },
  { id: 2, title: "Prof. Dr. Andre Indrawan", category: "Arts", img: "https://ugm.ac.id/wp-content/uploads/2010/10/andre_isi_1.jpg", isLocked: true, rating: 4.9, enrolled: "8.2k" },
  { id: 3, title: "Mentor Danton Sihombing, MFA.", category: "Arts", img: "https://storage.googleapis.com/swafiles/images/2025/11/272229/1764257341_ad58124ae0c31cdb4456.jpg", isLocked: true, rating: 4.7, enrolled: "5.1k" },
  
  // History
  { id: 6, title: "Introduction to History", category: "History", img: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=400&q=80", isLocked: false, rating: 4.6, enrolled: "15.3k" },
  { id: 7, title: "Mentor Akhmad Steivano, S.I.Kom.", category: "History", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQb9vPOx9b-SHPj6F0JKOOsCzi9-WRxvQWWfA&s", isLocked: true, rating: 4.8, enrolled: "11.4k" },
  { id: 8, title: "Prof. Dr. Anhar Gonggong", category: "History", img: "https://asset.tribunnews.com/_DZzX35X-O6RDmSY5eTyNAY42OU=/1200x675/filters:upscale():quality(30):format(webp):focal(0.5x0.5:0.5x0.5)/makassar/foto/bank/originals/Anhar-Gonggong-1-2082024.jpg", isLocked: true, rating: 4.9, enrolled: "5.1k" },

  // Economics
  { id: 11, title: "Introduction to Economics", category: "Economics", img: "https://www.marketeers.com/_next/image/?url=https%3A%2F%2Froom.marketeers.com%2Fwp-content%2Fuploads%2F2023%2F01%2F186809681_presentation-wide.jpg&w=1920&q=75", isLocked: false, rating: 4.7, enrolled: "22.8k" },
  { id: 12, title: "Mentor Ferry Irwandi, S.E.", category: "Economics", img: "https://c.inilah.com/reborn/2024/10/large_Snapinsta_app_449833215_1029256281883444_8397298077218426290_n_1080_11zon_f6e88e0e7c.jpg", isLocked: true, rating: 4.9, enrolled: "94.2k" },
  { id: 13, title: "Prof. Rhenald Kasali, Ph.D.", category: "Economics", img: "https://c.inilah.com/reborn/2025/10/large_Rhenald_Kasali_7b2d1adf87.jpg", isLocked: true, rating: 5.0, enrolled: "23.9k" },

  // Social Sciences
  { id: 16, title: "Introduction to Social Sciences", category: "Social Sciences", img: "https://platform.vox.com/wp-content/uploads/sites/2/chorus/uploads/chorus_asset/file/19539913/GettyImages_862457080.jpg?quality=90&strip=all&crop=0,9.0726794418797,100,81.854641116241", isLocked: false, rating: 4.5, enrolled: "18.1k" },
  { id: 17, title: "Dr. dr. Dwijo Saputro, Sp.KJ (K)", category: "Social Sciences", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxtgSkmR8ExSIjLph1_rbrRBlHSFxXSJLTXw&s", isLocked: true, rating: 4.8, enrolled: "7.6k" },
  { id: 18, title: "Drs. Rocky Gerung", category: "Social Sciences", img: "https://blue.kumparan.com/image/upload/fl_progressive,fl_lossy,c_fill,f_auto,q_auto:best,w_640/v1634025439/01j6ztc7w7pb9bfbd965cwb6dg.jpg", isLocked: true, rating: 4.9, enrolled: "82.4k" },

  // Math
  { id: 21, title: "Introduction to Mathematics", category: "Math", img: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80", isLocked: false, rating: 4.6, enrolled: "25.5k" },
  { id: 22, title: "Mentor Jerome Polin Sijabat", category: "Math", img: "https://assets-a1.kompasiana.com/items/album/2023/03/26/jerome-batik-6420014308a8b5232f67f602.jpg?t=o&v=770", isLocked: true, rating: 4.9, enrolled: "188.3k" },
  { id: 23, title: "Prof. Hendra Gunawan, Ph.D.", category: "Math", img: "https://itb.ac.id/files/dosen/1384-c2006175638f4a57cfcd5a6516d851534337ff2acc07e41fee18c323ca016006.png", isLocked: true, rating: 4.8, enrolled: "14.2k" },

  // Science
  { id: 26, title: "Introduction to Science", category: "Science", img: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&q=80", isLocked: false, rating: 4.7, enrolled: "19.8k" },
  { id: 27, title: "Mentor Fajrul Falah, M.Sc.", category: "Science", img: "https://unnes.ac.id/mipa/wp-content/uploads/sites/6/2023/10/70336743-b645-4e18-910a-46c97558c92b.jpeg", isLocked: true, rating: 4.8, enrolled: "41.5k" },
  { id: 28, title: "dr. Tirta Mandira Hudhi", category: "Science", img: "https://feb.ugm.ac.id/wp-content/uploads/sites/47/2024/11/drtirta-11112024.jpg", isLocked: true, rating: 4.7, enrolled: "84.1k" },

  // English
  { id: 31, title: "Introduction to English", category: "English", img: "https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400&q=80", isLocked: false, rating: 4.8, enrolled: "42.0k" },
  { id: 32, title: "Mentor Denisio Perez", category: "English", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAGptCOIhybxvcFZqowa48uCHW3hM5oGDCEw&s", isLocked: true, rating: 4.9, enrolled: "38.7k" },
  { id: 33, title: "Mentor Dave Jephcott", category: "English", img: "https://jatimnet.com/jinet/assets/media/news/news/image_front/Dave-Jephcott.-Instagram-Londo-Kampung.-1.png", isLocked: true, rating: 4.9, enrolled: "41.2k" },
];

const CATEGORIES = ["All", "History", "Arts", "English", "Social Sciences", "Math", "Science", "Economics"];
const GENERATION_COUNT_OPTIONS: GenerationCount[] = [15, 25, 30];


export default function Dashboard({ onUpload, onUploadYoutube, onOpenNote, onWriteManual, onGoToLanding }: DashboardProps) {
const [showNotifPrompt, setShowNotifPrompt] = useState(true);
  // State untuk menyimpan event install browser
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  // State untuk memunculkan banner buatanmu
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Mencegah Chrome memunculkan mini-infobar bawaannya yang jelek
      e.preventDefault();
      // Simpan event-nya ke dalam state
      setDeferredPrompt(e);
      // Munculkan banner buatanmu
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
    // STATE NAVIGASI SIDEBAR
  const [activeSidebar, setActiveSidebar] = useState<"dashboard" | "study-guides" | "settings">("dashboard");
  
  // STATES UNTUK STUDY GUIDES
  const [activeCategory, setActiveCategory] = useState("All");
  const [guideSearch, setGuideSearch] = useState("");

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"terbaru" | "terlama" | "abjad">("terbaru");
  const [filterSubject, setFilterSubject] = useState<string>("Semua");
  
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<"source" | "count">("source");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"annual" | "monthly">("annual");
  const [uploadSubject, setUploadSubject] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadGenerationCount, setUploadGenerationCount] = useState<GenerationCount>(15);
  const [isDragging, setIsDragging] = useState(false);
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);

  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeStep, setYoutubeStep] = useState<"source" | "count">("source");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [youtubeSubject, setYoutubeSubject] = useState("");
  const [youtubeGenerationCount, setYoutubeGenerationCount] = useState<GenerationCount>(15);

  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeTitle, setWriteTitle] = useState("");
  const [writeSubject, setWriteSubject] = useState("");

  const [showExamModal, setShowExamModal] = useState(false);
  const [examDate, setExamDate] = useState<string | null>(null);
  const [tempExamDate, setTempExamDate] = useState("");
  const [daysLeft, setDaysLeft] = useState(0);
  const [examProgress, setExamProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: "User", email: "user@email.com" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHistory(JSON.parse(saved));
      const savedProfile = localStorage.getItem(USER_PROFILE_KEY);
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        if (parsedProfile?.name && parsedProfile?.email) setUserProfile(parsedProfile);
      }
    } catch { setHistory([]); }

    const runOneSignal = async () => {
      await OneSignal.init({
        appId: "65151910-c29a-4fc8-a765-fd3479eb9d6e", 
        allowLocalhostAsSecureOrigin: true, // Wajib diaktifkan saat testing di localhost
      });
      // Menampilkan prompt izin notifikasi ke user
    };
    runOneSignal();

    const savedExamDate = localStorage.getItem("pdf_ai_exam_date");
    const savedStartDate = localStorage.getItem("pdf_ai_exam_start");

    if (savedExamDate && savedStartDate) {
      const targetDate = new Date(savedExamDate);
      targetDate.setHours(23, 59, 59, 999);
      if (targetDate.getTime() < new Date().getTime()) setShowExamModal(false);
      else { setExamDate(savedExamDate); calculateProgress(savedExamDate, savedStartDate); }
    } else { setShowExamModal(false); }

    const now = new Date();
    const formatDateStr = (d: Date) => {
      const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const todayStr = formatDateStr(now);
    const yesterdayDate = new Date(now); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = formatDateStr(yesterdayDate);
    const lastLoginStr = localStorage.getItem("pdf_ai_last_login");
    let currentStreak = parseInt(localStorage.getItem("pdf_ai_streak") || "0");
    let maxStreak = parseInt(localStorage.getItem("pdf_ai_best_streak") || "0");

    if (lastLoginStr !== todayStr) {
      if (lastLoginStr === yesterdayStr) currentStreak += 1;
      else currentStreak = 1;
      
      if (currentStreak > maxStreak) { maxStreak = currentStreak; localStorage.setItem("pdf_ai_best_streak", maxStreak.toString()); }
      localStorage.setItem("pdf_ai_streak", currentStreak.toString());
      localStorage.setItem("pdf_ai_last_login", todayStr);
    } else if (currentStreak === 0) {
       currentStreak = 1; localStorage.setItem("pdf_ai_streak", currentStreak.toString()); localStorage.setItem("pdf_ai_last_login", todayStr);
    }
    setStreak(currentStreak); setBestStreak(maxStreak);
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);

  const calculateProgress = (targetDateStr: string, startDateStr: string) => {
    const target = new Date(targetDateStr).getTime();
    const start = new Date(startDateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, target - now);
    const calculatedDaysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    setDaysLeft(calculatedDaysLeft);

    let pct = (target - start) > 0 ? ((now - start) / (target - start)) * 100 : 100;
    setExamProgress(Math.min(100, Math.max(0, pct)));

    // LOGIKA NOTIFIKASI
    if (calculatedDaysLeft > 0 && calculatedDaysLeft <= 7) {
      const todayStr = new Date().toLocaleDateString("en-CA"); // Format YYYY-MM-DD
      const lastNotified = localStorage.getItem("pdf_ai_last_notified");

      // Cek izin dan pastikan belum dinotifikasi hari ini
      if ("Notification" in window && Notification.permission === "granted" && lastNotified !== todayStr) {
        
        // Panggil Notifikasi Asli (Native)
        new Notification("Ayo Belajar! 🚀", {
          body: `Ujianmu tinggal ${calculatedDaysLeft} hari lagi! Yuk mulai fokus belajar hari ini.`,
          icon: "/favicon.ico", // Pastikan kamu punya ikon ini di folder public
        });

        // Catat agar tidak spam hari ini
        localStorage.setItem("pdf_ai_last_notified", todayStr);
      }
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Munculkan pop-up asli dari Chrome (Add to Home screen)
      deferredPrompt.prompt();
      
      // Tunggu jawaban user (di-install atau dicancel)
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User menginstal aplikasi!');
      }
      
      // Kosongkan state dan sembunyikan banner
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleSaveExamDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempExamDate) {
      const startDate = new Date().toISOString();
      localStorage.setItem("pdf_ai_exam_date", tempExamDate);
      localStorage.setItem("pdf_ai_exam_start", startDate);
      setExamDate(tempExamDate); 
      calculateProgress(tempExamDate, startDate); 
      setShowExamModal(false);

      if (OneSignal.User) {
        const examDate = new Date(tempExamDate);
        const examTimestamp = Math.floor(examDate.getTime() / 1000);

        // Hitung waktu H-7 (7 hari sebelum ujian)
        const startDate = new Date(examDate);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(8, 0, 0, 0); // Notif muncul jam 8 pagi
        const startTimestamp = Math.floor(startDate.getTime() / 1000);

        // Kirim dua tag sekaligus
        OneSignal.User.addTags({
          "start_pengingat": startTimestamp.toString(), // Pemicu MULAI
          "target_ujian": examTimestamp.toString()       // Pemicu BERHENTI
        });
      }
    }
  };

  const handleCustomSubscribe = async () => {
    setShowNotifPrompt(false);

    if (typeof window !== 'undefined' && window.OneSignal) {
      try {
        await window.OneSignal.Notifications.requestPermission();
      } catch (error) {
        console.error("Gagal meminta izin notifikasi:", error);
      }
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile && uploadSubject.trim()) {
      setUploadStep("count");
    }
  };

  const handleStartUploadGeneration = () => {
    if (!selectedFile || !uploadSubject.trim()) return;
    onUpload(selectedFile, uploadSubject.trim(), uploadGenerationCount);
    setShowUploadModal(false); setSelectedFile(null); setUploadSubject(""); setUploadStep("source"); setUploadGenerationCount(15);
  };

  const handleYoutubeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeLink.trim() && youtubeSubject.trim()) {
      setYoutubeStep("count");
    }
  };

  const handleStartYoutubeGeneration = () => {
    if (!youtubeLink.trim() || !youtubeSubject.trim()) return;
    onUploadYoutube(youtubeLink.trim(), youtubeSubject.trim(), youtubeGenerationCount);
    setShowYoutubeModal(false); setYoutubeLink(""); setYoutubeSubject(""); setYoutubeStep("source"); setYoutubeGenerationCount(15);
  };

  const handleWriteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (writeTitle.trim() && writeSubject.trim()) {
      // Kita panggil fungsi baru untuk mode tulis manual
      onWriteManual(writeTitle.trim(), writeSubject.trim());
      setShowWriteModal(false);
      setWriteTitle("");
      setWriteSubject("");
    }
  };

  // STATE UNTUK KONFIRMASI HAPUS
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const deleteHistoryItem = (fileKey: string) => {
    const nextHist = history.filter((item) => item.fileKey !== fileKey);
    setHistory(nextHist);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHist));
    setOpenMenuId(null);
  };

  const confirmDelete = (fileKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteHistoryItem(fileKey);
  };

  const executeDelete = () => {
    if (!itemToDelete) return;
    deleteHistoryItem(itemToDelete);
    setItemToDelete(null); // Tutup modal setelah hapus
  };

  const uniqueSubjects = ["Semua", ...Array.from(new Set(history.map(item => item.subject || "Subjek Umum")))];

  let processedHistory = history.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (filterSubject !== "Semua") {
    processedHistory = processedHistory.filter(item => (item.subject || "Subjek Umum") === filterSubject);
  }

  processedHistory.sort((a, b) => {
    if (sortBy === "terbaru") return b.createdAt - a.createdAt;
    if (sortBy === "terlama") return a.createdAt - b.createdAt;
    if (sortBy === "abjad") return a.title.localeCompare(b.title);
    return 0;
  });

  const todayDate = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Filter untuk Study Guides
  const filteredGuides = STUDY_GUIDES_DATA.filter(guide => {
    const matchesCategory = activeCategory === "All" || guide.category === activeCategory;
    const matchesSearch = guide.title.toLowerCase().includes(guideSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const firstName = userProfile.name.trim().split(/\s+/)[0] || "User";
  const initials = userProfile.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userProfile.email || userProfile.name)}&backgroundColor=c0aede`;

  return (
    <div className="min-h-[100dvh] md:h-screen overflow-auto md:overflow-hidden bg-[#11131f] text-white relative">
      <div className="flex min-h-[100dvh] md:h-full flex-col md:flex-row p-2 md:p-4 gap-3 md:gap-4">
        
        {/* SIDEBAR DASHBOARD */}
        <aside className="w-full md:w-[300px] shrink-0 rounded-[22px] md:rounded-[28px] border border-white/10 bg-gradient-to-b from-[#202438] to-[#1b1f2d] shadow-2xl overflow-hidden flex flex-col relative">
          
          {/* HEADER SIDEBAR (Logo & Tombol Mobile) */}
          <div className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-6 pb-2">
            
            {/* Bagian Kiri: Logo & Nama */}
            <div 
              onClick={onGoToLanding} 
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="h-10 w-10 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="text-2xl font-extrabold tracking-tight">belajar.ai</div>
            </div>

            {/* Bagian Kanan: Tombol Join Khusus Mobile (md:hidden) */}
            <button 
              onClick={() => window.open("https://discord.com", "_blank")} 
              className="md:hidden flex items-center gap-1.5 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/30 px-3 py-1.5 hover:bg-[#5865F2]/20 transition-colors shrink-0"
            >
              <span className="text-[11px] font-bold text-[#FFFFFF]">Join Community</span>
              <img 
                src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/discord-round-color-icon.png" 
                alt="Discord" 
                className="h-3 w-3 object-contain opacity-80" 
              />
            </button>
            
          </div>

          <nav className="p-3 md:p-4 md:flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-1 gap-2 md:space-y-2 md:block">
              <button 
                onClick={() => setActiveSidebar("dashboard")}
                className={`w-full rounded-[16px] px-5 py-3.5 flex items-center gap-4 text-left transition ${activeSidebar === "dashboard" ? "bg-[#5546ed] text-white shadow-lg shadow-shadow-indigo-600/20/20" : "hover:bg-white/5 text-white/70"}`}
              >
                <HomeIcon className="h-5 w-5" />
                <span className="text-[15px] font-bold">Dashboard</span>
              </button>
              <button 
                onClick={() => setActiveSidebar("study-guides")}
                className={`w-full rounded-[16px] px-5 py-3.5 flex items-center gap-4 text-left transition ${activeSidebar === "study-guides" ? "bg-[#5546ed] text-white shadow-lg shadow-shadow-indigo-600/20/20" : "hover:bg-white/5 text-white/70"}`}
              >
                <BookOpen className="h-5 w-5" />
                <span className="text-[15px] font-semibold">Study Guides</span>
              </button>
              <button 
                onClick={() => setActiveSidebar("settings")}
                className={`w-full rounded-[16px] px-5 py-3.5 flex items-center gap-4 text-left transition ${activeSidebar === "settings" ? "bg-[#5546ed] text-white shadow-lg shadow-shadow-indigo-600/20/20" : "hover:bg-white/5 text-white/70"}`}
              >
                <Settings className="h-5 w-5" />
                <span className="text-[15px] font-semibold">Settings</span>
              </button>
              <div className="col-span-2 sm:col-span-1 md:pt-6">
                <button 
  onClick={() => setShowUpgradeModal(true)} 
  className="w-full rounded-[16px] px-5 py-3.5 flex items-center gap-4 text-left transition bg-[#5546ed] hover:bg-[#4a28c1] text-white shadow-lg shadow-shadow-indigo-600/20/20"
>
  <Rocket className="h-5 w-5" />
  <span className="text-[15px] font-bold">Upgrade Pro</span>
</button>
              </div>
            </div>
          </nav>

          <div className="hidden md:block p-5 border-t border-white/10 mt-auto">
            
            {/* --- TOMBOL JOIN COMMUNITY (DENGAN GAMBAR CUSTOM) --- */}
            <button 
              onClick={() => window.open("https://discord.com", "_blank")} 
              className="w-full mb-3 rounded-[14px] bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 px-4 py-2.5 flex items-center justify-between transition-all duration-300 group"
            >
              <span className="text-[13px] font-bold text-[#FFFFFF] group-hover:text-white transition-colors">Join Community</span>
              
              {/* Gambar Custom Logo Discord */}
              <img 
                src="https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/discord-round-color-icon.png" 
                alt="Discord" 
                className="h-4 w-4 object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
              />
            </button>

            {/* --- PROFIL USER --- */}
            <div className="flex items-center gap-3 rounded-2xl p-2 hover:bg-white/5 transition cursor-pointer">
              <img src={avatarUrl} alt="Profile" className="w-10 h-10 rounded-full bg-white/10 object-cover border border-white/10" />
              <div className="flex-1 overflow-hidden">
                <div className="font-bold text-sm text-white truncate">{userProfile.name}</div>
                <div className="text-xs text-white/50 truncate">{userProfile.email}</div>
              </div>
            </div>
            
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-h-0 overflow-auto rounded-[22px] md:rounded-[28px] border border-white/10 bg-[#1b1f2d] shadow-2xl relative">
          
          {/* =======================================================
              TAMPILAN 1: DASHBOARD
              ======================================================= */}
          {activeSidebar === "dashboard" && (
            <div className="max-w-[1100px] mx-auto p-4 md:p-10 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-[26px] md:text-[32px] font-extrabold text-white flex items-center gap-3 leading-tight tracking-tight">
                    Halo, {firstName}! <span className="text-3xl animate-bounce" style={{ animationIterationCount: 2 }}>👋</span>
                  </h1>
                  <p className="text-white/50 mt-1 text-sm font-medium">{todayDate}</p>
                </div>
                <button 
  onClick={() => setShowUpgradeModal(true)} 
  className="w-full sm:w-auto justify-center rounded-full bg-[#5546ed] hover:bg-[#4a28c1] transition px-5 py-2.5 text-sm font-bold flex items-center gap-2 text-white shadow-lg shadow-shadow-indigo-600/20/20"
>
  <Rocket className="h-4 w-4" /> Upgrade Pro
</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 max-w-[800px]">
                <div className="rounded-[20px] border border-white/10 bg-[#202438] p-5 relative overflow-hidden group hover:border-white/20 transition">
                  <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Streak Belajar</div>
                  <div className="text-[36px] leading-none font-black text-white flex items-baseline gap-2">{streak} <span className="text-lg font-bold text-white/50">hari</span></div>
                  <div className="text-white/40 text-xs mt-2 font-medium">Rekor terbaik: {bestStreak} hari</div>
                  <div className="absolute top-5 right-5 h-10 w-10 rounded-[12px] bg-[#5546ed]/10 flex items-center justify-center border border-[#5546ed]/20">
                    <Flame className="h-5 w-5 text-[#5546ed]" />
                  </div>
                </div>
                
                <div className="rounded-[20px] border border-white/10 bg-[#202438] p-5 relative overflow-hidden group hover:border-white/20 transition cursor-pointer" onClick={() => setShowExamModal(true)}>
                  <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">Target Ujian <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  <div className="text-[36px] leading-none font-black text-white flex items-baseline gap-2">{daysLeft} <span className="text-lg font-bold text-white/50">hari lagi</span></div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${examProgress}%` }} />
                  </div>
                  <div className="absolute top-5 right-5 h-10 w-10 rounded-[12px] bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-[#202438] p-3 grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-3 mb-10 shadow-lg">
                <div className="px-1 sm:px-3 text-white/80 font-bold text-sm">Buat baru:</div>
                <button onClick={() => { setSelectedFile(null); setUploadSubject(""); setUploadStep("source"); setShowUploadModal(true); }} className="w-full sm:w-auto justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition text-white">
                  <Upload className="h-4 w-4 text-blue-400" /> Upload PDF / PPTX
                </button>
                <button onClick={() => { setYoutubeLink(""); setYoutubeSubject(""); setYoutubeStep("source"); setShowYoutubeModal(true); }} className="w-full sm:w-auto justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition text-white">
                  <PlayCircle className="h-4 w-4 text-red-400" /> Link YouTube
                </button>
                <button onClick={() => { setWriteTitle(""); setWriteSubject(""); setShowWriteModal(true); }} className="w-full sm:w-auto justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition text-white">
                  <Edit2 className="h-4 w-4 text-orange-400" /> Tulis Manual
                </button>
              </div>

              {/* Bagian Daftar Catatan */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Catatan Kamu</h2>
                  <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/10">
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition ${viewMode === "grid" ? "bg-[#5546ed] text-white shadow-sm" : "text-white/50 hover:text-white"}`}>
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition ${viewMode === "list" ? "bg-[#5546ed] text-white shadow-sm" : "text-white/50 hover:text-white"}`}>
                      <ListIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap md:flex-nowrap items-center gap-3 mb-8">
                  <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari catatan..." 
                      className="w-full bg-[#202438] border border-white/10 rounded-[14px] pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition shadow-sm"
                    />
                  </div>
                  
                  {/* DROPDOWN FILTER SUBJEK */}
                  <div className="relative w-full sm:w-auto">
                    <button onClick={() => setShowSubjectDropdown(!showSubjectDropdown)} className="w-full sm:w-auto justify-between bg-[#202438] border border-white/10 rounded-[14px] px-4 py-3 text-sm text-white/70 flex items-center gap-2 hover:text-white transition shadow-sm shrink-0">
                      <Folder className="h-4 w-4" /> 
                      {filterSubject === "Semua" ? "Semua Subjek" : filterSubject} 
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                    {showSubjectDropdown && (
                      <>
                        <div className="fixed inset-0 z-[80]" onClick={() => setShowSubjectDropdown(false)} />
                        <div className="absolute top-full mt-2 right-0 w-48 bg-[#202438] border border-white/10 rounded-xl shadow-xl z-[90] py-2 max-h-[300px] overflow-y-auto">
                          {uniqueSubjects.map(sub => (
                            <button key={sub} onClick={() => { setFilterSubject(sub); setShowSubjectDropdown(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 text-white/80 hover:text-white transition">
                              {sub}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* DROPDOWN SORTING TERBARU/TERLAMA */}
                  <div className="relative w-full sm:w-auto">
                    <button onClick={() => setShowSortDropdown(!showSortDropdown)} className="w-full sm:w-auto justify-between bg-[#202438] border border-white/10 rounded-[14px] px-4 py-3 text-sm text-white/70 flex items-center gap-2 hover:text-white transition shadow-sm shrink-0">
                      {sortBy === "terbaru" ? "Terbaru" : sortBy === "terlama" ? "Terlama" : "A-Z"}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </button>
                    {showSortDropdown && (
                      <>
                        <div className="fixed inset-0 z-[80]" onClick={() => setShowSortDropdown(false)} />
                        <div className="absolute top-full mt-2 right-0 w-40 bg-[#202438] border border-white/10 rounded-xl shadow-xl z-[90] py-2">
                          <button onClick={() => { setSortBy("terbaru"); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 text-white/80 hover:text-white transition">Terbaru</button>
                          <button onClick={() => { setSortBy("terlama"); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 text-white/80 hover:text-white transition">Terlama</button>
                          <button onClick={() => { setSortBy("abjad"); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 text-white/80 hover:text-white transition">A - Z</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* RENDER CATATAN (GRID / LIST) */}
                {processedHistory.length === 0 ? (
                  <div className="w-full rounded-[24px] border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
                    <FileText className="h-10 w-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60">Belum ada catatan yang ditemukan.</p>
                    <button onClick={() => setShowUploadModal(true)} className="mt-4 text-[#5546ed] hover:underline font-medium text-sm">Buat catatan pertamamu!</button>
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {processedHistory.map((item) => (
                      <div
                        key={item.fileKey}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("[data-note-menu]")) return;
                          onOpenNote(item.fileKey);
                        }}
                        className="rounded-[20px] border border-white/10 bg-[#202438] p-5 cursor-pointer hover:border-[#5546ed]/50 hover:bg-[#232738] hover:-translate-y-1 transition-all duration-300 group flex flex-col shadow-sm hover:shadow-xl"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="h-12 w-12 rounded-[14px] bg-[#1b1f2d] border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:border-[#5546ed]/30 transition-colors">
                            {item.fileName === "YouTube Video" ? <PlayCircle className="h-5 w-5 text-red-500" /> : <FileText className="h-5 w-5 text-white/70 group-hover:text-[#5546ed] transition-colors" />}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
  <div className="flex items-center justify-between gap-2">
    <h3 className="flex-1 font-bold text-[15px] leading-tight text-white truncate group-hover:text-[#5546ED] transition-colors">
      {item.title}
    </h3>
    
    {/* TOMBOL TITIK TIGA GRID */}
    <div className="relative z-30 shrink-0" data-note-menu>
      <button 
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item.fileKey ? null : item.fileKey); }}
        className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {openMenuId === item.fileKey && (
        <>
          <div className="fixed inset-0 z-[80]" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
          <div className="absolute top-full right-0 mt-1 w-32 bg-[#1b1f2d] border border-white/10 rounded-xl shadow-2xl z-[90] py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <button 
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => confirmDelete(item.fileKey, e)}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus
            </button>
          </div>
        </>
      )}
    </div>
  </div>
  <p className="text-xs text-white/40 truncate mt-1">{item.subject || "Subjek Umum"}</p>
</div>
                        </div>
                        <p className="text-white/50 text-sm line-clamp-2 mb-5 flex-1 leading-relaxed">
                          {item.summaryHtml ? item.summaryHtml.replace(/<[^>]*>?/gm, '') : `# ${item.title}`}
                        </p>
                        <div className="flex items-center justify-between text-xs font-medium text-white/40 pt-4 border-t border-white/5">
                          <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md"><BookOpen className="h-3.5 w-3.5" /> {item.cards?.length || 0} cards</div>
                          <div className="flex items-center gap-1.5">{new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {processedHistory.map((item) => (
                      <div
                        key={item.fileKey}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest("[data-note-menu]")) return;
                          onOpenNote(item.fileKey);
                        }}
                        className="rounded-[16px] border border-white/10 bg-[#202438] p-4 cursor-pointer hover:border-[#5546ed]/50 hover:bg-[#232738] transition-all duration-300 group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 shadow-sm hover:shadow-md"
                      >
                        <div className="h-12 w-12 rounded-[14px] bg-[#1b1f2d] border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:border-[#5546ed]/30 transition-colors">
                          {item.fileName === "YouTube Video" ? <PlayCircle className="h-5 w-5 text-red-500" /> : <FileText className="h-5 w-5 text-white/70 group-hover:text-[#5546ed] transition-colors" />}
                        </div>
                        <div className="w-full sm:w-[200px] lg:w-[250px] overflow-hidden shrink-0">
                          <h3 className="font-bold text-[15px] leading-tight text-white truncate group-hover:text-[#5546ed] transition-colors">{item.title}</h3>
                          <p className="text-xs text-white/40 truncate mt-1">{item.subject || "Subjek Umum"}</p>
                        </div>
                        <div className="hidden md:block flex-1 border-l border-white/10 pl-5 overflow-hidden">
                          <p className="text-white/50 text-sm truncate">
                            {item.summaryHtml ? item.summaryHtml.replace(/<[^>]*>?/gm, '') : `# ${item.title}`}
                          </p>
                        </div>
                        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-5 shrink-0 text-xs font-medium text-white/40 sm:ml-auto sm:border-l border-white/10 sm:pl-5">
  <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
    <BookOpen className="h-3.5 w-3.5" /> {item.cards?.length || 0} cards
  </div>
  <div className="hidden sm:block w-[80px] text-right">
    {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
  </div>
  
  {/* TOMBOL TITIK TIGA LIST */}
  <div className="relative z-30" data-note-menu>
    <button 
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item.fileKey ? null : item.fileKey); }}
      className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition"
    >
      <MoreVertical className="h-4 w-4" />
    </button>
    {openMenuId === item.fileKey && (
      <>
        <div className="fixed inset-0 z-[80]" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
        <div className="absolute top-full right-0 mt-1 w-32 bg-[#1b1f2d] border border-white/10 rounded-xl shadow-2xl z-[90] py-1 animate-in fade-in zoom-in-95 duration-150">
          <button 
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => confirmDelete(item.fileKey, e)}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
          >
            <Trash2 className="h-3.5 w-3.5" /> Hapus
          </button>
        </div>
      </>
    )}
  </div>
</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =======================================================
              TAMPILAN 2: STUDY GUIDES
              ======================================================= */}
          {activeSidebar === "study-guides" && (
            <div className="max-w-[1100px] mx-auto p-4 md:p-10 animate-in fade-in duration-500">
              <div className="flex flex-col items-center text-center mb-12">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="h-8 w-8 text-[#5546ed]" />
                  <h1 className="text-3xl md:text-5xl font-black text-white">Expert Study Guides</h1>
                </div>
                <p className="text-white/50 text-lg">Explore our expert curated content libraries for popular courses!</p>
              </div>

              <div className="flex flex-col items-center gap-8 mb-16">
                <div className="relative w-full max-w-xl">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                  <input 
                    type="text" 
                    value={guideSearch}
                    onChange={(e) => setGuideSearch(e.target.value)}
                    placeholder="Search for courses..." 
                    className="w-full bg-[#202438] border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:border-[#5546ed]/50 transition-all shadow-xl"
                  />
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeCategory === cat ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGuides.map((guide) => (
                  <div 
                    key={guide.id} 
                    onClick={() => guide.isLocked ? setShowUpgradeModal(true) : alert("Fitur menambahkan course ini akan segera hadir!")}
                    className={`group rounded-[24px] overflow-hidden border border-white/10 bg-[#202438] shadow-lg transition-all duration-300 flex flex-col cursor-pointer ${guide.isLocked ? 'opacity-90' : 'hover:shadow-[#5546ed]/20 hover:-translate-y-2'}`}
                  >
                    {/* Bagian Gambar (Atas) */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <img 
                        src={guide.img} 
                        alt={guide.title} 
                        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${guide.isLocked ? 'grayscale opacity-40' : 'group-hover:scale-110'}`} 
                      />
                      
                      {/* Overlay Efek & Icon Gembok */}
                      <div className={`absolute inset-0 transition-colors duration-300 ${guide.isLocked ? 'bg-black/40 flex items-center justify-center' : 'bg-black/10 group-hover:bg-transparent'}`}>
                        {guide.isLocked && (
                          <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
                            <Lock className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Bagian Teks (Bawah) */}
                    <div className="p-5 bg-[#202438] border-t border-white/5 relative flex flex-col justify-between flex-1">
                      {/* Badge Premium untuk yang dilock */}
                      {guide.isLocked && (
                        <div className="absolute top-0 right-5 -translate-y-1/2 bg-indigo-500 text-white text-[10px] font-black tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-indigo-500/30">
                          <Sparkles className="h-3 w-3" /> PRO
                        </div>
                      )}

                      <h3 className={`text-[17px] font-black leading-tight mb-4 transition-colors duration-300 ${guide.isLocked ? 'text-white/50' : 'text-white group-hover:text-[#5546ed]'}`}>
                         {guide.title}
                      </h3>

                      {/* --- RATING & ENROLLED STUDENTS --- */}
                      <div className="flex items-center gap-3 text-[13px] font-semibold text-white/50 mt-auto">
                        <div className="flex items-center gap-1.5">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className={guide.isLocked ? 'text-white/40' : 'text-white/80'}>{guide.rating}</span>
                        </div>
                        <div className="h-1 w-1 rounded-full bg-white/20" /> {/* Pemisah titik */}
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>{guide.enrolled}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =======================================================
              TAMPILAN 3: SETTINGS
              ======================================================= */}
          {/* =======================================================
              TAMPILAN 3: SETTINGS (PROFIL & AKUN)
              ======================================================= */}
          {activeSidebar === "settings" && (
            <div className="max-w-[1100px] mx-auto p-4 md:p-10 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                
                {/* SIDEBAR PROFIL (KIRI) */}
                <div className="w-full md:w-[350px] flex flex-col gap-6">
                  <div className="rounded-[32px] border border-white/10 bg-[#1b1f2d] p-8 flex flex-col items-center text-center shadow-xl">
                    {/* Foto Profil */}
                    <div className="relative mb-6">
                      <div className="h-32 w-32 rounded-full bg-indigo-600 flex items-center justify-center text-5xl font-bold text-white border-4 border-[#202438] shadow-2xl">
                        {initials}
                      </div>
                      <button className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-[#202438] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition shadow-lg">
                        <Camera className="h-5 w-5" />
                      </button>
                    </div>

                    <h2 className="text-3xl font-bold text-white flex items-center gap-2 mb-8">
                      {userProfile.name} <Edit2 className="h-4 w-4 text-white/30 cursor-pointer hover:text-white transition" />
                    </h2>

                    {/* Info List */}
                    <div className="w-full space-y-6 text-left">
                      <div>
                        <label className="block text-xs font-bold text-white/30 uppercase tracking-widest mb-1">Email</label>
                        <div className="flex justify-between items-center text-white/80">
                          <span className="truncate text-sm font-medium">{userProfile.email}</span>
                          <Edit2 className="h-3.5 w-3.5 text-white/20 cursor-pointer" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/30 uppercase tracking-widest mb-1">Language</label>
                        <div className="flex justify-between items-center text-white/80">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="text-lg">🇺🇸</span> English
                          </div>
                          <ChevronDown className="h-4 w-4 text-white/20 cursor-pointer" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-white/30 uppercase tracking-widest mb-1">User ID</label>
                        <div className="flex justify-between items-center text-white/80">
                          <span className="text-[13px] font-mono opacity-60">35745ce5-96d8-...</span>
                          <Edit2 className="h-3.5 w-3.5 text-white/20" />
                        </div>
                      </div>
                    </div>

                    {/* Logout Button */}
                    <button className="w-full mt-10 py-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 font-bold flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all duration-300">
                      <LogOut className="h-5 w-5" />
                      Log Out
                    </button>
                  </div>
                </div>

                {/* DETAIL KONTEN (KANAN) */}
                <div className="flex-1 flex flex-col gap-6 w-full">
                  
                  {/* CARD 1: SUBSCRIPTION */}
                  <div className="rounded-[32px] border border-white/10 bg-[#1b1f2d] p-8 shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-sm font-bold text-white/40 uppercase tracking-widest mb-1">Subscription</p>
                        <h3 className="text-white/60 text-sm font-medium">Basic access with essential features</h3>
                      </div>
                      <Sparkles className="h-6 w-6 text-indigo-500" />
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-white/20 uppercase tracking-widest mb-1">Current Plan</p>
                        <h4 className="text-4xl font-black text-white uppercase tracking-tight">Starter</h4>
                      </div>
                      <button 
  onClick={() => setShowUpgradeModal(true)} 
  className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-3 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
>
  <Rocket className="h-5 w-5" />
  Upgrade
</button>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mt-10 pt-8 border-t border-white/5">
                      <div>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Lock className="h-3 w-3" /> Access Code
                        </p>
                        <p className="text-sm font-bold text-white/40 italic">Not assigned</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> Member Since
                        </p>
                        <p className="text-sm font-bold text-white/80">Apr 29, 2026</p>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: AKUN TERHUBUNG */}
                  <div className="rounded-[32px] border border-white/10 bg-[#1b1f2d] p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <LinkIcon className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Akun Terhubung</h3>
                        <p className="text-sm text-white/40 font-medium">Kelola metode login kamu</p>
                      </div>
                    </div>

                    {/* Connection List */}
                    <div className="space-y-4">
                      {/* Google */}
                      <div className="flex items-center justify-between p-5 rounded-2xl bg-[#11131f] border border-white/5 hover:border-white/10 transition">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-inner">
                            <img src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" className="h-6 w-6" alt="Google" />
                          </div>
                          <span className="font-bold text-white">Google</span>
                        </div>
                        <button className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-white/70 hover:bg-white/5 transition flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" /> Hubungkan
                        </button>
                      </div>

                      {/* Discord */}
                      <div className="flex items-center justify-between p-5 rounded-2xl bg-[#11131f] border border-white/5 hover:border-white/10 transition">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-[#5865F2] flex items-center justify-center">
                            <MessageCircle className="h-6 w-6 text-white fill-current" />
                          </div>
                          <span className="font-bold text-white">Discord</span>
                        </div>
                        <button className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-white/70 hover:bg-white/5 transition flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" /> Hubungkan
                        </button>
                      </div>

                      {/* Email & Password */}
                      <div className="flex items-center justify-between p-5 rounded-2xl bg-[#11131f] border border-white/5 hover:border-white/10 transition">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                            <Mail className="h-6 w-6 text-white/60" />
                          </div>
                          <div>
                            <span className="block font-bold text-white">Email & Password</span>
                            <span className="text-xs text-white/30 font-medium">Belum diatur</span>
                          </div>
                        </div>
                        <button className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white/80 hover:bg-white/10 transition flex items-center gap-2">
                          <Key className="h-4 w-4" /> Atur Password
                        </button>
                      </div>
                    </div>

                    <p className="mt-8 text-center text-xs text-white/20 font-medium leading-relaxed">
                      Kamu harus memiliki minimal satu metode login yang aktif untuk keamanan akun.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* =========================================
          MODAL 1: UPLOAD PDF/PPTX
      ========================================= */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-4 animate-in fade-in duration-200">
          <div className="bg-[#202438] border border-white/10 rounded-[24px] shadow-2xl w-full max-w-md max-h-[92dvh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-white">{uploadStep === "source" ? "Upload Dokumen" : "Pilih Jumlah"}</h3>
              </div>
              <button onClick={() => { setShowUploadModal(false); setUploadStep("source"); }} className="text-white/50 hover:text-white transition rounded-lg hover:bg-white/5 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {uploadStep === "source" ? (
              <form onSubmit={handleUploadSubmit} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-white/80 mb-2">Pilih File (PDF/PPTX)</label>
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]); }}
                    onClick={() => modalFileInputRef.current?.click()}
                    className={`w-full h-[120px] rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${isDragging ? 'border-[#5546ed] bg-[#5546ed]/10' : 'border-white/20 bg-black/20 hover:border-white/40 hover:bg-black/40'}`}
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center text-center px-4">
                        <FileText className="h-6 w-6 text-[#5546ed] mb-2" />
                        <span className="text-white font-medium text-[13px] line-clamp-1">{selectedFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center px-4">
                        <UploadCloud className="h-6 w-6 text-white/40 mb-2" />
                        <span className="text-white/50 text-[13px]">Drag & Drop file ke sini atau <b className="text-white">klik</b> untuk mencari</span>
                      </div>
                    )}
                  </div>
                  <input ref={modalFileInputRef} type="file" accept=".pdf, .pptx" onChange={(e) => { if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]); }} className="hidden" />
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-semibold text-white/80 mb-2">Mata Pelajaran / Kuliah</label>
                  <input type="text" value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)} placeholder="Contoh: Matematika, Fisika Dasar..." className="w-full bg-[#1b1f2d] border border-white/10 rounded-[16px] px-4 py-3.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition shadow-inner" required />
                </div>

                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowUploadModal(false)} className="px-5 py-2.5 rounded-[14px] text-[14px] font-semibold text-white/70 hover:bg-white/5 transition">Batal</button>
                  <button type="submit" disabled={!selectedFile || !uploadSubject.trim()} className="px-6 py-2.5 rounded-[14px] bg-[#5546ed] hover:bg-[#4a28c1] text-white text-[14px] font-bold shadow-lg shadow-shadow-indigo-600/20/20 transition disabled:opacity-50">Selanjutnya</button>
                </div>
              </form>
            ) : (
              <div className="p-6">
                <p className="text-sm text-white/60 mb-5 leading-relaxed">Pilih jumlah flashcard dan quiz yang akan dibuat otomatis dari dokumen ini.</p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {GENERATION_COUNT_OPTIONS.map((count) => {
                    const isProOption = count > 15;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          if (isProOption) {
                            setShowUpgradeModal(true);
                            return;
                          }
                          setUploadGenerationCount(count);
                        }}
                        className={`relative rounded-[16px] border px-4 py-5 text-center transition ${!isProOption && uploadGenerationCount === count ? "border-[#5546ed] bg-[#5546ed]/15 text-white" : "border-white/10 bg-black/20 text-white/60 hover:bg-white/5"} ${isProOption ? "pt-6" : ""}`}
                      >
                        {isProOption && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#7c3aed] px-2.5 py-0.5 text-[10px] font-black tracking-wider text-white shadow-lg shadow-purple-700/30">
                            PRO
                          </span>
                        )}
                        <span className="block text-2xl font-black">{count}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wide">Item</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setUploadStep("source")} className="px-5 py-2.5 rounded-[14px] text-[14px] font-semibold text-white/70 hover:bg-white/5 transition">Kembali</button>
                  <button type="button" onClick={handleStartUploadGeneration} className="px-6 py-2.5 rounded-[14px] bg-[#5546ed] hover:bg-[#4a28c1] text-white text-[14px] font-bold shadow-lg shadow-shadow-indigo-600/20/20 transition">Generate</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 2: YOUTUBE
      ========================================= */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-4 animate-in fade-in duration-200">
          <div className="bg-[#202438] border border-white/10 rounded-[24px] shadow-2xl w-full max-w-md max-h-[92dvh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <PlayCircle className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white">{youtubeStep === "source" ? "Video YouTube" : "Pilih Jumlah"}</h3>
              </div>
              <button onClick={() => { setShowYoutubeModal(false); setYoutubeStep("source"); }} className="text-white/50 hover:text-white transition rounded-lg hover:bg-white/5 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            {youtubeStep === "source" ? (
              <form onSubmit={handleYoutubeSubmit} className="p-6">
                <p className="text-sm text-white/60 mb-5 leading-relaxed">
                  Masukkan link video YouTube yang ingin kamu rangkum. Pastikan video tersebut memiliki <b>Subtitle/CC</b> ya!
                </p>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-white/80 mb-2">Link YouTube</label>
                  <input type="url" value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="w-full bg-[#1b1f2d] border border-white/10 rounded-[16px] px-4 py-3.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition shadow-inner" required />
                </div>
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-white/80 mb-2">Mata Pelajaran / Kuliah</label>
                  <input type="text" value={youtubeSubject} onChange={(e) => setYoutubeSubject(e.target.value)} placeholder="Contoh: Sejarah, Biologi..." className="w-full bg-[#1b1f2d] border border-white/10 rounded-[16px] px-4 py-3.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition shadow-inner" required />
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowYoutubeModal(false)} className="px-5 py-2.5 rounded-[14px] text-[14px] font-semibold text-white/70 hover:bg-white/5 transition">Batal</button>
                  <button type="submit" disabled={!youtubeLink.trim() || !youtubeSubject.trim()} className="px-6 py-2.5 rounded-[14px] bg-[#5546ed] hover:bg-[#4a28c1] text-white text-[14px] font-bold shadow-lg shadow-shadow-indigo-600/20/20 transition disabled:opacity-50">Selanjutnya</button>
                </div>
              </form>
            ) : (
              <div className="p-6">
                <p className="text-sm text-white/60 mb-5 leading-relaxed">Pilih jumlah flashcard dan quiz yang akan dibuat otomatis dari video ini.</p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {GENERATION_COUNT_OPTIONS.map((count) => {
                    const isProOption = count > 15;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          if (isProOption) {
                            setShowUpgradeModal(true);
                            return;
                          }
                          setYoutubeGenerationCount(count);
                        }}
                        className={`relative rounded-[16px] border px-4 py-5 text-center transition ${!isProOption && youtubeGenerationCount === count ? "border-[#5546ed] bg-[#5546ed]/15 text-white" : "border-white/10 bg-black/20 text-white/60 hover:bg-white/5"} ${isProOption ? "pt-6" : ""}`}
                      >
                        {isProOption && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#7c3aed] px-2.5 py-0.5 text-[10px] font-black tracking-wider text-white shadow-lg shadow-purple-700/30">
                            PRO
                          </span>
                        )}
                        <span className="block text-2xl font-black">{count}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wide">Item</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setYoutubeStep("source")} className="px-5 py-2.5 rounded-[14px] text-[14px] font-semibold text-white/70 hover:bg-white/5 transition">Kembali</button>
                  <button type="button" onClick={handleStartYoutubeGeneration} className="px-6 py-2.5 rounded-[14px] bg-[#5546ed] hover:bg-[#4a28c1] text-white text-[14px] font-bold shadow-lg shadow-shadow-indigo-600/20/20 transition">Generate</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          MODAL 3: TULIS MANUAL
      ========================================= */}
      {showWriteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 md:p-4 animate-in fade-in duration-200">
          <div className="bg-[#202438] border border-white/10 rounded-[24px] shadow-2xl w-full max-w-md max-h-[92dvh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-shadow-indigo-600/20/10 border border-shadow-indigo-600/20/20 flex items-center justify-center">
                  <Edit2 className="h-5 w-5 text-shadow-indigo-600/20" />
                </div>
                <h3 className="text-xl font-bold text-white">Tulis Manual</h3>
              </div>
              <button onClick={() => setShowWriteModal(false)} className="text-white/50 hover:text-white transition rounded-lg hover:bg-white/5 p-1"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleWriteSubmit} className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-semibold text-white/80 mb-2">Judul Catatan</label>
                <input type="text" value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} placeholder="Masukkan judul..." className="w-full bg-[#1b1f2d] border border-white/10 rounded-[16px] px-4 py-3.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-shadow-indigo-600/20/50 transition shadow-inner" required />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-semibold text-white/80 mb-2">Mata Pelajaran / Kuliah</label>
                <input type="text" value={writeSubject} onChange={(e) => setWriteSubject(e.target.value)} placeholder="Contoh: Pengantar Bisnis..." className="w-full bg-[#1b1f2d] border border-white/10 rounded-[16px] px-4 py-3.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-shadow-indigo-600/20/50 transition shadow-inner" required />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowWriteModal(false)} className="px-5 py-2.5 rounded-[14px] text-[14px] font-semibold text-white/70 hover:bg-white/5 transition">Batal</button>
                <button type="submit" disabled={!writeTitle.trim() || !writeSubject.trim()} className="px-6 py-2.5 rounded-[14px] bg-[#5546ed] hover:bg-[#4a28c1] text-white text-[14px] font-bold shadow-lg shadow-shadow-indigo-600/20/20 transition disabled:opacity-50">Tulis Sekarang</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL TARGET UJIAN
      ========================================= */}
      {showExamModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 md:p-4 animate-in fade-in duration-300">
          <div className="bg-[#202438] border border-white/10 rounded-[28px] shadow-2xl w-full max-w-[400px] overflow-hidden animate-in zoom-in-90 duration-300 flex flex-col items-center p-8 text-center relative">
            <button onClick={() => setShowExamModal(false)} className="absolute top-5 right-5 text-white/30 hover:text-white transition"><X className="h-5 w-5" /></button>
            <div className="h-16 w-16 bg-blue-500/10 border border-blue-500/20 rounded-[20px] flex items-center justify-center mb-6"><Calendar className="h-8 w-8 text-blue-400" /></div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Kapan target ujianmu?</h2>
            <p className="text-white/50 text-sm mb-8 leading-relaxed px-4">Atur tanggal ujianmu agar kami bisa menyesuaikan progress belajar dan membantumu tetap fokus.</p>
            <form onSubmit={handleSaveExamDate} className="w-full">
              <div className="mb-8"><input type="date" min={new Date().toISOString().split("T")[0]} value={tempExamDate} onChange={(e) => setTempExamDate(e.target.value)} className="w-full bg-[#1b1f2d] border border-white/10 rounded-[16px] px-5 py-4 text-[16px] text-white focus:outline-none focus:border-blue-500/50 transition shadow-inner font-medium [color-scheme:dark]" required /></div>
              <button type="submit" disabled={!tempExamDate} className="w-full py-4 rounded-[16px] bg-blue-600 hover:bg-blue-500 text-white text-[15px] font-bold shadow-lg shadow-blue-500/20 transition disabled:opacity-50">Mulai Fokus Belajar!</button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODAL KONFIRMASI HAPUS
      ========================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-[#1f2029] border border-white/10 rounded-[28px] shadow-2xl w-full max-w-[400px] p-8 text-center animate-in zoom-in-95 duration-300">
            
            {/* Ikon Peringatan */}
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5 border border-red-500/20 shadow-inner">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            
            {/* Teks */}
            <h3 className="text-2xl font-black text-white mb-3">Hapus Catatan?</h3>
            <p className="text-white/60 text-[15px] leading-relaxed mb-8">
              Catatan ini akan dihapus secara permanen dari memorimu dan tidak dapat dikembalikan lagi.
            </p>
            
            {/* Tombol Aksi */}
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors border border-white/10"
              >
                Batal
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20 transition-all active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================
          MODAL UPGRADE PREMIUM
      ========================================= */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 md:p-4 animate-in fade-in duration-300">
          <div className="bg-[#1f2029] border border-white/10 rounded-[28px] shadow-2xl w-full max-w-[600px] max-h-[92dvh] overflow-y-auto relative p-6 md:p-10 animate-in zoom-in-95 duration-300">
            
            {/* Close Button */}
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-6 right-6 text-white/40 hover:text-white transition">
              <X className="h-6 w-6" />
            </button>

            {/* Headers */}
            <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-3">Upgrade to Premium</h2>
            <p className="text-white/70 text-center mb-10 text-[15px]">Join <b className="text-white">1,000,000+</b> students learning smarter with belajar.ai</p>

            {/* Features List */}
            <div className="space-y-4 mb-10 max-w-[480px] mx-auto">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-white shrink-0" />
                <p className="text-white/90 text-sm"><b className="text-white">Unlimited uploads</b> — PDFs, lectures, videos — all processed by AI</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-white shrink-0" />
                <p className="text-white/90 text-sm"><b className="text-white">Unlimited quizzes & flashcards</b> — Auto-generated from your material</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-white shrink-0" />
                <p className="text-white/90 text-sm"><b className="text-white">AI tutor 24/7</b> — Ask anything, understand everything</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-white shrink-0" />
                <p className="text-white/90 text-sm"><b className="text-white">Unlimited study podcasts</b> — Learn on the go, anytime</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-white shrink-0" />
                <p className="text-white/90 text-sm"><b className="text-white">Faster AI</b> — Notes and edits in seconds</p>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Annual Plan */}
              <div 
                onClick={() => setSelectedPlan("annual")}
                className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 border-2 ${selectedPlan === "annual" ? "bg-[#5a8b5e]/20 border-[#6fb073]" : "bg-white/5 border-transparent hover:bg-white/10"}`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7c5fba] text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  50% off
                </div>
                <div className="text-center mt-2">
                  <div className="text-white font-bold mb-2">Annual</div>
                  <div className="text-3xl font-extrabold text-white mb-2">Rp. 30.000 <span className="text-sm text-white/50 font-medium">/ mo</span></div>
                  <div className="text-xs text-white/60">billed yearly · Rp. 1.000/day</div>
                </div>
              </div>

              {/* Monthly Plan */}
              <div 
                onClick={() => setSelectedPlan("monthly")}
                className={`rounded-2xl p-5 cursor-pointer transition-all duration-200 border-2 mt-2 md:mt-0 ${selectedPlan === "monthly" ? "bg-[#5a8b5e]/20 border-[#6fb073]" : "bg-[#2a2c36] border-transparent hover:bg-[#333541]"}`}
              >
                <div className="text-center mt-2">
                  <div className="text-white font-bold mb-2">Monthly</div>
                  <div className="text-3xl font-extrabold text-white mb-2">Rp. 60.000 <span className="text-sm text-white/50 font-medium">/ mo</span></div>
                  <div className="text-xs text-white/60">billed monthly · Rp. 2.000/day</div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8869c9] to-[#6d54a5] hover:opacity-90 text-white font-bold text-lg flex items-center justify-center gap-2 transition-opacity shadow-lg shadow-purple-900/20">
              <Sparkles className="h-5 w-5" /> Upgrade Now
            </button>
            
            <p className="text-center text-white/40 text-xs mt-6">
              Join 1 million people studying smarter with belajar.ai
            </p>
          </div>
        </div>
      )}

      {/* --- 3. LETAKKAN UI BANNER DI SINI (SEBELUM PENUTUP UTAMA) --- */}
      {showNotifPrompt && (
        <div className="fixed bottom-5 left-5 right-5 bg-indigo-900 text-white p-5 rounded-xl shadow-lg z-50 flex flex-col md:flex-row items-center justify-between gap-4 border border-indigo-700">
          <div>
            <h3 className="font-bold text-lg">Jangan Sampai Nilaimu Jelek! 🚀</h3>
            <p className="text-sm text-gray-300">Izinkan notifikasi agar kami bisa mengingatkan kamu belajar buat ujianmu.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowNotifPrompt(false)} 
              className="px-4 py-2 text-sm text-gray-300 hover:text-white"
            >
              Nanti
            </button>
            <button 
              onClick={handleCustomSubscribe} 
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg font-bold"
            >
              Aktifkan
            </button>
          </div>
        </div>
      )}

      {/* Banner PWA (Letakkan di dalam return, sebelum div penutup) */}
      {showInstallPrompt && (
        <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-3 shadow-md z-[100] flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div>
              <p className="font-bold text-sm">Install belajar.ai</p>
              <p className="text-xs text-blue-200">Akses lebih cepat dari layar HP kamu!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowInstallPrompt(false)}
              className="px-3 py-1 text-sm bg-blue-800 hover:bg-blue-900 rounded-md"
            >
              Nanti
            </button>
            <button 
              onClick={handleInstallClick}
              className="px-3 py-1 text-sm bg-white text-blue-600 font-bold hover:bg-gray-200 rounded-md shadow"
            >
              Install
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
