import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL kosong" }, { status: 400 });

    let transcript;

    // URUTAN PRIORITAS PENGAMBILAN SUBTITLE
    try {
      // 1. Coba ambil Bahasa Indonesia ('id') terlebih dahulu
      transcript = await YoutubeTranscript.fetchTranscript(url, { lang: 'id' });
    } catch (idError) {
      try {
        // 2. Jika tidak ada, coba ambil Bahasa Inggris ('en')
        transcript = await YoutubeTranscript.fetchTranscript(url, { lang: 'en' });
      } catch (enError) {
        // 3. Jika masih tidak ada, ambil bahasa default apa pun yang tersedia
        transcript = await YoutubeTranscript.fetchTranscript(url);
      }
    }
    
    // Gabungkan semua potongan subtitle menjadi satu teks panjang
    const text = transcript.map(t => t.text).join(" ");

    // Mengambil Judul Video (Gratis via oEmbed API)
    let videoTitle = "Catatan YouTube";
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        if (oembedData.title) {
          videoTitle = oembedData.title; // Simpan judul asli
        }
      }
    } catch (titleError) {
      console.log("Gagal mengambil judul, menggunakan judul default.");
    }

    // Kirim balik teks dan judul ke frontend
    return NextResponse.json({ text, title: videoTitle });
    
  } catch (error) {
    console.error("YOUTUBE ERROR:", error);
    return NextResponse.json(
      { error: "Gagal mengambil teks. Pastikan video YouTube memiliki CC/Subtitle yang aktif." }, 
      { status: 500 }
    );
  }
}