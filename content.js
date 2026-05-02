const DEFAULT_SETTINGS = {
  enabled: true,
  language: "ja",
  readAuthorName: true,
  announceLinks: true,
  announceImages: false,
  announceEmojiMessages: false,
  excludeAuthorsEnabled: false,
  excludedAuthors: []
};

const MESSAGE_SELECTOR = [
  'li[id^="chat-messages-"]',
  'div[id^="chat-messages-"]',
  '[data-list-item-id*="chat-messages"]'
].join(", ");

const PRIMARY_CONTENT_SELECTORS = [
  '[id^="message-content-"]',
  '[class*="messageContent"]'
].join(", ");

const REMOVE_FROM_CONTENT = [
  "[id^='message-accessories-']",
  "[class*='repliedMessage']",
  "[class*='buttonContainer']",
  "[class*='embed']",
  "[class*='attachment']",
  "[class*='media']",
  "[class*='badge']",
  "[class*='chiplet']",
  "[class*='roleIcon']",
  "[class*='roleDot']",
  "[class*='decorator']",
  "[class*='subscription']",
  "[class*='authorDecorator']",
  "[class*='usernameBadge']",
  "[class*='botTag']",
  "[class*='member']",
  "[class*='flowerStar']",
  "[class*='guildIcon']",
  "[class*='separator']",
  "[class*='timestamp']",
  "[class*='headerText']",
  "[class*='header']:not([id^='message-content-'])",
  "[aria-label*='Member']",
  "[aria-label*='member']",
  "[aria-label*='YouTube']",
  "[aria-label*='subscriber']",
  "[aria-label*='Subscriber']",
  "[role='tooltip']",
  "button"
].join(", ");

const URL_PATTERN = /\b(?:https?:\/\/\S+|www\.\S+|[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:\/\S*)?)/gi;
const URL_TEST_PATTERN = /\b(?:https?:\/\/\S+|www\.\S+|[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:\/\S*)?)/i;
const MAX_KNOWN_AUTHORS = 100;
const MAX_LOG_ENTRIES = 30;
const HYDRATION_DELAY_MS = 4500;
const MUTATION_SETTLE_MS = 180;
const MESSAGE_DEDUPE_TTL_MS = 15000;
const TEXT_DEDUPE_TTL_MS = 15000;
const HISTORY_GUARD_MS = 20000;
const TRANSIENT_PHRASES = new Set([
  "URL\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f",
  "\u30ea\u30f3\u30af\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f",
  "\u753b\u50cf\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f",
  "\u7d75\u6587\u5b57\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f",
  "sent a URL",
  "sent an image",
  "sent an emoji",
  "\u53d1\u9001\u4e86 URL",
  "\u53d1\u9001\u4e86\u56fe\u7247",
  "\u53d1\u9001\u4e86\u8868\u60c5",
  "URL\uc744 \ubcf4\ub0c8\uc2b5\ub2c8\ub2e4",
  "\uc774\ubbf8\uc9c0\ub97c \ubcf4\ub0c8\uc2b5\ub2c8\ub2e4",
  "\uc774\ubaa8\uc9c0\ub97c \ubcf4\ub0c8\uc2b5\ub2c8\ub2e4"
]);
const NOTICE_TEXT = {
  ja: {
    url: "URL\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f",
    image: "\u753b\u50cf\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f",
    emoji: "\u7d75\u6587\u5b57\u3092\u9001\u4fe1\u3057\u307e\u3057\u305f"
  },
  en: {
    url: "sent a URL",
    image: "sent an image",
    emoji: "sent an emoji"
  },
  zh: {
    url: "\u53d1\u9001\u4e86 URL",
    image: "\u53d1\u9001\u4e86\u56fe\u7247",
    emoji: "\u53d1\u9001\u4e86\u8868\u60c5"
  },
  ko: {
    url: "URL\uc744 \ubcf4\ub0c8\uc2b5\ub2c8\ub2e4",
    image: "\uc774\ubbf8\uc9c0\ub97c \ubcf4\ub0c8\uc2b5\ub2c8\ub2e4",
    emoji: "\uc774\ubaa8\uc9c0\ub97c \ubcf4\ub0c8\uc2b5\ub2c8\ub2e4"
  }
};

