/**
 * Care Gap Identifier Agent
 */

import { BaseAgent, generateId } from './base-agent.js';
import { AgentCard, Task, Message, TransitionContext } from '../types/a2a.js';
import { getPatientById } from '../data/synthetic-patients.js';

const AGENT_CARD: AgentCard = {
  name: 'CareGapIdentifier',
  description: 'Identifies gaps in patient records needed for transition',
  url: 'transitionbridge://agents/care-gap-identifier',
  version: '1.0.0',
  capabilities: [{ streaming: false, pushNotifications: false, stateTransitionHistory: true }],
  skills: [{
    id: 'identify-gaps',
    name: 'Identify Care Gaps',
    description: 'Find missing documentation, immunizations, and care gaps',
    tags: ['gaps', 'audit'],
    examples: ['What gaps need addressing for Maya?']
  }],
  defaultInputModes: ['text', 'application/json'],
  defaultOutputModes: ['text', 'application/json']
};

export class CareGapIdentifierAgent extends BaseAgent {
  constructor() {
    super(AGENT_CARD);
  }

  canHandle(context: TransitionContext): boolean {
    return context.currentPhase === 'gap-identification';
  }

  async processTask(message: Message, context: TransitionContext): Promise<{ task: Task; updatedContext: TransitionContext }> {
    const task = this.createTask(generateId('session'), message);
    this.updateTaskStatus(task.id, { state: 'working', message: 'Analyzing care gaps...' });

    const patient = getPatientById(context.patientId);
    if (!patient) {
      this.updateTaskStatus(task.id, { state: 'failed', error: 'Patient not found' });
      return { task, updatedContext: context };
    }

    const gaps = patient.careGaps || [];
    const urgentCount = gaps.filter((g: any) => g.urgency === 'urgent').length;
    const highCount = gaps.filter((g: any) => g.urgency === 'high').length;

    const name = patient.patient.name?.[0]?.given?.join(' ') + ' ' + patient.patient.name?.[0]?.family;
    
    let report = `## Care Gap Analysis Report\n\n`;
    report += `**Patient:** ${name}\n\n`;
    report += `### Summary\n`;
    report += `- Total Gaps: ${gaps.length}\n`;
    report += `- Urgent: ${urgentCount}\n`;
    report += `- High Priority: ${highCount}\n\n`;
    report += `### Gaps Identified\n`;
    for (const gap of gaps) {
      report += `- **${gap.description}** (${gap.urgency})\n`;
      report += `  Action: ${gap.actionRequired}\n`;
    }

    const responseMsg = this.createAgentMessage([
      this.textPart(report),
      this.dataPart('application/json', { gaps })
    ]);
    this.addMessage(task.id, responseMsg);
    this.updateTaskStatus(task.id, { state: 'completed' });

    return {
      task,
      updatedContext: {
        ...context,
        identifiedGaps: gaps.map((g: any) => g.id),
        currentPhase: 'provider-matching'
      }
    };
  }
}

export const careGapIdentifier = new CareGapIdentifierAgent();
