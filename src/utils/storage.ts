import { SavedItem } from '../types';

const STORAGE_KEY = 'edugenie_notebook_v1';

export function getSavedItems(): SavedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load saved items from localStorage', e);
    return [];
  }
}

export function saveItemToNotebook(item: Omit<SavedItem, 'id' | 'date'>): SavedItem {
  const current = getSavedItems();
  const newItem: SavedItem = {
    ...item,
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    date: new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
  const updated = [newItem, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
  return newItem;
}

export function deleteSavedItem(id: string): SavedItem[] {
  const current = getSavedItems();
  const filtered = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete item from localStorage', e);
  }
  return filtered;
}

export function downloadAsFile(filename: string, content: string, contentType: string = 'text/markdown') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Speech synthesis helper for accessibility & audio learning
export function speakText(text: string, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) {
    return null;
  }
  window.speechSynthesis.cancel(); // Stop current speech
  // Clean markdown tags for natural speech
  const cleaned = text
    .replace(/[#*`_~]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .slice(0, 1000); // speak up to 1000 chars for smooth playback

  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
