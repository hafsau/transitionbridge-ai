/**
 * Handoff Coordinator Agent
 */

import { BaseAgent, generateId } from './base-agent.js';
import { AgentCard, Task, Message, TransitionContext } from '../types/a2a.js';
import { getPatientById, calculateAge } from '../data/synthetic-patients.js';

const AGENT_CARD: AgentCard = {
  name: 'HandoffCoordinator',
  description: 'Coordinates transition handoff between pediatric and adult care',
  url: 'transitionbridge://agents/handoff-coordinator',
  version: '1.0.0',
  capabilities: [{ streaming: false, pushNotifications: false, stateTransitionHistory: true }],
  skills: [{
    id: 'coordinate-handoff',
    name: 'Coordinate Handoff',
    description: 'Generate transition package and schedule warm handoff',
    tags: ['handoff', 'coordination'],
    examples: ['Coordinate handoff for Maya']
  }],
  defaultInputModes: ['text', 'application/json'],
  defaultOutputModes: ['text', 'application/json']
};

export class HandoffCoordinatorAgent extends BaseAgent {
  constructor() {
    super(AGENT_CARD);
  }

  canHandle(context: TransitionContext): boolean {
    return context.currentPhase === 'handoff';
  }

  async processTask(message: Message, context: TransitionContext): Promise<{ task: Task; updatedContext: TransitionContext }> {
    const task = this.createTask(generateId('session'), message);
    this.updateTaskStatus(task.id, { state: 'working', message: 'Coordinating transition handoff...' });

    const patient = getPatientById(context.patientId);
    if (!patient) {
      this.updateTaskStatus(task.id, { state: 'failed', error: 'Patient not found' });
      return { task, updatedContext: context };
    }

    const age = calculateAge(patient.patient.birthDate || '');
    const name = patient.patient.name?.[0]?.given?.join(' ') + ' ' + patient.patient.name?.[0]?.family;
    const conditions = patient.conditions.map((c: any) => c.code?.text || '').join(', ');

    // Schedule handoff date (2 weeks from now)
    const handoffDate = new Date();
    handoffDate.setDate(handoffDate.getDate() + 14);
    const handoffDateStr = handoffDate.toISOString().split('T')[0];

    let report = `## Transition Handoff Coordination Report\n\n`;
    report += `**Patient:** ${name}\n`;
    report += `**Age:** ${age} years\n`;
    report += `**Conditions:** ${conditions}\n\n`;
    
    report += `### Warm Handoff Scheduled\n\n`;
    report += `**Date:** ${handoffDateStr} at 10:00 AM\n`;
    report += `**Location:** Metro Adult Medicine Center\n`;
    report += `**Type:** Joint Visit (Pediatric + Adult Provider)\n\n`;
    
    report += `**Participants:**\n`;
    report += `- Pediatric Provider: Dr. Sarah Martinez\n`;
    report += `- Adult Provider: Dr. Sarah Mitchell\n`;
    report += `- Patient: Confirmed\n`;
    report += `- Family: Confirmed\n\n`;
    
    report += `### Transition Package Status\n\n`;
    report += `- ✅ Medical Summary Complete\n`;
    report += `- ✅ Medication List Complete\n`;
    report += `- ✅ Care Plan Documented\n`;
    report += `- ✅ Adult Provider Identified\n`;
    report += `- ✅ First Adult Appointment Scheduled\n\n`;
    
    report += `### Next Steps\n`;
    report += `1. Confirm attendance for warm handoff meeting\n`;
    report += `2. Attend joint visit on ${handoffDateStr}\n`;
    report += `3. Begin care with adult provider\n`;
    report += `4. Complete post-transition check-in\n\n`;
    
    report += `### Transition Complete\n\n`;
    report += `${name}'s transition from pediatric to adult care has been successfully coordinated.\n`;

    const responseMsg = this.createAgentMessage([
      this.textPart(report),
      this.dataPart('application/json', { handoffDate: handoffDateStr, status: 'scheduled' })
    ]);
    this.addMessage(task.id, responseMsg);
    this.updateTaskStatus(task.id, { state: 'completed' });

    return {
      task,
      updatedContext: {
        ...context,
        currentPhase: 'post-transition',
        handoffStatus: 'scheduled'
      }
    };
  }
}

export const handoffCoordinator = new HandoffCoordinatorAgent();
