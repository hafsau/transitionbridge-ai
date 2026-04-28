/**
 * Transition Readiness Assessor Agent
 */

import { BaseAgent, generateId } from './base-agent.js';
import { AgentCard, Task, Message, TransitionContext } from '../types/a2a.js';
import { getPatientById, calculateAge } from '../data/synthetic-patients.js';

const AGENT_CARD: AgentCard = {
  name: 'TransitionReadinessAssessor',
  description: 'Assesses transition readiness using TRAQ instrument',
  url: 'transitionbridge://agents/readiness-assessor',
  version: '1.0.0',
  capabilities: [{ streaming: false, pushNotifications: false, stateTransitionHistory: true }],
  skills: [{
    id: 'assess-readiness',
    name: 'Assess Transition Readiness',
    description: 'Perform TRAQ-based readiness assessment',
    tags: ['assessment', 'traq'],
    examples: ['Assess readiness for patient P001']
  }],
  defaultInputModes: ['text', 'application/json'],
  defaultOutputModes: ['text', 'application/json']
};

export class TransitionReadinessAssessorAgent extends BaseAgent {
  constructor() {
    super(AGENT_CARD);
  }

  canHandle(context: TransitionContext): boolean {
    return context.currentPhase === 'assessment';
  }

  async processTask(message: Message, context: TransitionContext): Promise<{ task: Task; updatedContext: TransitionContext }> {
    const task = this.createTask(generateId('session'), message);
    this.updateTaskStatus(task.id, { state: 'working', message: 'Assessing transition readiness...' });

    const patient = getPatientById(context.patientId);
    if (!patient) {
      this.updateTaskStatus(task.id, { state: 'failed', error: 'Patient not found' });
      return { task, updatedContext: context };
    }

    const age = calculateAge(patient.patient.birthDate || '');
    const name = patient.patient.name?.[0]?.given?.join(' ') + ' ' + patient.patient.name?.[0]?.family;
    const assessment = patient.readinessAssessment;
    const conditions = patient.conditions.map((c: any) => c.code?.text || '').join(', ');

    const readinessLevel = (assessment?.overallScore || 0) >= 0.8 ? 'High' :
                          (assessment?.overallScore || 0) >= 0.6 ? 'Moderate' :
                          (assessment?.overallScore || 0) >= 0.4 ? 'Low' : 'Very Low';

    let report = `## Transition Readiness Assessment Report\n\n`;
    report += `**Patient:** ${name}\n`;
    report += `**Age:** ${age} years\n`;
    report += `**Conditions:** ${conditions}\n\n`;
    report += `### Overall Readiness Score: ${Math.round((assessment?.overallScore || 0) * 100)}% (${readinessLevel})\n\n`;
    
    if (assessment?.domainScores) {
      report += `### Domain Scores:\n`;
      const domains = assessment.domainScores;
      for (const [domain, score] of Object.entries(domains)) {
        const pct = Math.round((score as number) * 100);
        const status = (score as number) >= 0.7 ? '✓' : (score as number) >= 0.5 ? '⚠' : '✗';
        report += `- **${domain}**: ${pct}% ${status}\n`;
      }
    }

    if (assessment?.gaps && assessment.gaps.length > 0) {
      report += `\n### Skill Gaps:\n`;
      for (const gap of assessment.gaps) {
        report += `- ${gap}\n`;
      }
    }

    report += `\n### Timeline:\n`;
    if (age >= 18) {
      report += `⚠ **URGENT**: Patient has aged out of pediatric care.\n`;
    } else {
      report += `📅 ${18 - age} years until adult care transition.\n`;
    }

    const responseMsg = this.createAgentMessage([
      this.textPart(report),
      this.dataPart('application/json', { assessment })
    ]);
    this.addMessage(task.id, responseMsg);
    this.updateTaskStatus(task.id, { state: 'completed' });

    return {
      task,
      updatedContext: {
        ...context,
        readinessScore: assessment?.overallScore,
        identifiedGaps: assessment?.gaps,
        currentPhase: 'gap-identification'
      }
    };
  }
}

export const transitionReadinessAssessor = new TransitionReadinessAssessorAgent();
