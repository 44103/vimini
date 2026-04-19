// Gemini: Enterで送信を抑制し、Ctrl+Enterで送信する

function handleKeydown(e: KeyboardEvent) {
  // Ctrl+Enter → 通常のEnterとして送信をトリガー
  if (e.key === "Enter" && e.ctrlKey && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();

    // 送信ボタンをクリック
    const sendButton = document.querySelector<HTMLElement>(
      'button.send-button, button[aria-label="Send message"], button[data-tooltip="Send message"], .send-button-container button'
    );
    if (sendButton) {
      sendButton.click();
      return;
    }

    // フォールバック: 素のEnterイベントを再発火
    const target = e.target as HTMLElement;
    target.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        code: "Enter",
        bubbles: true,
        cancelable: true,
      })
    );
    return;
  }

  // 素のEnter（Shift/Ctrl/Meta なし）→ 送信を抑制し改行を挿入
  if (e.key === "Enter" && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
    const target = e.target as HTMLElement;
    const isInput =
      target.tagName === "TEXTAREA" ||
      target.getAttribute("contenteditable") === "true" ||
      target.closest('[contenteditable="true"]') ||
      target.closest(".ql-editor") ||
      target.closest(".text-input-field");

    if (isInput) {
      e.preventDefault();
      e.stopPropagation();
      // 改行を挿入
      document.execCommand("insertLineBreak");
    }
  }
}

// capturing フェーズで最優先にインターセプト
document.addEventListener("keydown", handleKeydown, true);

export {};
