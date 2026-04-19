import type { ManifestV3Export } from '@crxjs/vite-plugin';
import packageJson from "./package.json";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "LLM Chat Keymap",
  version: packageJson.version,
  description: "Ctrl+Enterで送信、Enterで改行に変更",
  action: { default_popup: "src/popup/index.html" },
  content_scripts: [
    {
      matches: ["https://gemini.google.com/*"],
      js: ["src/contents/gemini-keymap.ts"],
      run_at: "document_idle",
    },
  ],
};

export default manifest;
