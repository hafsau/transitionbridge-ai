/**
 * Tests for Synthetic Patient Data
 */

import { describe, it, expect } from 'vitest';
import {
  getPatientById,
  getAllPatients,
  getTransitionEligiblePatients,
  calculateAge
} from '../data/synthetic-patients.js';

describe('Synthetic Patient Data', () => {
  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const birthDate = '2009-03-15';
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThanOrEqual(16);
      expect(age).toBeLessThanOrEqual(18);
    });

    it('should handle edge cases', () => {
      const today = new Date();
      const birthDate = `${today.getFullYear() - 17}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const age = calculateAge(birthDate);
      expect(age).toBe(17);
    });
  });

  describe('getPatientById', () => {
    it('should return Maya (P001)', () => {
      const patient = getPatientById('P001');
      expect(patient).toBeDefined();
      expect(patient?.patient.id).toBe('P001');
      expect(patient?.patient.name?.[0]?.family).toBe('Chen');
    });

    it('should return Marcus (P002)', () => {
      const patient = getPatientById('P002');
      expect(patient).toBeDefined();
      expect(patient?.patient.id).toBe('P002');
      expect(patient?.patient.name?.[0]?.family).toBe('Johnson');
    });

    it('should return Sophia (P003)', () => {
      const patient = getPatientById('P003');
      expect(patient).toBeDefined();
      expect(patient?.patient.id).toBe('P003');
      expect(patient?.patient.name?.[0]?.family).toBe('Martinez');
    });

    it('should return undefined for non-existent patient', () => {
      const patient = getPatientById('INVALID');
      expect(patient).toBeUndefined();
    });
  });

  describe('getAllPatients', () => {
    it('should return all 3 patients', () => {
      const patients = getAllPatients();
      expect(patients).toHaveLength(3);
    });

    it('should have complete patient data', () => {
      const patients = getAllPatients();
      for (const p of patients) {
        expect(p.patient).toBeDefined();
        expect(p.conditions).toBeDefined();
        expect(p.conditions.length).toBeGreaterThan(0);
        expect(p.immunizations).toBeDefined();
        expect(p.readinessAssessment).toBeDefined();
        expect(p.careGaps).toBeDefined();
      }
    });
  });

  describe('getTransitionEligiblePatients', () => {
    it('should return patients aged 12-26', () => {
      const eligible = getTransitionEligiblePatients();
      expect(eligible.length).toBeGreaterThan(0);

      for (const p of eligible) {
        const age = calculateAge(p.patient.birthDate || '');
        expect(age).toBeGreaterThanOrEqual(12);
        expect(age).toBeLessThanOrEqual(26);
      }
    });
  });

  describe('Patient Data Integrity', () => {
    it('Maya should have Type 1 Diabetes condition', () => {
      const maya = getPatientById('P001');
      const conditions = maya?.conditions.map(c => c.code?.text?.toLowerCase() || '');
      expect(conditions?.some(c => c.includes('diabetes'))).toBe(true);
    });

    it('Marcus should have heart condition', () => {
      const marcus = getPatientById('P002');
      const conditions = marcus?.conditions.map(c => c.code?.text?.toLowerCase() || '');
      expect(conditions?.some(c => c.includes('tetralogy') || c.includes('heart'))).toBe(true);
    });

    it('Sophia should have Cystic Fibrosis', () => {
      const sophia = getPatientById('P003');
      const conditions = sophia?.conditions.map(c => c.code?.text?.toLowerCase() || '');
      expect(conditions?.some(c => c.includes('cystic fibrosis'))).toBe(true);
    });

    it('All patients should have readiness assessments', () => {
      const patients = getAllPatients();
      for (const p of patients) {
        expect(p.readinessAssessment).toBeDefined();
        expect(p.readinessAssessment.overallScore).toBeGreaterThanOrEqual(0);
        expect(p.readinessAssessment.overallScore).toBeLessThanOrEqual(1);
      }
    });

    it('Readiness assessments should have domain scores', () => {
      const patients = getAllPatients();
      for (const p of patients) {
        const domains = p.readinessAssessment.domainScores;
        expect(domains).toBeDefined();
        expect(domains['managing-medications']).toBeDefined();
        expect(domains['appointment-keeping']).toBeDefined();
      }
    });
  });
});
