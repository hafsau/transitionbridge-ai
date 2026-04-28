/**
 * Tests for A2A Agents
 */

import { describe, it, expect } from 'vitest';
import { transitionReadinessAssessor } from '../agents/transition-readiness-assessor.js';
import { careGapIdentifier } from '../agents/care-gap-identifier.js';
import { adultProviderMatcher } from '../agents/adult-provider-matcher.js';
import { patientEducator } from '../agents/patient-educator.js';
import { handoffCoordinator } from '../agents/handoff-coordinator.js';
import { TransitionContext, Message } from '../types/a2a.js';

// Helper to create test message
function createTestMessage(text: string): Message {
  return {
    role: 'user',
    parts: [{ type: 'text', text }],
    timestamp: new Date().toISOString()
  };
}

describe('Transition Readiness Assessor Agent', () => {
  it('should have correct agent card', () => {
    const card = transitionReadinessAssessor.getCard();
    expect(card.name).toBe('TransitionReadinessAssessor');
    expect(card.skills.length).toBeGreaterThan(0);
  });

  it('should handle assessment phase', () => {
    const context: TransitionContext = {
      patientId: 'P001',
      currentPhase: 'assessment'
    };
    expect(transitionReadinessAssessor.canHandle(context)).toBe(true);
  });

  it('should not handle other phases', () => {
    const context: TransitionContext = {
      patientId: 'P001',
      currentPhase: 'handoff'
    };
    expect(transitionReadinessAssessor.canHandle(context)).toBe(false);
  });

  it('should process task for valid patient', async () => {
    const context: TransitionContext = {
      patientId: 'P001',
      currentPhase: 'assessment'
    };
    const message = createTestMessage('Assess readiness for P001');

    const result = await transitionReadinessAssessor.processTask(message, context);

    expect(result.task).toBeDefined();
    expect(result.task.status.state).toBe('completed');
    expect(result.updatedContext.currentPhase).toBe('gap-identification');
    expect(result.updatedContext.readinessScore).toBeDefined();
  });

  it('should fail for invalid patient', async () => {
    const context: TransitionContext = {
      patientId: 'INVALID',
      currentPhase: 'assessment'
    };
    const message = createTestMessage('Assess readiness');

    const result = await transitionReadinessAssessor.processTask(message, context);

    expect(result.task.status.state).toBe('failed');
  });
});

describe('Care Gap Identifier Agent', () => {
  it('should have correct agent card', () => {
    const card = careGapIdentifier.getCard();
    expect(card.name).toBe('CareGapIdentifier');
  });

  it('should handle gap-identification phase', () => {
    const context: TransitionContext = {
      patientId: 'P001',
      currentPhase: 'gap-identification'
    };
    expect(careGapIdentifier.canHandle(context)).toBe(true);
  });

  it('should identify gaps for patient with gaps', async () => {
    const context: TransitionContext = {
      patientId: 'P001',
      currentPhase: 'gap-identification'
    };
    const message = createTestMessage('Identify care gaps');

    const result = await careGapIdentifier.processTask(message, context);

    expect(result.task.status.state).toBe('completed');
    expect(result.updatedContext.identifiedGaps).toBeDefined();
    expect(result.updatedContext.currentPhase).toBe('provider-matching');
  });
});

describe('Adult Provider Matcher Agent', () => {
  it('should have correct agent card', () => {
    const card = adultProviderMatcher.getCard();
    expect(card.name).toBe('AdultProviderMatcher');
  });

  it('should handle provider-matching phase', () => {
    const context: TransitionContext = {
      patientId: 'P001',
      currentPhase: 'provider-matching'
    };
    expect(adultProviderMatcher.canHandle(context)).toBe(true);
  });

  it('should match providers for diabetes patient', async () => {
    const context: TransitionContext = {
      patientId: 'P001',
      currentPhase: 'provider-matching'
    };
    const message = createTestMessage('Find providers');

    const result = await adultProviderMatcher.processTask(message, context);

    expect(result.task.status.state).toBe('completed');
    expect(result.updatedContext.matchedProviders).toBeDefined();
    expect(result.updatedContext.currentPhase).toBe('education');
  });

  it('should match providers for heart patient', async () => {
    const context: TransitionContext = {
      patientId: 'P002',
      currentPhase: 'provider-matching'
    };
    const message = createTestMessage('Find providers');

    const result = await adultProviderMatcher.processTask(message, context);

    expect(result.task.status.state).toBe('completed');
  });
});

describe('Patient Educator Agent', () => {
  it('should have correct agent card', () => {
    const card = patientEducator.getCard();
    expect(card.name).toBe('PatientEducator');
  });

  it('should handle education phase', () => {
    const context: TransitionContext = {
      patientId: 'P001',
      currentPhase: 'education'
    };
    expect(patientEducator.canHandle(context)).toBe(true);
  });

  it('should create education plan', async () => {
    const context: TransitionContext = {
      patientId: 'P001',
      currentPhase: 'education'
    };
    const message = createTestMessage('Create education plan');

    const result = await patientEducator.processTask(message, context);

    expect(result.task.status.state).toBe('completed');
    expect(result.updatedContext.educationPlan).toBeDefined();
    expect(result.updatedContext.educationPlan?.length).toBeGreaterThan(0);
    expect(result.updatedContext.currentPhase).toBe('handoff');
  });
});

describe('Handoff Coordinator Agent', () => {
  it('should have correct agent card', () => {
    const card = handoffCoordinator.getCard();
    expect(card.name).toBe('HandoffCoordinator');
  });

  it('should handle handoff phase', () => {
    const context: TransitionContext = {
      patientId: 'P001',
      currentPhase: 'handoff'
    };
    expect(handoffCoordinator.canHandle(context)).toBe(true);
  });

  it('should coordinate handoff', async () => {
    const context: TransitionContext = {
      patientId: 'P001',
      currentPhase: 'handoff'
    };
    const message = createTestMessage('Coordinate handoff');

    const result = await handoffCoordinator.processTask(message, context);

    expect(result.task.status.state).toBe('completed');
    expect(result.updatedContext.currentPhase).toBe('post-transition');
    expect(result.updatedContext.handoffStatus).toBe('scheduled');
  });
});
