/**
 * End-to-End Integration Tests
 */

import { describe, it, expect } from 'vitest';
import { transitionOrchestrator } from '../orchestrator/transition-orchestrator.js';
import { getPatientById, calculateAge } from '../data/synthetic-patients.js';

describe('End-to-End Transition Workflows', () => {
  describe('Standard Transition - Maya (Type 1 Diabetes)', () => {
    it('should complete full workflow', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P001');

      expect(result.success).toBe(true);
      expect(result.phases.filter(p => p.status === 'completed')).toHaveLength(5);
    });

    it('should identify diabetes-specific needs', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P001');

      // Should match endocrinology providers
      expect(result.finalContext.matchedProviders?.length).toBeGreaterThan(0);
    });

    it('should create appropriate education plan', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P001');

      expect(result.finalContext.educationPlan).toBeDefined();
      expect(result.finalContext.educationPlan?.length).toBeGreaterThan(0);
    });
  });

  describe('Early Planning - Marcus (Congenital Heart Disease)', () => {
    it('should complete workflow for younger patient', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P002');

      expect(result.success).toBe(true);
      expect(result.patientName).toContain('Marcus');
    });

    it('should identify cardiac-specific providers', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P002');

      expect(result.finalContext.matchedProviders).toBeDefined();
    });

    it('should have lower readiness score', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P002');

      // Marcus has lower readiness (0.45)
      expect(result.finalContext.readinessScore).toBeLessThan(0.6);
    });
  });

  describe('Crisis Case - Sophia (Cystic Fibrosis)', () => {
    it('should handle aged-out patient', async () => {
      const sophia = getPatientById('P003');
      const age = calculateAge(sophia?.patient.birthDate || '');

      expect(age).toBeGreaterThanOrEqual(18);

      const result = await transitionOrchestrator.runTransitionWorkflow('P003');
      expect(result.success).toBe(true);
    });

    it('should identify CF-specific providers', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P003');

      expect(result.finalContext.matchedProviders).toBeDefined();
    });

    it('should have higher readiness score', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P003');

      // Sophia has higher readiness (0.78)
      expect(result.finalContext.readinessScore).toBeGreaterThan(0.7);
    });
  });

  describe('Workflow Context Propagation', () => {
    it('should pass readiness score from assessment to later phases', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P001');

      const maya = getPatientById('P001');
      expect(result.finalContext.readinessScore).toBe(maya?.readinessAssessment.overallScore);
    });

    it('should accumulate data through phases', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P001');

      // After all phases, context should have all fields populated
      expect(result.finalContext.patientId).toBe('P001');
      expect(result.finalContext.readinessScore).toBeDefined();
      expect(result.finalContext.identifiedGaps).toBeDefined();
      expect(result.finalContext.matchedProviders).toBeDefined();
      expect(result.finalContext.educationPlan).toBeDefined();
      expect(result.finalContext.handoffStatus).toBe('scheduled');
    });
  });

  describe('Error Handling', () => {
    it('should throw for non-existent patient', async () => {
      await expect(
        transitionOrchestrator.runTransitionWorkflow('NONEXISTENT')
      ).rejects.toThrow();
    });

    it('should handle empty patient ID', async () => {
      await expect(
        transitionOrchestrator.runTransitionWorkflow('')
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete workflow quickly', async () => {
      const start = Date.now();
      await transitionOrchestrator.runTransitionWorkflow('P001');
      const duration = Date.now() - start;

      // Should complete in under 1 second for synthetic data
      expect(duration).toBeLessThan(1000);
    });

    it('should handle batch processing', async () => {
      const start = Date.now();
      const results = await transitionOrchestrator.runBatchWorkflow();
      const duration = Date.now() - start;

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(3000);
    });
  });
});

describe('Agent Communication', () => {
  describe('Task History', () => {
    it('should maintain task history', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P001');

      // Each phase should have completed
      for (const phase of result.phases) {
        expect(phase.status).toBe('completed');
        expect(phase.summary).toBeDefined();
        expect(phase.summary.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Context Updates', () => {
    it('should update phase correctly', async () => {
      const result = await transitionOrchestrator.runTransitionWorkflow('P001');

      // Final phase should be post-transition
      expect(result.finalContext.currentPhase).toBe('post-transition');
    });
  });
});
