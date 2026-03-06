// ABOUTME: Requests microphone permission via getUserMedia in a popup window
// ABOUTME: Grants permission for the extension origin so the side panel can use the mic

document.getElementById('btn-grant').addEventListener('click', async () => {
  const status = document.getElementById('status');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    status.textContent = 'Microphone access granted! Closing...';
    status.className = 'status pass';
    chrome.runtime.sendMessage({ type: 'MIC_PERMISSION_GRANTED' });
    setTimeout(() => window.close(), 1000);
  } catch (err) {
    status.textContent = `Failed: ${err.message}. Please allow microphone access when prompted.`;
    status.className = 'status fail';
  }
});
