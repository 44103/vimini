// Site-specific adapter interface for LLM chat UIs

export interface SiteAdapter {
  /** Get the editor element */
  getEditor(): HTMLElement | null;

  /** Get plain text from the editor */
  getEditorText(): string;

  /** Set text content in the editor and notify the site */
  setEditorText(text: string): void;

  /** Click the send button */
  send(): void;

  /** Check if the given element is inside the editor */
  isEditor(target: HTMLElement): boolean;

  /** Collect all navigable message blocks in document order */
  getMessageBlocks(): HTMLElement[];

  /** Extract copyable text from a message block (e.g. strip language label from code blocks) */
  extractText(block: HTMLElement): string;

  /** Whether the block needs special highlight treatment (e.g. code blocks with overflow) */
  isCodeBlock(block: HTMLElement): boolean;
}
