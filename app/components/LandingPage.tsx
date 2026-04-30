"use client";

import { useState, useEffect } from "react";
import { ArrowRight, BookOpen, Brain, PlayCircle, Sparkles, Zap, FileText, UploadCloud, Mic, MousePointer2, Play, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

const USER_PROFILE_KEY = "belajar_ai_user_profile_v1";

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  // STATE UNTUK ANIMASI SHOWCASE
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  const handleGetStarted = () => {
    try {
      const savedProfile = localStorage.getItem(USER_PROFILE_KEY);
      if (savedProfile) {
        onGetStarted();
        return;
      }
    } catch {}

    setShowProfileModal(true);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = profileName.trim();
    const email = profileEmail.trim();
    if (!name || !email) return;

    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify({ name, email }));
    setShowProfileModal(false);
    onGetStarted();
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    if (step === 0) {
      // Step 0: Menampilkan state Upload selama 2.5 detik
      timeout = setTimeout(() => setStep(1), 2500);
    } else if (step === 1) {
      // Step 1: Menjalankan progress bar dari 0 ke 100
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStep(2); // Lanjut ke Step 2 (Hasil)
            return 100;
          }
          // Tambah progress secara acak agar terlihat natural
          return prev + Math.floor(Math.random() * 15) + 5; 
        });
      }, 150);
    } else if (step === 2) {
      // Step 2: Menampilkan hasil catatan selama 5 detik, lalu kembali ke Step 0
      timeout = setTimeout(() => {
        setStep(0);
        setProgress(0);
      }, 5000);
    }

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [step]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative font-sans selection:bg-[#5546ED]/30">
      
      {/* Efek Cahaya Background Khas Turbo.ai */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#5546ED]/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-[#9b4dca]/10 blur-[120px] rounded-full pointer-events-none" />

      {/* --- FLOATING NAVBAR --- */}
      <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
        <nav className="pointer-events-auto flex items-center justify-between px-4 py-2.5 w-full max-w-3xl rounded-full border border-white/10 bg-[#10111a]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all">
          
          {/* Logo Kiri */}
          <div className="flex items-center gap-2.5 cursor-pointer pl-2">
            <div className="h-7 w-7 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[17px] font-extrabold tracking-tight text-white">belajar.ai</span>
          </div>

          {/* Menu Tengah (Seperti di referensi) */}
          <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-white/60">
            <a href="#blog" className="hover:text-white transition-colors">Blog</a>
            <a href="#careers" className="hover:text-white transition-colors">Karier</a>
          </div>

          {/* Tombol Kanan */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGetStarted}
              className="rounded-full border border-white/10 bg-white/5 text-white px-5 py-2 text-[13px] font-bold hover:bg-white/10 transition-colors shadow-sm"
            >
              Mulai sekarang
            </button>
          </div>
          
        </nav>
      </div>

      {/* HERO SECTION (SPLIT LAYOUT) */}
      <main className="relative z-10 pt-40 pb-32 px-6 flex flex-col lg:flex-row items-center justify-between gap-16 max-w-7xl mx-auto">

        {/* KIRI: Teks & Tombol CTA */}
        <div className="flex-1 flex flex-col items-center text-center lg:items-start lg:text-left w-full">
          
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="text-lg">🎉</span>
            <span className="text-xs font-semibold text-white/80 tracking-wide">Kami baru saja mencapai 1 Juta pengguna!</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-black tracking-tighter leading-[1.05] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Belajar jadi <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">mudah</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/60 max-w-xl mb-10 leading-snug font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Ubah apa saja menjadi catatan, flashcard, kuis, dan banyak lagi.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <button 
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#5546ED] hover:bg-[#4A28C1] text-white font-bold text-[15px] flex items-center justify-center shadow-[0_0_30px_rgba(85,70,237,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              Mulai Sekarang - Gratis
            </button>
          </div>
        </div>

        {/* KANAN: Animasi Interaktif Showcase */}
        <div className="flex-1 w-full max-w-[550px] relative animate-in fade-in zoom-in-95 duration-1000 delay-500">
          {/* Efek Glow di Belakang Mockup */}
          <div className="absolute -inset-1 bg-gradient-to-br from-[#5546ED]/40 to-purple-600/40 rounded-[32px] blur-2xl opacity-50" />
          
          {/* Container Mockup */}
          <div className="relative h-[400px] w-full rounded-[24px] border border-white/10 bg-[#10111a]/90 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col items-center justify-center p-8">
            
            {/* --- STATE 0: UPLOAD --- */}
            {step === 0 && (
              <div className="flex flex-col items-center justify-center w-full animate-in fade-in zoom-in duration-300">
                <p className="text-xs text-white/50 mb-4 font-semibold tracking-wide">Kuliah 5: Biologi Sel.pdf</p>
                <div className="w-24 h-32 rounded-2xl border-2 border-dashed border-[#5546ED]/50 bg-[#5546ED]/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(85,70,237,0.15)] relative">
                  <FileText className="h-10 w-10 text-[#5546ED]" />
                  <div className="absolute -bottom-3 -right-3 bg-[#5546ED] rounded-full p-1.5 border-[3px] border-[#10111a]">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60 font-medium">
                  <UploadCloud className="h-4.5 w-4.5" /> Tarik PDF kamu ke sini
                </div>
              </div>
            )}

            {/* --- STATE 1: LOADING --- */}
            {step === 1 && (
              <div className="flex flex-col items-center justify-center w-full animate-in fade-in duration-300">
                <div className="text-[56px] font-black text-white mb-6 tracking-tighter tabular-nums leading-none">
                  {progress}<span className="text-2xl text-white/40 ml-1">%</span>
                </div>
                <div className="w-3/4 h-2.5 bg-white/10 rounded-full overflow-hidden mb-5 border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#5546ED] to-purple-400 rounded-full transition-all duration-200 ease-out" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <div className="text-sm text-white/50 font-medium animate-pulse">Menulis tentang biologi sel...</div>
              </div>
            )}

            {/* --- STATE 2: HASIL CATATAN --- */}
            {step === 2 && (
              <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-[#5546ED]/20 text-[#5546ED]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-[17px] text-white tracking-tight">Kuliah 5: Biologi Sel</h3>
                </div>
                
                <p className="text-[13px] text-white/60 leading-relaxed mb-4">
                  Teori sel adalah salah satu prinsip dasar biologi. Teori ini menyatakan bahwa:
                </p>
                <ul className="list-disc pl-5 text-[13px] text-white/60 space-y-2.5 mb-6 marker:text-[#5546ED]">
                  <li>Semua makhluk hidup tersusun dari satu sel atau lebih.</li>
                  <li>Sel adalah unit dasar kehidupan pada semua makhluk hidup.</li>
                  <li>Semua sel berasal dari sel yang sudah ada sebelumnya.</li>
                </ul>

                <div className="flex items-center gap-3 mt-6 mb-4">
                  <div className="p-1.5 rounded-md bg-pink-500/20 text-pink-400">
                    <Brain className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-[15px] text-white tracking-tight">Jenis-jenis Sel</h4>
                </div>
                
                <p className="text-[13px] text-white/60 mb-4">Ada dua jenis sel utama, dibedakan berdasarkan organisasi strukturalnya:</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                     <div className="h-12 w-12 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center border border-orange-500/20 shadow-inner">
                       <span className="text-xl">🦠</span>
                     </div>
                     <span className="text-xs font-semibold text-white/80">Sel Prokariotik</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                     <div className="h-12 w-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border border-green-500/20 shadow-inner">
                       <span className="text-xl">🌿</span>
                     </div>
                     <span className="text-xs font-semibold text-white/80">Sel Eukariotik</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* --- TRUSTED BY LOGO TICKER --- */}
      <section className="relative z-10 py-10 border-t border-b border-white/5 bg-white/[0.01] overflow-hidden mt-0">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes infinite-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .animate-infinite-scroll {
            /* Waktu diperlambat jadi 40s karena jumlah logo lebih banyak */
            animation: infinite-scroll 40s linear infinite;
          }
          .animate-infinite-scroll:hover {
            animation-play-state: paused;
          }
        `}} />
        
        <p className="text-center text-[15px] font-semibold text-white/50 mb-8 tracking-wide">
          belajar.ai dipercaya oleh mahasiswa dan akademisi di...
        </p>

        {/* Efek Fade transparan di sisi kiri dan kanan */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

        {/* PERUBAHAN DI SINI: Pakai w-max agar kotaknya bisa memanjang sesuai isi tanpa memaksakan diri ke lebar layar */}
        <div className="flex w-max animate-infinite-scroll">
          
          {[...Array(2)].map((_, i) => (
            /* PERUBAHAN DI SINI: Pakai gap-16 untuk jarak antar logo */
            <div key={i} className="flex items-center gap-16 px-8">
              
              {/* DAFTAR 10 GAMBAR LOGO */}
              {[
                "https://upload.wikimedia.org/wikipedia/id/a/a2/Logo_Binus_University.png", 
                "https://brand.ugm.ac.id/wp-content/uploads/sites/2/2021/03/UPDATE.png", 
                "https://upload.wikimedia.org/wikipedia/id/thumb/d/d8/UPH_LOGO.svg/330px-UPH_LOGO.svg.png", 
                "https://www.monsoonsim.com/uploads/190972_f18baac4e23711d2723e0f822030a77919694fe0.png",
                "https://www.prasetiyamulya.ac.id/wp-content/uploads/2020/01/Logo-Universitas-Prasetiya-Mulya.png",
                "https://www.ciputra.ac.id/wp-content/uploads/2021/09/LOGO-UC-PANJANG-FIX-SEP-2021-01.png", 
                "https://upload.wikimedia.org/wikipedia/id/9/95/Logo_Institut_Teknologi_Bandung.png", 
                "https://upload.wikimedia.org/wikipedia/id/thumb/0/0f/Logo_BPK_PENABUR.png/1280px-Logo_BPK_PENABUR.png", 
                "https://upload.wikimedia.org/wikipedia/en/thumb/f/ff/Jakarta_Intercultural_School_logo.svg/3840px-Jakarta_Intercultural_School_logo.svg.png", 
                "https://ridergalau.id/wp-content/uploads/2026/03/Logo-Universitas-Tarumanagara-UNTAR.png",
              ].map((logoSrc, index) => (
                <div key={index} className="relative h-12 w-32 flex items-center justify-center flex-shrink-0">
                  <img 
                    src={logoSrc} 
                    alt={`Trusted brand ${index + 1}`} 
                    className="max-h-full max-w-full object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300"
                  />
                </div>
              ))}

            </div>
          ))}

        </div>
      </section>

      

      {/* --- SHOWCASE BENTO BOX SECTION --- */}
      <section className="relative z-10 py-32 px-6 max-w-5xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col items-center mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8 text-xs font-medium text-white/70 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#5546ED]" />
            Platform Belajar AI<span className="font-bold text-white">#1</span>di Indonesia
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
            Satu-satunya pembuat catatan yang kamu butuhkan
          </h2>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl font-medium">
            belajar.ai merekam langsung, mengedit, memberi komentar, dan berkolaborasi layaknya <span className="text-[#9b8dff] bg-[#5546ED]/20 px-2 py-0.5 rounded-md border border-[#5546ED]/30">asisten sungguhan.</span>
          </p>
        </div>

        {/* --- CARD 1: Turn anything into an editable note --- */}
        <div className="bg-[#10111a]/80 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 md:p-12 relative overflow-hidden mb-8 shadow-2xl">
          <div className="relative z-10 mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">Ubah apa pun menjadi catatan yang bisa diedit.</h3>
            <p className="text-white/50 text-[15px] md:text-base">Ubah PDF, video, dan audio menjadi catatan yang bisa diedit dan dibagikan.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
            
            {/* Cluster Ikon Kiri */}
            <div className="relative w-64 h-56 flex-shrink-0">
              {/* DOC */}
              <div className="absolute top-10 left-0 bg-[#2563eb] rounded-2xl w-16 h-16 flex items-center justify-center font-black text-white text-xs shadow-lg transform -rotate-12 border-t border-white/20">DOC</div>
              {/* Video/Play */}
              <div className="absolute top-0 left-20 bg-[#dc2626] rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg transform rotate-6 border-t border-white/20"><Play className="h-6 w-6 text-white fill-white" /></div>
              {/* PPT */}
              <div className="absolute top-12 right-4 bg-[#ea580c] rounded-2xl w-16 h-16 flex items-center justify-center font-black text-white text-xs shadow-lg transform rotate-12 border-t border-white/20">PPT</div>
              {/* Mic */}
              <div className="absolute bottom-16 left-20 bg-[#1b1f2d] rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg border border-white/10 z-10"><Mic className="h-6 w-6 text-[#9b8dff]" /></div>
              {/* TXT */}
              <div className="absolute bottom-0 left-6 bg-[#374151] rounded-2xl w-16 h-16 flex items-center justify-center font-black text-white text-xs shadow-lg transform -rotate-6 border-t border-white/20">TXT</div>
              {/* PDF */}
              <div className="absolute bottom-4 right-12 bg-[#dc2626] rounded-2xl w-16 h-16 flex items-center justify-center font-black text-white text-xs shadow-lg transform rotate-12 border-t border-white/20">PDF</div>
            </div>

            {/* Garis Tengah Penghubung */}
            <div className="hidden md:flex items-center gap-3 w-full max-w-[200px]">
              <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-[#5546ED]/50" />
              <div className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-[13px] font-medium whitespace-nowrap shadow-lg">Membuat Catatan...</div>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-[#5546ED]/50 to-transparent" />
            </div>

            {/* Mockup Catatan Kanan */}
            <div className="bg-[#161822] border border-white/5 rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h4 className="text-white font-semibold text-[15px] mb-3">Deret Taylor dan Maclaurin</h4>
              <p className="text-[11px] text-white/40 leading-relaxed font-mono">
                Pada tutorial sebelumnya, kita membahas deret pangkat dalam bentuk:<br/>
                CNX XV<br/>
                dari nol hingga tak terhingga.<br/>
                Jumlah deret pangkat dapat direpresentasikan oleh sebuah fungsi, dengan suku-suku yang melibatkan setiap pangkat X hingga tak terhingga.<br/>
                Sekarang, kita ingin memahami lebih jauh tentang koefisien-koefisiennya.
              </p>
            </div>

          </div>
        </div>

        {/* --- CARD 2: Live Collaboration --- */}
        <div className="bg-[#10111a]/80 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">Kolaborasi langsung</h3>
            <p className="text-white/50 text-[15px] md:text-base">belajar.ai aktif bekerja bersama kamu — mengedit dokumenmu, menyorot masalah, dan menambahkan komentar AI.</p>
          </div>

          <div className="relative h-72 md:h-80 bg-[#161822] border border-white/5 rounded-2xl p-6 md:p-8 overflow-hidden">
            
            {/* Teks Dokumen */}
            <div className="relative inline-block">
              <h4 className="text-xl md:text-2xl font-bold text-white mb-4">Strategi Pasar Fintech Eropa</h4>
              {/* Kursor belajar AI */}
              <div className="absolute -top-3 -right-20 flex flex-col items-start z-20 animate-pulse">
                <div className="bg-[#5546ED] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm rounded-bl-none shadow-lg">belajar.ai</div>
                <MousePointer2 className="h-4 w-4 text-[#5546ED] fill-[#5546ED] rotate-[100deg] -mt-0.5 -ml-1" />
              </div>
            </div>
            
            <p className="text-white/40 leading-relaxed text-[13px] md:text-[15px] max-w-2xl mt-2 relative">
              Analisis awal kami mendukung tiga inisiatif utama untuk mempercepat masuknya pasar. Fokus utamanya melibatkan pembentukan kemitraan dengan bank-bank regional besar, memanfaatkan posisi regulasi mereka yang sudah mapan dan <span className="bg-[#5546ED]/20 text-white/80 px-1 rounded">jaringan pelanggan yang luas.</span> Selain itu, kami merekomendasikan untuk memprioritaskan Jerman...
            </p>

            {/* Kursor User Lain (Misal: Alex) */}
            <div className="absolute top-[50%] left-[45%] flex flex-col items-start z-20">
              <MousePointer2 className="h-4 w-4 text-[#ea580c] fill-[#ea580c] -rotate-90 -mb-0.5 ml-1" />
              <div className="bg-[#ea580c] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm rounded-tl-none shadow-lg">Alex C.M.</div>
            </div>

            {/* Popup Komentar AI */}
            <div className="absolute bottom-6 right-6 bg-[#1b1f2d] border border-white/10 rounded-2xl p-5 shadow-2xl w-80 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 z-30">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#5546ED] to-purple-600 flex items-center justify-center border border-white/10 shadow-inner">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white tracking-wide">belajar.ai</span>
              </div>
              <p className="text-[15px] text-white/90 mb-3 font-medium">Lebih spesifik, pasar yang mana?</p>
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>12 Detik yang lalu</span>
                <span className="text-[#5546ED] font-semibold cursor-pointer hover:text-white transition">Balas</span>
              </div>
            </div>

            {/* Hint Teks Bawah Kanan */}
            <div className="absolute bottom-4 right-4 md:right-auto md:left-[50%] md:-translate-x-1/2 text-center w-full max-w-md hidden md:block">
              <p className="text-[13px] text-white/40">
                belajar.ai siap diajak mengobrol kapan saja — <span className="text-[#9b8dff]">rekan tim yang sempurna.</span>
              </p>
            </div>

          </div>
        </div>

      </section>

      {/* --- TESTIMONIALS SECTION --- */}
      <section id="testimonials" className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <MessageCircle className="h-6 w-6 text-[#9b8dff]" />
          <h2 className="text-2xl font-semibold text-white tracking-tight">Testimoni</h2>
        </div>

        {/* Grid 3x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1: Harvard Pre-med */}
          <div className="bg-[#10111a]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 hover:bg-[#161822] transition-colors duration-300">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-medium text-white">Mahasiswa Pra-kedokteran UGM</h3>
              {/* Logo Harvard Berwarna */}
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/6/6a/UNIVERSITAS_GADJAH_MADA%2C_YOGYAKARTA.png" 
                alt="UGM Logo" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-[15px] text-white/60 leading-relaxed mb-8">
              “Buku biologi saya tebalnya 500 halaman, tapi belajar.ai membuat ringkasan dan flashcard untuk tiap bab sehingga saya bisa belajar dengan lebih mudah.”
            </p>
            <p className="text-sm text-white/40 font-medium">— Olivia C.</p>
          </div>

          {/* Card 1: Harvard Pre-med */}
          <div className="bg-[#10111a]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 hover:bg-[#161822] transition-colors duration-300">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-medium text-white">Siswa SMAK 1 Penabur</h3>
              {/* Logo Harvard Berwarna */}
              <img 
                src="https://upload.wikimedia.org/wikipedia/id/thumb/0/0f/Logo_BPK_PENABUR.png/1280px-Logo_BPK_PENABUR.png" 
                alt="Penabur Logo" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-[15px] text-white/60 leading-relaxed mb-8">
              “Semua jadi lebih mudah semenjak ada belajar.ai. Nilai saya yang awalnya di bawah 80, sekarang sudah bisa mencapai 90 ke atas.”
            </p>
            <p className="text-sm text-white/40 font-medium">— Alex W.</p>
          </div>

          {/* Card 3: MIT Education PhD */}
          <div className="bg-[#10111a]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 hover:bg-[#161822] transition-colors duration-300">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-medium text-white">S3 Pendidikan UI</h3>
              {/* Logo MIT Berwarna */}
              <img 
                src="https://upload.wikimedia.org/wikipedia/id/thumb/0/0f/Makara_of_Universitas_Indonesia.svg/250px-Makara_of_Universitas_Indonesia.svg.png" 
                alt="UI Logo" 
                className="h-7 w-auto object-contain"
              />
            </div>
            <p className="text-[15px] text-white/60 leading-relaxed mb-8">
              “belajar.ai <span className="bg-[#5546ED]/20 text-[#9b8dff] px-1 rounded">membuat rangkuman buat PPT mata kuliah saya</span>, lalu saya belajar dari rangkuman itu dan berhasil lulus dengan nilai A.”
            </p>
            <p className="text-sm text-white/40 font-medium">— Elena R.</p>
          </div>

          {/* Card 4: Stanford Chemistry Major */}
          <div className="bg-[#10111a]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 hover:bg-[#161822] transition-colors duration-300">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-medium text-white">Mahasiswa Kimia ITB</h3>
              {/* Logo Stanford Berwarna */}
              <img 
                src="https://upload.wikimedia.org/wikipedia/id/9/95/Logo_Institut_Teknologi_Bandung.png" 
                alt="ITB Logo" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-[15px] text-white/60 leading-relaxed mb-8">
              “Mengidap ADHD membuat saya sulit fokus di kuliah kimia organik, jadi saya <span className="bg-[#5546ED]/20 text-[#9b8dff] px-1 rounded">berikan video rekaman kelas ke belajar.ai</span>. Lalu ia memberi saya kuis tentang reaksi sampai saya benar-benar paham—nilai saya naik dari C+ ke A- semester ini.”
            </p>
            <p className="text-sm text-white/40 font-medium">— Sarah K.</p>
          </div>

          {/* Card 5: Yale Law Student (Diubah ke UPH) */}
          <div className="bg-[#10111a]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 hover:bg-[#161822] transition-colors duration-300">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-medium text-white">Mahasiswa Hukum UPH</h3>
              {/* Logo UPH dengan filter putih/abu */}
              <img 
                src="https://ap2tpi.id/wp-content/uploads/2025/02/member-uph.png" 
                alt="UPH Logo" 
                className="h-6 w-auto object-contain brightness-0 invert opacity-80"
              />
            </div>
            <p className="text-[15px] text-white/60 leading-relaxed mb-8">
              “Kasus-kasus hukum dulu membuat saya kewalahan, tapi belajar.ai langsung mengubah bacaan saya menjadi flashcard dan kuis. Sekarang saya bisa mencicil belajar tiap hari daripada sistem kebut semalam sebelum ujian.”
            </p>
            <p className="text-sm text-white/40 font-medium">— Marcus O.</p>
          </div>

          {/* Card 6: McKinsey Consultant (Diubah ke Binus) */}
          <div className="bg-[#10111a]/80 backdrop-blur-md border border-white/5 rounded-2xl p-8 hover:bg-[#161822] transition-colors duration-300">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-medium text-white">Dosen Binus University</h3>
              {/* Logo Binus dengan filter putih/abu */}
              <img 
                src="https://curriculum.binus.ac.id/wp-content/themes/binus-2014-58-core/assets/university/site-logo/site-logo-lg@2x.png" 
                alt="Binus Logo" 
                className="h-6 w-auto object-contain brightness-0 invert opacity-80"
              />
            </div>
            <p className="text-[15px] text-white/60 leading-relaxed mb-8">
              “belajar.ai <span className="bg-[#5546ED]/20 text-[#9b8dff] px-1 rounded">mengubah PPT materi</span> menjadi catatan, lalu saya mempelajari catatan itu sehingga saya dapat memahami dan menjelaskan materi di kelas dengan baik.”
            </p>
            <p className="text-sm text-white/40 font-medium">— Haryono A.</p>
          </div>

        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="relative z-10 py-32 px-6 max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Pertanyaan yang Sering Diajukan</h2>
          <p className="text-white/50 text-lg">Semua yang perlu kamu ketahui tentang belajar.ai</p>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-3">
          {[
            {
              q: "Apakah layanan ini gratis atau berbayar?",
              a: "Iya, layanan ini gratis untuk digunakan dengan fitur dasar. Kami juga menawarkan paket berbayar dengan fitur tambahan seperti penyimpanan lebih besar, akses ke model AI yang lebih canggih, dan dukungan prioritas.",
            },
            {
              q: "Bagaimana cara merekam kuliah dan mengubahnya jadi catatan?",
              a: "Cukup klik tombol 'Rekam' di dashboard-mu saat kelas berlangsung. AI kami akan mentranskripsikan audio secara real-time dan otomatis membuat catatan komprehensif, ringkasan, dan daftar tugas."
            },
            {
              q: "Bisakah saya mengubah buku teks PDF jadi materi belajar?",
              a: "Tentu saja! Kamu bisa mengunggah buku teks PDF, slide presentasi, atau dokumen apa pun. AI kami akan menganalisis teks tersebut dan langsung membuat flashcard interaktif, kuis, dan ringkasan."
            },
            {
              q: "Apakah belajar.ai gratis digunakan?",
              a: "Ya, belajar.ai menyediakan paket gratis yang melimpah, mencakup pembuatan catatan dasar dan alat belajar. Untuk pengguna aktif, kami menawarkan paket Pro dengan fitur AI tingkat lanjut dan penggunaan tanpa batas."
            },
            {
              q: "Bisakah saya membuat flashcard dari video YouTube?",
              a: "Bisa! Cukup tempel tautan YouTube ke dashboard, dan belajar.ai akan mengekstrak transkrip, meringkas video, dan membuat flashcard khusus berdasarkan konsep-konsep kuncinya."
            },
            {
              q: "Bagaimana cara merapikan catatan untuk berbagai mata pelajaran?",
              a: "Kamu bisa membuat 'Mata Pelajaran' atau folder khusus di dashboard-mu. Saat membuat catatan baru atau mengunggah file, cukup masukkan ke mata pelajaran yang relevan agar semuanya tetap rapi."
            }
          ].map((faq, index) => {
            const isOpen = openFaq === index;
            
            return (
              <div 
                key={index} 
                className={`border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${isOpen ? 'bg-[#161822] border-white/10' : 'bg-[#10111a]/80 border-white/5 hover:bg-[#161822]/80 hover:border-white/10'}`}
                onClick={() => setOpenFaq(isOpen ? null : index)} // Tutup jika diklik lagi, buka jika yang lain
              >
                {/* Pertanyaan */}
                <div className="p-6 flex items-center justify-between gap-4">
                  <h3 className="text-white font-semibold text-[15px] md:text-base leading-snug">{faq.q}</h3>
                  <div className="flex-shrink-0 text-white/40">
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
                
                {/* Jawaban (Animasi Expand) */}
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <div className="p-6 pt-0 text-white/60 text-[14px] md:text-[15px] leading-relaxed">
                      {faq.a}
                      
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- FOOTER SECTION --- */}
      <footer className="relative z-10 pt-24 pb-8 px-6 border-t border-white/5 mt-20 overflow-hidden">
        
        {/* Background Glow Ungu di Bawah */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#5546ED]/10 blur-[120px] rounded-t-[100%] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between gap-16 relative z-10">
          
          {/* KIRI: Logo, Tagline, & Tombol */}
          <div className="flex flex-col items-start max-w-sm">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="h-8 w-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-[#5546ED]" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">belajar.ai</span>
            </div>
            
            <p className="text-white/70 text-[15px] mb-8 font-medium">
              Platform Belajar AI #1 di Indonesia
            </p>
            
            <button 
              onClick={handleGetStarted}
              className="px-6 py-3 rounded-xl bg-[#5546ED] hover:bg-[#4A28C1] text-white font-bold text-[15px] transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(85,70,237,0.3)]"
            >
              Mulai Sekarang - Gratis
            </button>
          </div>

          {/* KANAN: Daftar Link */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 lg:gap-20">
            
            {/* Kolom 1: Products */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[13px] font-bold text-white/80 tracking-widest uppercase mb-2">Produk</h4>
              <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">Pencatat AI</a>
              <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">Untuk Mahasiswa</a>
              <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">Beasiswa</a>
              <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">App Store</a>
              <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">Google Play</a>
            </div>

            {/* Kolom 2: Company */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[13px] font-bold text-white/80 tracking-widest uppercase mb-2">Perusahaan</h4>
              <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">Daftar</a>
              <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">Masuk</a>
              
              <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">Blog</a>
            </div>

            {/* Kolom 3: Legal */}
            <div className="flex flex-col gap-4">
              <h4 className="text-[13px] font-bold text-white/80 tracking-widest uppercase mb-2">Legal</h4>
              <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">Privasi</a>
              <a href="#" className="text-[14px] text-white/50 hover:text-white transition-colors">Syarat & Ketentuan</a>
            </div>

          </div>
        </div>

        {/* Garis Bawah & Copyright */}
        <div className="max-w-7xl mx-auto mt-20 relative z-10">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
          <p className="text-center text-[13px] text-white/40 font-medium">
            © 2026 PT. Belajar Jadi Mudah. Hak cipta dilindungi undang-undang.
          </p>
        </div>
        
      </footer>

      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-[#202438] p-6 shadow-2xl">
            <div className="mb-6">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#5546ED]/30 bg-[#5546ED]/10">
                <Sparkles className="h-5 w-5 text-[#7c6cff]" />
              </div>
              <h2 className="text-2xl font-black text-white">Sign Up</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Buat catatan dalam beberapa detik. Tidak ada kartu kredit yang diperlukan.
              </p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80">Nama</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Nama kamu"
                  className="w-full rounded-[16px] border border-white/10 bg-[#1b1f2d] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#5546ED]/60"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80">Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-[16px] border border-white/10 bg-[#1b1f2d] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#5546ED]/60"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-[14px] px-5 py-2.5 text-sm font-semibold text-white/65 transition hover:bg-white/5"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-[14px] bg-[#5546ED] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#5546ED]/20 transition hover:bg-[#4A28C1]"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}
