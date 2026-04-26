const DEFAULT_SETTINGS = {
  enabled: true,
  rate: 1,
  pitch: 1,
  volume: 1,
  language: "ja",
  lang: "ja-JP",
  voiceName: "",
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
const recentQueueKeys = new Map();
const QUEUE_DEDUPE_TTL_MS = 12000;
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
  chrome.tts.stop();
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

function speakNow(text) {
  speaking = true;
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

  if (message?.type === "TEST_SPEECH") {
    if (typeof message.text === "string" && message.text.trim()) {
      resetQueue();
      speakNow(message.text.trim());
    }
    sendResponse({ ok: true });
  }
});
