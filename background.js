const DEFAULT_SETTINGS = {
  enabled: true,
  rate: 1,
  pitch: 1,
  volume: 1,
  language: "ja",
  lang: "ja-JP",
  speechEngine: "chrome",
  voiceName: "",
  voicevoxEndpoint: "http://127.0.0.1:50021",
  voicevoxSpeaker: 3,
  readAuthorName: true,
  announceLinks: true,
  announceImages: false,
  announceEmojiMessages: false,
  excludeAuthorsEnabled: false,
  excludedAuthors: []
};

let settings = { ...DEFAULT_SETTINGS };
let queue = [];
let speaking = false;
let voicevoxWatchdogTimer = 0;
let voicevoxPlaybackToken = 0;
let voicevoxPlaybackSequence = 0;
const recentQueueKeys = new Map();
const QUEUE_DEDUPE_TTL_MS = 12000;
const OFFSCREEN_MESSAGE_RETRY_MS = 250;
const OFFSCREEN_MESSAGE_ATTEMPTS = 4;
const VOICEVOX_FETCH_TIMEOUT_MS = 6000;
const VOICEVOX_PLAYBACK_TIMEOUT_MS = 75000;
const ICON_PATHS = {
  on: {
    16: "icons/icon-on-16.png",
    32: "icons/icon-on-32.png",
    48: "icons/icon-on-48.png",
    128: "icons/icon-on-128.png"
  },
  off: {
    16: "icons/icon-off-16.png",
    32: "icons/icon-off-32.png",
    48: "icons/icon-off-48.png",
    128: "icons/icon-off-128.png"
  }
};

async function loadSettings() {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  settings = { ...DEFAULT_SETTINGS, ...stored };
  updateActionIcon();
}

function resetQueue() {
  queue = [];
  speaking = false;
  voicevoxPlaybackToken = 0;
  clearVoicevoxWatchdog();
  chrome.tts.stop();
  chrome.runtime.sendMessage({ type: "STOP_OFFSCREEN_AUDIO" }).catch(() => {});
}

function clearVoicevoxWatchdog() {
  if (voicevoxWatchdogTimer) {
    clearTimeout(voicevoxWatchdogTimer);
    voicevoxWatchdogTimer = 0;
  }
}

function startVoicevoxWatchdog(playbackToken) {
  clearVoicevoxWatchdog();
  voicevoxWatchdogTimer = setTimeout(() => {
    if (playbackToken !== voicevoxPlaybackToken) {
      return;
    }

    speaking = false;
    voicevoxPlaybackToken = 0;
    voicevoxWatchdogTimer = 0;
    chrome.runtime.sendMessage({ type: "STOP_OFFSCREEN_AUDIO" }).catch(() => {});
    speakNext();
  }, VOICEVOX_PLAYBACK_TIMEOUT_MS);
}

function pruneRecentQueueKeys(now = Date.now()) {
  for (const [key, timestamp] of recentQueueKeys.entries()) {
    if (now - timestamp > QUEUE_DEDUPE_TTL_MS) {
      recentQueueKeys.delete(key);
    }
  }
}

function shouldSkipQueuedMessage(dedupeKey) {
  if (!dedupeKey) {
    return false;
  }

  const now = Date.now();
  pruneRecentQueueKeys(now);
  const seenAt = recentQueueKeys.get(dedupeKey);
  if (typeof seenAt === "number" && now - seenAt < QUEUE_DEDUPE_TTL_MS) {
    return true;
  }

  recentQueueKeys.set(dedupeKey, now);
  return false;
}

function updateActionIcon() {
  chrome.action.setIcon({
    path: settings.enabled ? ICON_PATHS.on : ICON_PATHS.off
  });
}

function buildSpeechOptions() {
  const options = {
    lang: settings.lang,
    rate: settings.rate,
    pitch: settings.pitch,
    volume: settings.volume,
    enqueue: false,
    onEvent(event) {
      if (
        event.type === "end" ||
        event.type === "interrupted" ||
        event.type === "cancelled" ||
        event.type === "error"
      ) {
        speaking = false;
        speakNext();
      }
    }
  };

  if (settings.voiceName) {
    options.voiceName = settings.voiceName;
  }

  return options;
}

function normalizeVoicevoxEndpoint(endpoint) {
  const fallback = DEFAULT_SETTINGS.voicevoxEndpoint;
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

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = VOICEVOX_FETCH_TIMEOUT_MS) {
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

async function ensureOffscreenDocument() {
  if (!chrome.offscreen) {
    throw new Error("Offscreen documents are not available.");
  }

  const offscreenUrl = chrome.runtime.getURL("offscreen.html");
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [offscreenUrl]
    });
    if (contexts.length > 0) {
      return;
    }
  } else if (await chrome.offscreen.hasDocument()) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["AUDIO_PLAYBACK"],
    justification: "Play locally generated VOICEVOX speech audio for Discord chat reading."
  });
}

