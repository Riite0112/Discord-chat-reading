let currentAudio = null;
let currentObjectUrl = "";
let activePlaybackId = 0;
const VOICEVOX_QUERY_TIMEOUT_MS = 10000;
const VOICEVOX_SYNTHESIS_TIMEOUT_MS = 30000;
const VOICEVOX_ATTEMPTS = 3;

function clearCurrentAudio() {
  activePlaybackId += 1;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }

  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = "";
  }
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeVoicevoxEndpoint(endpoint) {
  const fallback = "http://127.0.0.1:50021";
  try {
    const url = new URL(endpoint || fallback);
    if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname)) {
      return fallback;
    }

    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = VOICEVOX_QUERY_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function retryOperation(task) {
  let lastError = null;
  for (let attempt = 1; attempt <= VOICEVOX_ATTEMPTS; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      await delay(250 * attempt);
    }
  }

  throw lastError || new Error("VOICEVOX request failed.");
}

async function getVoicevoxAudio(message) {
  const endpoint = normalizeVoicevoxEndpoint(message.endpoint);
  const speaker = Number(message.speaker || 3);
  const text = String(message.text || "");
  const queryUrl = `${endpoint}/audio_query?text=${encodeURIComponent(text)}&speaker=${encodeURIComponent(speaker)}`;

  const queryResponse = await retryOperation(async () => {
    const response = await fetchWithTimeout(queryUrl, { method: "POST" }, VOICEVOX_QUERY_TIMEOUT_MS);
    if (!response.ok) {
      throw new Error(`VOICEVOX audio_query failed: ${response.status}`);
    }
    return response;
  });

  const audioQuery = await queryResponse.json();
  audioQuery.speedScale = Number(message.rate || 1);
  audioQuery.volumeScale = Number(message.volume || 1);
  audioQuery.pitchScale = Math.max(-0.15, Math.min(0.15, (Number(message.pitch || 1) - 1) * 0.15));

  const synthesisUrl = `${endpoint}/synthesis?speaker=${encodeURIComponent(speaker)}`;
  const synthesisResponse = await retryOperation(async () => {
    const response = await fetchWithTimeout(
      synthesisUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(audioQuery)
      },
      VOICEVOX_SYNTHESIS_TIMEOUT_MS
    );
    if (!response.ok) {
      throw new Error(`VOICEVOX synthesis failed: ${response.status}`);
    }
    return response;
  });

  return synthesisResponse.arrayBuffer();
}

async function playVoicevoxSpeech(message) {
  clearCurrentAudio();
  const playbackId = activePlaybackId;
  const text = String(message.text || "");

  function notify(type) {
    if (activePlaybackId !== playbackId) {
      return;
    }

    clearCurrentAudio();
    chrome.runtime.sendMessage({
      type,
      playbackToken: message.playbackToken || 0,
      fallbackText: text
    });
  }

  try {
    const audioBuffer = await getVoicevoxAudio(message);
    if (activePlaybackId !== playbackId) {
      return;
    }

    const blob = new Blob([audioBuffer], { type: "audio/wav" });
    currentObjectUrl = URL.createObjectURL(blob);
    currentAudio = new Audio(currentObjectUrl);
    currentAudio.addEventListener("ended", () => notify("OFFSCREEN_AUDIO_ENDED"), { once: true });
    currentAudio.addEventListener("error", () => notify("OFFSCREEN_AUDIO_ERROR"), { once: true });
    await currentAudio.play();
  } catch {
    notify("OFFSCREEN_AUDIO_ERROR");
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "STOP_OFFSCREEN_AUDIO") {
    clearCurrentAudio();
    sendResponse({ ok: true });
    return;
  }

  if (message?.type === "PLAY_VOICEVOX_SPEECH") {
    playVoicevoxSpeech(message);
    sendResponse({ ok: true });
  }
});
