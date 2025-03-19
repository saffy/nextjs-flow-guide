import type { NextConfig } from "next";
import path from "node:path";
import CopyWebpackPlugin from "copy-webpack-plugin";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Use CopyWebpackPlugin to copy the file to the public directory
    if (!isServer) {
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(
                __dirname,
                "node_modules/@speechmatics/browser-audio-input/dist/pcm-audio-worklet.min.js"
              ),
              to: path.resolve(__dirname, "public/js/[name][ext]"),
            },
          ],
        })
      );
    }

    return config;
  },
};

export default nextConfig;
