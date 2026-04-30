"use client";

import { useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Editor from "../../components/Editor"; // Sesuaikan path ini jika error
import { takePendingFile } from "../../lib/pendingFiles";

export default function NotesPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  // ==========================================
  // KUNCI PERBAIKANNYA DI SINI:
  // Kita gunakan decodeURIComponent agar %20 kembali menjadi spasi
  // ==========================================
  const rawId = params.id as string;
  const fileKey = rawId ? decodeURIComponent(rawId) : "";
  
  const isManualMode = searchParams.get("mode") === "manual";
  const initialTitle = searchParams.get("title") || undefined;
  const initialSubject = searchParams.get("subject") || undefined;
  const initialYoutubeUrl = searchParams.get("url") || undefined;
  const countParam = Number(searchParams.get("count"));
  const initialGenerationCount = countParam === 25 || countParam === 30 ? countParam : 15;
  const initialFileRef = useRef<File | null | undefined>(undefined);

  if (initialFileRef.current === undefined) {
    initialFileRef.current = takePendingFile(fileKey);
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <Editor 
      initialFileKey={fileKey}
      initialTitle={initialTitle}
      initialSubject={initialSubject}
      initialYoutubeUrl={initialYoutubeUrl}
      initialGenerationCount={initialGenerationCount}
      isManualMode={isManualMode}
      initialFile={initialFileRef.current} 
      onBack={handleBackToDashboard}
    />
  );
}
