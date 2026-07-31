import { useContextKeyService } from './ContextKeyService';

export interface Command {
  id: string;
  title: string;
  execute: (...args: any[]) => void | Promise<void>;
  when?: string; // Context condition required to execute or enable this command
}

class CommandRegistryClass {
  private commands = new Map<string, Command>();

  /**
   * Register a new command in the registry.
   */
  registerCommand(command: Command) {
    if (this.commands.has(command.id)) {
      console.warn(`[CommandRegistry] Command ${command.id} is being overwritten.`);
    }
    this.commands.set(command.id, command);
  }

  /**
   * Execute a command by its ID.
   */
  async executeCommand(id: string, ...args: any[]) {
    const command = this.commands.get(id);
    if (!command) {
      console.error(`[CommandRegistry] Command ${id} not found.`);
      return;
    }

    // Evaluate context condition if it exists
    if (command.when) {
      const isEnabled = useContextKeyService.getState().evaluate(command.when);
      if (!isEnabled) {
        console.warn(`[CommandRegistry] Command ${id} cannot be executed because its 'when' clause (${command.when}) evaluated to false.`);
        return;
      }
    }

    try {
      await command.execute(...args);
    } catch (error) {
      console.error(`[CommandRegistry] Error executing command ${id}:`, error);
    }
  }

  /**
   * Check if a command is currently enabled based on its 'when' clause.
   */
  isCommandEnabled(id: string): boolean {
    const command = this.commands.get(id);
    if (!command) return false;
    if (!command.when) return true;
    return useContextKeyService.getState().evaluate(command.when);
  }

  getCommand(id: string): Command | undefined {
    return this.commands.get(id);
  }
}

export const CommandRegistry = new CommandRegistryClass();
