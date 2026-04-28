/**
 * Synthetic Patient Data for TransitionBridge AI
 * Demo patients with chronic conditions requiring transition
 */

import type { Patient, Condition, Immunization } from '../types/fhir.js';
import type { ReadinessAssessment, CareGap, TRAQDomain } from '../types/transition.js';

// Helper to calculate age from birthdate
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// ============================================
// Patient 1: Maya - Type 1 Diabetes
// ============================================
export const mayaPatient: Patient = {
  resourceType: 'Patient',
  id: 'P001',
  identifier: [{ system: 'http://hospital.example.org/mrn', value: 'MRN-2009-4521' }],
  active: true,
  name: [{ use: 'official', family: 'Chen', given: ['Maya', 'Lin'] }],
  telecom: [
    { system: 'phone', value: '555-0123', use: 'home' },
    { system: 'email', value: 'maya.chen@email.com' }
  ],
  gender: 'female',
  birthDate: '2009-03-15',
  address: [{
    use: 'home',
    line: ['123 Oak Street'],
    city: 'Portland',
    state: 'OR',
    postalCode: '97201'
  }],
  contact: [{
    relationship: [{ coding: [{ code: 'parent', display: 'Parent' }] }],
    name: { family: 'Chen', given: ['Jennifer'] },
    telecom: [{ system: 'phone', value: '555-0124', use: 'mobile' }]
  }],
  generalPractitioner: [{ reference: 'Practitioner/dr-peds-endo-001', display: 'Dr. Sarah Martinez' }]
};

export const mayaConditions: Condition[] = [
  {
    resourceType: 'Condition',
    id: 'condition-maya-t1d',
    clinicalStatus: { coding: [{ code: 'active', display: 'Active' }] },
    verificationStatus: { coding: [{ code: 'confirmed', display: 'Confirmed' }] },
    category: [{ coding: [{ code: 'problem-list-item', display: 'Problem List Item' }] }],
    code: {
      coding: [{ system: 'http://snomed.info/sct', code: '46635009', display: 'Type 1 diabetes mellitus' }],
      text: 'Type 1 Diabetes Mellitus'
    },
    subject: { reference: 'Patient/P001' },
    onsetDateTime: '2017-06-20',
    recordedDate: '2017-06-20',
    note: [{ text: 'Diagnosed at age 8. On insulin pump therapy since 2019. Good glycemic control.' }]
  }
];

export const mayaImmunizations: Immunization[] = [
  {
    resourceType: 'Immunization',
    id: 'imm-maya-tdap',
    status: 'completed',
    vaccineCode: { coding: [{ code: 'Tdap', display: 'Tdap Vaccine' }], text: 'Tdap' },
    patient: { reference: 'Patient/P001' },
    occurrenceDateTime: '2020-03-15'
  },
  {
    resourceType: 'Immunization',
    id: 'imm-maya-hpv1',
    status: 'completed',
    vaccineCode: { coding: [{ code: 'HPV', display: 'HPV Vaccine' }], text: 'HPV Dose 1' },
    patient: { reference: 'Patient/P001' },
    occurrenceDateTime: '2020-03-15'
  },
  {
    resourceType: 'Immunization',
    id: 'imm-maya-hpv2',
    status: 'completed',
    vaccineCode: { coding: [{ code: 'HPV', display: 'HPV Vaccine' }], text: 'HPV Dose 2' },
    patient: { reference: 'Patient/P001' },
    occurrenceDateTime: '2020-09-15'
  }
];

export const mayaReadinessAssessment: ReadinessAssessment = {
  patientId: 'P001',
  assessmentDate: '2026-03-01',
  traqVersion: '5.0',
  overallScore: 0.62,
  domainScores: {
    'managing-medications': 0.75,
    'appointment-keeping': 0.50,
    'tracking-health-issues': 0.70,
    'talking-with-providers': 0.55,
    'managing-daily-activities': 0.60
  },
  gaps: ['appointment-keeping', 'talking-with-providers'],
  recommendations: [
    'Begin transition planning discussions at next visit',
    'Introduce adult endocrinology provider options',
    'Complete missing immunizations before transition',
    'Schedule overlapping visit with adult provider'
  ],
  nextAssessmentDate: '2026-06-01'
};

export const mayaCareGaps: CareGap[] = [
  {
    id: 'gap-maya-immunization-001',
    category: 'immunization',
    description: 'Meningococcal booster due at age 16, currently overdue',
    urgency: 'high',
    actionRequired: 'Schedule meningococcal vaccination',
    estimatedTimeToResolve: '1-2 weeks',
    status: 'open'
  },
  {
    id: 'gap-maya-documentation-001',
    category: 'documentation',
    description: 'No comprehensive portable medical summary exists',
    urgency: 'urgent',
    actionRequired: 'Generate portable medical summary for transition',
    estimatedTimeToResolve: '1 week',
    status: 'open'
  },
  {
    id: 'gap-maya-referral-001',
    category: 'specialist_referral',
    description: 'Need to identify and schedule with adult endocrinologist',
    urgency: 'high',
    actionRequired: 'Search for and schedule with adult endocrinologist',
    estimatedTimeToResolve: '2-4 weeks',
    status: 'open',
    relatedConditions: ['Type 1 Diabetes']
  },
  {
    id: 'gap-maya-screening-001',
    category: 'screening',
    description: 'Diabetic retinopathy screening due annually',
    urgency: 'medium',
    actionRequired: 'Schedule annual eye exam',
    estimatedTimeToResolve: '2-3 weeks',
    status: 'open',
    relatedConditions: ['Type 1 Diabetes']
  }
];

