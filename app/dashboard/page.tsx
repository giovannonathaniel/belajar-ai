// app/dashboard/page.tsx
"use client";

import { useRouter } from "next/navigation";
import Dashboard from "../components/Dashbord";
import { putPendingFile } from "../lib/pendingFiles";

export default function DashboardPage() {
  const router = useRouter();

  // Karena ini adalah page terpisah, kita hanya perlu menangani 
  // navigasi "kembali ke home" dan "pergi ke editor".
  
  // Data file/youtube tidak lagi dioper via props komponen, 
  // melainkan akan dikelola di dalam Editor secara mandiri nanti, 
  // atau bisa dioper via state global/localStorage (untuk sementara kita oper via URL parameter/localStorage)

  const handleOpenNote = (fileKey: string) => {
    // KUNCI PERBAIKANNYA DI SINI: 
    // Tambahkan encodeURIComponent agar garis miring (/) pada link YouTube aman
    router.push(`/notes/${encodeURIComponent(fileKey)}`);
  };

  const handleGoToLanding = () => {
    router.push("/");
  };

  // Dummy handlers untuk upload baru (sementara akan diarahkan ke note baru dengan ID unik)
  const handleWriteManual = (title: string, subject: string) => {
    const newId = "manual_" + Date.now();
    // Idealnya di sini kamu save 'title' dan 'subject' ke database/localStorage dulu
    router.push(`/notes/${newId}?title=${encodeURIComponent(title)}&subject=${encodeURIComponent(subject)}&mode=manual`);
  };

  const handleUploadYoutube = (url: string, subject: string, generationCount: 15 | 25 | 30) => {
    const newId = "yt_" + Date.now();
    router.push(`/notes/${newId}?url=${encodeURIComponent(url)}&subject=${encodeURIComponent(subject)}&count=${generationCount}`);
  };

  const handleUploadFile = (file: File, subject: string, generationCount: 15 | 25 | 30) => {
    const newId = "file_" + Date.now();
    putPendingFile(newId, file);
    router.push(`/notes/${newId}?subject=${encodeURIComponent(subject)}&count=${generationCount}`);
  };

  return (
    <Dashboard 
      onOpenNote={handleOpenNote}
      onGoToLanding={handleGoToLanding}
      onWriteManual={handleWriteManual}
      onUploadYoutube={handleUploadYoutube}
      onUpload={handleUploadFile}
    />
  );
}
