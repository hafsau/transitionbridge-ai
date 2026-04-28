/**
 * TransitionBridge AI - MCP Server HTTP Endpoint
 * Vercel Serverless Function for Streamable HTTP Transport
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMcpServer } from './mcp.js';

const server = createMcpServer();

// MCP Protocol message types
interface McpRequest {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: any;
}

interface McpResponse {
  jsonrpc: "2.0";
  id?: string | number;
  result?: any;
  error?: { code: number; message: string; data?: any };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Server info
  if (req.method === 'GET') {
    return res.status(200).json({
      name: "transitionbridge-ai",
      version: "1.0.0",
      description: "Pediatric-to-Adult Care Transition Navigator - Multi-Agent Healthcare AI System",
      protocol: "mcp",
      capabilities: {
        tools: true
      },
      tools: [
        { name: "assessTransitionReadiness", description: "Assess patient readiness for care transition using TRAQ" },
        { name: "getPatientAge", description: "Get patient age and transition eligibility" },
        { name: "identifyCareGaps", description: "Identify care gaps before transition" },
        { name: "checkImmunizationStatus", description: "Check immunization status" },
        { name: "searchAdultProviders", description: "Search for adult healthcare providers" },
        { name: "mapPediatricToAdultSpecialty", description: "Map pediatric condition to adult specialty" },
        { name: "generateTransitionSummary", description: "Generate transition summary package" },
        { name: "scheduleWarmHandoff", description: "Schedule warm handoff meeting" },
        { name: "listAvailablePatients", description: "List available demo patients" }
      ]
    });
  }

  // POST - Handle MCP requests
  if (req.method === 'POST') {
    try {
      const mcpRequest: McpRequest = req.body;

      // Handle initialize
      if (mcpRequest.method === 'initialize') {
        const response: McpResponse = {
          jsonrpc: "2.0",
          id: mcpRequest.id,
          result: {
            protocolVersion: "2024-11-05",
            serverInfo: {
              name: "transitionbridge-ai",
              version: "1.0.0"
            },
            capabilities: {
              tools: {}
            }
          }
        };
        return res.status(200).json(response);
      }

      // Handle tools/list
      if (mcpRequest.method === 'tools/list') {
        const tools = [
          {
            name: "assessTransitionReadiness",
            description: "Assess a patient's readiness for pediatric-to-adult care transition using TRAQ (Transition Readiness Assessment Questionnaire)",
            inputSchema: {
              type: "object",
              properties: { patientId: { type: "string", description: "The patient's ID (P001, P002, or P003)" } },
              required: ["patientId"]
            }
          },
          {
            name: "getPatientAge",
            description: "Get a patient's age and transition eligibility status",
            inputSchema: {
              type: "object",
              properties: { patientId: { type: "string", description: "The patient's ID" } },
              required: ["patientId"]
            }
          },
          {
            name: "identifyCareGaps",
            description: "Identify gaps in a patient's care that need to be addressed before transition",
            inputSchema: {
              type: "object",
              properties: { patientId: { type: "string", description: "The patient's ID" } },
              required: ["patientId"]
            }
          },
          {
            name: "checkImmunizationStatus",
            description: "Check a patient's immunization status for adult healthcare transition",
            inputSchema: {
              type: "object",
              properties: { patientId: { type: "string", description: "The patient's ID" } },
              required: ["patientId"]
            }
          },
          {
            name: "searchAdultProviders",
            description: "Search for adult healthcare providers matching specific criteria",
            inputSchema: {
              type: "object",
              properties: {
                specialty: { type: "string", description: "Medical specialty to search for" },
                location: { type: "string", description: "Location preference" }
              },
              required: ["specialty"]
            }
          },
          {
            name: "mapPediatricToAdultSpecialty",
            description: "Map a pediatric condition to appropriate adult specialty",
            inputSchema: {
              type: "object",
              properties: { condition: { type: "string", description: "The pediatric condition" } },
              required: ["condition"]
            }
          },
          {
            name: "generateTransitionSummary",
            description: "Generate a comprehensive transition summary package for a patient",
            inputSchema: {
              type: "object",
              properties: { patientId: { type: "string", description: "The patient's ID" } },
              required: ["patientId"]
            }
          },
          {
            name: "scheduleWarmHandoff",
            description: "Schedule a warm handoff meeting between pediatric and adult care teams",
            inputSchema: {
              type: "object",
              properties: {
                patientId: { type: "string", description: "The patient's ID" },
                adultProviderId: { type: "string", description: "The adult provider's ID" }
              },
              required: ["patientId", "adultProviderId"]
            }
          },
          {
            name: "listAvailablePatients",
            description: "List all available demo patients in the system",
            inputSchema: { type: "object", properties: {} }
          }
        ];

        const response: McpResponse = {
          jsonrpc: "2.0",
          id: mcpRequest.id,
          result: { tools }
        };
        return res.status(200).json(response);
      }

      // Handle tools/call
      if (mcpRequest.method === 'tools/call') {
        const { name, arguments: args } = mcpRequest.params;

        // Execute the tool using our server
        const toolHandlers: Record<string, (args: any) => Promise<any>> = {
          assessTransitionReadiness: async (args) => {
            const { patientId } = args;
            const PATIENTS = getPatients();
            const patient = PATIENTS[patientId];
            if (!patient) return { error: "Patient not found", availablePatients: ["P001", "P002", "P003"] };
            const age = calculateAge(patient.patient.birthDate);
            return {
              patientId,
              patientName: `${patient.patient.name[0].given[0]} ${patient.patient.name[0].family}`,
              age,
              eligible: age >= 12 && age <= 26,
              assessment: patient.readinessAssessment
            };
          },
          getPatientAge: async (args) => {
            const { patientId } = args;
            const PATIENTS = getPatients();
            const patient = PATIENTS[patientId];
            if (!patient) return { error: "Patient not found" };
            const age = calculateAge(patient.patient.birthDate);
            return {
              patientId,
              age,
              transitionEligible: age >= 12 && age <= 26,
              yearsUntilAdulthood: age < 18 ? 18 - age : 0,
              status: age >= 18 ? "AGED OUT - Urgent transition needed" : "Pre-transition planning phase"
            };
          },
          identifyCareGaps: async (args) => {
            const { patientId } = args;
            const PATIENTS = getPatients();
            const patient = PATIENTS[patientId];
            if (!patient) return { error: "Patient not found" };
            const urgentGaps = patient.careGaps.filter((g: any) => g.urgency === "urgent");
            return {
              patientId,
              totalGaps: patient.careGaps.length,
              urgentCount: urgentGaps.length,
              gaps: patient.careGaps
            };
          },
          checkImmunizationStatus: async (args) => {
            const { patientId } = args;
            const PATIENTS = getPatients();
            const patient = PATIENTS[patientId];
            if (!patient) return { error: "Patient not found" };
            const immunizationGaps = patient.careGaps.filter((g: any) => g.category === "immunization");
            return {
              patientId,
              completedImmunizations: patient.immunizations.map((i: any) => i.vaccineCode.text),
              missingImmunizations: immunizationGaps.map((g: any) => g.description),
              status: immunizationGaps.length === 0 ? "Complete" : "Gaps identified"
            };
          },
          searchAdultProviders: async (args) => {
            const { specialty, location } = args;
            const PROVIDERS = getProviders();
            const matches = PROVIDERS.filter(p =>
              p.specialty.toLowerCase().includes(specialty.toLowerCase()) ||
              specialty.toLowerCase().includes(p.specialty.toLowerCase().split(" ")[0])
            );
            return { searchCriteria: { specialty, location }, matchCount: matches.length, providers: matches };
          },
          mapPediatricToAdultSpecialty: async (args) => {
            const { condition } = args;
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
            const PROVIDERS = getProviders();
            return {
              pediatricCondition: condition,
              recommendedAdultSpecialty: adultSpecialty,
              matchingProviders: PROVIDERS.filter(p => p.specialty === adultSpecialty)
            };
          },
          generateTransitionSummary: async (args) => {
            const { patientId } = args;
            const PATIENTS = getPatients();
            const patient = PATIENTS[patientId];
            if (!patient) return { error: "Patient not found" };
            const age = calculateAge(patient.patient.birthDate);
            return {
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
            };
          },
          scheduleWarmHandoff: async (args) => {
            const { patientId, adultProviderId } = args;
            const PATIENTS = getPatients();
            const PROVIDERS = getProviders();
            const patient = PATIENTS[patientId];
            const provider = PROVIDERS.find(p => p.providerId === adultProviderId);
            if (!patient || !provider) return { error: "Patient or provider not found" };
            const handoffDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
            return {
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
            };
          },
          listAvailablePatients: async () => {
            const PATIENTS = getPatients();
            const patientList = Object.entries(PATIENTS).map(([id, data]: [string, any]) => ({
              id,
              name: `${data.patient.name[0].given[0]} ${data.patient.name[0].family}`,
              age: calculateAge(data.patient.birthDate),
              condition: data.conditions[0].code.text
            }));
            return { description: "TransitionBridge AI Demo Patients", patients: patientList };
          }
        };

        const handler = toolHandlers[name];
        if (!handler) {
          const response: McpResponse = {
            jsonrpc: "2.0",
            id: mcpRequest.id,
            error: { code: -32601, message: `Unknown tool: ${name}` }
          };
          return res.status(200).json(response);
        }

        const result = await handler(args || {});
        const response: McpResponse = {
          jsonrpc: "2.0",
          id: mcpRequest.id,
          result: {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          }
        };
        return res.status(200).json(response);
      }

      // Unknown method
      const response: McpResponse = {
        jsonrpc: "2.0",
        id: mcpRequest.id,
        error: { code: -32601, message: `Unknown method: ${mcpRequest.method}` }
      };
      return res.status(200).json(response);

    } catch (error: any) {
      const response: McpResponse = {
        jsonrpc: "2.0",
        error: { code: -32603, message: error.message || "Internal error" }
      };
      return res.status(500).json(response);
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// Helper functions
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

function getPatients(): Record<string, any> {
  return {
    "P001": {
      patient: { resourceType: "Patient", id: "P001", name: [{ given: ["Maya"], family: "Chen" }], birthDate: "2009-03-15", gender: "female", telecom: [{ system: "phone", value: "555-0101" }], address: [{ city: "Boston", state: "MA" }] },
      conditions: [{ resourceType: "Condition", code: { text: "Type 1 Diabetes Mellitus" }, clinicalStatus: { coding: [{ code: "active" }] }, subject: { reference: "Patient/P001" } }],
      immunizations: [{ resourceType: "Immunization", vaccineCode: { text: "Tdap" }, status: "completed", patient: { reference: "Patient/P001" } }, { resourceType: "Immunization", vaccineCode: { text: "HPV" }, status: "completed", patient: { reference: "Patient/P001" } }],
      readinessAssessment: { overallScore: 0.65, domainScores: { "managing-medications": 0.7, "appointment-keeping": 0.6, "tracking-health-issues": 0.65, "talking-with-providers": 0.55, "managing-daily-activities": 0.75 }, gaps: ["talking-with-providers", "appointment-keeping"], recommendations: ["Practice scheduling own appointments", "Role-play conversations with providers"] },
      careGaps: [{ id: "G001", category: "immunization", description: "Missing Meningococcal B vaccine", urgency: "high", actionRequired: "Schedule vaccination" }, { id: "G002", category: "documentation", description: "Transition summary not prepared", urgency: "urgent", actionRequired: "Prepare comprehensive transition summary" }]
    },
    "P002": {
      patient: { resourceType: "Patient", id: "P002", name: [{ given: ["Marcus"], family: "Johnson" }], birthDate: "2010-07-22", gender: "male", telecom: [{ system: "phone", value: "555-0102" }], address: [{ city: "Chicago", state: "IL" }] },
      conditions: [{ resourceType: "Condition", code: { text: "Tetralogy of Fallot (repaired)" }, clinicalStatus: { coding: [{ code: "active" }] }, subject: { reference: "Patient/P002" } }],
      immunizations: [{ resourceType: "Immunization", vaccineCode: { text: "Flu" }, status: "completed", patient: { reference: "Patient/P002" } }],
      readinessAssessment: { overallScore: 0.45, domainScores: { "managing-medications": 0.4, "appointment-keeping": 0.5, "tracking-health-issues": 0.45, "talking-with-providers": 0.4, "managing-daily-activities": 0.5 }, gaps: ["managing-medications", "talking-with-providers", "tracking-health-issues"], recommendations: ["Begin medication self-management training", "Create health tracking routine", "Start transition planning early"] },
      careGaps: [{ id: "G003", category: "specialist_referral", description: "Adult cardiology referral needed", urgency: "medium", actionRequired: "Identify adult congenital heart specialist" }, { id: "G004", category: "documentation", description: "Surgical history summary incomplete", urgency: "high", actionRequired: "Complete cardiac surgical history" }]
    },
    "P003": {
      patient: { resourceType: "Patient", id: "P003", name: [{ given: ["Sophia"], family: "Martinez" }], birthDate: "2008-01-10", gender: "female", telecom: [{ system: "phone", value: "555-0103" }], address: [{ city: "Houston", state: "TX" }] },
      conditions: [{ resourceType: "Condition", code: { text: "Cystic Fibrosis" }, clinicalStatus: { coding: [{ code: "active" }] }, subject: { reference: "Patient/P003" } }],
      immunizations: [{ resourceType: "Immunization", vaccineCode: { text: "Pneumococcal" }, status: "completed", patient: { reference: "Patient/P003" } }, { resourceType: "Immunization", vaccineCode: { text: "Flu" }, status: "completed", patient: { reference: "Patient/P003" } }],
      readinessAssessment: { overallScore: 0.78, domainScores: { "managing-medications": 0.85, "appointment-keeping": 0.75, "tracking-health-issues": 0.8, "talking-with-providers": 0.7, "managing-daily-activities": 0.8 }, gaps: ["talking-with-providers"], recommendations: ["URGENT: Patient has aged out - expedite transition", "Connect with adult CF center immediately"] },
      careGaps: [{ id: "G005", category: "specialist_referral", description: "Adult CF center transfer urgent", urgency: "urgent", actionRequired: "Immediate referral to adult CF program" }, { id: "G006", category: "care_summary", description: "Complete care summary for transfer", urgency: "urgent", actionRequired: "Prepare comprehensive CF history" }]
    }
  };
}

function getProviders() {
  return [
    { providerId: "PROV-001", name: "Dr. Sarah Mitchell", specialty: "Endocrinology", location: "Boston, MA", acceptingPatients: true, transitionExperience: "high" },
    { providerId: "PROV-002", name: "Dr. James Chen", specialty: "Adult Congenital Heart Disease", location: "Chicago, IL", acceptingPatients: true, transitionExperience: "high" },
    { providerId: "PROV-003", name: "Dr. Amanda Foster", specialty: "Pulmonology - CF Center", location: "Houston, TX", acceptingPatients: true, transitionExperience: "high" }
  ];
}
