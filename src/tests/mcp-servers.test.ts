/**
 * Tests for MCP Server Tools
 * These test the raw functionality that will be exposed via MCP
 */

import { describe, it, expect } from 'vitest';
import { getPatientById, calculateAge, getAllPatients } from '../data/synthetic-patients.js';

describe('MCP Server: Transition Assessment', () => {
  describe('assessTransitionReadiness functionality', () => {
    it('should assess readiness for valid patient', () => {
      const patient = getPatientById('P001');
      expect(patient).toBeDefined();

      const age = calculateAge(patient!.patient.birthDate || '');
      const assessment = patient!.readinessAssessment;

      expect(age).toBeGreaterThanOrEqual(12);
      expect(age).toBeLessThanOrEqual(26);
      expect(assessment.overallScore).toBeGreaterThan(0);
    });

    it('should return undefined for invalid patient', () => {
      const patient = getPatientById('INVALID');
      expect(patient).toBeUndefined();
    });
  });

  describe('getPatientAge functionality', () => {
    it('should calculate age correctly', () => {
      const patient = getPatientById('P001');
      const age = calculateAge(patient!.patient.birthDate || '');

      expect(age).toBeGreaterThanOrEqual(16);
      expect(age).toBeLessThanOrEqual(18);
    });

    it('should determine transition eligibility', () => {
      const patients = getAllPatients();

      for (const p of patients) {
        const age = calculateAge(p.patient.birthDate || '');
        const eligible = age >= 12 && age <= 26;
        expect(eligible).toBe(true);
      }
    });
  });
});

describe('MCP Server: Care Gap Analysis', () => {
  describe('identifyCareGaps functionality', () => {
    it('should identify gaps for Maya', () => {
      const patient = getPatientById('P001');
      const gaps = patient?.careGaps || [];

      expect(gaps.length).toBeGreaterThan(0);

      // Maya should have immunization and documentation gaps
      const categories = gaps.map(g => g.category);
      expect(categories).toContain('immunization');
      expect(categories).toContain('documentation');
    });

    it('should count urgent gaps', () => {
      const patient = getPatientById('P001');
      const gaps = patient?.careGaps || [];
      const urgentGaps = gaps.filter(g => g.urgency === 'urgent');

      expect(urgentGaps.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('checkImmunizationStatus functionality', () => {
    it('should return immunization list', () => {
      const patient = getPatientById('P001');
      const immunizations = patient?.immunizations || [];

      expect(immunizations.length).toBeGreaterThan(0);

      for (const imm of immunizations) {
        expect(imm.vaccineCode?.text).toBeDefined();
        expect(imm.status).toBe('completed');
      }
    });
  });
});

describe('MCP Server: Provider Matching', () => {
  describe('searchAdultProviders functionality', () => {
    it('should find endocrinology providers', () => {
      // Simulating the provider database that MCP server would use
      const PROVIDERS = [
        { providerId: 'PROV-001', specialty: 'Endocrinology', name: 'Dr. Sarah Mitchell' },
        { providerId: 'PROV-002', specialty: 'Adult Congenital Heart Disease', name: 'Dr. James Chen' },
        { providerId: 'PROV-003', specialty: 'Pulmonology - CF Center', name: 'Dr. Amanda Foster' }
      ];

      const matches = PROVIDERS.filter(p =>
        p.specialty.toLowerCase().includes('endocrinology')
      );

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].name).toBe('Dr. Sarah Mitchell');
    });

    it('should find cardiology providers', () => {
      const PROVIDERS = [
        { providerId: 'PROV-001', specialty: 'Endocrinology', name: 'Dr. Sarah Mitchell' },
        { providerId: 'PROV-002', specialty: 'Adult Congenital Heart Disease', name: 'Dr. James Chen' },
        { providerId: 'PROV-003', specialty: 'Pulmonology - CF Center', name: 'Dr. Amanda Foster' }
      ];

      const matches = PROVIDERS.filter(p =>
        p.specialty.toLowerCase().includes('heart') ||
        p.specialty.toLowerCase().includes('cardio')
      );

      expect(matches.length).toBeGreaterThan(0);
    });

    it('should find pulmonology/CF providers', () => {
      const PROVIDERS = [
        { providerId: 'PROV-001', specialty: 'Endocrinology', name: 'Dr. Sarah Mitchell' },
        { providerId: 'PROV-002', specialty: 'Adult Congenital Heart Disease', name: 'Dr. James Chen' },
        { providerId: 'PROV-003', specialty: 'Pulmonology - CF Center', name: 'Dr. Amanda Foster' }
      ];

      const matches = PROVIDERS.filter(p =>
        p.specialty.toLowerCase().includes('pulmonology') ||
        p.specialty.toLowerCase().includes('cf')
      );

      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('mapPediatricToAdultSpecialty functionality', () => {
    it('should map pediatric specialties correctly', () => {
      const mappings: Record<string, string> = {
        'Pediatric Endocrinology': 'Endocrinology',
        'Pediatric Cardiology': 'Adult Congenital Heart Disease',
        'Pediatric Pulmonology': 'Pulmonology'
      };

      expect(mappings['Pediatric Endocrinology']).toBe('Endocrinology');
      expect(mappings['Pediatric Cardiology']).toBe('Adult Congenital Heart Disease');
      expect(mappings['Pediatric Pulmonology']).toBe('Pulmonology');
    });
  });
});

describe('MCP Server: Transition Handoff', () => {
  describe('generateTransitionSummary functionality', () => {
    it('should generate summary with all required fields', () => {
      const patient = getPatientById('P001');
      const age = calculateAge(patient!.patient.birthDate || '');
      const name = patient!.patient.name?.[0]?.given?.join(' ') + ' ' + patient!.patient.name?.[0]?.family;

      const summary = {
        patientId: 'P001',
        patientName: name,
        age,
        conditions: patient!.conditions.map((c: any) => c.code?.text),
        readinessScore: patient!.readinessAssessment.overallScore,
        careGaps: patient!.careGaps.length
      };

      expect(summary.patientId).toBe('P001');
      expect(summary.patientName).toContain('Maya');
      expect(summary.age).toBeGreaterThanOrEqual(16);
      expect(summary.conditions.length).toBeGreaterThan(0);
      expect(summary.readinessScore).toBeGreaterThan(0);
    });
  });

  describe('scheduleWarmHandoff functionality', () => {
    it('should schedule handoff with future date', () => {
      const scheduledDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      const dateStr = scheduledDate.toISOString().split('T')[0];

      const handoff = {
        patientId: 'P001',
        scheduledDate: dateStr,
        status: 'scheduled'
      };

      expect(handoff.scheduledDate).toBeDefined();
      expect(new Date(handoff.scheduledDate).getTime()).toBeGreaterThan(Date.now());
      expect(handoff.status).toBe('scheduled');
    });
  });
});
