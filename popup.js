const DEFAULT_SETTINGS = {
  enabled: true,
  rate: 1,
  pitch: 1,
  volume: 1,
  lang: "ja-JP",
  voiceName: "",
  readAuthorName: true,
  announceLinks: true,
  announceImages: false,
  announceEmojiMessages: false,
  excludeAuthorsEnabled: false,
  excludedAuthors: []
};

const HELP_URL = "https://support.google.com/chrome/answer/12929150?hl=ja";
const PERFORMANCE_SETTINGS_URL = "chrome://settings/performance";

const enabledInput = document.getElementById("enabled");
const latestButton = document.getElementById("latestButton");
const testButton = document.getElementById("testButton");
const rateInput = document.getElementById("rate");
const pitchInput = document.getElementById("pitch");
const volumeInput = document.getElementById("volume");
const voiceNameInput = document.getElementById("voiceName");
const readAuthorNameInput = document.getElementById("readAuthorName");
const announceLinksInput = document.getElementById("announceLinks");
const announceImagesInput = document.getElementById("announceImages");
const announceEmojiMessagesInput = document.getElementById("announceEmojiMessages");
const excludeAuthorsEnabledInput = document.getElementById("excludeAuthorsEnabled");
const excludePanel = document.getElementById("excludePanel");
const authorList = document.getElementById("authorList");
const stateCard = document.getElementById("stateCard");
const stateBadge = document.getElementById("stateBadge");
const stateText = document.getElementById("stateText");
const statusText = document.getElementById("status");
const testHint = document.getElementById("testHint");
const rateValue = document.getElementById("rateValue");
const pitchValue = document.getElementById("pitchValue");
const volumeValue = document.getElementById("volumeValue");
const titleText = document.getElementById("titleText");
const enabledLabel = document.getElementById("enabledLabel");
const voiceLabel = document.getElementById("voiceLabel");
const rateLabel = document.getElementById("rateLabel");
const pitchLabel = document.getElementById("pitchLabel");
const volumeLabel = document.getElementById("volumeLabel");
const rulesTitle = document.getElementById("rulesTitle");
const readAuthorLabel = document.getElementById("readAuthorLabel");
const announceLinksLabel = document.getElementById("announceLinksLabel");
const announceImagesLabel = document.getElementById("announceImagesLabel");
const announceEmojiLabel = document.getElementById("announceEmojiLabel");
const excludeAuthorsLabel = document.getElementById("excludeAuthorsLabel");
const excludeHint = document.getElementById("excludeHint");
const performanceTitle = document.getElementById("performanceTitle");
const performanceHint = document.getElementById("performanceHint");
const openPerformanceButton = document.getElementById("openPerformanceButton");
const helpLink = document.getElementById("helpLink");
const logTitle = document.getElementById("logTitle");
const logList = document.getElementById("logList");

let currentSettings = { ...DEFAULT_SETTINGS };
let knownAuthors = [];
let spokenLog = [];

