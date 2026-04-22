import type { ManifestV3Export } from '@crxjs/vite-plugin';
import packageJson from "./package.json";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "Vimini",
  version: packageJson.version,
  description: "Vim-like keybindings for Gemini",
  action: { default_popup: "src/popup/index.html" },
  content_scripts: [
    {
      matches: ["https://gemini.google.com/*"],
      js: ["src/contents/entries/gemini.ts"],
      run_at: "document_idle",
    },
  ],
};

export default manifest;
