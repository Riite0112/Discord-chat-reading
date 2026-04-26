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

const LANGUAGE_OPTIONS = [
  { value: "ja", label: "日本語", lang: "ja-JP", locale: "ja-JP" },
  { value: "en", label: "English", lang: "en-US", locale: "en-US" },
  { value: "zh", label: "中文", lang: "zh-CN", locale: "zh-CN" },
  { value: "ko", label: "한국어", lang: "ko-KR", locale: "ko-KR" }
];
const HELP_URLS = {
  ja: "https://support.google.com/chrome/answer/12929150?hl=ja",
  en: "https://support.google.com/chrome/answer/12929150?hl=en",
  zh: "https://support.google.com/chrome/answer/12929150?hl=zh-Hans",
  ko: "https://support.google.com/chrome/answer/12929150?hl=ko"
};
const UI_TEXT = {
  ja: {
    enabledLabel: "読み上げを有効にする",
    latestButton: "最新を読む",
    testButton: "テスト再生",
    testHint: "Discord のチャットを開いた後は、最初にテスト再生を押して音が出るか確認してください。",
    languageLabel: "表示と言語",
    voiceLabel: "音声",
    rateLabel: "速度",
    pitchLabel: "高さ",
    volumeLabel: "音量",
    rulesTitle: "読み上げ設定",
    readAuthorLabel: "投稿者名を読む",
    announceLinksLabel: "リンク送信を案内する",
    announceImagesLabel: "画像送信を案内する",
    announceEmojiLabel: "絵文字送信を案内する",
    excludeAuthorsLabel: "選択したユーザーを除外する",
    excludeHint: "対象の Discord チャットを開くと、最近の投稿者がここに表示されます。",
    performanceTitle: "バックグラウンド対策",
    performanceHint: "Chrome の Memory Saver で Discord タブが止まらないよう、discord.com を「常にアクティブにするサイト」に追加してください。",
    openPerformanceButton: "設定を開く",
    helpLink: "手順を見る（Google Chrome ヘルプ）",
    logTitle: "過去の読み上げログ",
    enabledState: "読み上げは有効です。",
    disabledState: "読み上げは停止中です。",
    emptyAuthors: "まだ投稿者が見つかっていません。",
    emptyLog: "まだ読み上げログはありません。",
    auto: "自動",
    voiceLoadFailed: "音声一覧を読み込めませんでした。",
    openDiscord: "Discord のチャンネルを開いてください。",
    latestRead: "最新メッセージを読み上げました。",
    noLatest: "読み上げ可能な最新メッセージがありません。",
    discordConnectionFailed: "Discord タブと通信できませんでした。",
    performanceOpened: "パフォーマンス設定を開きました。",
    ready: "準備ができました。",
    authorsHintStatus: "Discord を開くと投稿者一覧を読み込めます。",
    testSpeech: "読み上げテストです。",
    testSent: "テスト音声を送信しました。"
  },
  en: {
    enabledLabel: "Enable reading",
    latestButton: "Read latest",
    testButton: "Test playback",
    testHint: "After opening the Discord chat, press Test playback first to confirm audio works.",
    languageLabel: "Display language",
    voiceLabel: "Voice",
    rateLabel: "Rate",
    pitchLabel: "Pitch",
    volumeLabel: "Volume",
    rulesTitle: "Reading rules",
    readAuthorLabel: "Read author names",
    announceLinksLabel: "Announce links",
    announceImagesLabel: "Announce images",
    announceEmojiLabel: "Announce emoji messages",
    excludeAuthorsLabel: "Ignore selected users",
    excludeHint: "Open the target Discord chat to show recent authors here.",
    performanceTitle: "Background playback",
    performanceHint: "Add discord.com to Chrome Memory Saver's always-active sites so the Discord tab keeps running.",
    openPerformanceButton: "Open settings",
    helpLink: "View steps (Google Chrome Help)",
    logTitle: "Recent read log",
    enabledState: "Reading is enabled.",
    disabledState: "Reading is paused.",
    emptyAuthors: "No authors found yet.",
    emptyLog: "No read log yet.",
    auto: "Auto",
    voiceLoadFailed: "Could not load the voice list.",
    openDiscord: "Open a Discord channel first.",
    latestRead: "Read the latest message.",
    noLatest: "No readable latest message found.",
    discordConnectionFailed: "Could not communicate with the Discord tab.",
    performanceOpened: "Opened performance settings.",
    ready: "Ready.",
    authorsHintStatus: "Open Discord to load the author list.",
    testSpeech: "This is a playback test.",
    testSent: "Sent test speech."
  },
  zh: {
    enabledLabel: "启用朗读",
    latestButton: "朗读最新",
    testButton: "测试播放",
    testHint: "打开 Discord 聊天后，请先按测试播放，确认可以听到声音。",
    languageLabel: "显示语言",
    voiceLabel: "语音",
    rateLabel: "速度",
    pitchLabel: "音高",
    volumeLabel: "音量",
    rulesTitle: "朗读设置",
    readAuthorLabel: "朗读发言者名称",
    announceLinksLabel: "提示链接发送",
    announceImagesLabel: "提示图片发送",
    announceEmojiLabel: "提示表情发送",
    excludeAuthorsLabel: "忽略所选用户",
    excludeHint: "打开目标 Discord 聊天后，最近的发言者会显示在这里。",
    performanceTitle: "后台运行设置",
    performanceHint: "请将 discord.com 添加到 Chrome Memory Saver 的始终保持活动网站，避免 Discord 标签页停止运行。",
    openPerformanceButton: "打开设置",
    helpLink: "查看步骤（Google Chrome 帮助）",
    logTitle: "最近朗读记录",
    enabledState: "朗读已启用。",
    disabledState: "朗读已暂停。",
    emptyAuthors: "尚未找到发言者。",
    emptyLog: "暂无朗读记录。",
    auto: "自动",
    voiceLoadFailed: "无法加载语音列表。",
    openDiscord: "请先打开 Discord 频道。",
    latestRead: "已朗读最新消息。",
    noLatest: "没有可朗读的最新消息。",
    discordConnectionFailed: "无法与 Discord 标签页通信。",
    performanceOpened: "已打开性能设置。",
    ready: "准备就绪。",
    authorsHintStatus: "打开 Discord 后即可加载发言者列表。",
    testSpeech: "这是朗读测试。",
    testSent: "已发送测试语音。"
  },
  ko: {
    enabledLabel: "읽기 활성화",
    latestButton: "최신 읽기",
    testButton: "테스트 재생",
    testHint: "Discord 채팅을 연 뒤 먼저 테스트 재생을 눌러 소리가 나는지 확인하세요.",
    languageLabel: "표시 언어",
    voiceLabel: "음성",
    rateLabel: "속도",
    pitchLabel: "높이",
    volumeLabel: "음량",
    rulesTitle: "읽기 설정",
    readAuthorLabel: "작성자 이름 읽기",
    announceLinksLabel: "링크 전송 알림",
    announceImagesLabel: "이미지 전송 알림",
    announceEmojiLabel: "이모지 전송 알림",
    excludeAuthorsLabel: "선택한 사용자 제외",
    excludeHint: "대상 Discord 채팅을 열면 최근 작성자가 여기에 표시됩니다.",
    performanceTitle: "백그라운드 설정",
    performanceHint: "Discord 탭이 멈추지 않도록 Chrome Memory Saver의 항상 활성 사이트에 discord.com을 추가하세요.",
    openPerformanceButton: "설정 열기",
    helpLink: "단계 보기(Google Chrome 도움말)",
    logTitle: "최근 읽기 로그",
    enabledState: "읽기가 활성화되어 있습니다.",
    disabledState: "읽기가 일시 중지되었습니다.",
    emptyAuthors: "아직 작성자를 찾지 못했습니다.",
    emptyLog: "아직 읽기 로그가 없습니다.",
    auto: "자동",
    voiceLoadFailed: "음성 목록을 불러오지 못했습니다.",
    openDiscord: "먼저 Discord 채널을 열어 주세요.",
    latestRead: "최신 메시지를 읽었습니다.",
    noLatest: "읽을 수 있는 최신 메시지가 없습니다.",
    discordConnectionFailed: "Discord 탭과 통신할 수 없습니다.",
    performanceOpened: "성능 설정을 열었습니다.",
    ready: "준비되었습니다.",
    authorsHintStatus: "Discord를 열면 작성자 목록을 불러올 수 있습니다.",
    testSpeech: "읽기 테스트입니다.",
    testSent: "테스트 음성을 보냈습니다."
  }
};
const PERFORMANCE_SETTINGS_URL = "chrome://settings/performance";