const seenMessages = new Set();
const activeMessageKeys = new Set();
const recentSpeechKeys = [];
let currentUrl = location.href;
let settings = { ...DEFAULT_SETTINGS };
let authorSyncTimer = 0;
let hydrationTimer = 0;
let mutationTimer = 0;
let urlWatchTimer = 0;
let messageObserver = null;
let extensionContextAlive = true;
let isHydrating = false;
let spokenLog = [];
const recentMessageKeys = new Map();
const recentTextKeys = new Map();
let historyCutoffMessageId = null;
let historyCutoffTimestampMs = 0;
let historyGuardUntil = 0;
let lastSpokenAuthor = "";

function isExtensionContextInvalidatedError(error) {
  const message = String(error?.message || error || "");
  return message.includes("Extension context invalidated");
}

function stopExtensionWork() {
  extensionContextAlive = false;
  window.clearTimeout(authorSyncTimer);
  window.clearTimeout(hydrationTimer);
  window.clearTimeout(mutationTimer);
  window.clearInterval(urlWatchTimer);
  messageObserver?.disconnect();
  messageObserver = null;
}

function handleChromeApiError(error) {
  if (isExtensionContextInvalidatedError(error)) {
    stopExtensionWork();
  }
}

function canUseChromeApi() {
  if (!extensionContextAlive) {
    return false;
  }

  try {
    return typeof chrome !== "undefined" && Boolean(chrome.runtime?.id);
  } catch (error) {
    handleChromeApiError(error);
    return false;
  }
}

async function safeRuntimeSendMessage(message) {
  if (!canUseChromeApi() || !chrome.runtime?.sendMessage) {
    return null;
  }

  try {
    return await chrome.runtime.sendMessage(message);
  } catch (error) {
    handleChromeApiError(error);
    return null;
  }
}

async function safeStorageLocalGet(defaultValue) {
  if (!canUseChromeApi() || !chrome.storage?.local?.get) {
    return defaultValue;
  }

  try {
    return await chrome.storage.local.get(defaultValue);
  } catch (error) {
    handleChromeApiError(error);
    return defaultValue;
  }
}

function safeStorageLocalSet(values) {
  if (!canUseChromeApi() || !chrome.storage?.local?.set) {
    return;
  }

  try {
    const result = chrome.storage.local.set(values);
    if (result && typeof result.catch === "function") {
      result.catch(handleChromeApiError);
    }
  } catch (error) {
    handleChromeApiError(error);
  }
}

function safeAddRuntimeMessageListener(listener) {
  if (!canUseChromeApi() || !chrome.runtime?.onMessage?.addListener) {
    return;
  }

  try {
    chrome.runtime.onMessage.addListener(listener);
  } catch (error) {
    handleChromeApiError(error);
  }
}

function safeAddStorageChangeListener(listener) {
  if (!canUseChromeApi() || !chrome.storage?.onChanged?.addListener) {
    return;
  }

  try {
    chrome.storage.onChanged.addListener(listener);
  } catch (error) {
    handleChromeApiError(error);
  }
}

function isElement(value) {
  return value instanceof Element;
}

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function getLanguageCode() {
  return Object.prototype.hasOwnProperty.call(NOTICE_TEXT, settings.language) ? settings.language : "ja";
}

