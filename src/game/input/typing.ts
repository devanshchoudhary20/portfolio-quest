// a text field owns its key presses: typing "x" must not close a panel or run, and Enter submits the form
export const isTyping = (event: KeyboardEvent) => event.target instanceof HTMLElement && event.target.closest('input, textarea') !== null;
