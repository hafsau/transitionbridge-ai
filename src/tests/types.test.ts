/**
 * Tests for Type Definitions and Data Integrity
 */

import { describe, it, expect } from 'vitest';
import { getPatientById, getAllPatients } from '../data/synthetic-patients.js';
import type { TRAQDomain, CareGap, ReadinessAssessment } from '../types/transition.js';

describe('FHIR Data Integrity', () => {
  describe('Patient Resource', () => {
    it('should have valid FHIR Patient structure', () => {
      const patients = getAllPatients();

      for (const p of patients) {
        expect(p.patient.resourceType).toBe('Patient');
        expect(p.patient.id).toBeDefined();
        expect(p.patient.name).toBeDefined();
        expect(p.patient.name?.length).toBeGreaterThan(0);
        expect(p.patient.birthDate).toBeDefined();
        expect(p.patient.gender).toBeDefined();
      }
    });

    it('should have valid contact information', () => {
      const maya = getPatientById('P001');

      expect(maya?.patient.telecom).toBeDefined();
      expect(maya?.patient.telecom?.some(t => t.system === 'phone')).toBe(true);
    });

    it('should have valid address', () => {
      const maya = getPatientById('P001');

      expect(maya?.patient.address).toBeDefined();
      expect(maya?.patient.address?.[0]?.city).toBeDefined();
      expect(maya?.patient.address?.[0]?.state).toBeDefined();
    });
  });

  describe('Condition Resource', () => {
    it('should have valid FHIR Condition structure', () => {
      const patients = getAllPatients();

      for (const p of patients) {
        for (const c of p.conditions) {
          expect(c.resourceType).toBe('Condition');
          expect(c.code).toBeDefined();
          expect(c.code?.text || c.code?.coding?.[0]?.display).toBeDefined();
          expect(c.subject).toBeDefined();
        }
      }
    });

    it('should have clinical status', () => {
      const maya = getPatientById('P001');

      for (const c of maya?.conditions || []) {
        expect(c.clinicalStatus).toBeDefined();
      }
    });
  });

  describe('Immunization Resource', () => {
    it('should have valid FHIR Immunization structure', () => {
      const patients = getAllPatients();

      for (const p of patients) {
        for (const i of p.immunizations) {
          expect(i.resourceType).toBe('Immunization');
          expect(i.vaccineCode).toBeDefined();
          expect(i.status).toBeDefined();
          expect(i.patient).toBeDefined();
        }
      }
    });
  });
});

describe('Transition Data Integrity', () => {
  describe('Readiness Assessment', () => {
    it('should have valid domain scores', () => {
      const patients = getAllPatients();
      const validDomains: TRAQDomain[] = [
        'managing-medications',
        'appointment-keeping',
        'tracking-health-issues',
        'talking-with-providers',
        'managing-daily-activities'
      ];

      for (const p of patients) {
        const assessment = p.readinessAssessment;
        expect(assessment.domainScores).toBeDefined();

        for (const domain of validDomains) {
          const score = assessment.domainScores[domain];
          expect(score).toBeDefined();
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        }
      }
    });

    it('should have valid overall score', () => {
      const patients = getAllPatients();

      for (const p of patients) {
        expect(p.readinessAssessment.overallScore).toBeGreaterThanOrEqual(0);
        expect(p.readinessAssessment.overallScore).toBeLessThanOrEqual(1);
      }
    });

    it('should have gaps array', () => {
      const patients = getAllPatients();

      for (const p of patients) {
        expect(Array.isArray(p.readinessAssessment.gaps)).toBe(true);
      }
    });

    it('should have recommendations', () => {
      const patients = getAllPatients();

      for (const p of patients) {
        expect(Array.isArray(p.readinessAssessment.recommendations)).toBe(true);
        expect(p.readinessAssessment.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Care Gaps', () => {
    it('should have valid care gap structure', () => {
      const maya = getPatientById('P001');

      for (const gap of maya?.careGaps || []) {
        expect(gap.id).toBeDefined();
        expect(gap.category).toBeDefined();
        expect(gap.description).toBeDefined();
        expect(gap.urgency).toBeDefined();
        expect(gap.actionRequired).toBeDefined();
      }
    });

    it('should have valid urgency levels', () => {
      const validUrgencies = ['urgent', 'high', 'medium', 'low'];
      const maya = getPatientById('P001');

      for (const gap of maya?.careGaps || []) {
        expect(validUrgencies).toContain(gap.urgency);
      }
    });

    it('should have valid categories', () => {
      const validCategories = [
        'immunization',
        'documentation',
        'specialist_referral',
        'lab_work',
        'screening',
        'care_summary',
        'medication_reconciliation'
      ];
      const maya = getPatientById('P001');

      for (const gap of maya?.careGaps || []) {
        expect(validCategories).toContain(gap.category);
      }
    });
  });
});

describe('Patient Scenario Coverage', () => {
  it('Maya should represent standard transition case', () => {
    const maya = getPatientById('P001');

    // Maya is 17, has diabetes, moderate readiness
    expect(maya?.readinessAssessment.overallScore).toBeLessThan(0.8);
    expect(maya?.readinessAssessment.overallScore).toBeGreaterThan(0.5);
    expect(maya?.careGaps?.length).toBeGreaterThan(0);
  });

  it('Marcus should represent early planning case', () => {
    const marcus = getPatientById('P002');

    // Marcus is 16, lower readiness, more gaps
    expect(marcus?.readinessAssessment.overallScore).toBeLessThan(0.6);
    expect(marcus?.readinessAssessment.gaps.length).toBeGreaterThan(2);
  });

  it('Sophia should represent crisis/urgent case', () => {
    const sophia = getPatientById('P003');

    // Sophia is 18, has aged out, higher readiness but urgent
    expect(sophia?.readinessAssessment.overallScore).toBeGreaterThan(0.7);
    expect(sophia?.readinessAssessment.recommendations.some(r =>
      r.toLowerCase().includes('urgent')
    )).toBe(true);
  });
});
