/**
 * Combined MCP Server - HTTP Endpoint for Vercel
 * Exposes all TransitionBridge AI tools via Streamable HTTP
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Synthetic patient data (embedded for serverless deployment)
const PATIENTS: Record<string, any> = {
  "P001": {
    patient: {
      resourceType: "Patient",
      id: "P001",
      name: [{ given: ["Maya"], family: "Chen" }],
      birthDate: "2009-03-15",
      gender: "female",
      telecom: [{ system: "phone", value: "555-0101" }],
      address: [{ city: "Boston", state: "MA" }]
    },
    conditions: [
      { resourceType: "Condition", code: { text: "Type 1 Diabetes Mellitus" }, clinicalStatus: { coding: [{ code: "active" }] }, subject: { reference: "Patient/P001" } }
    ],
    immunizations: [
      { resourceType: "Immunization", vaccineCode: { text: "Tdap" }, status: "completed", patient: { reference: "Patient/P001" } },
      { resourceType: "Immunization", vaccineCode: { text: "HPV" }, status: "completed", patient: { reference: "Patient/P001" } }
    ],
    readinessAssessment: {
      overallScore: 0.65,
      domainScores: {
        "managing-medications": 0.7,
        "appointment-keeping": 0.6,
        "tracking-health-issues": 0.65,
        "talking-with-providers": 0.55,
        "managing-daily-activities": 0.75
      },
      gaps: ["talking-with-providers", "appointment-keeping"],
      recommendations: ["Practice scheduling own appointments", "Role-play conversations with providers"]
    },
    careGaps: [
      { id: "G001", category: "immunization", description: "Missing Meningococcal B vaccine", urgency: "high", actionRequired: "Schedule vaccination" },
      { id: "G002", category: "documentation", description: "Transition summary not prepared", urgency: "urgent", actionRequired: "Prepare comprehensive transition summary" }
    ]
  },
  "P002": {
    patient: {
      resourceType: "Patient",
      id: "P002",
      name: [{ given: ["Marcus"], family: "Johnson" }],
      birthDate: "2010-07-22",
      gender: "male",
      telecom: [{ system: "phone", value: "555-0102" }],
      address: [{ city: "Chicago", state: "IL" }]
    },
    conditions: [
      { resourceType: "Condition", code: { text: "Tetralogy of Fallot (repaired)" }, clinicalStatus: { coding: [{ code: "active" }] }, subject: { reference: "Patient/P002" } }
    ],
    immunizations: [
      { resourceType: "Immunization", vaccineCode: { text: "Flu" }, status: "completed", patient: { reference: "Patient/P002" } }
    ],
    readinessAssessment: {
      overallScore: 0.45,
      domainScores: {
        "managing-medications": 0.4,
        "appointment-keeping": 0.5,
        "tracking-health-issues": 0.45,
        "talking-with-providers": 0.4,
        "managing-daily-activities": 0.5
      },
      gaps: ["managing-medications", "talking-with-providers", "tracking-health-issues"],
      recommendations: ["Begin medication self-management training", "Create health tracking routine", "Start transition planning early"]
    },
    careGaps: [
      { id: "G003", category: "specialist_referral", description: "Adult cardiology referral needed", urgency: "medium", actionRequired: "Identify adult congenital heart specialist" },
      { id: "G004", category: "documentation", description: "Surgical history summary incomplete", urgency: "high", actionRequired: "Complete cardiac surgical history" }
    ]
  },
  "P003": {
    patient: {
      resourceType: "Patient",
      id: "P003",
      name: [{ given: ["Sophia"], family: "Martinez" }],
      birthDate: "2008-01-10",
      gender: "female",
      telecom: [{ system: "phone", value: "555-0103" }],
      address: [{ city: "Houston", state: "TX" }]
    },
    conditions: [
      { resourceType: "Condition", code: { text: "Cystic Fibrosis" }, clinicalStatus: { coding: [{ code: "active" }] }, subject: { reference: "Patient/P003" } }
    ],
    immunizations: [
      { resourceType: "Immunization", vaccineCode: { text: "Pneumococcal" }, status: "completed", patient: { reference: "Patient/P003" } },
      { resourceType: "Immunization", vaccineCode: { text: "Flu" }, status: "completed", patient: { reference: "Patient/P003" } }
    ],
    readinessAssessment: {
      overallScore: 0.78,
      domainScores: {
        "managing-medications": 0.85,
        "appointment-keeping": 0.75,
        "tracking-health-issues": 0.8,
        "talking-with-providers": 0.7,
        "managing-daily-activities": 0.8
      },
      gaps: ["talking-with-providers"],
      recommendations: ["URGENT: Patient has aged out - expedite transition", "Connect with adult CF center immediately"]
    },
    careGaps: [
      { id: "G005", category: "specialist_referral", description: "Adult CF center transfer urgent", urgency: "urgent", actionRequired: "Immediate referral to adult CF program" },
      { id: "G006", category: "care_summary", description: "Complete care summary for transfer", urgency: "urgent", actionRequired: "Prepare comprehensive CF history" }
    ]
  }
};

const PROVIDERS = [
  { providerId: "PROV-001", name: "Dr. Sarah Mitchell", specialty: "Endocrinology", location: "Boston, MA", acceptingPatients: true, transitionExperience: "high" },
  { providerId: "PROV-002", name: "Dr. James Chen", specialty: "Adult Congenital Heart Disease", location: "Chicago, IL", acceptingPatients: true, transitionExperience: "high" },
  { providerId: "PROV-003", name: "Dr. Amanda Foster", specialty: "Pulmonology - CF Center", location: "Houston, TX", acceptingPatients: true, transitionExperience: "high" }
];

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Create the MCP server with all tools
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "transitionbridge-ai",
    version: "1.0.0",
  });

  // === Transition Assessment Tools ===
  server.tool(
    "assessTransitionReadiness",
    "Assess a patient's readiness for pediatric-to-adult care transition using TRAQ (Transition Readiness Assessment Questionnaire)",
    { patientId: z.string().describe("The patient's ID (P001, P002, or P003)") },
    async ({ patientId }) => {
      const patient = PATIENTS[patientId];
      if (!patient) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Patient not found", availablePatients: ["P001", "P002", "P003"] }) }] };
      }
      const age = calculateAge(patient.patient.birthDate);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            patientId,
            patientName: `${patient.patient.name[0].given[0]} ${patient.patient.name[0].family}`,
            age,
            eligible: age >= 12 && age <= 26,
            assessment: patient.readinessAssessment
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    "getPatientAge",
    "Get a patient's age and transition eligibility status",
    { patientId: z.string().describe("The patient's ID") },
    async ({ patientId }) => {
      const patient = PATIENTS[patientId];
      if (!patient) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Patient not found" }) }] };
      }
      const age = calculateAge(patient.patient.birthDate);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            patientId,
            age,
            transitionEligible: age >= 12 && age <= 26,
            yearsUntilAdulthood: age < 18 ? 18 - age : 0,
            status: age >= 18 ? "AGED OUT - Urgent transition needed" : "Pre-transition planning phase"
          }, null, 2)
        }]
      };
    }
  );

  // === Care Gap Analysis Tools ===
  server.tool(
    "identifyCareGaps",
    "Identify gaps in a patient's care that need to be addressed before transition",
    { patientId: z.string().describe("The patient's ID") },
    async ({ patientId }) => {
      const patient = PATIENTS[patientId];
      if (!patient) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Patient not found" }) }] };
      }
      const urgentGaps = patient.careGaps.filter((g: any) => g.urgency === "urgent");
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            patientId,
            totalGaps: patient.careGaps.length,
            urgentCount: urgentGaps.length,
            gaps: patient.careGaps
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    "checkImmunizationStatus",
    "Check a patient's immunization status for adult healthcare transition",
    { patientId: z.string().describe("The patient's ID") },
    async ({ patientId }) => {
      const patient = PATIENTS[patientId];
      if (!patient) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Patient not found" }) }] };
      }
      const immunizationGaps = patient.careGaps.filter((g: any) => g.category === "immunization");
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            patientId,
            completedImmunizations: patient.immunizations.map((i: any) => i.vaccineCode.text),
            missingImmunizations: immunizationGaps.map((g: any) => g.description),
            status: immunizationGaps.length === 0 ? "Complete" : "Gaps identified"
          }, null, 2)
        }]
      };
    }
  );

  // === Provider Matching Tools ===
  server.tool(
    "searchAdultProviders",
    "Search for adult healthcare providers matching specific criteria",
    {
      specialty: z.string().describe("Medical specialty to search for"),
      location: z.string().optional().describe("Location preference")
    },
    async ({ specialty, location }) => {
      const matches = PROVIDERS.filter(p =>
        p.specialty.toLowerCase().includes(specialty.toLowerCase()) ||
        specialty.toLowerCase().includes(p.specialty.toLowerCase().split(" ")[0])
      );
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            searchCriteria: { specialty, location },
            matchCount: matches.length,
            providers: matches
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    "mapPediatricToAdultSpecialty",
    "Map a pediatric condition to appropriate adult specialty",
    { condition: z.string().describe("The pediatric condition") },
    async ({ condition }) => {
      const mappings: Record<string, string> = {
        "diabetes": "Endocrinology",
        "type 1 diabetes": "Endocrinology",
        "heart": "Adult Congenital Heart Disease",
        "tetralogy": "Adult Congenital Heart Disease",
        "cardiac": "Adult Congenital Heart Disease",
        "cystic fibrosis": "Pulmonology - CF Center",
        "cf": "Pulmonology - CF Center",
        "pulmonary": "Pulmonology"
      };
      const conditionLower = condition.toLowerCase();
      let adultSpecialty = "General Internal Medicine";
      for (const [key, value] of Object.entries(mappings)) {
        if (conditionLower.includes(key)) {
          adultSpecialty = value;
          break;
        }
      }
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            pediatricCondition: condition,
            recommendedAdultSpecialty: adultSpecialty,
            matchingProviders: PROVIDERS.filter(p => p.specialty === adultSpecialty)
          }, null, 2)
        }]
      };
    }
  );

  // === Transition Handoff Tools ===
  server.tool(
    "generateTransitionSummary",
    "Generate a comprehensive transition summary package for a patient",
    { patientId: z.string().describe("The patient's ID") },
    async ({ patientId }) => {
      const patient = PATIENTS[patientId];
      if (!patient) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Patient not found" }) }] };
      }
      const age = calculateAge(patient.patient.birthDate);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            transitionSummary: {
              generatedAt: new Date().toISOString(),
              patient: {
                id: patientId,
                name: `${patient.patient.name[0].given[0]} ${patient.patient.name[0].family}`,
                age,
                gender: patient.patient.gender
              },
              conditions: patient.conditions.map((c: any) => c.code.text),
              readinessScore: patient.readinessAssessment.overallScore,
              careGaps: patient.careGaps,
              recommendations: patient.readinessAssessment.recommendations,
              immunizationStatus: patient.immunizations.map((i: any) => i.vaccineCode.text)
            }
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    "scheduleWarmHandoff",
    "Schedule a warm handoff meeting between pediatric and adult care teams",
    {
      patientId: z.string().describe("The patient's ID"),
      adultProviderId: z.string().describe("The adult provider's ID")
    },
    async ({ patientId, adultProviderId }) => {
      const patient = PATIENTS[patientId];
      const provider = PROVIDERS.find(p => p.providerId === adultProviderId);
      if (!patient || !provider) {
        return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Patient or provider not found" }) }] };
      }
      const handoffDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            handoff: {
              status: "scheduled",
              patientId,
              patientName: `${patient.patient.name[0].given[0]} ${patient.patient.name[0].family}`,
              adultProvider: provider.name,
              specialty: provider.specialty,
              scheduledDate: handoffDate.toISOString().split('T')[0],
              type: "warm_handoff",
              notes: "Joint visit with pediatric and adult care teams"
            }
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    "listAvailablePatients",
    "List all available demo patients in the system",
    {},
    async () => {
      const patientList = Object.entries(PATIENTS).map(([id, data]: [string, any]) => ({
        id,
        name: `${data.patient.name[0].given[0]} ${data.patient.name[0].family}`,
        age: calculateAge(data.patient.birthDate),
        condition: data.conditions[0].code.text
      }));
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            description: "TransitionBridge AI Demo Patients",
            patients: patientList
          }, null, 2)
        }]
      };
    }
  );

  return server;
}

// Export for Vercel serverless function
export const mcpServer = createMcpServer();
