import { TextToSpeechClient } from "@google-cloud/text-to-speech";
type ISynthesizeSpeechRequest = any;

const client = new TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export interface TtsOptions {
  text: string;
  languageCode?: string;
  voiceName?: string;
}

export async function synthesizeSpeech(options: TtsOptions): Promise<Buffer> {
  const {
    text,
    languageCode = "en-US",
    voiceName = "en-US-Neural2-C",
  } = options;

  const request: ISynthesizeSpeechRequest = {
    input: { text },
    voice: {
      languageCode,
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: "MP3" as any,
      pitch: 0,
      speakingRate: 1,
    },
  };

  const [response] = await client.synthesizeSpeech(request);
  const audioContent = response.audioContent;

  if (!audioContent) {
    throw new Error("No audio content returned from TTS service");
  }

  return Buffer.from(audioContent as string, "binary");
}

export async function getAvailableVoices(languageCode: string = "en-US") {
  const [result] = await client.listVoices({ languageCode });
  return result.voices || [];
}
