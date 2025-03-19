"use client";
import { type FormEventHandler, useCallback, useMemo } from "react";
import { MicrophoneSelect, Select } from "./MicrophoneSelect";
import { useFlow } from "@speechmatics/flow-client-react";
import { useFlowWithBrowserAudio } from "../hooks/useFlowWithBrowserAudio";

export function Controls({
  personas,
}: {
  personas: Record<string, { name: string }>;
}) {
  const { socketState, sessionId } = useFlow();
  const { startSession, stopSession } = useFlowWithBrowserAudio();
  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const personaId = formData.get("personaId")?.toString();
      if (!personaId) throw new Error("No persona selected!");
      const deviceId = formData.get("deviceId")?.toString();
      if (!deviceId) throw new Error("No device selected!");

      startSession({ personaId, deviceId });
    },
    [startSession]
  );

  const conversationButton = useMemo(() => {
    if (socketState === "open" && sessionId) {
      return (
        <button
          type="button"
          className="flex-1 btn btn-primary text-md"
          onClick={stopSession}
        >
          End conversation
        </button>
      );
    }
    if (
      socketState === "connecting" ||
      socketState === "closing" ||
      (socketState === "open" && !sessionId)
    ) {
      return (
        <button
          type="button"
          className="flex-1 btn btn-primary text-md"
          disabled
        >
          <span className="loading loading-spinner" />
        </button>
      );
    }
    return (
      <button type="submit" className="flex-1 btn btn-primary text-md">
        Start conversation
      </button>
    );
  }, [socketState, sessionId, stopSession]);

  return (
    <form onSubmit={handleSubmit}>
      <MicrophoneSelect />
      <Select label="Select a persona" name="personaId">
        {Object.entries(personas).map(([id, persona]) => (
          <option key={id} value={id} label={persona.name} />
        ))}
      </Select>
      <div>{conversationButton}</div>
    </form>
  );
}