import { CommandRegistry } from './CommandRegistry';

export interface Keybinding {
  commandId: string;
  key: string; // e.g., 'Ctrl+S', 'Alt+Shift+F', 'Cmd+Shift+P'
  when?: string; // Optional context condition specific to this keybinding
}

class KeybindingManagerClass {
  private keybindings: Keybinding[] = [];

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Start listening to global keyboard events
   */
  start() {
    document.addEventListener('keydown', this.handleKeyDown, true);
  }

  /**
   * Stop listening to global keyboard events
   */
  stop() {
    document.removeEventListener('keydown', this.handleKeyDown, true);
  }

  register(keybinding: Keybinding) {
    this.keybindings.push(keybinding);
  }

  getCommandKeybinding(commandId: string): string | undefined {
    // Return the first matching keybinding for display in menus
    const binding = this.keybindings.find(k => k.commandId === commandId);
    return binding?.key;
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Ignore keydown events inside input fields unless they are specific shortcuts
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      // Allow some specific IDE shortcuts to pass through, but generally return
      // (Monaco handles its own shortcuts, but we might want global overrides here)
      // For now, we let it pass, as Monaco is a textarea and we DO want global shortcuts to work inside it.
    }

    const keyStr = this.eventToKeyString(event);
    if (!keyStr) return;

    // Find a matching keybinding
    const matchingBindings = this.keybindings.filter(k => k.key === keyStr);
    
    for (const binding of matchingBindings) {
      // Check if command is enabled before executing
      if (CommandRegistry.isCommandEnabled(binding.commandId)) {
        event.preventDefault();
        event.stopPropagation();
        CommandRegistry.executeCommand(binding.commandId);
        break;
      }
    }
  }

  private eventToKeyString(event: KeyboardEvent): string | null {
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
      return null; // Just a modifier key press
    }

    const isMac = navigator.userAgent.includes('Mac');
    const modifiers = [];

    if (event.ctrlKey) {
      modifiers.push(isMac ? 'Ctrl' : 'Ctrl'); // On Mac, Ctrl is Ctrl. Meta is Cmd.
    }
    if (event.metaKey) {
      modifiers.push(isMac ? 'Cmd' : 'Win');
    }
    if (event.altKey) {
      modifiers.push('Alt');
    }
    if (event.shiftKey) {
      modifiers.push('Shift');
    }

    let key = event.key;
    // Normalize letters to uppercase for consistency in binding strings (e.g., 'Ctrl+S' not 'Ctrl+s')
    if (key.length === 1) {
      key = key.toUpperCase();
    } else if (key === 'Escape') {
      key = 'Esc';
    }

    return [...modifiers, key].join('+');
  }
}

export const KeybindingManager = new KeybindingManagerClass();
