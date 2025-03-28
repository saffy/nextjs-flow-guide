"use client";
import { useCallback, useState } from "react";
import {
  type AgentAudioEvent,
  useFlow,
  useFlowEventListener,
} from "@speechmatics/flow-client-react";
import { getJWT } from "@/app/actions";
import {
  usePCMAudioListener,
  usePCMAudioRecorder,
} from "@speechmatics/browser-audio-input-react";
import { usePCMAudioPlayer } from "@speechmatics/web-pcm-player-react";

const RECORDING_SAMPLE_RATE = 16_000;

// Hook to set up two way audio between the browser and Flow
export function useFlowWithBrowserAudio() {
  const { startConversation, endConversation, sendAudio } = useFlow();
  const { startRecording, stopRecording } = usePCMAudioRecorder();
  const [audioContext, setAudioContext] = useState<AudioContext>();

  // Normally we would be able to use the same audio context for playback and recording,
  // but there is a bug in Firefox which prevents capturing microphone audio at 16,000 Hz.
  // So in Firefox, we need to use a separate audio context for playback.
  const [playbackAudioContext, setPlaybackAudioContext] =
    useState<AudioContext>();

  const { playAudio } = usePCMAudioPlayer(playbackAudioContext);

  // Send audio to Flow when we receive it from the active input device
  usePCMAudioListener((audio: Float32Array) => {
    sendAudio(audio.buffer);
  });

  // Play back audio when we receive it from flow
  useFlowEventListener(
    "agentAudio",
    useCallback(
      ({ data }: AgentAudioEvent) => {
        playAudio(data);
      },
      [playAudio]
    )
  );

  const startSession = useCallback(
    async ({
      personaId,
      deviceId,
    }: {
      personaId: string;
      deviceId: string;
    }) => {
      const jwt = await getJWT("flow");

      const isFirefox = navigator.userAgent.includes("Firefox");
      const audioContext = new AudioContext({
        sampleRate: isFirefox ? undefined : RECORDING_SAMPLE_RATE,
      });
      setAudioContext(audioContext);

      const playbackAudioContext = isFirefox
        ? new AudioContext({ sampleRate: 16_000 })
        : audioContext;
      setPlaybackAudioContext(playbackAudioContext);

      await startConversation(jwt, {
        config: {
          template_id: personaId,
          template_variables: {
            // We can set up any template variables here
          },
        },
        audioFormat: {
          type: "raw",
          encoding: "pcm_f32le",
          sample_rate: audioContext.sampleRate,
        },
      });

      await startRecording({
        deviceId,
        audioContext,
      });
    },
    [startConversation, startRecording]
  );

  const closeAudioContext = useCallback(() => {
    if (audioContext?.state !== "closed") {
      audioContext?.close();
    }
    setAudioContext(undefined);
    if (playbackAudioContext?.state !== "closed") {
      playbackAudioContext?.close();
    }
    setPlaybackAudioContext(undefined);
  }, [audioContext, playbackAudioContext]);

  const stopSession = useCallback(async () => {
    endConversation();
    stopRecording();
    closeAudioContext();
  }, [endConversation, stopRecording, closeAudioContext]);

  return { startSession, stopSession };
}