function noticeText(key) {
  const language = getLanguageCode();
  return NOTICE_TEXT[language]?.[key] || NOTICE_TEXT.ja[key] || "";
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatMinuteKey(timestampMs) {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
    return "";
  }

  const date = new Date(timestampMs);
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())} ${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`;
}

function isLikelyUrl(text, href) {
  const safeText = normalizeWhitespace(text || "");
  const safeHref = normalizeWhitespace(href || "");
  return /^https?:\/\//i.test(safeHref) || /^www\./i.test(safeText) || URL_TEST_PATTERN.test(safeText);
}

function stripUrls(text) {
  return normalizeWhitespace((text || "").replace(URL_PATTERN, " "));
}

function stripBadgeArtifacts(text) {
  let value = text || "";
  value = value.replace(/\[[^\]]{1,24}\]/g, " ");
  value = value.replace(/\u3010[^\u3011]{1,24}\u3011/g, " ");
  value = value.replace(/\b\S*YouTube\s+Member\s*:\s*[^\n\r]*/gi, " ");
  value = value.replace(/\b(?:Premium|Nitro)\s+Member\s*:\s*[^\n\r]*/gi, " ");
  value = normalizeWhitespace(value);

  if (/^[A-Z0-9_+\-]{2,16}$/.test(value)) {
    return "";
  }

  return value;
}

function sanitizeSpeechText(text) {
  return stripBadgeArtifacts(stripUrls(text || ""));
}

function sanitizeAuthorText(text) {
  let value = stripBadgeArtifacts(text || "");
  const commaIndex = value.indexOf(",");
  if (commaIndex >= 0) {
    value = value.slice(0, commaIndex);
  }

  const japaneseCommaIndex = value.indexOf("\u3001");
  if (japaneseCommaIndex >= 0) {
    value = value.slice(0, japaneseCommaIndex);
  }

  return normalizeWhitespace(value);
}

function getMessageId(messageElement) {
  return messageElement.id || messageElement.getAttribute("data-list-item-id") || "";
}

function getSortableMessageId(messageId) {
  const numericIds = String(messageId || "").match(/\d{16,22}/g) || [];
  const numericId = numericIds[numericIds.length - 1];
  if (!numericId) {
    return null;
  }

  try {
    return BigInt(numericId);
  } catch {
    return null;
  }
}

function getAuthorFromNode(messageElement) {
  const authorNode =
    messageElement.querySelector("[id^='message-username-']") ||
    messageElement.querySelector("h3 span[role='button']") ||
    messageElement.querySelector("h3 span[class*='username']") ||
    messageElement.querySelector("header span[class*='username']");

  return sanitizeAuthorText(authorNode?.textContent || "");
}

function getAuthor(messageElement) {
  const author = getAuthorFromNode(messageElement);
  if (author) {
    return author;
  }

  let previous = messageElement.previousElementSibling;
  while (previous) {
    if (previous.matches(MESSAGE_SELECTOR)) {
      const previousAuthor = getAuthorFromNode(previous);
      if (previousAuthor) {
        return previousAuthor;
      }
    }
    previous = previous.previousElementSibling;
  }

  return "";
}

function resolveMessageAuthor(messageElement) {
  const directAuthor = getAuthorFromNode(messageElement);
  if (directAuthor) {
    return {
      author: directAuthor,
      hasDirectAuthor: true
    };
  }

  return {
    author: getAuthor(messageElement) || lastSpokenAuthor,
    hasDirectAuthor: false
  };
}

function getMessageTimestampMs(messageElement) {
  const timeNode =
    messageElement.querySelector("time[datetime]") ||
    messageElement.querySelector("[id^='message-timestamp'] time[datetime]") ||
    messageElement.querySelector("time");

  if (!timeNode) {
    return 0;
  }

  const timestampText = timeNode.getAttribute("datetime") || "";
  const parsedTimestamp = Date.parse(timestampText);
  return Number.isFinite(parsedTimestamp) ? parsedTimestamp : 0;
}

function getContentNodes(messageElement) {
  return Array.from(messageElement.querySelectorAll(PRIMARY_CONTENT_SELECTORS)).filter((node) => {
    if (!isElement(node)) {
      return false;
    }

    if (node.closest("h3, header")) {
      return false;
    }

    return !node.closest(REMOVE_FROM_CONTENT);
  });
}

function buildContentWrapper(contentNodes) {
  const wrapper = document.createElement("div");
  for (const node of contentNodes) {
    wrapper.append(node.cloneNode(true));
  }

  wrapper.querySelectorAll(REMOVE_FROM_CONTENT).forEach((node) => node.remove());
  return wrapper;
}

function removeTextBadges(wrapper) {
  const suspiciousNodes = Array.from(wrapper.querySelectorAll("*")).filter((node) => {
    const text = normalizeWhitespace(node.textContent || "");
    if (!text) {
      return false;
    }

    return (
      /YouTube Member:/i.test(text) ||
      /^Member:/i.test(text) ||
      /^\[[^\]]{1,24}\]$/.test(text) ||
      /^\u3010[^\u3011]{1,24}\u3011$/.test(text)
    );
  });

  suspiciousNodes.forEach((node) => node.remove());
}

function getEmojiCount(contentNodes) {
  let count = 0;

  for (const node of contentNodes) {
    const emojis = node.querySelectorAll("img[alt], [role='img'][aria-label]");
    for (const emojiNode of emojis) {
      const label = normalizeWhitespace(
        emojiNode.getAttribute("alt") ||
        emojiNode.getAttribute("aria-label") ||
        ""
      );

      if (!label || isLikelyUrl(label, "")) {
        continue;
      }

      count += 1;
    }
  }

  return count;
}

function getImageCount(messageElement) {
  const accessoryRoot = messageElement.querySelector("[id^='message-accessories-']");
  if (!accessoryRoot) {
    return 0;
  }

  const mediaNodes = Array.from(accessoryRoot.querySelectorAll("img, video, canvas"));
  return mediaNodes.filter((node) => {
    if (node.closest("[class*='embed']")) {
      return false;
    }

    const alt = normalizeWhitespace(node.getAttribute?.("alt") || "");
    if (alt && !isLikelyUrl(alt, "")) {
      return false;
    }

    return true;
  }).length;
}

function extractMessageParts(messageElement) {
  const contentNodes = getContentNodes(messageElement);
  const wrapper = buildContentWrapper(contentNodes);
  removeTextBadges(wrapper);

  let linkCount = 0;
  wrapper.querySelectorAll("a").forEach((anchor) => {
    const text = anchor.textContent || "";
    const href = anchor.getAttribute("href") || "";
    if (isLikelyUrl(text, href)) {
      linkCount += 1;
      anchor.remove();
    }
  });

  const rawText = normalizeWhitespace(wrapper.textContent || "");
  const rawUrlMatches = rawText.match(URL_PATTERN);
  if (rawUrlMatches) {
    linkCount += rawUrlMatches.length;
  }

  return {
    text: sanitizeSpeechText(rawText),
    linkCount,
    imageCount: getImageCount(messageElement),
    emojiCount: getEmojiCount(contentNodes)
  };
}

function shouldSkipAuthor(author) {
  if (!settings.excludeAuthorsEnabled) {
    return false;
  }

  if (!author) {
    return false;
  }

  return Array.isArray(settings.excludedAuthors) && settings.excludedAuthors.includes(author);
}

function buildSpeechText(author, parts) {
  const safeAuthor = sanitizeAuthorText(author);
  const safeText = sanitizeSpeechText(parts.text || "");
  const hasLinks = Number(parts.linkCount || 0) > 0;
  const hasImages = Number(parts.imageCount || 0) > 0;
  const hasEmojiOnly = !safeText && !hasImages && Number(parts.emojiCount || 0) > 0;

  if (shouldSkipAuthor(safeAuthor)) {
    return "";
  }

  const segments = [];
  const formatNotice = (text) => (settings.readAuthorName && safeAuthor && segments.length === 0 ? `${safeAuthor}: ${text}` : text);

  if (safeText) {
    segments.push(settings.readAuthorName && safeAuthor ? `${safeAuthor}: ${safeText}` : safeText);
  }

  if (hasLinks && settings.announceLinks) {
    segments.push(formatNotice(noticeText("url")));
  }

  if (hasImages && settings.announceImages) {
    segments.push(formatNotice(noticeText("image")));
  }

  if (hasEmojiOnly && settings.announceEmojiMessages) {
    segments.push(formatNotice(noticeText("emoji")));
  }

  return normalizeWhitespace(segments.join(" "));
}

function buildSpeechKey(parsed) {
  const author = normalizeWhitespace(parsed.author || "");
  const speechText = normalizeWhitespace(parsed.speechText || "");
  const minuteKey = normalizeWhitespace(parsed.minuteKey || "");
  return `${minuteKey}||${author}||${speechText}`;
}

function isTransientSpeech(parsed) {
  const speechText = normalizeWhitespace(parsed.speechText || "");
  const speechTextWithoutAuthor = speechText.replace(/^.{1,80}:\s*/, "");
  return TRANSIENT_PHRASES.has(speechText) || TRANSIENT_PHRASES.has(speechTextWithoutAuthor);
}

function syncRecentSpeechKeysFromLog() {
  recentSpeechKeys.splice(0, recentSpeechKeys.length, ...spokenLog.map((entry) => entry.key));
}

async function loadSpokenLog() {
  const stored = await safeStorageLocalGet({ spokenLog: [] });
  spokenLog = Array.isArray(stored.spokenLog) ? stored.spokenLog.slice(0, MAX_LOG_ENTRIES) : [];
  syncRecentSpeechKeysFromLog();
}

function persistSpokenLog() {
  safeStorageLocalSet({ spokenLog });
}

function hasRecentSpeech(parsed) {
  if (isTransientSpeech(parsed)) {
    return false;
  }

  if (!normalizeWhitespace(parsed.speechText || "")) {
    return false;
  }

  const speechKey = buildSpeechKey(parsed);
  return recentSpeechKeys.includes(speechKey);
}

function rememberSpeech(parsed) {
  if (isTransientSpeech(parsed)) {
    return;
  }

  if (!normalizeWhitespace(parsed.speechText || "")) {
    return;
  }

  const speechKey = buildSpeechKey(parsed);
  spokenLog = spokenLog.filter((entry) => entry.key !== speechKey);
  spokenLog.unshift({
    key: speechKey,
    author: normalizeWhitespace(parsed.author || ""),
    text: normalizeWhitespace(parsed.speechText || ""),
    minuteKey: normalizeWhitespace(parsed.minuteKey || ""),
    messageTimestampMs: Number(parsed.timestampMs || 0),
    createdAt: Date.now()
  });
  spokenLog = spokenLog.slice(0, MAX_LOG_ENTRIES);
  syncRecentSpeechKeysFromLog();
  persistSpokenLog();
}

function rememberLastSpokenAuthor(parsed) {
  const safeAuthor = sanitizeAuthorText(parsed.author || "");
  if (safeAuthor) {
    lastSpokenAuthor = safeAuthor;
  }
}

function queueSpeech(text) {
  safeRuntimeSendMessage({
    type: "QUEUE_SPEECH",
    text
  });
}

function pruneRecentMessageKeys(now = Date.now()) {
  for (const [key, timestamp] of recentMessageKeys.entries()) {
    if (now - timestamp > MESSAGE_DEDUPE_TTL_MS) {
      recentMessageKeys.delete(key);
    }
  }
}

function getStableMessageKey(parsed) {
  if (parsed.messageId) {
    return `id:${parsed.messageId}`;
  }

  return `speech:${buildSpeechKey(parsed)}`;
}

function wasRecentlyProcessed(parsed) {
  const stableKey = getStableMessageKey(parsed);
  const now = Date.now();
  pruneRecentMessageKeys(now);
  const seenAt = recentMessageKeys.get(stableKey);
  if (typeof seenAt === "number" && now - seenAt < MESSAGE_DEDUPE_TTL_MS) {
    return true;
  }

  recentMessageKeys.set(stableKey, now);
  return false;
}

function pruneRecentTextKeys(now = Date.now()) {
  for (const [key, timestamp] of recentTextKeys.entries()) {
    if (now - timestamp > TEXT_DEDUPE_TTL_MS) {
      recentTextKeys.delete(key);
    }
  }
}

function buildTextKey(parsed) {
  return normalizeWhitespace(parsed.bodyText || "");
}

function hasRecentSameText(parsed) {
  const textKey = buildTextKey(parsed);
  if (!textKey) {
    return false;
  }

  const now = Date.now();
  pruneRecentTextKeys(now);
  const seenAt = recentTextKeys.get(textKey);
  return typeof seenAt === "number" && now - seenAt < TEXT_DEDUPE_TTL_MS;
}

function rememberRecentText(parsed) {
  const textKey = buildTextKey(parsed);
  if (!textKey) {
    return;
  }

  pruneRecentTextKeys();
  recentTextKeys.set(textKey, Date.now());
}

function parseMessage(messageElement) {
  const authorInfo = resolveMessageAuthor(messageElement);
  const author = authorInfo.author;
  const parts = extractMessageParts(messageElement);
  const speechText = buildSpeechText(author, parts);
  const messageId = getMessageId(messageElement);
  const timestampMs = getMessageTimestampMs(messageElement);
  const minuteKey = formatMinuteKey(timestampMs);

  return {
    author,
    hasDirectAuthor: authorInfo.hasDirectAuthor,
    bodyText: sanitizeSpeechText(parts.text || ""),
    messageId,
    minuteKey,
    speechText,
    timestampMs,
    dedupeKey: messageId
      ? `id:${messageId}`
      : `speech:${normalizeWhitespace(minuteKey)}||${normalizeWhitespace(author)}||${normalizeWhitespace(speechText)}`
  };
}

function refreshHistoricalBoundary(messageElements) {
  let nextCutoffMessageId = historyCutoffMessageId;
  let nextCutoffTimestampMs = historyCutoffTimestampMs;

  for (const messageElement of messageElements) {
    const sortableMessageId = getSortableMessageId(getMessageId(messageElement));
    if (sortableMessageId !== null && (nextCutoffMessageId === null || sortableMessageId > nextCutoffMessageId)) {
      nextCutoffMessageId = sortableMessageId;
    }

    const timestampMs = getMessageTimestampMs(messageElement);
    if (timestampMs > nextCutoffTimestampMs) {
      nextCutoffTimestampMs = timestampMs;
    }
  }

  historyCutoffMessageId = nextCutoffMessageId;
  historyCutoffTimestampMs = nextCutoffTimestampMs;
}

function advanceHistoricalBoundary(parsed) {
  const sortableMessageId = getSortableMessageId(parsed.messageId);
  if (sortableMessageId !== null && (historyCutoffMessageId === null || sortableMessageId > historyCutoffMessageId)) {
    historyCutoffMessageId = sortableMessageId;
  }

  const timestampMs = Number(parsed.timestampMs || 0);
  if (timestampMs > historyCutoffTimestampMs) {
    historyCutoffTimestampMs = timestampMs;
  }
}

function isHistoricalMessage(parsed) {
  const sortableMessageId = getSortableMessageId(parsed.messageId);
  if (sortableMessageId !== null && historyCutoffMessageId !== null && sortableMessageId <= historyCutoffMessageId) {
    return true;
  }

  if (Date.now() > historyGuardUntil) {
    return false;
  }

  const timestampMs = Number(parsed.timestampMs || 0);
  if (timestampMs > 0 && historyCutoffTimestampMs > 0 && timestampMs <= historyCutoffTimestampMs) {
    return true;
  }

  return !parsed.messageId && !timestampMs;
}

function handleMessageElement(messageElement) {
  if (!settings.enabled || isHydrating) {
    return;
  }

  const messageId = getMessageId(messageElement);
  if (!messageId || seenMessages.has(messageId)) {
    return;
  }

  const parsed = parseMessage(messageElement);
  seenMessages.add(messageId);

  if (!parsed.hasDirectAuthor && hasRecentSameText(parsed)) {
    return;
  }

  if (isHistoricalMessage(parsed)) {
    return;
  }

  if (!parsed.speechText || hasRecentSpeech(parsed) || wasRecentlyProcessed(parsed)) {
    return;
  }

  const activeKey = parsed.dedupeKey;
  if (activeMessageKeys.has(activeKey)) {
    return;
  }

  activeMessageKeys.add(activeKey);
  advanceHistoricalBoundary(parsed);
  rememberRecentText(parsed);
  rememberSpeech(parsed);
  rememberLastSpokenAuthor(parsed);
  safeRuntimeSendMessage({
    type: "QUEUE_SPEECH",
    text: parsed.speechText,
    dedupeKey: parsed.dedupeKey
  });
}

function getAllCurrentMessageElements() {
  return Array.from(document.querySelectorAll(MESSAGE_SELECTOR));
}

function markMessagesAsSeen(messageElements) {
  messageElements.forEach((messageElement) => {
    const messageId = getMessageId(messageElement);
    if (messageId) {
      seenMessages.add(messageId);
    }
  });
}

function processRecentMessages() {
  const recentMessages = getAllCurrentMessageElements().slice(-40);
  recentMessages.forEach((messageElement) => handleMessageElement(messageElement));
  activeMessageKeys.clear();
  scheduleAuthorSync();
}

function scheduleMutationProcessing() {
  if (!extensionContextAlive) {
    return;
  }

  window.clearTimeout(mutationTimer);
  mutationTimer = window.setTimeout(() => {
    if (!extensionContextAlive) {
      return;
    }

    processRecentMessages();
  }, MUTATION_SETTLE_MS);
}

function handleMutations(mutations) {
  if (!extensionContextAlive) {
    return;
  }

  let hasMessageRelatedChange = false;

  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (!isElement(node)) {
        return;
      }

      if (node.matches?.(MESSAGE_SELECTOR) || node.closest?.(MESSAGE_SELECTOR) || node.querySelector?.(MESSAGE_SELECTOR)) {
        hasMessageRelatedChange = true;
      }
    });
  }

  if (!hasMessageRelatedChange) {
    return;
  }

  if (isHydrating) {
    const messageElements = getAllCurrentMessageElements();
    refreshHistoricalBoundary(messageElements);
    markMessagesAsSeen(messageElements);
    scheduleAuthorSync();
    return;
  }

  scheduleMutationProcessing();
}

function syncKnownAuthors() {
  if (!extensionContextAlive) {
    return;
  }

  const authors = [];
  const seenAuthors = new Set();

  for (const messageElement of getAllCurrentMessageElements().slice(-MAX_KNOWN_AUTHORS)) {
    const author = getAuthorFromNode(messageElement);
    if (!author || seenAuthors.has(author)) {
      continue;
    }

    seenAuthors.add(author);
    authors.push(author);
  }

  safeStorageLocalSet({ knownAuthors: authors });
}

function scheduleAuthorSync() {
  if (!extensionContextAlive) {
    return;
  }

  window.clearTimeout(authorSyncTimer);
  authorSyncTimer = window.setTimeout(() => {
    if (!extensionContextAlive) {
      return;
    }

    syncKnownAuthors();
  }, 300);
}

function getLatestParsedMessage(forceReplay = false) {
  const messageElements = getAllCurrentMessageElements().reverse();
  for (const messageElement of messageElements) {
    const parsed = parseMessage(messageElement);
    if (!parsed.speechText) {
      continue;
    }

    if (!forceReplay && !parsed.hasDirectAuthor && hasRecentSameText(parsed)) {
      continue;
    }

    if (!forceReplay && hasRecentSpeech(parsed)) {
      continue;
    }

    return parsed;
  }

  return null;
}

function readLatestVisibleMessage(forceReplay = false) {
  if (!extensionContextAlive) {
    return null;
  }

  const parsed = getLatestParsedMessage(forceReplay);
  if (!parsed) {
    return null;
  }

  if (parsed.messageId) {
    seenMessages.add(parsed.messageId);
  }

  advanceHistoricalBoundary(parsed);
  wasRecentlyProcessed(parsed);
  rememberRecentText(parsed);
  rememberSpeech(parsed);
  rememberLastSpokenAuthor(parsed);
  return parsed.speechText;
}

function beginHydration(resetSeen = false) {
  if (!extensionContextAlive) {
    return;
  }

  if (resetSeen) {
    seenMessages.clear();
    lastSpokenAuthor = "";
  }

  isHydrating = true;
  activeMessageKeys.clear();
  recentMessageKeys.clear();
  recentTextKeys.clear();
  window.clearTimeout(hydrationTimer);
  window.clearTimeout(mutationTimer);
  const messageElements = getAllCurrentMessageElements();
  refreshHistoricalBoundary(messageElements);
  historyGuardUntil = Date.now() + HISTORY_GUARD_MS;
  markMessagesAsSeen(messageElements);

  hydrationTimer = window.setTimeout(() => {
    if (!extensionContextAlive) {
      return;
    }

    const currentMessages = getAllCurrentMessageElements();
    refreshHistoricalBoundary(currentMessages);
    markMessagesAsSeen(currentMessages);
    activeMessageKeys.clear();
    isHydrating = false;
  }, HYDRATION_DELAY_MS);
}

async function loadSettings() {
  const response = await safeRuntimeSendMessage({ type: "GET_SETTINGS" });
  if (response?.ok) {
    settings = { ...settings, ...response.settings };
  }
}

function watchUrlChanges() {
  urlWatchTimer = window.setInterval(() => {
    if (!extensionContextAlive) {
      return;
    }

    if (location.href === currentUrl) {
      return;
    }

    currentUrl = location.href;
    window.setTimeout(() => {
      beginHydration(true);
      scheduleAuthorSync();
    }, 1200);
  }, 1000);
}

function startObserver() {
  messageObserver = new MutationObserver(handleMutations);
  messageObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function handleRuntimeMessage(message, sender, sendResponse) {
  if (!extensionContextAlive) {
    return;
  }

  if (message?.type === "READ_LATEST_MESSAGE") {
    const speechText = readLatestVisibleMessage(Boolean(message.forceReplay));
    if (speechText) {
      safeRuntimeSendMessage({ type: "TEST_SPEECH", text: speechText });
      sendResponse({ ok: true, speechText });
    } else {
      sendResponse({ ok: false });
    }
    return;
  }

  if (message?.type === "REFRESH_AUTHORS") {
    syncKnownAuthors();
    sendResponse({ ok: true });
  }
}

async function init() {
  await loadSettings();
  await loadSpokenLog();
  if (!extensionContextAlive) {
    return;
  }

  safeAddRuntimeMessageListener(handleRuntimeMessage);
  safeAddStorageChangeListener((changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }

    for (const [key, change] of Object.entries(changes)) {
      settings[key] = change.newValue;
    }
  });

  startObserver();
  beginHydration(false);
  watchUrlChanges();
  scheduleAuthorSync();
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => {
    init().catch(handleChromeApiError);
  }, { once: true });
} else {
  init().catch(handleChromeApiError);
}
