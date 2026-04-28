/**
 * TransitionBridge AI Orchestrator
 *
 * Coordinates the multi-agent transition workflow using A2A protocol.
 * Manages the flow: Assessment → Gap Analysis → Provider Matching → Education → Handoff
 */

import {
  TransitionContext,
  TransitionPhase,
  OrchestrationPlan,
  OrchestrationStep,
  Message,
  Task
} from '../types/a2a.js';
import { TransitionReadinessAssessorAgent, transitionReadinessAssessor } from '../agents/transition-readiness-assessor.js';
import { CareGapIdentifierAgent, careGapIdentifier } from '../agents/care-gap-identifier.js';
import { AdultProviderMatcherAgent, adultProviderMatcher } from '../agents/adult-provider-matcher.js';
import { PatientEducatorAgent, patientEducator } from '../agents/patient-educator.js';
import { HandoffCoordinatorAgent, handoffCoordinator } from '../agents/handoff-coordinator.js';
import { getPatientById, getAllPatients, getTransitionEligiblePatients } from '../data/synthetic-patients.js';

// Agent registry
const AGENTS = {
  'readiness-assessor': transitionReadinessAssessor,
  'gap-identifier': careGapIdentifier,
  'provider-matcher': adultProviderMatcher,
  'patient-educator': patientEducator,
  'handoff-coordinator': handoffCoordinator
};

// Phase to agent mapping
const PHASE_AGENTS: Record<TransitionPhase, keyof typeof AGENTS> = {
  'assessment': 'readiness-assessor',
  'gap-identification': 'gap-identifier',
  'provider-matching': 'provider-matcher',
  'education': 'patient-educator',
  'handoff': 'handoff-coordinator',
  'post-transition': 'handoff-coordinator' // For follow-up tracking
};

// Orchestration workflow definition
const WORKFLOW_STEPS: OrchestrationStep[] = [
  {
    agent: 'readiness-assessor',
    task: 'Assess transition readiness using TRAQ',
    dependencies: [],
    status: 'pending'
  },
  {
    agent: 'gap-identifier',
    task: 'Identify care gaps and missing documentation',
    dependencies: ['readiness-assessor'],
    status: 'pending'
  },
  {
    agent: 'provider-matcher',
    task: 'Match patient with appropriate adult providers',
    dependencies: ['gap-identifier'],
    status: 'pending'
  },
  {
    agent: 'patient-educator',
    task: 'Create personalized education plan',
    dependencies: ['provider-matcher'],
    status: 'pending'
  },
  {
    agent: 'handoff-coordinator',
    task: 'Coordinate transition handoff and generate documentation',
    dependencies: ['patient-educator'],
    status: 'pending'
  }
];

export interface OrchestrationResult {
  patientId: string;
  patientName: string;
  success: boolean;
  phases: Array<{
    phase: TransitionPhase;
    agent: string;
    status: 'completed' | 'failed' | 'skipped';
    summary: string;
    artifacts?: string[];
  }>;
  finalContext: TransitionContext;
  totalDuration: number;
}

export class TransitionOrchestrator {
  private plans: Map<string, OrchestrationPlan> = new Map();

