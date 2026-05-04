// Entry point: Gemini content script

import { geminiAdapter } from "../adapters/gemini";
import { initKeymapController } from "../keymap-controller";

initKeymapController(geminiAdapter);
