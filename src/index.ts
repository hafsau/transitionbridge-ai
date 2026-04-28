/**
 * TransitionBridge AI
 *
 * An intelligent multi-agent system that ensures no young patient falls
 * through the cracks when transitioning from pediatric to adult healthcare.
 *
 * Addressing the 81% failure rate in pediatric-to-adult care transitions.
 *
 * Architecture:
 * - 4 MCP Servers providing specialized healthcare tools
 * - 5 A2A Agents coordinating the transition workflow
 * - Orchestrator managing the multi-agent flow
 *
 * @author TransitionBridge AI Team
 * @version 1.0.0
 */

// Types
export * from './types/fhir.js';
export * from './types/transition.js';
export * from './types/a2a.js';

// Synthetic Patient Data
export {
  getPatientById,
  getAllPatients,
  getTransitionEligiblePatients,
  calculateAge
} from './data/synthetic-patients.js';

// A2A Agents
export { TransitionReadinessAssessorAgent, transitionReadinessAssessor } from './agents/transition-readiness-assessor.js';
export { CareGapIdentifierAgent, careGapIdentifier } from './agents/care-gap-identifier.js';
export { AdultProviderMatcherAgent, adultProviderMatcher } from './agents/adult-provider-matcher.js';
export { PatientEducatorAgent, patientEducator } from './agents/patient-educator.js';
export { HandoffCoordinatorAgent, handoffCoordinator } from './agents/handoff-coordinator.js';

// Orchestrator
export { TransitionOrchestrator, transitionOrchestrator } from './orchestrator/transition-orchestrator.js';

// Version info
export const VERSION = '1.0.0';
export const NAME = 'TransitionBridge AI';
export const DESCRIPTION = 'Pediatric-to-Adult Care Transition Navigator';

/**
 * Quick start demo
 */
export async function runDemo(patientId: string = 'P001'): Promise<void> {
  const { transitionOrchestrator } = await import('./orchestrator/transition-orchestrator.js');

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                   TransitionBridge AI                       ║
║         Pediatric-to-Adult Care Transition Navigator        ║
╠════════════════════════════════════════════════════════════╣
║  Problem: 81% of youth don't receive transition services    ║
║  Solution: AI-powered multi-agent transition coordinator    ║
╚════════════════════════════════════════════════════════════╝
`);

  const result = await transitionOrchestrator.runTransitionWorkflow(patientId);

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    Transition Complete                      ║
╠════════════════════════════════════════════════════════════╣
║  Patient: ${result.patientName.padEnd(46)}║
║  Success: ${result.success ? '✓ Yes' : '✗ No '.padEnd(46)}║
║  Phases:  ${result.phases.length} completed${' '.repeat(36)}║
╚════════════════════════════════════════════════════════════╝
`);
}

// Main entry point
if (process.argv[1]?.endsWith('index.js') || process.argv[1]?.endsWith('index.ts')) {
  runDemo().catch(console.error);
}