async function getVoicevoxSpeakers(endpoint = settings.voicevoxEndpoint) {
  const safeEndpoint = normalizeVoicevoxEndpoint(endpoint);
  const response = await fetchWithTimeout(`${safeEndpoint}/speakers`);
  if (!response.ok) {
    throw new Error(`VOICEVOX speakers failed: ${response.status}`);
  }

  const speakers = await response.json();
  return speakers.flatMap((speaker) =>
    Array.isArray(speaker.styles)
      ? speaker.styles.map((style) => ({
          id: Number(style.id),
          name: `${speaker.name} - ${style.name}`
        }))
      : []
  );
}

async function sendOffscreenMessage(message) {
  let lastError = null;
  for (let attempt = 1; attempt <= OFFSCREEN_MESSAGE_ATTEMPTS; attempt += 1) {
    await ensureOffscreenDocument();
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      lastError = error;
      await delay(OFFSCREEN_MESSAGE_RETRY_MS * attempt);
    }
  }

  throw lastError || new Error("Could not reach offscreen audio document.");
}

async function speakVoicevoxNow(text) {
  speaking = true;
  const playbackToken = ++voicevoxPlaybackSequence;
  voicevoxPlaybackToken = playbackToken;
  try {
    await sendOffscreenMessage({
      type: "PLAY_VOICEVOX_SPEECH",
      playbackToken,
      text,
      endpoint: normalizeVoicevoxEndpoint(settings.voicevoxEndpoint),
      speaker: Number(settings.voicevoxSpeaker || DEFAULT_SETTINGS.voicevoxSpeaker),
      rate: Number(settings.rate || 1),
      pitch: Number(settings.pitch || 1),
      volume: Number(settings.volume || 1)
    });
    startVoicevoxWatchdog(playbackToken);
  } catch (error) {
    if (playbackToken === voicevoxPlaybackToken) {
      voicevoxPlaybackToken = 0;
      clearVoicevoxWatchdog();
    }
    console.warn(error);
    chrome.tts.speak(text, buildSpeechOptions());
  }
}

function speakNow(text) {
  speaking = true;
  if (settings.speechEngine === "voicevox") {
    speakVoicevoxNow(text);
    return;
  }

  chrome.tts.speak(text, buildSpeechOptions());
}

function speakNext() {
  if (speaking || !settings.enabled || queue.length === 0) {
    return;
  }

  const next = queue.shift();
  speakNow(next.text);
}

async function getVoices() {
  const voices = await chrome.tts.getVoices();
  return voices
    .filter((voice) => voice.voiceName)
    .map((voice) => ({
      voiceName: voice.voiceName,
      lang: voice.lang || "",
      remote: Boolean(voice.remote),
      extensionId: voice.extensionId || ""
    }));
}

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...stored });
  await loadSettings();
  updateActionIcon();
});

chrome.runtime.onStartup.addListener(loadSettings);
loadSettings();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }

  for (const [key, change] of Object.entries(changes)) {
    settings[key] = change.newValue;
  }

  updateActionIcon();

  if (!settings.enabled) {
    resetQueue();
  } else {
    speakNext();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "QUEUE_SPEECH") {
    if (!settings.enabled || typeof message.text !== "string" || !message.text.trim()) {
      sendResponse({ ok: false });
      return;
    }

    if (shouldSkipQueuedMessage(typeof message.dedupeKey === "string" ? message.dedupeKey : "")) {
      sendResponse({ ok: true, skipped: true });
      return;
    }

    queue.push({ text: message.text.trim() });

    if (queue.length > 50) {
      queue = queue.slice(-50);
    }

    speakNext();
    sendResponse({ ok: true });
    return;
  }

  if (message?.type === "GET_SETTINGS") {
    sendResponse({ ok: true, settings });
    return;
  }

  if (message?.type === "GET_VOICES") {
    getVoices()
      .then((voices) => sendResponse({ ok: true, voices }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message?.type === "GET_VOICEVOX_SPEAKERS") {
    getVoicevoxSpeakers(message.endpoint)
      .then((speakers) => sendResponse({ ok: true, speakers }))
      .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message?.type === "TEST_SPEECH") {
    if (typeof message.text === "string" && message.text.trim()) {
      resetQueue();
      speakNow(message.text.trim());
    }
    sendResponse({ ok: true });
    return;
  }

  if (message?.type === "OFFSCREEN_AUDIO_ENDED") {
    if (message.playbackToken && message.playbackToken !== voicevoxPlaybackToken) {
      sendResponse({ ok: true, stale: true });
      return;
    }

    clearVoicevoxWatchdog();
    voicevoxPlaybackToken = 0;
    speaking = false;
    speakNext();
    sendResponse({ ok: true });
    return;
  }

  if (message?.type === "OFFSCREEN_AUDIO_ERROR") {
    if (message.playbackToken && message.playbackToken !== voicevoxPlaybackToken) {
      sendResponse({ ok: true, stale: true });
      return;
    }

    clearVoicevoxWatchdog();
    voicevoxPlaybackToken = 0;
    if (settings.enabled && typeof message.fallbackText === "string" && message.fallbackText.trim()) {
      speaking = true;
      chrome.tts.speak(message.fallbackText.trim(), buildSpeechOptions());
    } else {
      speaking = false;
      speakNext();
    }
    sendResponse({ ok: true });
  }
});
