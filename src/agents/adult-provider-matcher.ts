/**
 * Adult Provider Matcher Agent
 *
 * Purpose: Match patient conditions to appropriate adult specialists
 */

import { BaseAgent, generateId } from './base-agent.js';
import {
  AgentCard,
  Task,
  Message,
  Artifact,
  TransitionContext
} from '../types/a2a.js';
import { getPatientById } from '../data/synthetic-patients.js';
import { ProviderMatch } from '../types/transition.js';

// Pediatric to Adult specialty mapping
const SPECIALTY_MAPPING: Record<string, {
  adultSpecialty: string;
  subspecialties: string[];
  considerations: string[];
}> = {
  'Pediatric Endocrinology': {
    adultSpecialty: 'Endocrinology',
    subspecialties: ['Diabetes & Metabolism', 'General Endocrinology'],
    considerations: ['Look for providers with young adult diabetes experience']
  },
  'Pediatric Cardiology': {
    adultSpecialty: 'Adult Congenital Heart Disease (ACHD)',
    subspecialties: ['ACHD', 'General Cardiology'],
    considerations: ['ACHD specialists preferred for complex conditions']
  },
  'Pediatric Pulmonology': {
    adultSpecialty: 'Pulmonology',
    subspecialties: ['Cystic Fibrosis Center', 'General Pulmonology'],
    considerations: ['Must be accredited CF center for CF patients']
  }
};

// Synthetic provider database
const ADULT_PROVIDERS: any[] = [
  {
    providerId: 'PROV-001',
    name: 'Dr. Sarah Mitchell',
    specialty: 'Endocrinology',
    subspecialty: 'Diabetes & Metabolism',
    organization: 'Metro Adult Medicine Center',
    location: { address: '123 Health Plaza', city: 'Springfield', state: 'IL', zipCode: '62701', distance: 3.2 },
    acceptsInsurance: ['BlueCross', 'Aetna', 'Medicare'],
    transitionExperience: 'high',
    nextAvailability: '2026-05-15',
    waitTimeWeeks: 3,
    rating: 4.8,
    patientReviews: 127,
    specialNotes: 'Runs dedicated young adult diabetes clinic'
  },
  {
    providerId: 'PROV-002',
    name: 'Dr. James Chen',
    specialty: 'Adult Congenital Heart Disease (ACHD)',
    subspecialty: 'ACHD',
    organization: 'University Heart Center',
    location: { address: '500 University Ave', city: 'Springfield', state: 'IL', zipCode: '62702', distance: 5.8 },
    acceptsInsurance: ['BlueCross', 'Aetna', 'Cigna'],
    transitionExperience: 'high',
    nextAvailability: '2026-05-22',
    waitTimeWeeks: 4,
    rating: 4.9,
    patientReviews: 89,
    specialNotes: 'Board certified in ACHD'
  },
  {
    providerId: 'PROV-003',
    name: 'Dr. Amanda Foster',
    specialty: 'Pulmonology',
    subspecialty: 'Cystic Fibrosis Center',
    organization: 'Regional CF Care Center',
    location: { address: '200 Medical Center Dr', city: 'Springfield', state: 'IL', zipCode: '62703', distance: 8.1 },
    acceptsInsurance: ['BlueCross', 'Aetna', 'United'],
    transitionExperience: 'high',
    nextAvailability: '2026-05-08',
    waitTimeWeeks: 2,
    rating: 4.7,
    patientReviews: 156,
    specialNotes: 'CFF-accredited adult CF center'
  }
];

const AGENT_CARD: AgentCard = {
  name: 'AdultProviderMatcher',
  description: 'Matches transitioning patients with appropriate adult care providers',
  url: 'transitionbridge://agents/provider-matcher',
  version: '1.0.0',
  capabilities: [{ streaming: false, pushNotifications: false, stateTransitionHistory: true }],
  skills: [{
    id: 'match-providers',
    name: 'Match Providers',
    description: 'Find and rank adult providers for transition',
    tags: ['matching', 'providers'],
    examples: ['Find adult endocrinologist for Maya']
  }],
  defaultInputModes: ['text', 'application/json'],
  defaultOutputModes: ['text', 'application/json']
};

