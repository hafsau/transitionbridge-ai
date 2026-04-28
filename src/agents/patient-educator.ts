/**
 * Patient Educator Agent
 */

import { BaseAgent, generateId } from './base-agent.js';
import { AgentCard, Task, Message, TransitionContext } from '../types/a2a.js';
import { getPatientById, calculateAge } from '../data/synthetic-patients.js';

const EDUCATION_MODULES: any = {
  'medication-management': { title: 'Medication Self-Management', estimatedMinutes: 30 },
  'appointment-scheduling': { title: 'Scheduling and Keeping Appointments', estimatedMinutes: 25 },
  'insurance-navigation': { title: 'Understanding Health Insurance', estimatedMinutes: 45 },
  'self-advocacy': { title: 'Self-Advocacy in Healthcare', estimatedMinutes: 35 },
  'emergency-preparedness': { title: 'Emergency Preparedness', estimatedMinutes: 25 },
  'adult-healthcare-differences': { title: 'Adult vs Pediatric Healthcare', estimatedMinutes: 30 }
};

const AGENT_CARD: AgentCard = {
  name: 'PatientEducator',
  description: 'Provides personalized health education for transition',
  url: 'transitionbridge://agents/patient-educator',
  version: '1.0.0',
  capabilities: [{ streaming: false, pushNotifications: false, stateTransitionHistory: true }],
  skills: [{
    id: 'create-education-plan',
    name: 'Create Education Plan',
    description: 'Generate personalized learning plan',
    tags: ['education', 'planning'],
    examples: ['Create education plan for Maya']
  }],
  defaultInputModes: ['text', 'application/json'],
  defaultOutputModes: ['text', 'application/json']
};

export class PatientEducatorAgent extends BaseAgent {
  constructor() {
    super(AGENT_CARD);
  }

  canHandle(context: TransitionContext): boolean {
    return context.currentPhase === 'education';
  }

  async processTask(message: Message, context: TransitionContext): Promise<{ task: Task; updatedContext: TransitionContext }> {
    const task = this.createTask(generateId('session'), message);
    this.updateTaskStatus(task.id, { state: 'working', message: 'Creating education plan...' });

    const patient = getPatientById(context.patientId);
    if (!patient) {
      this.updateTaskStatus(task.id, { state: 'failed', error: 'Patient not found' });
      return { task, updatedContext: context };
    }

    const age = calculateAge(patient.patient.birthDate || '');
    const name = patient.patient.name?.[0]?.given?.join(' ') + ' ' + patient.patient.name?.[0]?.family;
    
    // Determine required modules based on gaps
    const gaps = patient.readinessAssessment?.gaps || [];
    const modules: string[] = [];
    for (const gap of gaps) {
      if (typeof gap === 'string') {
        if (gap.includes('medication')) modules.push('medication-management');
        if (gap.includes('appointment')) modules.push('appointment-scheduling');
      }
    }
    modules.push('adult-healthcare-differences', 'emergency-preparedness');
    const uniqueModules = [...new Set(modules)];

    let report = `## Personalized Education Plan\n\n`;
    report += `**Patient:** ${name}\n`;
    report += `**Age:** ${age} years\n\n`;
    report += `### Education Modules\n\n`;
    
    let totalMinutes = 0;
    for (const moduleId of uniqueModules) {
      const mod = EDUCATION_MODULES[moduleId];
      if (mod) {
        report += `- **${mod.title}** (${mod.estimatedMinutes} min)\n`;
        totalMinutes += mod.estimatedMinutes;
      }
    }
    report += `\n**Total Time:** ${totalMinutes} minutes\n`;

    const responseMsg = this.createAgentMessage([
      this.textPart(report),
      this.dataPart('application/json', { modules: uniqueModules })
    ]);
    this.addMessage(task.id, responseMsg);
    this.updateTaskStatus(task.id, { state: 'completed' });

    return {
      task,
      updatedContext: {
        ...context,
        educationPlan: uniqueModules,
        currentPhase: 'handoff'
      }
    };
  }
}

export const patientEducator = new PatientEducatorAgent();
