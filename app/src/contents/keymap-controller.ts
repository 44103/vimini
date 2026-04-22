// Site-agnostic keymap controller with vim-like modal keybindings
// Insert mode: typing in editor (default)
// Normal mode: navigating messages (Esc to enter, i to exit)

import type { SiteAdapter } from "./site-adapter";

const HIGHLIGHT_STYLE = "box-shadow: 0 0 0 3px #4285f4; border-radius: 8px;";
const HIGHLIGHT_STYLE_CODE =
  "box-shadow: 0 0 0 3px #4285f4; border-radius: 8px; position: relative; z-index: 1; display: block; overflow: visible;";

type Mode = "insert" | "normal";

function createModeIndicator(): HTMLElement {
  const el = document.createElement("div");
  el.id = "keymap-mode-indicator";
  el.style.cssText =
    "position:fixed;bottom:16px;right:16px;z-index:2147483647;" +
    "padding:4px 12px;border-radius:4px;font:bold 12px monospace;" +
    "color:#fff;pointer-events:none;transition:opacity .15s,background .15s;";
  document.body.appendChild(el);
  return el;
}

function updateModeIndicator(el: HTMLElement, mode: Mode) {
  el.textContent = `-- ${mode.toUpperCase()} --`;
  el.style.background = mode === "normal" ? "#1a73e8" : "#34a853";
  el.style.opacity = mode === "normal" ? "1" : "0.7";
}

export function initKeymapController(adapter: SiteAdapter) {
  let mode: Mode = "insert";
  let msgIndex = -1;
  const indicator = createModeIndicator();
  updateModeIndicator(indicator, mode);

  function clearHighlight() {
    document.querySelectorAll<HTMLElement>("[data-keymap-highlight]").forEach((el) => {
      el.style.cssText = el.dataset.keymapOrigStyle ?? "";
      el.removeAttribute("data-keymap-highlight");
      el.removeAttribute("data-keymap-orig-style");
    });
  }

  function highlightAndScroll(el: HTMLElement) {
    clearHighlight();
    el.dataset.keymapOrigStyle = el.style.cssText;
    el.style.cssText += adapter.isCodeBlock(el) ? HIGHLIGHT_STYLE_CODE : HIGHLIGHT_STYLE;
    el.setAttribute("data-keymap-highlight", "true");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function enterInsertMode() {
    mode = "insert";
    msgIndex = -1;
    clearHighlight();
    updateModeIndicator(indicator, mode);
    const editor = adapter.getEditor();
    editor?.scrollIntoView({ behavior: "smooth", block: "center" });
    editor?.focus();
  }

  function enterNormalMode() {
    mode = "normal";
    updateModeIndicator(indicator, mode);
    adapter.getEditor()?.blur();
  }

  function moveCursorToEnd() {
    const sel = window.getSelection();
    const editor = adapter.getEditor();
    if (sel && editor) {
      sel.selectAllChildren(editor);
      sel.collapseToEnd();
    }
  }

  function handleInsertMode(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (!adapter.isEditor(target)) return;

    // Esc -> normal mode
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      enterNormalMode();
      return;
    }

    // Ctrl+Enter -> send
    if (e.key === "Enter" && e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      adapter.send();
      return;
    }

    // Enter (plain) -> newline
    if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      document.execCommand("insertLineBreak");
    }
  }

  function handleNormalMode(e: KeyboardEvent) {
    // Ignore if user is typing in some other input
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
    if (target.getAttribute("contenteditable") === "true") {
      // If they somehow focused the editor, treat Esc specially but let other keys pass
      if (e.key !== "Escape") return;
    }

    const msgs = adapter.getMessageBlocks();

    switch (e.key) {
      // i -> insert mode
      case "i": {
        e.preventDefault();
        e.stopPropagation();
        enterInsertMode();
        return;
      }

      // j -> down (newer)
      case "j": {
        e.preventDefault();
        e.stopPropagation();
        if (msgs.length === 0) return;
        if (msgIndex < msgs.length - 1) {
          msgIndex++;
          highlightAndScroll(msgs[msgIndex]);
        } else {
          enterInsertMode();
        }
        return;
      }

      // k -> up (older)
      case "k": {
        e.preventDefault();
        e.stopPropagation();
        if (msgs.length === 0) return;
        if (msgIndex === -1) {
          msgIndex = msgs.length - 1;
        } else if (msgIndex > 0) {
          msgIndex--;
        }
        highlightAndScroll(msgs[msgIndex]);
        return;
      }

      // G -> jump to last message
      case "G": {
        e.preventDefault();
        e.stopPropagation();
        if (msgs.length === 0) return;
        msgIndex = msgs.length - 1;
        highlightAndScroll(msgs[msgIndex]);
        return;
      }

      // g -> wait for second g (gg = jump to first)
      case "g": {
        e.preventDefault();
        e.stopPropagation();
        const onSecondKey = (e2: KeyboardEvent) => {
          document.removeEventListener("keydown", onSecondKey, true);
          if (e2.key === "g" && msgs.length > 0) {
            e2.preventDefault();
            e2.stopPropagation();
            msgIndex = 0;
            highlightAndScroll(msgs[0]);
          }
        };
        document.addEventListener("keydown", onSecondKey, true);
        return;
      }

      // y -> copy
      case "y": {
        e.preventDefault();
        e.stopPropagation();
        if (msgIndex === -1 || !msgs[msgIndex]) return;
        navigator.clipboard.writeText(adapter.extractText(msgs[msgIndex]));
        return;
      }

      // r -> quote into editor
      case "r": {
        e.preventDefault();
        e.stopPropagation();
        if (msgIndex === -1 || !msgs[msgIndex]) return;
        const text = adapter.extractText(msgs[msgIndex]);
        const quoted = text.split("\n").map((l) => `> ${l}`).join("\n");
        const current = adapter.getEditorText();
        const prefix = current ? current + "\n\n" : "";
        adapter.setEditorText(prefix + quoted + "\n\n");
        enterInsertMode();
        moveCursorToEnd();
        return;
      }

      // Escape -> back to insert mode
      case "Escape": {
        e.preventDefault();
        e.stopPropagation();
        enterInsertMode();
        return;
      }
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (mode === "insert") {
      handleInsertMode(e);
    } else {
      handleNormalMode(e);
    }
  }

  document.addEventListener("keydown", handleKeydown, true);

  document.addEventListener("focusin", (e) => {
    if (mode === "normal" && adapter.isEditor(e.target as HTMLElement)) {
      enterInsertMode();
    }
  }, true);
}
