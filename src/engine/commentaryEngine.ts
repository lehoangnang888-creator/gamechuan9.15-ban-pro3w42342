/**
 * AI English Racing Commentary Engine (Bình Luận Viên Đua Xe Thể Thao F1 Tiếng Anh)
 * Tích hợp trực tiếp âm thanh bình luận vào luồng Audio Engine của game và video xuất xưởng.
 * Hỗ trợ đồng bộ cả 10 luồng đua với phụ đề và âm thanh phát thanh viên tiếng Anh chuyên nghiệp.
 */

import { audioEngine } from './audioEngine';
import { commentarySoundManager, CommentaryClipInfo } from './commentarySoundManager';
import { generateDynamicCommentary, speakCommentaryTTS } from './commentaryGenerator';

export interface CommentaryMessage {
  id: string;
  text: string;
  timestamp: number;
  category: 'START' | 'OVERTAKE' | 'NITRO' | 'DRIFT' | 'COLLISION' | 'SLIPSTREAM' | 'FINISH' | 'BATTLE';
  speakerName: string;
  durationMs: number;
}

export type CommentaryListener = (msg: CommentaryMessage | null) => void;

class CommentaryEngine {
  private isEnabled: boolean = true;
  private isMuted: boolean = false;
  private speakerName: string = 'F1 Lead Commentator';
  
  private lastSpokenTime: number = 0;
  private minIntervalSeconds: number = 4.2; // Khoảng nghỉ tự nhiên tránh chồng chéo câu
  private currentMessage: CommentaryMessage | null = null;
  private listeners: Set<CommentaryListener> = new Set();
  
  // Audio ducking callback
  private onDuckingChange?: (isDucking: boolean) => void;

  private currentAudioNode: AudioBufferSourceNode | null = null;
  private currentHtmlAudio: HTMLAudioElement | null = null;

  constructor() {
    try {
      const saved = localStorage.getItem('commentary_enabled');
      if (saved !== null) {
        this.isEnabled = saved === 'true';
      }
    } catch {
      // Ignore
    }
  }

