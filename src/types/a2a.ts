/**
 * A2A (Agent-to-Agent) Protocol Types for TransitionBridge AI
 * Based on Google's A2A specification for agent interoperability
 */

// Agent Card - describes an agent's capabilities
export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  capabilities: AgentCapability[];
  skills: AgentSkill[];
  defaultInputModes: string[];
  defaultOutputModes: string[];
}

export interface AgentCapability {
  streaming?: boolean;
  pushNotifications?: boolean;
  stateTransitionHistory?: boolean;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  tags: string[];
  examples?: string[];
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

// Task - A unit of work for an agent
export interface Task {
  id: string;
  sessionId: string;
  status: TaskStatus;
  history: Message[];
  artifacts?: Artifact[];
  metadata?: Record<string, unknown>;
}

export type TaskStatus =
  | { state: 'submitted' }
  | { state: 'working'; message?: string }
  | { state: 'input-required'; message: string }
  | { state: 'completed' }
  | { state: 'failed'; error: string }
  | { state: 'canceled' };

// Messages between agents
export interface Message {
  role: 'user' | 'agent';
  parts: Part[];
  timestamp: string;
}

export type Part = TextPart | DataPart | FilePart;

export interface TextPart {
  type: 'text';
  text: string;
}

export interface DataPart {
  type: 'data';
  mimeType: string;
  data: Record<string, unknown>;
}

export interface FilePart {
  type: 'file';
  mimeType: string;
  uri: string;
  name?: string;
}

// Artifacts produced by agents
export interface Artifact {
  id: string;
  name: string;
  mimeType: string;
  parts: Part[];
  index?: number;
  append?: boolean;
  lastChunk?: boolean;
}

// A2A Request/Response
export interface TaskSendParams {
  id: string;
  sessionId?: string;
  message: Message;
  acceptedOutputModes?: string[];
  historyLength?: number;
  metadata?: Record<string, unknown>;
}

export interface TaskQueryParams {
  id: string;
  historyLength?: number;
}

// Agent Communication
export interface AgentMessage {
  from: string;
  to: string;
  task: Task;
  context?: TransitionContext;
}

// TransitionBridge-specific context passed between agents
export interface TransitionContext {
  patientId: string;
  currentPhase: TransitionPhase;
  readinessScore?: number;
  identifiedGaps?: string[];
  matchedProviders?: string[];
  educationPlan?: string[];
  handoffStatus?: HandoffStatus;
}

export type TransitionPhase =
  | 'assessment'
  | 'gap-identification'
  | 'provider-matching'
  | 'education'
  | 'handoff'
  | 'post-transition';

export type HandoffStatus =
  | 'not-started'
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'requires-followup';

// Agent Registry for orchestration
export interface AgentRegistry {
  agents: Map<string, AgentCard>;
  getAgent(name: string): AgentCard | undefined;
  registerAgent(card: AgentCard): void;
}

// Orchestrator types
export interface OrchestrationPlan {
  patientId: string;
  steps: OrchestrationStep[];
  currentStep: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface OrchestrationStep {
  agent: string;
  task: string;
  dependencies: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'skipped' | 'failed';
  result?: unknown;
}
