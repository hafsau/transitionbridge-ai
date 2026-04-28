/**
 * Transition-specific types for TransitionBridge AI
 * Based on Got Transition and AAP guidelines
 */

// TRAQ (Transition Readiness Assessment Questionnaire) domains
export type TRAQDomain =
  | 'managing-medications'
  | 'appointment-keeping'
  | 'tracking-health-issues'
  | 'talking-with-providers'
  | 'managing-daily-activities';

// Legacy domain names for MCP server compatibility
export type TRAQDomainLegacy =
  | 'managing_medications'
  | 'appointment_keeping'
  | 'tracking_health_issues'
  | 'talking_with_providers'
  | 'managing_daily_activities';

// TRAQ Question structure
export interface TRAQQuestion {
  id: string;
  domain: TRAQDomain;
  text: string;
  minScore: 1;
  maxScore: 5;
}

// TRAQ Response
export interface TRAQResponse {
  questionId: string;
  score: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

// Readiness Assessment Result
export interface ReadinessAssessment {
  patientId: string;
  assessmentDate: string;
  traqVersion?: string;
  overallScore: number; // 0-1 (percentage as decimal)
  domainScores: Record<TRAQDomain, number> | any; // 0-1 for each domain, or array format
  gaps: string[] | any[]; // Domain names that need work, or detailed gap objects
  recommendations: string[];
  nextAssessmentDate?: string;
}

// Care Gap Types
export type CareGapCategory =
  | 'immunization'
  | 'documentation'
  | 'specialist_referral'
  | 'lab_work'
  | 'screening'
  | 'care_summary'
  | 'medication_reconciliation';

export type UrgencyLevel = 'urgent' | 'high' | 'medium' | 'low';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface CareGap {
  id: string;
  category: CareGapCategory;
  title?: string;
  description: string;
  urgency?: UrgencyLevel;
  priority?: PriorityLevel;
  actionRequired?: string;
  estimatedTimeToResolve?: string;
  dueDate?: string;
  status?: 'open' | 'in_progress' | 'resolved';
  requiredForTransition?: boolean;
  relatedConditions?: string[];
}

export interface CareGapReport {
  patientId: string;
  generatedDate: string;
  totalGaps: number;
  criticalGaps: number;
  gaps: CareGap[];
  completionPercentage: number;
  readyForTransition: boolean;
  blockers: string[];
}

// Provider Matching Types
export interface ProviderLocation {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  distance: number;
}

export interface ProviderMatch {
  providerId: string;
  practitionerId?: string;
  name: string;
  practitionerName?: string;
  specialty: string;
  subspecialty?: string;
  organization: string;
  location: ProviderLocation;
  address?: string;
  phone?: string;
  distanceMiles?: number;
  acceptsInsurance: string[] | boolean;
  transitionExperience: 'high' | 'medium' | 'low' | 'unknown';
  nextAvailability: string;
  nextAvailableDate?: string;
  waitTimeWeeks: number;
  rating: number;
  patientReviews: number;
  specialNotes?: string;
  score?: number;
  matchScore?: number;
  matchReasons?: string[];
}

export interface ProviderMatchCriteria {
  patientId: string;
  conditions: string[];
  location: {
    zipCode?: string;
    city?: string;
    state?: string;
    maxDistanceMiles?: number;
  };
  insurance?: {
    payerId?: string;
    planName?: string;
  };
}

export interface ProviderMatchResult {
  patientId: string;
  searchCriteria: ProviderMatchCriteria;
  matches: ProviderMatch[];
  totalMatches: number;
  recommendedProvider?: ProviderMatch;
}

// Transition Package Types
export interface TransitionPackage {
  id?: string;
  patientId: string;
  patientName?: string;
  createdDate?: string;
  generatedDate?: string;
  status?: 'draft' | 'pending_review' | 'approved' | 'sent';
  pediatricProvider: {
    name: string;
    specialty: string;
    organization: string;
    phone?: string;
    fax?: string;
  };
  adultProvider: {
    name: string;
    specialty: string;
    organization: string;
    phone?: string;
    fax?: string;
  };
  diagnoses: Array<{
    code: string;
    description: string;
    onsetDate: string;
    status: string;
  }>;
  medications: Array<{
    name: string;
    dose: string;
    frequency: string;
    route?: string;
  }>;
  allergies: Array<{
    allergen: string;
    reaction: string;
    severity: 'mild' | 'moderate' | 'severe' | 'N/A' | string;
  }>;
  immunizations?: Array<{
    vaccine: string;
    date: string;
    status: 'completed' | 'due' | 'overdue';
  }>;
  readinessScore?: number;
  readinessSummary?: any;
  completedEducation?: string[];
  checklistStatus?: Array<{
    id: string;
    label: string;
    critical: boolean;
    completed: boolean;
  }>;
  specialInstructions?: string[] | string;
  emergencyPlan?: {
    emergencyContacts: Array<{
      name: string;
      relationship: string;
      phone: string;
    }>;
    warningSignsToReport: string[];
    whenToSeekEmergencyCare: string[];
    emergencyMedications: string[];
  };
  careTeam?: any[];
  patientSummary?: any;
  medicalSummary?: any;
  receivingProvider?: any;
  attachments?: any[];
  [key: string]: any; // Allow additional properties
}

// Warm Handoff Types
export interface WarmHandoff {
  id?: string;
  handoffId?: string;
  patientId: string;
  scheduledDate: string;
  scheduledTime?: string;
  meetingType?: 'joint-visit' | 'phone-conference' | 'virtual' | 'joint_visit';
  pediatricProvider: {
    name: string;
    role?: string;
    specialty?: string;
    organization?: string;
    attendingInPerson?: boolean;
  };
  adultProvider: {
    name: string;
    role?: string;
    specialty?: string;
    organization?: string;
    attendingInPerson?: boolean;
  };
  patientAttending?: boolean;
  familyAttending?: boolean;
  location?: string;
  agenda?: string[];
  documentsToReview?: string[];
  appointments?: Array<{
    type: 'joint_visit' | 'pediatric_final' | 'adult_initial';
    date: string;
    location?: string;
    notes?: string;
    status: 'scheduled' | 'completed' | 'cancelled';
  }>;
  followUpPlan?: {
    firstAdultVisit: string;
    phoneCheckIn: string;
    pediatricFinalVisit: string;
  };
  transitionPackageSent?: boolean;
  transitionPackageSentDate?: string;
  followUpScheduled?: boolean;
  followUpDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

// Transition Timeline
export interface TransitionMilestone {
  id: string;
  title: string;
  description: string;
  targetAge?: number;
  dueDate?: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  completedDate?: string;
  category: 'assessment' | 'education' | 'documentation' | 'provider' | 'handoff';
}

export interface TransitionTimeline {
  patientId: string;
  transitionStartAge: number;
  targetTransitionAge: number;
  currentPhase: 'early' | 'middle' | 'late' | 'post_transition';
  milestones: TransitionMilestone[];
  completedMilestones: number;
  totalMilestones: number;
  onTrack: boolean;
  nextMilestone?: TransitionMilestone;
}