export class AdultProviderMatcherAgent extends BaseAgent {
  constructor() {
    super(AGENT_CARD);
  }

  canHandle(context: TransitionContext): boolean {
    return context.currentPhase === 'provider-matching';
  }

  async processTask(message: Message, context: TransitionContext): Promise<{ task: Task; updatedContext: TransitionContext }> {
    const task = this.createTask(generateId('session'), message);
    this.updateTaskStatus(task.id, { state: 'working', message: 'Matching adult providers...' });

    const patient = getPatientById(context.patientId);
    if (!patient) {
      this.updateTaskStatus(task.id, { state: 'failed', error: 'Patient not found' });
      return { task, updatedContext: context };
    }

    const conditions = patient.conditions.map((c: any) => c.code?.text || '');
    const requiredSpecialties = this.mapConditionsToSpecialties(conditions);
    const matchedProviders = this.findMatchingProviders(requiredSpecialties);
    const rankedProviders = this.rankProviders(matchedProviders);

    const name = patient.patient.name?.[0]?.given?.join(' ') + ' ' + patient.patient.name?.[0]?.family;
    const responseText = this.generateReport(name, requiredSpecialties, rankedProviders);

    const responseMsg = this.createAgentMessage([
      this.textPart(responseText),
      this.dataPart('application/json', { providers: rankedProviders })
    ]);
    this.addMessage(task.id, responseMsg);
    this.updateTaskStatus(task.id, { state: 'completed' });

    return {
      task,
      updatedContext: {
        ...context,
        matchedProviders: rankedProviders.slice(0, 3).map((p: any) => p.providerId),
        currentPhase: 'education'
      }
    };
  }

  private mapConditionsToSpecialties(conditions: string[]): any[] {
    const specialties: any[] = [];
    for (const condition of conditions) {
      const conditionLower = condition.toLowerCase();
      if (conditionLower.includes('diabetes')) {
        specialties.push(SPECIALTY_MAPPING['Pediatric Endocrinology']);
      } else if (conditionLower.includes('heart') || conditionLower.includes('tetralogy')) {
        specialties.push(SPECIALTY_MAPPING['Pediatric Cardiology']);
      } else if (conditionLower.includes('cystic fibrosis')) {
        specialties.push(SPECIALTY_MAPPING['Pediatric Pulmonology']);
      }
    }
    return specialties;
  }

  private findMatchingProviders(specialties: any[]): any[] {
    const providers: any[] = [];
    for (const spec of specialties) {
      const matches = ADULT_PROVIDERS.filter(p =>
        p.specialty.toLowerCase().includes(spec.adultSpecialty.toLowerCase())
      );
      providers.push(...matches);
    }
    return providers;
  }

  private rankProviders(providers: any[]): any[] {
    return providers.sort((a, b) => {
      let scoreA = 0, scoreB = 0;
      if (a.transitionExperience === 'high') scoreA += 40;
      if (b.transitionExperience === 'high') scoreB += 40;
      scoreA += (a.rating || 0) * 5;
      scoreB += (b.rating || 0) * 5;
      return scoreB - scoreA;
    });
  }

  private generateReport(patientName: string, specialties: any[], providers: any[]): string {
    let report = `## Adult Provider Matching Report\n\n`;
    report += `**Patient:** ${patientName}\n\n`;
    report += `### Required Specialties\n`;
    for (const spec of specialties) {
      report += `- ${spec.adultSpecialty}\n`;
    }
    report += `\n### Top Matched Providers\n\n`;
    for (let i = 0; i < Math.min(providers.length, 3); i++) {
      const p = providers[i];
      report += `#### ${i + 1}. ${p.name}\n`;
      report += `**${p.specialty}** at ${p.organization}\n`;
      report += `Rating: ${p.rating}/5 | Wait: ${p.waitTimeWeeks} weeks\n\n`;
    }
    return report;
  }
}

export const adultProviderMatcher = new AdultProviderMatcherAgent();