  /**
   * Run complete transition workflow for a patient
   */
  async runTransitionWorkflow(patientId: string): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const patient = getPatientById(patientId);

    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    const patientName = `${patient.patient.name[0].given.join(' ')} ${patient.patient.name[0].family}`;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`TransitionBridge AI - Starting Transition Workflow`);
    console.log(`Patient: ${patientName} (${patientId})`);
    console.log(`${'='.repeat(60)}\n`);

    // Initialize context
    let context: TransitionContext = {
      patientId,
      currentPhase: 'assessment',
      handoffStatus: 'not-started'
    };

    // Create orchestration plan
    const plan: OrchestrationPlan = {
      patientId,
      steps: JSON.parse(JSON.stringify(WORKFLOW_STEPS)),
      currentStep: 0,
      status: 'in-progress'
    };
    this.plans.set(patientId, plan);

    const phaseResults: OrchestrationResult['phases'] = [];

    // Execute each phase
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      plan.currentStep = i;
      step.status = 'in-progress';

      console.log(`\n${'─'.repeat(50)}`);
      console.log(`Phase ${i + 1}/${plan.steps.length}: ${this.formatAgentName(step.agent)}`);
      console.log(`Task: ${step.task}`);
      console.log(`${'─'.repeat(50)}\n`);

      try {
        const agent = AGENTS[step.agent as keyof typeof AGENTS];
        const message = this.createInitialMessage(step.task, context);

        const { task, updatedContext } = await agent.processTask(message, context);
        context = updatedContext;

        step.status = 'completed';
        step.result = task;

        // Extract summary from task
        const summary = this.extractSummary(task);
        const artifacts = task.artifacts?.map(a => a.name) || [];

        phaseResults.push({
          phase: this.getPhaseFromAgent(step.agent),
          agent: step.agent,
          status: 'completed',
          summary,
          artifacts
        });

        console.log(`✓ ${this.formatAgentName(step.agent)} completed`);
        console.log(`  Summary: ${summary.substring(0, 100)}...`);

      } catch (error) {
        step.status = 'failed';
        console.error(`✗ ${this.formatAgentName(step.agent)} failed:`, error);

        phaseResults.push({
          phase: this.getPhaseFromAgent(step.agent),
          agent: step.agent,
          status: 'failed',
          summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });

        // Continue with next step despite failure
      }
    }

    plan.status = 'completed';
    const totalDuration = Date.now() - startTime;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Transition Workflow Complete`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`Phases Completed: ${phaseResults.filter(p => p.status === 'completed').length}/${phaseResults.length}`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      patientId,
      patientName,
      success: phaseResults.every(p => p.status === 'completed'),
      phases: phaseResults,
      finalContext: context,
      totalDuration
    };
  }

  /**
   * Run workflow for all transition-eligible patients
   */
  async runBatchWorkflow(): Promise<OrchestrationResult[]> {
    const eligiblePatients = getTransitionEligiblePatients();
    const results: OrchestrationResult[] = [];

    console.log(`\n${'#'.repeat(60)}`);
    console.log(`TransitionBridge AI - Batch Processing`);
    console.log(`Processing ${eligiblePatients.length} transition-eligible patients`);
    console.log(`${'#'.repeat(60)}\n`);

    for (const patient of eligiblePatients) {
      try {
        const result = await this.runTransitionWorkflow(patient.patient.id);
        results.push(result);
      } catch (error) {
        console.error(`Failed to process patient ${patient.patient.id}:`, error);
      }
    }

    // Print summary
    console.log(`\n${'#'.repeat(60)}`);
    console.log(`Batch Processing Complete`);
    console.log(`Successful: ${results.filter(r => r.success).length}/${results.length}`);
    console.log(`${'#'.repeat(60)}\n`);

    return results;
  }

  /**
   * Get current orchestration status for a patient
   */
  getOrchestrationStatus(patientId: string): OrchestrationPlan | undefined {
    return this.plans.get(patientId);
  }

  /**
   * List all available agents
   */
  listAgents(): Array<{ name: string; description: string; phase: TransitionPhase }> {
    return Object.entries(AGENTS).map(([key, agent]) => ({
      name: agent.getCard().name,
      description: agent.getCard().description,
      phase: this.getPhaseFromAgent(key)
    }));
  }

  private createInitialMessage(task: string, context: TransitionContext): Message {
    return {
      role: 'user',
      parts: [
        {
          type: 'text',
          text: `Execute task: ${task}\nPatient ID: ${context.patientId}\nCurrent Phase: ${context.currentPhase}`
        },
        {
          type: 'data',
          mimeType: 'application/json',
          data: context as unknown as Record<string, unknown>
        }
      ],
      timestamp: new Date().toISOString()
    };
  }

  private extractSummary(task: Task): string {
    const lastMessage = task.history[task.history.length - 1];
    if (lastMessage?.parts) {
      const textPart = lastMessage.parts.find(p => p.type === 'text');
      if (textPart && textPart.type === 'text') {
        // Get first paragraph
        const lines = textPart.text.split('\n').filter(l => l.trim());
        return lines.slice(0, 3).join(' ').replace(/[#*]/g, '').trim();
      }
    }
    return 'Task completed';
  }

  private formatAgentName(agentKey: string): string {
    return agentKey
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getPhaseFromAgent(agentKey: string): TransitionPhase {
    const phaseMap: Record<string, TransitionPhase> = {
      'readiness-assessor': 'assessment',
      'gap-identifier': 'gap-identification',
      'provider-matcher': 'provider-matching',
      'patient-educator': 'education',
      'handoff-coordinator': 'handoff'
    };
    return phaseMap[agentKey] || 'assessment';
  }
}

// Export singleton instance
export const transitionOrchestrator = new TransitionOrchestrator();

// CLI entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Run demo with first patient
    console.log('TransitionBridge AI - Demo Mode');
    console.log('Usage: node transition-orchestrator.js <patientId>');
    console.log('       node transition-orchestrator.js --all');
    console.log('\nRunning demo with patient P001...\n');

    const result = await transitionOrchestrator.runTransitionWorkflow('P001');
    console.log('\nFinal Result:');
    console.log(JSON.stringify(result, null, 2));

  } else if (args[0] === '--all') {
    // Run for all patients
    const results = await transitionOrchestrator.runBatchWorkflow();
    console.log('\nAll Results:');
    for (const result of results) {
      console.log(`${result.patientName}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    }

  } else if (args[0] === '--list-agents') {
    // List agents
    console.log('\nTransitionBridge AI Agents:\n');
    for (const agent of transitionOrchestrator.listAgents()) {
      console.log(`• ${agent.name}`);
      console.log(`  Phase: ${agent.phase}`);
      console.log(`  ${agent.description}\n`);
    }

  } else {
    // Run for specific patient
    const patientId = args[0];
    const result = await transitionOrchestrator.runTransitionWorkflow(patientId);
    console.log('\nFinal Result:');
    console.log(JSON.stringify(result, null, 2));
  }
}

// Run if executed directly
main().catch(console.error);