function formatLogTime(item) {
  if (typeof item.minuteKey === "string" && item.minuteKey.trim()) {
    return item.minuteKey.trim().slice(-5);
  }

  if (Number.isFinite(item.messageTimestampMs) && item.messageTimestampMs > 0) {
    return new Date(item.messageTimestampMs).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return new Date(item.createdAt).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function setStatus(text) {
  statusText.textContent = text;
}

function applyStaticText() {
  titleText.textContent = "Discord Chat Reader";
  enabledLabel.textContent = "\u8aad\u307f\u4e0a\u3052\u3092\u6709\u52b9\u306b\u3059\u308b";
  latestButton.textContent = "\u6700\u65b0\u3092\u8aad\u3080";
  testButton.textContent = "\u30c6\u30b9\u30c8\u518d\u751f";
  testHint.textContent = "Discord \u306e\u30c1\u30e3\u30c3\u30c8\u3092\u958b\u3044\u305f\u5f8c\u306f\u3001\u6700\u521d\u306b\u30c6\u30b9\u30c8\u518d\u751f\u3092\u62bc\u3057\u3066\u97f3\u304c\u51fa\u308b\u304b\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
  voiceLabel.textContent = "\u97f3\u58f0";
  rateLabel.textContent = "\u901f\u5ea6";
  pitchLabel.textContent = "\u9ad8\u3055";
  volumeLabel.textContent = "\u97f3\u91cf";
  rulesTitle.textContent = "\u8aad\u307f\u4e0a\u3052\u8a2d\u5b9a";
  readAuthorLabel.textContent = "\u6295\u7a3f\u8005\u540d\u3092\u8aad\u3080";
  announceLinksLabel.textContent = "\u30ea\u30f3\u30af\u9001\u4fe1\u3092\u6848\u5185\u3059\u308b";
  announceImagesLabel.textContent = "\u753b\u50cf\u9001\u4fe1\u3092\u6848\u5185\u3059\u308b";
  announceEmojiLabel.textContent = "\u7d75\u6587\u5b57\u9001\u4fe1\u3092\u6848\u5185\u3059\u308b";
  excludeAuthorsLabel.textContent = "\u9078\u629e\u3057\u305f\u30e6\u30fc\u30b6\u30fc\u3092\u9664\u5916\u3059\u308b";
  excludeHint.textContent = "\u5bfe\u8c61\u306e Discord \u30c1\u30e3\u30c3\u30c8\u3092\u958b\u304f\u3068\u3001\u6700\u8fd1\u306e\u6295\u7a3f\u8005\u304c\u3053\u3053\u306b\u8868\u793a\u3055\u308c\u307e\u3059\u3002";
  performanceTitle.textContent = "\u30d0\u30c3\u30af\u30b0\u30e9\u30a6\u30f3\u30c9\u5bfe\u7b56";
  performanceHint.textContent = "Chrome \u306e Memory Saver \u3067 Discord \u30bf\u30d6\u304c\u6b62\u307e\u3089\u306a\u3044\u3088\u3046\u3001discord.com \u3092\u300c\u5e38\u306b\u30a2\u30af\u30c6\u30a3\u30d6\u306b\u3059\u308b\u30b5\u30a4\u30c8\u300d\u306b\u8ffd\u52a0\u3057\u3066\u304f\u3060\u3055\u3044\u3002";
  openPerformanceButton.textContent = "\u8a2d\u5b9a\u3092\u958b\u304f";
  helpLink.textContent = "\u624b\u9806\u3092\u898b\u308b\uff08Google Chrome \u30d8\u30eb\u30d7\uff09";
  logTitle.textContent = "\u904e\u53bb\u306e\u8aad\u307f\u4e0a\u3052\u30ed\u30b0";
  helpLink.href = HELP_URL;
}

function renderState(settings) {
  const isEnabled = Boolean(settings.enabled);
  document.body.classList.toggle("is-enabled", isEnabled);
  document.body.classList.toggle("is-disabled", !isEnabled);
  stateCard.classList.toggle("enabled", isEnabled);
  stateCard.classList.toggle("disabled", !isEnabled);
  stateBadge.textContent = isEnabled ? "ON" : "OFF";
  stateText.textContent = isEnabled
    ? "\u8aad\u307f\u4e0a\u3052\u306f\u6709\u52b9\u3067\u3059\u3002"
    : "\u8aad\u307f\u4e0a\u3052\u306f\u505c\u6b62\u4e2d\u3067\u3059\u3002";
}

function renderAuthors(settings) {
  authorList.textContent = "";
  excludePanel.hidden = !settings.excludeAuthorsEnabled;

  if (!settings.excludeAuthorsEnabled) {
    return;
  }

  if (knownAuthors.length === 0) {
    const empty = document.createElement("p");
    empty.className = "emptyState";
    empty.textContent = "\u307e\u3060\u6295\u7a3f\u8005\u304c\u898b\u3064\u304b\u3063\u3066\u3044\u307e\u305b\u3093\u3002";
    authorList.append(empty);
    return;
  }

  for (const author of knownAuthors) {
    const label = document.createElement("label");
    label.className = "authorItem";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = settings.excludedAuthors.includes(author);
    checkbox.addEventListener("change", async () => {
      const nextAuthors = new Set(currentSettings.excludedAuthors);
      if (checkbox.checked) {
        nextAuthors.add(author);
      } else {
        nextAuthors.delete(author);
      }

      await updateSettings({ excludedAuthors: Array.from(nextAuthors) });
    });

    const text = document.createElement("span");
    text.textContent = author;

    label.append(checkbox, text);
    authorList.append(label);
  }
}

function renderLog() {
  logList.textContent = "";

  if (spokenLog.length === 0) {
    const empty = document.createElement("p");
    empty.className = "emptyState";
    empty.textContent = "\u307e\u3060\u8aad\u307f\u4e0a\u3052\u30ed\u30b0\u306f\u3042\u308a\u307e\u305b\u3093\u3002";
    logList.append(empty);
    return;
  }

  for (const item of spokenLog) {
    const row = document.createElement("div");
    row.className = "logItem";

    const time = document.createElement("span");
    time.className = "logTime";
    time.textContent = formatLogTime(item);

    const text = document.createElement("span");
    text.className = "logText";
    text.textContent = item.text || "";

    row.append(time, text);
    logList.append(row);
  }
}

function renderVoices(voices, selectedVoiceName) {
  voiceNameInput.textContent = "";

  const autoOption = document.createElement("option");
  autoOption.value = "";
  autoOption.textContent = "\u81ea\u52d5";
  voiceNameInput.append(autoOption);

  for (const voice of voices) {
    const option = document.createElement("option");
    option.value = voice.voiceName;
    option.textContent = `${voice.voiceName}${voice.lang ? ` (${voice.lang})` : ""}`;
    voiceNameInput.append(option);
  }

  voiceNameInput.value = selectedVoiceName || "";
}

function render(settings) {
  currentSettings = { ...currentSettings, ...settings };
  enabledInput.checked = currentSettings.enabled;
  rateInput.value = String(currentSettings.rate);
  pitchInput.value = String(currentSettings.pitch);
  volumeInput.value = String(currentSettings.volume);
  voiceNameInput.value = currentSettings.voiceName || "";
  readAuthorNameInput.checked = currentSettings.readAuthorName;
  announceLinksInput.checked = currentSettings.announceLinks;
  announceImagesInput.checked = currentSettings.announceImages;
  announceEmojiMessagesInput.checked = currentSettings.announceEmojiMessages;
  excludeAuthorsEnabledInput.checked = currentSettings.excludeAuthorsEnabled;
  rateValue.textContent = `${currentSettings.rate.toFixed(1)}x`;
  pitchValue.textContent = `${currentSettings.pitch.toFixed(1)}x`;
  volumeValue.textContent = `${Math.round(currentSettings.volume * 100)}%`;

  renderState(currentSettings);
  renderAuthors(currentSettings);
  renderLog();
}

async function updateSettings(partial) {
  await chrome.storage.sync.set(partial);
  const nextSettings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  render(nextSettings);
}

async function getActiveDiscordTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const [tab] = tabs;
  if (!tab?.id || typeof tab.url !== "string" || !tab.url.startsWith("https://discord.com/channels/")) {
    return null;
  }

  return tab;
}

async function refreshAuthorsFromActiveTab() {
  const tab = await getActiveDiscordTab();
  if (!tab) {
    return false;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "REFRESH_AUTHORS" });
    return true;
  } catch {
    return false;
  }
}

