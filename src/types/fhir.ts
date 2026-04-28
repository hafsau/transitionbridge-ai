/**
 * FHIR R4 Type Definitions for TransitionBridge AI
 * Simplified types for healthcare transition workflows
 */

// Base FHIR Types
export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
}

export interface Reference {
  reference?: string;
  type?: string;
  display?: string;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Coding {
  system?: string;
  code?: string;
  display?: string;
}

export interface Period {
  start?: string;
  end?: string;
}

export interface HumanName {
  use?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
}

export interface Address {
  use?: string;
  type?: string;
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface ContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

// Patient Resource
export interface Patient extends FHIRResource {
  resourceType: 'Patient';
  identifier?: { system?: string; value?: string }[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: Address[];
  maritalStatus?: CodeableConcept;
  contact?: PatientContact[];
  generalPractitioner?: Reference[];
}

export interface PatientContact {
  relationship?: CodeableConcept[];
  name?: HumanName;
  telecom?: ContactPoint[];
  address?: Address;
}

// Condition Resource
export interface Condition extends FHIRResource {
  resourceType: 'Condition';
  clinicalStatus?: CodeableConcept;
  verificationStatus?: CodeableConcept;
  category?: CodeableConcept[];
  severity?: CodeableConcept;
  code?: CodeableConcept;
  subject: Reference;
  onsetDateTime?: string;
  onsetAge?: { value: number; unit: string };
  recordedDate?: string;
  note?: { text: string }[];
}

// Observation Resource (for assessments)
export interface Observation extends FHIRResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: CodeableConcept[];
  code: CodeableConcept;
  subject: Reference;
  effectiveDateTime?: string;
  valueQuantity?: { value: number; unit?: string; system?: string; code?: string };
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueInteger?: number;
  interpretation?: CodeableConcept[];
  component?: ObservationComponent[];
}

export interface ObservationComponent {
  code: CodeableConcept;
  valueQuantity?: { value: number; unit?: string };
  valueCodeableConcept?: CodeableConcept;
  valueString?: string;
  valueInteger?: number;
}

// QuestionnaireResponse (for TRAQ assessments)
export interface QuestionnaireResponse extends FHIRResource {
  resourceType: 'QuestionnaireResponse';
  questionnaire?: string;
  status: 'in-progress' | 'completed' | 'amended' | 'entered-in-error' | 'stopped';
  subject?: Reference;
  authored?: string;
  author?: Reference;
  item?: QuestionnaireResponseItem[];
}

export interface QuestionnaireResponseItem {
  linkId: string;
  text?: string;
  answer?: QuestionnaireResponseAnswer[];
  item?: QuestionnaireResponseItem[];
}

export interface QuestionnaireResponseAnswer {
  valueBoolean?: boolean;
  valueDecimal?: number;
  valueInteger?: number;
  valueString?: string;
  valueCoding?: Coding;
}

// Immunization Resource
export interface Immunization extends FHIRResource {
  resourceType: 'Immunization';
  status: 'completed' | 'entered-in-error' | 'not-done';
  vaccineCode: CodeableConcept;
  patient: Reference;
  occurrenceDateTime?: string;
  primarySource?: boolean;
  note?: { text: string }[];
}

// DocumentReference Resource
export interface DocumentReference extends FHIRResource {
  resourceType: 'DocumentReference';
  status: 'current' | 'superseded' | 'entered-in-error';
  type?: CodeableConcept;
  category?: CodeableConcept[];
  subject?: Reference;
  date?: string;
  author?: Reference[];
  description?: string;
  content: {
    attachment: {
      contentType?: string;
      data?: string;
      url?: string;
      title?: string;
    };
  }[];
}

// Practitioner Resource
export interface Practitioner extends FHIRResource {
  resourceType: 'Practitioner';
  identifier?: { system?: string; value?: string }[];
  active?: boolean;
  name?: HumanName[];
  telecom?: ContactPoint[];
  address?: Address[];
  gender?: string;
  qualification?: {
    code: CodeableConcept;
    period?: Period;
    issuer?: Reference;
  }[];
}

// PractitionerRole Resource
export interface PractitionerRole extends FHIRResource {
  resourceType: 'PractitionerRole';
  active?: boolean;
  period?: Period;
  practitioner?: Reference;
  organization?: Reference;
  code?: CodeableConcept[];
  specialty?: CodeableConcept[];
  location?: Reference[];
  healthcareService?: Reference[];
  availableTime?: {
    daysOfWeek?: string[];
    allDay?: boolean;
    availableStartTime?: string;
    availableEndTime?: string;
  }[];
}

// Organization Resource
export interface Organization extends FHIRResource {
  resourceType: 'Organization';
  identifier?: { system?: string; value?: string }[];
  active?: boolean;
  type?: CodeableConcept[];
  name?: string;
  telecom?: ContactPoint[];
  address?: Address[];
}

// Appointment Resource
export interface Appointment extends FHIRResource {
  resourceType: 'Appointment';
  status: 'proposed' | 'pending' | 'booked' | 'arrived' | 'fulfilled' | 'cancelled' | 'noshow' | 'entered-in-error' | 'checked-in' | 'waitlist';
  serviceCategory?: CodeableConcept[];
  serviceType?: CodeableConcept[];
  specialty?: CodeableConcept[];
  appointmentType?: CodeableConcept;
  start?: string;
  end?: string;
  participant: {
    type?: CodeableConcept[];
    actor?: Reference;
    required?: 'required' | 'optional' | 'information-only';
    status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }[];
  description?: string;
}

// CarePlan Resource
export interface CarePlan extends FHIRResource {
  resourceType: 'CarePlan';
  status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error' | 'unknown';
  intent: 'proposal' | 'plan' | 'order' | 'option';
  category?: CodeableConcept[];
  title?: string;
  description?: string;
  subject: Reference;
  period?: Period;
  created?: string;
  author?: Reference;
  goal?: Reference[];
  activity?: {
    detail?: {
      kind?: string;
      code?: CodeableConcept;
      status: string;
      description?: string;
      scheduledPeriod?: Period;
    };
  }[];
}

// Composition Resource (for transition summary)
export interface Composition extends FHIRResource {
  resourceType: 'Composition';
  status: 'preliminary' | 'final' | 'amended' | 'entered-in-error';
  type: CodeableConcept;
  category?: CodeableConcept[];
  subject?: Reference;
  date: string;
  author: Reference[];
  title: string;
  section?: {
    title?: string;
    code?: CodeableConcept;
    text?: { status: string; div: string };
    entry?: Reference[];
  }[];
}
