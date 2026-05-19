import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export const runtime = "nodejs";
export const maxDuration = 30;

const TRANSCRIPT_LANGS = ["id", "en", undefined];
const REQUEST_TIMEOUT_MS = 12000;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
};

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function getVideoId(input) {
  const value = String(input || "").trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  try {
    const parsed = new URL(value);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }
    if (parsed.searchParams.get("v")) return parsed.searchParams.get("v");

    const pathMatch = parsed.pathname.match(/\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{11})/);
    if (pathMatch) return pathMatch[1];
  } catch {
    const match = value.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }

  return null;
}

function makeYoutubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

async function timedFetch(resource, init = {}, lang) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const resourceUrl = String(resource);
  const isInnerTube = resourceUrl.includes("/youtubei/v1/player");
  const languageHeader = lang
    ? { "Accept-Language": `${lang},id-ID;q=0.9,en-US;q=0.8,en;q=0.7` }
    : {};
  const headers = isInnerTube
    ? { ...(init.headers || {}), ...languageHeader }
    : { ...(init.headers || {}), ...BROWSER_HEADERS, ...languageHeader };

  try {
    return await fetch(resource, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTranscriptWithFallbacks(url, videoId) {
  const attempts = [];
  const inputs = [url, videoId].filter(Boolean);

  for (const input of inputs) {
    for (const lang of TRANSCRIPT_LANGS) {
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(input, {
          ...(lang ? { lang } : {}),
          fetch: (resource, init) => timedFetch(resource, init, lang),
        });

        const text = transcript
          .map((part) => part?.text)
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        if (text.length > 0) {
          return { transcript, text, lang: lang || "default", input };
        }

        attempts.push(`${input}:${lang || "default"} -> transcript kosong`);
      } catch (error) {
        attempts.push(`${input}:${lang || "default"} -> ${getErrorMessage(error)}`);
      }
    }
  }

  const error = new Error("Tidak ada transcript yang bisa diambil dari YouTube.");
  error.attempts = attempts;
  throw error;
}

async function fetchVideoTitle(url) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const oembedRes = await timedFetch(oembedUrl);
    if (!oembedRes.ok) return "Catatan YouTube";

    const oembedData = await oembedRes.json();
    return oembedData?.title || "Catatan YouTube";
  } catch {
    return "Catatan YouTube";
  }
}

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL kosong" }, { status: 400 });

    const videoId = getVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: "URL YouTube tidak valid." }, { status: 400 });
    }

    const normalizedUrl = makeYoutubeUrl(videoId);
    const [{ text, lang }, videoTitle] = await Promise.all([
      fetchTranscriptWithFallbacks(normalizedUrl, videoId),
      fetchVideoTitle(normalizedUrl),
    ]);

    return NextResponse.json({ text, title: videoTitle, transcriptLang: lang });
  } catch (error) {
    const attempts = Array.isArray(error?.attempts) ? error.attempts : [];
    console.error("YOUTUBE ERROR:", getErrorMessage(error), attempts);

    return NextResponse.json(
      {
        error:
          "Gagal mengambil transcript YouTube dari server. Video mungkin tidak punya subtitle publik, dibatasi region/umur, atau YouTube menolak request dari Vercel. Coba video lain atau paste transcript manual.",
      },
      { status: 502 }
    );
  }
}