async function loadLocalData() {
  const stored = await chrome.storage.local.get({
    knownAuthors: [],
    spokenLog: []
  });

  knownAuthors = Array.isArray(stored.knownAuthors) ? stored.knownAuthors : [];
  spokenLog = Array.isArray(stored.spokenLog) ? stored.spokenLog.slice(0, 30) : [];
  render(currentSettings);
}

async function loadVoices(selectedVoiceName) {
  const response = await chrome.runtime.sendMessage({ type: "GET_VOICES" });
  if (!response?.ok) {
    setStatus("\u97f3\u58f0\u4e00\u89a7\u3092\u8aad\u307f\u8fbc\u3081\u307e\u305b\u3093\u3067\u3057\u305f\u3002");
    return;
  }

  renderVoices(response.voices, selectedVoiceName);
}

async function readLatestMessage() {
  const tab = await getActiveDiscordTab();
  if (!tab) {
    setStatus("Discord \u306e\u30c1\u30e3\u30f3\u30cd\u30eb\u3092\u958b\u3044\u3066\u304f\u3060\u3055\u3044\u3002");
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "READ_LATEST_MESSAGE", forceReplay: true });
    if (response?.ok) {
      setStatus("\u6700\u65b0\u30e1\u30c3\u30bb\u30fc\u30b8\u3092\u8aad\u307f\u4e0a\u3052\u307e\u3057\u305f\u3002");
    } else {
      setStatus("\u8aad\u307f\u4e0a\u3052\u53ef\u80fd\u306a\u6700\u65b0\u30e1\u30c3\u30bb\u30fc\u30b8\u304c\u3042\u308a\u307e\u305b\u3093\u3002");
    }
  } catch {
    setStatus("Discord \u30bf\u30d6\u3068\u901a\u4fe1\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002");
  }
}

