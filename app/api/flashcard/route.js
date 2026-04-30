import { NextResponse } from "next/server";

export const runtime = "nodejs";

function extractJsonBlock(value, startChar, endChar) {
  const clean = value.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = clean.indexOf(startChar);
  const end = clean.lastIndexOf(endChar);
  if (start === -1 || end === -1 || end <= start) return clean;
  return clean.slice(start, end + 1);
}

function normalizeQuizItems(value, limit) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const options = Array.isArray(item?.options) ? item.options.slice(0, 4).map(String) : [];
      const answer = Number.isInteger(item?.answer) ? item.answer : Number(item?.answer);

      if (!item?.question || options.length < 4 || !Number.isInteger(answer) || answer < 0 || answer > 3) {
        return null;
      }

      return {
        question: String(item.question),
        options,
        answer,
        hint: item?.hint ? String(item.hint) : "Ingat kembali konsep utama dari materi.",
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

export async function POST(req) {
  try {
    const token = process.env.HF_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "HF_TOKEN belum ada di .env.local" },
        { status: 500 }
      );
    }

    const { text, mode, messages, count } = await req.json();
    const generationCount = [15, 25, 30].includes(Number(count)) ? Number(count) : 15;

    if (!text && mode !== "chat") {
      return NextResponse.json(
        { error: "Text kosong" },
        { status: 400 }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";
    let apiMessages = [];

    // 🔥 LOGIKA UNTUK MASING-MASING MODE
    if (mode === "summary") {
      systemPrompt =
        "Kamu merangkum teks secara jelas dan mudah dipahami dengan poin-poin, minimal 500 kata. Anda hanya boleh berikan output berupa ringkasan tanpa embel-embel teknis lain misal total kata, dan sebagainya.";
      userPrompt = `Buat ringkasan dari teks berikut.\nGunakan bullet points.\n\nTeks:\n${text.slice(0, 3000)}`;
      apiMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

    } else if (mode === "quiz") {
      systemPrompt = `Kamu adalah pembuat soal kuis pilihan ganda.
WAJIB: Hasilkan output HANYA dalam format JSON Array yang valid. Jangan berikan teks pembuka, penutup, markdown, atau komentar.
Setiap objek dalam array harus memiliki struktur ini:
{
  "question": "Teks pertanyaan",
  "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
  "answer": 0,
  "hint": "Petunjuk singkat untuk menjawab soal"
}`;
      userPrompt = `Buat tepat ${generationCount} soal pilihan ganda dari teks berikut.
Pastikan output berupa JSON Array valid yang bisa langsung di-JSON.parse.

Teks:
${text.slice(0, 3000)}`;
      apiMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

    } else if (mode === "mindmap") {
      // 🔥 LOGIKA KHUSUS MIND MAP
      systemPrompt = `Kamu adalah ahli pembuat mind map. 
WAJIB: Hasilkan output HANYA dalam format JSON murni tanpa markdown pembungkus.
Struktur JSON harus seperti ini:
{
  "title": "Judul/Topik Utama Dokumen",
  "nodes": ["Subtopik Utama 1", "Subtopik Utama 2", "Subtopik Utama 3", "Subtopik Utama 4", "Subtopik Utama 5"]
}`;
      userPrompt = `Ekstrak hierarki materi dari teks berikut menjadi format JSON mind map:\n\n${text.slice(0, 3000)}`;
      apiMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];

    } else if (mode === "chat") {
      systemPrompt = `Kamu adalah asisten belajar pintar dari "belajar.ai". 
Tugasmu adalah menjawab pertanyaan pengguna HANYA berdasarkan teks dokumen berikut. 
Jika jawaban tidak ada di dalam teks, beritahu pengguna dengan sopan bahwa informasi tersebut tidak ada di dokumen.
Gunakan bahasa Indonesia yang santai, ramah, dan mudah dipahami. Tanpa format apapun.

TEKS DOKUMEN:
${text.slice(0, 4000)}`;

      apiMessages = [
        { role: "system", content: systemPrompt },
        ...(messages || []),
      ];

    } else {
      // default flashcard
      systemPrompt = "Kamu membuat flashcard. Format WAJIB: Q: ... A: ... TANPA PENJELASAN LAIN.";
      userPrompt = `Buat tepat ${generationCount} flashcard dari teks berikut:\n\n${text.slice(0, 3000)}`;
      apiMessages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ];
    }

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b", 
          messages: apiMessages,
          temperature: mode === "chat" ? 0.7 : 0.3,
          max_tokens: mode === "quiz" ? 5000 : mode === "chat" ? 1200 : 2500,
        }),
      }
    );

    const raw = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: raw || "Request gagal" },
        { status: response.status }
      );
    }

    const data = JSON.parse(raw);
    const result = data.choices?.[0]?.message?.content ?? "";

    // 🔥 PENGEMBALIAN DATA BERDASARKAN MODE
    if (mode === "summary") return NextResponse.json({ summary: result });
    if (mode === "chat") return NextResponse.json({ reply: result });
    
    if (mode === "quiz" || mode === "mindmap") {
      try {
        const cleanJson = mode === "quiz" ? extractJsonBlock(result, "[", "]") : extractJsonBlock(result, "{", "}");
        const parsedData = JSON.parse(cleanJson);
        if (mode === "quiz") {
          const quiz = normalizeQuizItems(parsedData, generationCount);
          if (quiz.length > 0) return NextResponse.json({ quiz });
          return NextResponse.json({ quiz: [], error: "Respons quiz dari AI tidak berisi format soal yang valid." });
        }
        if (mode === "mindmap") return NextResponse.json({ mindmap: parsedData });
      } catch (err) {
        console.error(`Gagal memproses respons ${mode}:`, result);
        return NextResponse.json({ [mode === "quiz" ? "quiz" : "mindmap"]: mode === "quiz" ? [] : null, error: `Gagal memproses respons ${mode}` });
      }
    }

    // flashcard parsing
    const cards = result
      .split("Q:")
      .slice(1)
      .map((block) => {
        const [q, a] = block.split("A:");
        return { question: q?.trim(), answer: a?.trim() };
      })
      .filter((c) => c.question && c.answer)
      .slice(0, generationCount);

    return NextResponse.json({ cards });

  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
