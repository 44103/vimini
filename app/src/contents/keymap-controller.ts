// Site-agnostic keymap controller for LLM chat UIs

import type { SiteAdapter } from "./site-adapter";

const HIGHLIGHT_STYLE = "box-shadow: 0 0 0 3px #4285f4; border-radius: 8px;";
const HIGHLIGHT_STYLE_CODE =
  "box-shadow: 0 0 0 3px #4285f4; border-radius: 8px; position: relative; z-index: 1; display: block; overflow: visible;";

export function initKeymapController(adapter: SiteAdapter) {
  let msgIndex = -1;

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

  function focusEditor() {
    clearHighlight();
    const editor = adapter.getEditor();
    editor?.scrollIntoView({ behavior: "smooth", block: "center" });
    editor?.focus();
  }

  function moveCursorToEnd() {
    const sel = window.getSelection();
    const editor = adapter.getEditor();
    if (sel && editor) {
      sel.selectAllChildren(editor);
      sel.collapseToEnd();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const inEditor = adapter.isEditor(target);

    // Ctrl+Enter -> send
    if (e.key === "Enter" && e.ctrlKey && !e.shiftKey) {
      if (!inEditor) return;
      e.preventDefault();
      e.stopPropagation();
      adapter.send();
      msgIndex = -1;
      return;
    }

    // Enter (plain) -> insert newline
    if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      if (!inEditor) return;
      e.preventDefault();
      e.stopPropagation();
      document.execCommand("insertLineBreak");
      return;
    }

    // Alt+k: navigate up / Alt+j: navigate down
    if ((e.key === "k" || e.key === "j") && e.altKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();

      const msgs = adapter.getMessageBlocks();
      if (msgs.length === 0) return;

      if (e.key === "k") {
        if (msgIndex === -1) {
          msgIndex = msgs.length - 1;
        } else if (msgIndex > 0) {
          msgIndex--;
        }
        highlightAndScroll(msgs[msgIndex]);
      } else {
        if (msgIndex === -1) return;
        if (msgIndex < msgs.length - 1) {
          msgIndex++;
          highlightAndScroll(msgs[msgIndex]);
        } else {
          msgIndex = -1;
          focusEditor();
        }
      }
      return;
    }

    // Alt+y -> copy focused message text to clipboard
    if (e.key === "y" && e.altKey && !e.ctrlKey && !e.shiftKey && msgIndex !== -1) {
      e.preventDefault();
      e.stopPropagation();
      const el = adapter.getMessageBlocks()[msgIndex];
      if (el) navigator.clipboard.writeText(adapter.extractText(el));
      return;
    }

    // Alt+r -> quote focused message into editor
    if (e.key === "r" && e.altKey && !e.ctrlKey && !e.shiftKey && msgIndex !== -1) {
      e.preventDefault();
      e.stopPropagation();
      const el = adapter.getMessageBlocks()[msgIndex];
      if (el) {
        const text = adapter.extractText(el);
        const quoted = text.split("\n").map((l) => `> ${l}`).join("\n");
        const current = adapter.getEditorText();
        const prefix = current ? current + "\n\n" : "";
        adapter.setEditorText(prefix + quoted + "\n\n");
        msgIndex = -1;
        focusEditor();
        moveCursorToEnd();
      }
      return;
    }

    // Escape -> return to editor
    if (e.key === "Escape" && msgIndex !== -1) {
      e.preventDefault();
      e.stopPropagation();
      msgIndex = -1;
      focusEditor();
    }
  }

  document.addEventListener("keydown", handleKeydown, true);
}