async function openPerformanceSettings() {
  await chrome.tabs.create({ url: PERFORMANCE_SETTINGS_URL });
  setStatus("\u30d1\u30d5\u30a9\u30fc\u30de\u30f3\u30b9\u8a2d\u5b9a\u3092\u958b\u304d\u307e\u3057\u305f\u3002");
}

async function init() {
  applyStaticText();
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  render(settings);
  await loadVoices(settings.voiceName);

  const authorsRefreshed = await refreshAuthorsFromActiveTab();
  await loadLocalData();
  setStatus(
    authorsRefreshed
      ? "\u6e96\u5099\u304c\u3067\u304d\u307e\u3057\u305f\u3002"
      : "Discord \u3092\u958b\u304f\u3068\u6295\u7a3f\u8005\u4e00\u89a7\u3092\u8aad\u307f\u8fbc\u3081\u307e\u3059\u3002"
  );

  enabledInput.addEventListener("change", () => updateSettings({ enabled: enabledInput.checked }));
  rateInput.addEventListener("input", () => updateSettings({ rate: Number(rateInput.value) }));
  pitchInput.addEventListener("input", () => updateSettings({ pitch: Number(pitchInput.value) }));
  volumeInput.addEventListener("input", () => updateSettings({ volume: Number(volumeInput.value) }));
  voiceNameInput.addEventListener("change", () => updateSettings({ voiceName: voiceNameInput.value }));
  readAuthorNameInput.addEventListener("change", () => updateSettings({ readAuthorName: readAuthorNameInput.checked }));
  announceLinksInput.addEventListener("change", () => updateSettings({ announceLinks: announceLinksInput.checked }));
  announceImagesInput.addEventListener("change", () => updateSettings({ announceImages: announceImagesInput.checked }));
  announceEmojiMessagesInput.addEventListener("change", () => updateSettings({ announceEmojiMessages: announceEmojiMessagesInput.checked }));
  excludeAuthorsEnabledInput.addEventListener("change", () => updateSettings({ excludeAuthorsEnabled: excludeAuthorsEnabledInput.checked }));
  latestButton.addEventListener("click", () => readLatestMessage());
  openPerformanceButton.addEventListener("click", () => openPerformanceSettings());

  testButton.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({
      type: "TEST_SPEECH",
      text: "\u8aad\u307f\u4e0a\u3052\u30c6\u30b9\u30c8\u3067\u3059\u3002"
    });
    setStatus("\u30c6\u30b9\u30c8\u97f3\u58f0\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f\u3002");
  });

  chrome.storage.local.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes.knownAuthors) {
      knownAuthors = Array.isArray(changes.knownAuthors.newValue) ? changes.knownAuthors.newValue : [];
    }

    if (changes.spokenLog) {
      spokenLog = Array.isArray(changes.spokenLog.newValue) ? changes.spokenLog.newValue.slice(0, 30) : [];
    }

    render(currentSettings);
  });
}

init();
