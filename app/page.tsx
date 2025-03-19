import { FlowProvider, fetchPersonas } from "@speechmatics/flow-client-react";
import { PCMAudioRecorderProvider } from "@speechmatics/browser-audio-input-react";
import { Controls } from "./components/Controls";

export default async function Home() {
  const personas = await fetchPersonas();

  // Filter out 'Welcome Voice' persona since it's not suitable for the example
  const filteredPersonas = Object.fromEntries(
    Object.entries(personas).filter(
      ([_, agent]) => !agent.name.toLowerCase().includes("welcome voice")
    )
  );

  return (
    // Two context providers:
    // 1. For the audio recorder (see https://github.com/speechmatics/speechmatics-js-sdk/blob/main/packages/browser-audio-input-react/README.md)
    // 2. For the Flow API client (see https://github.com/speechmatics/speechmatics-js-sdk/blob/main/packages/flow-client-react/README.md)
    <PCMAudioRecorderProvider workletScriptURL="/js/pcm-audio-worklet.min.js">
      <FlowProvider
        appId="nextjs-example"
        audioBufferingMs={500}
        websocketBinaryType="arraybuffer" // This is optional, but does lead to better audio performance, particularly on Firefox
      >
        <div className="container p-4 mx-auto max-xl:container">
          <h1 className="text-2xl font-bold mb-4">
            Speechmatics ❤️ NextJS Flow Example
          </h1>
          <Controls personas={filteredPersonas} />
        </div>
      </FlowProvider>
    </PCMAudioRecorderProvider>
  );
}