const enabledInput = document.getElementById("enabled");
const latestButton = document.getElementById("latestButton");
const testButton = document.getElementById("testButton");
const languageInput = document.getElementById("language");
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
const languageLabel = document.getElementById("languageLabel");
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

function getLanguageOption(language = currentSettings.language) {
  return LANGUAGE_OPTIONS.find((option) => option.value === language) || LANGUAGE_OPTIONS[0];
}

function getLanguageCode(settings = currentSettings) {
  return getLanguageOption(settings.language).value;
}

function t(key) {
  const language = getLanguageCode();
  return UI_TEXT[language]?.[key] || UI_TEXT.ja[key] || "";
}

function getLocale() {
  return getLanguageOption().locale;
}

function formatLogTime(item) {
  if (typeof item.minuteKey === "string" && item.minuteKey.trim()) {
    return item.minuteKey.trim().slice(-5);
  }

  if (Number.isFinite(item.messageTimestampMs) && item.messageTimestampMs > 0) {
    return new Date(item.messageTimestampMs).toLocaleTimeString(getLocale(), {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return new Date(item.createdAt).toLocaleTimeString(getLocale(), {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function setStatus(text) {
  statusText.textContent = text;
}

function renderLanguageOptions(selectedLanguage) {
  languageInput.textContent = "";

  for (const option of LANGUAGE_OPTIONS) {
    const optionElement = document.createElement("option");
    optionElement.value = option.value;
    optionElement.textContent = option.label;
    languageInput.append(optionElement);
  }

  languageInput.value = getLanguageOption(selectedLanguage).value;
}

function applyStaticText() {
  const language = getLanguageCode();
  document.documentElement.lang = getLanguageOption(language).lang;
  titleText.textContent = "Discord Chat Reader";
  enabledLabel.textContent = t("enabledLabel");
  latestButton.textContent = t("latestButton");
  testButton.textContent = t("testButton");
  testHint.textContent = t("testHint");
  languageLabel.textContent = t("languageLabel");
  voiceLabel.textContent = t("voiceLabel");
  rateLabel.textContent = t("rateLabel");
  pitchLabel.textContent = t("pitchLabel");
  volumeLabel.textContent = t("volumeLabel");
  rulesTitle.textContent = t("rulesTitle");
  readAuthorLabel.textContent = t("readAuthorLabel");
  announceLinksLabel.textContent = t("announceLinksLabel");
  announceImagesLabel.textContent = t("announceImagesLabel");
  announceEmojiLabel.textContent = t("announceEmojiLabel");
  excludeAuthorsLabel.textContent = t("excludeAuthorsLabel");
  excludeHint.textContent = t("excludeHint");
  performanceTitle.textContent = t("performanceTitle");
  performanceHint.textContent = t("performanceHint");
  openPerformanceButton.textContent = t("openPerformanceButton");
  helpLink.textContent = t("helpLink");
  logTitle.textContent = t("logTitle");
  helpLink.href = HELP_URLS[language] || HELP_URLS.ja;
}

function renderState(settings) {
  const isEnabled = Boolean(settings.enabled);
  document.body.classList.toggle("is-enabled", isEnabled);
  document.body.classList.toggle("is-disabled", !isEnabled);
  stateCard.classList.toggle("enabled", isEnabled);
  stateCard.classList.toggle("disabled", !isEnabled);
  stateBadge.textContent = isEnabled ? "ON" : "OFF";
  stateText.textContent = isEnabled
    ? t("enabledState")
    : t("disabledState");
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
    empty.textContent = t("emptyAuthors");
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
    empty.textContent = t("emptyLog");
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
  autoOption.textContent = t("auto");
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
  applyStaticText();
  renderLanguageOptions(currentSettings.language);
  enabledInput.checked = currentSettings.enabled;
  languageInput.value = getLanguageCode(currentSettings);
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
    setStatus(t("voiceLoadFailed"));
    return;
  }

  renderVoices(response.voices, selectedVoiceName);
}

async function readLatestMessage() {
  const tab = await getActiveDiscordTab();
  if (!tab) {
    setStatus(t("openDiscord"));
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "READ_LATEST_MESSAGE", forceReplay: true });
    if (response?.ok) {
      setStatus(t("latestRead"));
    } else {
      setStatus(t("noLatest"));
    }
  } catch {
    setStatus(t("discordConnectionFailed"));
  }
}

async function openPerformanceSettings() {
  await chrome.tabs.create({ url: PERFORMANCE_SETTINGS_URL });
  setStatus(t("performanceOpened"));
}

async function init() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  render(settings);
  await loadVoices(settings.voiceName);

  const authorsRefreshed = await refreshAuthorsFromActiveTab();
  await loadLocalData();
  setStatus(
    authorsRefreshed
      ? t("ready")
      : t("authorsHintStatus")
  );

  enabledInput.addEventListener("change", () => updateSettings({ enabled: enabledInput.checked }));
  languageInput.addEventListener("change", async () => {
    const language = getLanguageOption(languageInput.value);
    await updateSettings({
      language: language.value,
      lang: language.lang,
      voiceName: ""
    });
    await loadVoices("");
  });
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
      text: t("testSpeech")
    });
    setStatus(t("testSent"));
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
