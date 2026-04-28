import type { SiteAdapter } from "../site-adapter";

const EDITOR_SEL = "div.ql-editor[contenteditable='true']";
const SEND_BTN_SEL = "button.send-button";
const RESPONSE_BLOCK_SEL =
  ":scope .markdown > p, :scope .markdown > h3, :scope .markdown > ol, :scope .markdown > ul, :scope .markdown > response-element";

export const geminiAdapter: SiteAdapter = {
  getEditor() {
    return document.querySelector<HTMLElement>(EDITOR_SEL);
  },

  getEditorText() {
    return this.getEditor()?.innerText.trim() ?? "";
  },

  setEditorText(text: string) {
    const editor = this.getEditor();
    if (!editor) return;
    editor.innerHTML = text
      .split("\n")
      .map((line) => `<p>${line || "<br>"}</p>`)
      .join("");
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  },

  send() {
    document.querySelector<HTMLElement>(SEND_BTN_SEL)?.click();
  },

  isEditor(target: HTMLElement) {
    return !!(target.closest(EDITOR_SEL) || target.matches(EDITOR_SEL));
  },

  getMessageBlocks() {
    const result: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>("user-query, model-response").forEach((el) => {
      if (el.tagName === "USER-QUERY") {
        result.push(el);
      } else {
        const blocks = el.querySelectorAll<HTMLElement>(RESPONSE_BLOCK_SEL);
        if (blocks.length > 0) {
          blocks.forEach((b) => result.push(b));
        } else {
          result.push(el);
        }
      }
    });
    return result;
  },

  extractText(block: HTMLElement) {
    if (this.isCodeBlock(block)) {
      const code = block.querySelector<HTMLElement>("code.code-container");
      return (code ?? block).innerText.trim();
    }
    return block.innerText.trim();
  },

  isCodeBlock(block: HTMLElement) {
    return block.tagName === "RESPONSE-ELEMENT";
  },
};
