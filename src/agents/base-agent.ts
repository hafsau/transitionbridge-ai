/**
 * Base Agent Class for TransitionBridge AI
 * Provides common functionality for all A2A agents
 */

import {
  AgentCard,
  AgentSkill,
  Task,
  TaskStatus,
  Message,
  Part,
  TextPart,
  DataPart,
  Artifact,
  TransitionContext
} from '../types/a2a.js';

export abstract class BaseAgent {
  protected card: AgentCard;
  protected tasks: Map<string, Task> = new Map();

  constructor(card: AgentCard) {
    this.card = card;
  }

  // Get the agent's card
  getCard(): AgentCard {
    return this.card;
  }

  // Create a new task
  protected createTask(sessionId: string, initialMessage: Message): Task {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task: Task = {
      id: taskId,
      sessionId,
      status: { state: 'submitted' },
      history: [initialMessage],
      artifacts: []
    };
    this.tasks.set(taskId, task);
    return task;
  }

  // Update task status
  protected updateTaskStatus(taskId: string, status: TaskStatus): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
    }
  }

  // Add message to task history
  protected addMessage(taskId: string, message: Message): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.history.push(message);
    }
  }

  // Add artifact to task
  protected addArtifact(taskId: string, artifact: Artifact): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.artifacts = task.artifacts || [];
      task.artifacts.push(artifact);
    }
  }

  // Create a text part
  protected textPart(text: string): TextPart {
    return { type: 'text', text };
  }

  // Create a data part
  protected dataPart(mimeType: string, data: Record<string, unknown>): DataPart {
    return { type: 'data', mimeType, data };
  }

  // Create an agent message
  protected createAgentMessage(parts: Part[]): Message {
    return {
      role: 'agent',
      parts,
      timestamp: new Date().toISOString()
    };
  }

  // Get task by ID
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  // Abstract method to process a task - must be implemented by each agent
  abstract processTask(
    message: Message,
    context: TransitionContext
  ): Promise<{ task: Task; updatedContext: TransitionContext }>;

  // Abstract method to check if agent can handle a request
  abstract canHandle(context: TransitionContext): boolean;
}

// Helper to generate unique IDs
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
