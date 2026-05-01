let currentAudio = null;
let currentObjectUrl = "";

function clearCurrentAudio() {
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

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "STOP_OFFSCREEN_AUDIO") {
    clearCurrentAudio();
    sendResponse({ ok: true });
    return;
  }

  if (message?.type === "PLAY_OFFSCREEN_AUDIO") {
    clearCurrentAudio();
    const bytes = base64ToBytes(message.audioBase64 || "");
    const blob = new Blob([bytes], { type: message.mimeType || "audio/wav" });
    currentObjectUrl = URL.createObjectURL(blob);
    currentAudio = new Audio(currentObjectUrl);
    currentAudio.addEventListener("ended", () => {
      clearCurrentAudio();
      chrome.runtime.sendMessage({ type: "OFFSCREEN_AUDIO_ENDED" });
    });
    currentAudio.addEventListener("error", () => {
      clearCurrentAudio();
      chrome.runtime.sendMessage({ type: "OFFSCREEN_AUDIO_ERROR" });
    });
    currentAudio.play().catch(() => {
      clearCurrentAudio();
      chrome.runtime.sendMessage({ type: "OFFSCREEN_AUDIO_ERROR" });
    });
    sendResponse({ ok: true });
  }
});