// ============================================
// Patient 2: Marcus - Congenital Heart Disease
// ============================================
export const marcusPatient: Patient = {
  resourceType: 'Patient',
  id: 'P002',
  identifier: [{ system: 'http://hospital.example.org/mrn', value: 'MRN-2010-7832' }],
  active: true,
  name: [{ use: 'official', family: 'Johnson', given: ['Marcus', 'Andre'] }],
  telecom: [
    { system: 'phone', value: '555-0456', use: 'home' },
    { system: 'email', value: 'marcus.j@email.com' }
  ],
  gender: 'male',
  birthDate: '2010-08-22',
  address: [{
    use: 'home',
    line: ['456 Maple Avenue'],
    city: 'Seattle',
    state: 'WA',
    postalCode: '98101'
  }],
  contact: [{
    relationship: [{ coding: [{ code: 'parent', display: 'Parent' }] }],
    name: { family: 'Johnson', given: ['Michelle'] },
    telecom: [{ system: 'phone', value: '555-0457', use: 'mobile' }]
  }]
};

export const marcusConditions: Condition[] = [
  {
    resourceType: 'Condition',
    id: 'condition-marcus-tof',
    clinicalStatus: { coding: [{ code: 'active', display: 'Active' }] },
    verificationStatus: { coding: [{ code: 'confirmed', display: 'Confirmed' }] },
    code: {
      coding: [{ system: 'http://snomed.info/sct', code: '86299006', display: 'Tetralogy of Fallot' }],
      text: 'Tetralogy of Fallot (Repaired)'
    },
    subject: { reference: 'Patient/P002' },
    onsetDateTime: '2010-08-22',
    note: [{ text: 'Complete surgical repair at 6 months. Mild pulmonary regurgitation. Annual cardiology follow-up.' }]
  },
  {
    resourceType: 'Condition',
    id: 'condition-marcus-pr',
    clinicalStatus: { coding: [{ code: 'active', display: 'Active' }] },
    code: {
      coding: [{ system: 'http://snomed.info/sct', code: '79619009', display: 'Pulmonary valve regurgitation' }],
      text: 'Mild Pulmonary Regurgitation'
    },
    subject: { reference: 'Patient/P002' },
    onsetDateTime: '2015-01-01',
    note: [{ text: 'Residual from TOF repair. Stable on echo. May need pulmonary valve replacement in future.' }]
  }
];

export const marcusImmunizations: Immunization[] = [
  {
    resourceType: 'Immunization',
    id: 'imm-marcus-tdap',
    status: 'completed',
    vaccineCode: { coding: [{ code: 'Tdap', display: 'Tdap Vaccine' }], text: 'Tdap' },
    patient: { reference: 'Patient/P002' },
    occurrenceDateTime: '2021-08-22'
  }
];

export const marcusReadinessAssessment: ReadinessAssessment = {
  patientId: 'P002',
  assessmentDate: '2026-02-15',
  traqVersion: '5.0',
  overallScore: 0.45,
  domainScores: {
    'managing-medications': 0.40,
    'appointment-keeping': 0.35,
    'tracking-health-issues': 0.50,
    'talking-with-providers': 0.45,
    'managing-daily-activities': 0.55
  },
  gaps: ['managing-medications', 'appointment-keeping', 'talking-with-providers'],
  recommendations: [
    'Begin formal transition education - 2 years until target transition',
    'Ensure understanding of lifelong cardiac follow-up needs',
    'Discuss activity restrictions and endocarditis prevention',
    'Start identifying adult congenital heart disease (ACHD) programs'
  ],
  nextAssessmentDate: '2026-08-15'
};

export const marcusCareGaps: CareGap[] = [
  {
    id: 'gap-marcus-documentation-001',
    category: 'documentation',
    description: 'Cardiac emergency action plan needs updating',
    urgency: 'high',
    actionRequired: 'Update emergency action plan with current provider',
    estimatedTimeToResolve: '1 week',
    status: 'open'
  }
];

// ============================================
// Patient 3: Sophia - Cystic Fibrosis (Crisis Case)
// ============================================
export const sophiaPatient: Patient = {
  resourceType: 'Patient',
  id: 'P003',
  identifier: [{ system: 'http://hospital.example.org/mrn', value: 'MRN-2008-1234' }],
  active: true,
  name: [{ use: 'official', family: 'Martinez', given: ['Sophia', 'Rose'] }],
  telecom: [
    { system: 'phone', value: '555-0789', use: 'mobile' },
    { system: 'email', value: 'sophia.m@email.com' }
  ],
  gender: 'female',
  birthDate: '2008-01-10',
  address: [{
    use: 'home',
    line: ['789 Pine Road'],
    city: 'Denver',
    state: 'CO',
    postalCode: '80201'
  }]
};

