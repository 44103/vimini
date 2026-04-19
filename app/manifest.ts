import type { ManifestV3Export } from '@crxjs/vite-plugin';
import packageJson from "./package.json";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "Chrome extension",
  version: packageJson.version,
  action: { default_popup: "src/popup/index.html" },
};

export default manifest;
