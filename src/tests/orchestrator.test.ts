/**
 * Tests for Transition Orchestrator
 */

import { describe, it, expect } from 'vitest';
import { transitionOrchestrator } from '../orchestrator/transition-orchestrator.js';

describe('Transition Orchestrator', () => {
  describe('listAgents', () => {
    it('should list all 5 agents', () => {
      const agents = transitionOrchestrator.listAgents();
      expect(agents).toHaveLength(5);
    });

    it('should have agents for all phases', () => {
      const agents = transitionOrchestrator.listAgents();
      const phases = agents.map(a => a.phase);

      expect(phases).toContain('assessment');
      expect(phases).toContain('gap-identification');
      expect(phases).toContain('provider-matching');
      expect(phases).toContain('education');
      expect(phases).toContain('handoff');
    });
  });

  describe('runTransitionWorkflow', () => {
    it('should complete workflow for Maya (P001)', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P001');

      expect(result.success).toBe(true);
      expect(result.patientId).toBe('P001');
      expect(result.patientName).toContain('Maya');
      expect(result.phases).toHaveLength(5);
      expect(result.phases.every(p => p.status === 'completed')).toBe(true);
      expect(result.finalContext.currentPhase).toBe('post-transition');
    });

    it('should complete workflow for Marcus (P002)', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P002');

      expect(result.success).toBe(true);
      expect(result.patientId).toBe('P002');
      expect(result.patientName).toContain('Marcus');
      expect(result.phases).toHaveLength(5);
    });

    it('should complete workflow for Sophia (P003) - crisis case', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P003');

      expect(result.success).toBe(true);
      expect(result.patientId).toBe('P003');
      expect(result.patientName).toContain('Sophia');
      expect(result.phases).toHaveLength(5);
    });

    it('should fail for non-existent patient', async () => {
      await expect(
        transitionOrchestrator.runTransitionWorkflow('INVALID')
      ).rejects.toThrow('Patient not found');
    });
  });

  describe('Workflow Phase Transitions', () => {
    it('should progress through phases in correct order', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P001');

      const phaseOrder = result.phases.map(p => p.phase);
      expect(phaseOrder).toEqual([
        'assessment',
        'gap-identification',
        'provider-matching',
        'education',
        'handoff'
      ]);
    });

    it('should populate context with readiness score after assessment', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P001');

      expect(result.finalContext.readinessScore).toBeDefined();
      expect(result.finalContext.readinessScore).toBeGreaterThan(0);
    });

    it('should populate context with matched providers', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P001');

      expect(result.finalContext.matchedProviders).toBeDefined();
    });

    it('should set handoff status to scheduled', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P001');

      expect(result.finalContext.handoffStatus).toBe('scheduled');
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple patients', async () => {
      const results = await transitionOrchestrator.runBatchWorkflow();

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});