export const sophiaConditions: Condition[] = [
  {
    resourceType: 'Condition',
    id: 'condition-sophia-cf',
    clinicalStatus: { coding: [{ code: 'active', display: 'Active' }] },
    code: {
      coding: [{ system: 'http://snomed.info/sct', code: '190905008', display: 'Cystic fibrosis' }],
      text: 'Cystic Fibrosis'
    },
    subject: { reference: 'Patient/P003' },
    onsetDateTime: '2008-03-15',
    note: [{ text: 'F508del homozygous. On CFTR modulator therapy. Recent decline in FEV1.' }]
  },
  {
    resourceType: 'Condition',
    id: 'condition-sophia-cfrd',
    clinicalStatus: { coding: [{ code: 'active', display: 'Active' }] },
    code: {
      coding: [{ system: 'http://snomed.info/sct', code: '426875007', display: 'CF-related diabetes' }],
      text: 'CF-Related Diabetes (CFRD)'
    },
    subject: { reference: 'Patient/P003' },
    onsetDateTime: '2024-06-01',
    note: [{ text: 'Diagnosed at age 16. On mealtime insulin.' }]
  }
];

export const sophiaImmunizations: Immunization[] = [
  {
    resourceType: 'Immunization',
    id: 'imm-sophia-tdap',
    status: 'completed',
    vaccineCode: { coding: [{ code: 'Tdap', display: 'Tdap Vaccine' }], text: 'Tdap' },
    patient: { reference: 'Patient/P003' },
    occurrenceDateTime: '2019-01-10'
  },
  {
    resourceType: 'Immunization',
    id: 'imm-sophia-flu',
    status: 'completed',
    vaccineCode: { coding: [{ code: 'Flu', display: 'Influenza Vaccine' }], text: 'Influenza' },
    patient: { reference: 'Patient/P003' },
    occurrenceDateTime: '2025-10-15'
  }
];

export const sophiaReadinessAssessment: ReadinessAssessment = {
  patientId: 'P003',
  assessmentDate: '2026-01-20',
  traqVersion: '5.0',
  overallScore: 0.78,
  domainScores: {
    'managing-medications': 0.85,
    'appointment-keeping': 0.70,
    'tracking-health-issues': 0.90,
    'talking-with-providers': 0.75,
    'managing-daily-activities': 0.70
  },
  gaps: ['appointment-keeping'],
  recommendations: [
    'URGENT: Patient has aged out of pediatric care',
    'Schedule immediate warm handoff to adult CF center',
    'Ensure adult pulmonology and endocrinology coordinated',
    'Transfer pharmacy and insurance information'
  ],
  nextAssessmentDate: '2026-02-20'
};

export const sophiaCareGaps: CareGap[] = [
  {
    id: 'gap-sophia-referral-001',
    category: 'specialist_referral',
    description: 'URGENT: Needs immediate transfer to adult CF center',
    urgency: 'urgent',
    actionRequired: 'Contact adult CF center for emergency transfer',
    estimatedTimeToResolve: '1-2 weeks',
    status: 'open',
    relatedConditions: ['Cystic Fibrosis']
  }
];

// ============================================
// Data Access Functions
// ============================================

export interface PatientData {
  patient: Patient;
  conditions: Condition[];
  immunizations: Immunization[];
  readinessAssessment: ReadinessAssessment;
  careGaps: CareGap[];
}

const patientsDatabase: Map<string, PatientData> = new Map([
  ['P001', {
    patient: mayaPatient,
    conditions: mayaConditions,
    immunizations: mayaImmunizations,
    readinessAssessment: mayaReadinessAssessment,
    careGaps: mayaCareGaps
  }],
  ['P002', {
    patient: marcusPatient,
    conditions: marcusConditions,
    immunizations: marcusImmunizations,
    readinessAssessment: marcusReadinessAssessment,
    careGaps: marcusCareGaps
  }],
  ['P003', {
    patient: sophiaPatient,
    conditions: sophiaConditions,
    immunizations: sophiaImmunizations,
    readinessAssessment: sophiaReadinessAssessment,
    careGaps: sophiaCareGaps
  }]
]);

export function getPatientById(patientId: string): PatientData | undefined {
  return patientsDatabase.get(patientId);
}

export function getAllPatients(): PatientData[] {
  return Array.from(patientsDatabase.values());
}

export function getTransitionEligiblePatients(): PatientData[] {
  return getAllPatients().filter(data => {
    const age = calculateAge(data.patient.birthDate || '');
    return age >= 12 && age <= 26;
  });
}

export function getPatientAge(patientId: string): number | undefined {
  const data = getPatientById(patientId);
  if (!data?.patient.birthDate) return undefined;
  return calculateAge(data.patient.birthDate);
}
