/**
 * Command Pattern Implementation
 * Enables undo/redo functionality for state mutations
 */

import type { Command, CommandType } from '@workspace/shared-types';
import { generateCommandId } from '@workspace/shared-utils';

export abstract class BaseCommand implements Command {
  id: string;
  type: CommandType;
  timestamp: number;
  authorId: string;

  constructor(type: CommandType, authorId: string) {
    this.id = generateCommandId();
    this.type = type;
    this.authorId = authorId;
    this.timestamp = Date.now();
  }

  abstract execute(): void;
  abstract undo(): void;
  
  redo(): void {
    this.execute();
  }
}

/**
 * Command History Manager
 * Maintains undo/redo stacks with size limits
 */
export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxSize: number;
  private lastCheckpoint: number = Date.now();

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Execute a command and add to history
   */
  execute(command: Command): void {
    command.execute();
    
    this.undoStack.push(command);
    this.redoStack = []; // Clear redo stack on new action
    
    // Trim history if needed
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo the last command
   */
  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;

    command.undo();
    this.redoStack.push(command);
    return true;
  }

  /**
   * Redo the last undone command
   */
  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;

    command.redo();
    this.undoStack.push(command);
    return true;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Create a checkpoint (for periodic state snapshots)
   */
  checkpoint(): void {
    this.lastCheckpoint = Date.now();
    // In full implementation, save full state snapshot
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Get history size
   */
  getSize(): { undo: number; redo: number } {
    return {
      undo: this.undoStack.length,
      redo: this.redoStack.length,
    };
  }
}
