class SpeechService {
  private synthesis = window.speechSynthesis;
  private recognition: SpeechRecognition | null = null;

  constructor() {
    // Try both standard and webkit prefixed versions
    const SpeechRecognitionAPI = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US'; // Set language to English
    } else {
      console.warn('Speech recognition is not supported in this browser');
    }
  }

  // Text to Speech
  speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Use a female voice if available
    const voices = this.synthesis.getVoices();
    const femaleVoice = voices.find(voice => voice.name.includes('female') || voice.name.includes('Female'));
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();

    this.synthesis.speak(utterance);
  }

  // Stop speaking
  stop(): void {
    this.synthesis.cancel();
  }

  // Speech to Text
  startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      this.recognition.onstart = () => resolve();
      this.recognition.onerror = (event) => onError?.(event.error);
      this.recognition.onend = () => this.recognition!.abort();
      
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        onResult(transcript, result.isFinal);
      };

      this.recognition.start();
    });
  }

  // Stop listening
  stopListening(): void {
    this.recognition?.stop();
  }

  // Check if speech synthesis is speaking
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  // Check if speech recognition is supported
  isRecognitionSupported(): boolean {
    return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition);
  }
}

export const speechService = new SpeechService();