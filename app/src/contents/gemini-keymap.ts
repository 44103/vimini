// Gemini keymap: Enter=newline, Ctrl+Enter=send, Alt+k/j=navigate messages

const EDITOR_SEL = "div.ql-editor[contenteditable='true']";
const SEND_BTN_SEL = "button.send-button";

// --- Message navigation ---
let msgIndex = -1; // -1 = editor (default position)

const HIGHLIGHT_STYLE = "box-shadow: 0 0 0 3px #4285f4; border-radius: 8px;";
const HIGHLIGHT_STYLE_CODE = "box-shadow: 0 0 0 3px #4285f4; border-radius: 8px; position: relative; z-index: 1; display: block; overflow: visible;";

// user-query stays as one block; model-response is split into individual block elements
const RESPONSE_BLOCK_SEL = ":scope .markdown > p, :scope .markdown > h3, :scope .markdown > ol, :scope .markdown > ul, :scope .markdown > response-element";

function getMessages(): HTMLElement[] {
  const result: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>("user-query, model-response").forEach((el) => {
    if (el.tagName === "USER-QUERY") {
      result.push(el);
    } else {
      const blocks = el.querySelectorAll<HTMLElement>(RESPONSE_BLOCK_SEL);
      if (blocks.length > 0) {
        blocks.forEach((b) => result.push(b));
      } else {
        result.push(el); // fallback
      }
    }
  });
  return result;
}

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
  const isCode = el.tagName === "RESPONSE-ELEMENT";
  el.style.cssText += isCode ? HIGHLIGHT_STYLE_CODE : HIGHLIGHT_STYLE;
  el.setAttribute("data-keymap-highlight", "true");
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function focusEditor() {
  clearHighlight();
  const editor = document.querySelector<HTMLElement>(EDITOR_SEL);
  editor?.scrollIntoView({ behavior: "smooth", block: "center" });
  editor?.focus();
}

// --- Key handler ---
function handleKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  const inEditor = target.closest(EDITOR_SEL) || target.matches(EDITOR_SEL);

  // Ctrl+Enter -> send
  if (e.key === "Enter" && e.ctrlKey && !e.shiftKey) {
    if (!inEditor) return;
    e.preventDefault();
    e.stopPropagation();
    document.querySelector<HTMLElement>(SEND_BTN_SEL)?.click();
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

  // Alt+k: navigate up (older) / Alt+j: navigate down (newer)
  if ((e.key === "k" || e.key === "j") && e.altKey && !e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();

    const msgs = getMessages();
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
        // Past the last message -> return to editor
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
    const msgs = getMessages();
    const el = msgs[msgIndex];
    if (el) {
      const code = el.tagName === "RESPONSE-ELEMENT"
        ? el.querySelector<HTMLElement>("code.code-container")
        : null;
      navigator.clipboard.writeText((code ?? el).innerText.trim());
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

export {};