  public subscribe(listener: CommentaryListener): () => void {
    this.listeners.add(listener);
    listener(this.currentMessage);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentMessage));
  }

  public setDuckingCallback(cb: (isDucking: boolean) => void) {
    this.onDuckingChange = cb;
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    try {
      localStorage.setItem('commentary_enabled', String(this.isEnabled));
    } catch {}

    if (!this.isEnabled) {
      this.stop();
    }
    return this.isEnabled;
  }

  public setEnabled(val: boolean) {
    this.isEnabled = val;
    try {
      localStorage.setItem('commentary_enabled', String(this.isEnabled));
    } catch {}
    if (!val) {
      this.stop();
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public getCurrentMessage(): CommentaryMessage | null {
    return this.currentMessage;
  }

  public stop() {
    if (this.currentAudioNode) {
      try {
        this.currentAudioNode.stop();
      } catch {}
      this.currentAudioNode = null;
    }
    if (this.currentHtmlAudio) {
      try {
        this.currentHtmlAudio.pause();
      } catch {}
      this.currentHtmlAudio = null;
    }
    this.currentMessage = null;
    this.notify();
    if (this.onDuckingChange) {
      this.onDuckingChange(false);
    }
    audioEngine.setDucking(false);
  }

  /**
   * Kích hoạt câu bình luận thể thao phong phú theo sự kiện chặng đua
   * Tự động sinh hàng triệu biến thể từ kho thoại tổ hợp
   */
  public triggerEvent(
    category: 'START' | 'OVERTAKE' | 'NITRO' | 'DRIFT' | 'COLLISION' | 'SLIPSTREAM' | 'FINISH' | 'BATTLE',
    customText?: string,
    forced: boolean = false,
    options?: { driverName?: string; speedKmh?: number; seed?: number }
  ) {
    if (!this.isEnabled) return;

    const now = Date.now();
    const timeSinceLast = (now - this.lastSpokenTime) / 1000;

    // Giữ khoảng cách tự nhiên giữa các câu, trừ khi là sự kiện quan trọng ép buộc (như xuất phát/về đích)
    if (!forced && timeSinceLast < this.minIntervalSeconds) {
      return;
    }

    // Map category sang các clip giọng bình luận tiếng Anh
    let soundType: 'START' | 'OVERTAKE' | 'NITRO' | 'DRIFT' | 'BATTLE' | 'FINISH' = 'OVERTAKE';
    if (category === 'START') soundType = 'START';
    else if (category === 'NITRO') soundType = 'NITRO';
    else if (category === 'DRIFT') soundType = 'DRIFT';
    else if (category === 'FINISH') soundType = 'FINISH';
    else if (category === 'BATTLE' || category === 'SLIPSTREAM') soundType = 'BATTLE';
    else soundType = 'OVERTAKE';

    const clip = commentarySoundManager.getRandomClip(soundType, Math.floor(Math.random() * 100));
    
    let text = customText;
    if (!text) {
      const dyn = generateDynamicCommentary({
        category,
        driverName: options?.driverName || clip.driver || 'Cristiano Ronaldo',
        seed: options?.seed || Math.floor(Math.random() * 1000000),
        speedKmh: options?.speedKmh
      });
      text = dyn.text;
    }

    this.playClip(clip, category, text);
  }

  /**
   * Phát giọng bình luận tiếng Anh chuẩn truyền hình trực tiếp vào Web Audio API của game
   */
  private playClip(clip: CommentaryClipInfo, category: CommentaryMessage['category'], text: string) {
    this.lastSpokenTime = Date.now();

    // 1. Cập nhật phụ đề truyền hình (Banner Ticker)
    const durationMs = Math.round(clip.duration * 1000) || 5200;
    const msg: CommentaryMessage = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      timestamp: Date.now(),
      category,
      speakerName: this.speakerName,
      durationMs
    };

    this.currentMessage = msg;
    this.notify();

    // Tự động ẩn phụ đề sau khi phát thanh viên nói xong
    setTimeout(() => {
      if (this.currentMessage?.id === msg.id) {
        this.currentMessage = null;
        this.notify();
      }
    }, durationMs);

    if (this.isMuted) return;

    // 2. Kích hoạt Ducking tiếng động cơ
    if (this.onDuckingChange) {
      this.onDuckingChange(true);
    }
    audioEngine.setDucking(true);

    // 3. Phát trực tiếp qua Web Audio Graph (MasterGain + MediaStreamDestination)
    const decoded = commentarySoundManager.getClip(clip.id);
    if (decoded && decoded.audioBuffer) {
      try {
        if (this.currentAudioNode) {
          try { this.currentAudioNode.stop(); } catch {}
        }
        this.currentAudioNode = audioEngine.playCommentaryBuffer(decoded.audioBuffer, () => {
          if (this.onDuckingChange) this.onDuckingChange(false);
          audioEngine.setDucking(false);
        });
        return;
      } catch (err) {
        console.warn('Lỗi khi phát AudioBuffer qua Web Audio:', err);
      }
    }

    // Dự phòng bằng HTML5 Audio Element nếu AudioBuffer chưa tải xong
    try {
      if (this.currentHtmlAudio) {
        this.currentHtmlAudio.pause();
      }
      const audio = new Audio(clip.path);
      this.currentHtmlAudio = audio;
      audio.volume = 0.95;
      audio.onended = () => {
        if (this.onDuckingChange) this.onDuckingChange(false);
        audioEngine.setDucking(false);
      };
      audio.onerror = () => {
        if (this.onDuckingChange) this.onDuckingChange(false);
        audioEngine.setDucking(false);
      };
      audio.play().catch(() => {
        if (this.onDuckingChange) this.onDuckingChange(false);
        audioEngine.setDucking(false);
      });
    } catch {
      if (this.onDuckingChange) this.onDuckingChange(false);
      audioEngine.setDucking(false);
    }
  }
}

export const commentaryEngine = new CommentaryEngine();
