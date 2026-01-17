
import { GoogleGenAI, LiveServerMessage, Modality, Blob, Type, FunctionDeclaration } from '@google/genai';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const DESKTOP_TOOLS: FunctionDeclaration[] = [
  {
    name: 'open_website',
    description: 'Opens a specific URL in the system browser.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        url: { type: Type.STRING, description: 'The full URL to open' },
        reason: { type: Type.STRING, description: 'Why this is being opened' }
      },
      required: ['url']
    }
  },
  {
    name: 'read_emails',
    description: 'Accesses the system email client to read recent messages.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        folder: { type: Type.STRING, description: 'Folder to read, e.g., Inbox, Sent' },
        limit: { type: Type.NUMBER, description: 'How many emails to fetch' }
      }
    }
  },
  {
    name: 'send_email',
    description: 'Drafts and sends an email via the system mail agent.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        to: { type: Type.STRING, description: 'Recipient email address' },
        subject: { type: Type.STRING, description: 'Email subject line' },
        body: { type: Type.STRING, description: 'The content of the email' }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'write_code_file',
    description: 'Creates a new file in the local workspace and writes code into it.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filename: { type: Type.STRING, description: 'Name of the file' },
        language: { type: Type.STRING, description: 'Programming language' },
        code: { type: Type.STRING, description: 'The actual code content' }
      },
      required: ['filename', 'language', 'code']
    }
  },
  {
    name: 'read_file_content',
    description: 'Reads the text content of a local file to answer questions about it.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filepath: { type: Type.STRING, description: 'Path or name of the file to read' }
      },
      required: ['filepath']
    }
  },
  {
    name: 'scan_system_security',
    description: 'Performs a live virus and security threat detection scan on the system.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        deep_scan: { type: Type.BOOLEAN, description: 'Whether to perform an exhaustive deep scan' }
      }
    }
  },
  {
    name: 'control_app',
    description: 'Launches or focuses a desktop application.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        app_name: { type: Type.STRING, description: 'Name of the application, e.g., Outlook, VS Code, Chrome' },
        action: { type: Type.STRING, description: 'Action to perform: launch, focus, or close' }
      },
      required: ['app_name', 'action']
    }
  }
];

export class LiveAssistantSession {
  private sessionPromise: Promise<any> | null = null;
  private nextStartTime = 0;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private sources = new Set<AudioBufferSourceNode>();
  private stream: MediaStream | null = null;
  private onTranscription: (text: string, isUser: boolean, isFinal: boolean) => void;
  private onStateChange: (active: boolean) => void;
  private onToolCall: (id: string, name: string, args: any) => Promise<any>;
  private onError: (msg: string) => void;

  constructor(
    onTranscription: (text: string, isUser: boolean, isFinal: boolean) => void,
    onStateChange: (active: boolean) => void,
    onToolCall: (id: string, name: string, args: any) => Promise<any>,
    onError: (msg: string) => void
  ) {
    this.onTranscription = onTranscription;
    this.onStateChange = onStateChange;
    this.onToolCall = onToolCall;
    this.onError = onError;
  }

  async start() {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error('API Key is missing. Ensure the environment is correctly configured.');
      }

      // Initialize fresh instance strictly before use
      const ai = new GoogleGenAI({ apiKey });
      
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        throw new Error('Microphone access denied. Please allow microphone permissions.');
      }

      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.log('Sylvie Link Established.');
            this.onStateChange(true);
            this.setupMicrophoneStream();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Calls
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                const result = await this.onToolCall(fc.id, fc.name, fc.args);
                this.sessionPromise?.then(session => {
                  session.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: result || 'Processed.' } }
                  });
                });
              }
            }

            // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
              this.onTranscription(message.serverContent.outputTranscription.text, false, !!message.serverContent.turnComplete);
            } else if (message.serverContent?.inputTranscription) {
              this.onTranscription(message.serverContent.inputTranscription.text, true, !!message.serverContent.turnComplete);
            }

            // Handle Audio Playback
            if (message.serverContent?.interrupted) {
              for (const source of this.sources.values()) {
                try { source.stop(); } catch(e) {}
              }
              this.sources.clear();
              this.nextStartTime = 0;
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && this.outputAudioContext) {
              this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.outputAudioContext.destination);
              source.addEventListener('ended', () => this.sources.delete(source));
              source.start(this.nextStartTime);
              this.nextStartTime += audioBuffer.duration;
              this.sources.add(source);
            }
          },
          onerror: (e) => {
            console.error('Gemini Live API Error:', e);
            this.onError('Link Error: Potential network interruption.');
            this.stop();
          },
          onclose: () => {
            console.log('Sylvie Link Closed.');
            this.onStateChange(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          tools: [{ functionDeclarations: DESKTOP_TOOLS }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: "You are Sylvie, an elite sovereign system assistant. You have live control over the user's desktop environment. You are sarcastic, highly capable, and witty. You can scan for viruses, read files, draft emails, and interact with applications. When performing an action, clearly describe what you are doing. Always confirm high-stakes actions with the user.",
        },
      });
    } catch (err: any) {
      this.onError(err.message || 'Network link failed to initialize.');
      console.error('Session start failed:', err);
    }
  }

  private setupMicrophoneStream() {
    if (!this.inputAudioContext || !this.stream || !this.sessionPromise) return;
    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
      const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
      // Solely rely on sessionPromise resolves as per guidelines
      this.sessionPromise?.then(session => session.sendRealtimeInput({ media: pcmBlob }));
    };
    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
  }

  async stop() {
    if (this.sessionPromise) {
      try {
        const session = await this.sessionPromise;
        session.close();
      } catch(e) {}
    }
    this.stream?.getTracks().forEach(t => t.stop());
    this.sources.forEach(s => { try { s.stop(); } catch(e) {} });
    this.onStateChange(false);
    this.sessionPromise = null;
  }
}
