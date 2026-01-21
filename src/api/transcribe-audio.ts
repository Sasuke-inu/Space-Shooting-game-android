/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom audio transcription service that proxies requests through the backend.
This prevents API keys from being exposed in the client-side bundle.
*/

import { API_ENDPOINTS } from '../config/api';

/**
 * Transcribe an audio file
 * @param localAudioUri - The local URI of the audio file to transcribe. Obtained via the expo-av library.
 * @returns The text of the audio file
 */
export const transcribeAudio = async (localAudioUri: string) => {
  try {
    // Create FormData for the audio file
    const formData = new FormData();
    formData.append("file", {
      uri: localAudioUri,
      type: "audio/m4a",
      name: "recording.m4a",
    } as any);

    // API call to backend proxy
    const response = await fetch(API_ENDPOINTS.openai.transcribe, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription failed: ${errorText}`);
    }

    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
};
