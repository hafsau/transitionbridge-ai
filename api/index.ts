/**
 * TransitionBridge AI - MCP Server
 * Pediatric-to-Adult Care Transition Navigator
 *
 * SHARP-on-MCP compliant FHIR R4 server
 */

import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Helper to extract FHIR context from headers (SHARP spec)
function getFhirContext(req: Request) {
  return {
    fhirServerUrl: req.headers['x-fhir-server-url'] as string || null,
    accessToken: req.headers['x-fhir-access-token'] as string || null,
    patientId: req.headers['x-patient-id'] as string || null
  };
}

// Helper to make FHIR API calls
async function fhirFetch(fhirServerUrl: string, path: string, accessToken: string | null): Promise<any> {
  const headers: Record<string, string> = {
    'Accept': 'application/fhir+json',
    'Content-Type': 'application/fhir+json'
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${fhirServerUrl}${path}`, { headers });
  if (!response.ok) {
    throw new Error(`FHIR request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Fallback synthetic data (used when no FHIR context provided)
const SYNTHETIC_PATIENTS: Record<string, any> = {
  "P001": {
    patient: { resourceType: "Patient", id: "P001", name: [{ given: ["Maya"], family: "Chen" }], birthDate: "2009-03-15", gender: "female" },
    conditions: [{ resourceType: "Condition", code: { text: "Type 1 Diabetes Mellitus" }, clinicalStatus: { coding: [{ code: "active" }] } }],
    immunizations: [{ resourceType: "Immunization", vaccineCode: { text: "Tdap" }, status: "completed" }, { resourceType: "Immunization", vaccineCode: { text: "HPV" }, status: "completed" }],
    readinessAssessment: { overallScore: 0.65, domainScores: { "managing-medications": 0.7, "appointment-keeping": 0.6, "tracking-health-issues": 0.65, "talking-with-providers": 0.55, "managing-daily-activities": 0.75 }, gaps: ["talking-with-providers", "appointment-keeping"], recommendations: ["Practice scheduling own appointments", "Role-play conversations with providers"] },
    careGaps: [{ id: "G001", category: "immunization", description: "Missing Meningococcal B vaccine", urgency: "high", actionRequired: "Schedule vaccination" }, { id: "G002", category: "documentation", description: "Transition summary not prepared", urgency: "urgent", actionRequired: "Prepare comprehensive transition summary" }]
  },
  "P002": {
    patient: { resourceType: "Patient", id: "P002", name: [{ given: ["Marcus"], family: "Johnson" }], birthDate: "2010-07-22", gender: "male" },
    conditions: [{ resourceType: "Condition", code: { text: "Tetralogy of Fallot (repaired)" }, clinicalStatus: { coding: [{ code: "active" }] } }],
    immunizations: [{ resourceType: "Immunization", vaccineCode: { text: "Flu" }, status: "completed" }],
    readinessAssessment: { overallScore: 0.45, domainScores: { "managing-medications": 0.4, "appointment-keeping": 0.5, "tracking-health-issues": 0.45, "talking-with-providers": 0.4, "managing-daily-activities": 0.5 }, gaps: ["managing-medications", "talking-with-providers", "tracking-health-issues"], recommendations: ["Begin medication self-management training", "Create health tracking routine", "Start transition planning early"] },
    careGaps: [{ id: "G003", category: "specialist_referral", description: "Adult cardiology referral needed", urgency: "medium", actionRequired: "Identify adult congenital heart specialist" }, { id: "G004", category: "documentation", description: "Surgical history summary incomplete", urgency: "high", actionRequired: "Complete cardiac surgical history" }]
  },
  "P003": {
    patient: { resourceType: "Patient", id: "P003", name: [{ given: ["Sophia"], family: "Martinez" }], birthDate: "2008-01-10", gender: "female" },
    conditions: [{ resourceType: "Condition", code: { text: "Cystic Fibrosis" }, clinicalStatus: { coding: [{ code: "active" }] } }],
    immunizations: [{ resourceType: "Immunization", vaccineCode: { text: "Pneumococcal" }, status: "completed" }, { resourceType: "Immunization", vaccineCode: { text: "Flu" }, status: "completed" }],
    readinessAssessment: { overallScore: 0.78, domainScores: { "managing-medications": 0.85, "appointment-keeping": 0.75, "tracking-health-issues": 0.8, "talking-with-providers": 0.7, "managing-daily-activities": 0.8 }, gaps: ["talking-with-providers"], recommendations: ["URGENT: Patient has aged out - expedite transition", "Connect with adult CF center immediately"] },
    careGaps: [{ id: "G005", category: "specialist_referral", description: "Adult CF center transfer urgent", urgency: "urgent", actionRequired: "Immediate referral to adult CF program" }, { id: "G006", category: "care_summary", description: "Complete care summary for transfer", urgency: "urgent", actionRequired: "Prepare comprehensive CF history" }]
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
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Helper to get patient data - tries FHIR first, falls back to synthetic
async function getPatientData(patientId: string, fhirContext: { fhirServerUrl: string | null, accessToken: string | null, patientId: string | null }) {
  // If we have FHIR context, try to fetch from FHIR server
  if (fhirContext.fhirServerUrl) {
    try {
      const patient = await fhirFetch(fhirContext.fhirServerUrl, `/Patient/${patientId}`, fhirContext.accessToken);
      const conditionBundle = await fhirFetch(fhirContext.fhirServerUrl, `/Condition?subject=Patient/${patientId}`, fhirContext.accessToken);
      const immunizationBundle = await fhirFetch(fhirContext.fhirServerUrl, `/Immunization?patient=Patient/${patientId}`, fhirContext.accessToken);
      const observationBundle = await fhirFetch(fhirContext.fhirServerUrl, `/Observation?subject=Patient/${patientId}&code=TRAQ`, fhirContext.accessToken);

      const conditions = conditionBundle.entry?.map((e: any) => e.resource) || [];
      const immunizations = immunizationBundle.entry?.map((e: any) => e.resource) || [];
      const observations = observationBundle.entry?.map((e: any) => e.resource) || [];

      // Parse readiness assessment from observation
      const readinessObs = observations.find((o: any) => o.code?.coding?.some((c: any) => c.code === 'TRAQ'));
      let readinessAssessment = null;
      if (readinessObs) {
        const domainScores: Record<string, number> = {};
        readinessObs.component?.forEach((c: any) => {
          domainScores[c.code?.text] = c.valueQuantity?.value || 0;
        });
        readinessAssessment = {
          overallScore: readinessObs.valueQuantity?.value || 0,
          domainScores,
          gaps: Object.entries(domainScores).filter(([_, v]) => v < 0.6).map(([k]) => k),
          recommendations: readinessObs.note?.[0]?.text?.split('. ').filter((r: string) => r.startsWith('Recommendation')) || []
        };
      }

      return {
        patient,
        conditions,
        immunizations,
        readinessAssessment: readinessAssessment || SYNTHETIC_PATIENTS[patientId]?.readinessAssessment,
        careGaps: SYNTHETIC_PATIENTS[patientId]?.careGaps || [], // Care gaps would need custom FHIR extension
        source: 'fhir'
      };
    } catch (error) {
      console.log(`FHIR fetch failed for ${patientId}, falling back to synthetic data:`, error);
    }
  }

  // Fallback to synthetic data
  const synthetic = SYNTHETIC_PATIENTS[patientId];
  if (!synthetic) return null;
  return { ...synthetic, source: 'synthetic' };
}

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: "TransitionBridge AI",
    description: "Pediatric-to-Adult Care Transition Navigator",
    version: "1.0.0",
    status: "running",
    fhirSupport: "SHARP-on-MCP compliant",
    endpoints: { mcp: "/mcp (POST)", health: "/ (GET)" },
    tools: ["listAvailablePatients", "assessTransitionReadiness", "getPatientAge", "identifyCareGaps", "checkImmunizationStatus", "searchAdultProviders", "mapPediatricToAdultSpecialty", "generateTransitionSummary", "scheduleWarmHandoff"]
  });
});

// MCP endpoint - direct JSON-RPC handler
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const { method, params, id } = req.body;
    const fhirContext = getFhirContext(req);

    // Handle initialize - declare FHIR context support per SHARP spec
    if (method === 'initialize') {
      return res.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "transitionbridge-ai", version: "1.0.0" },
          capabilities: {
            tools: {},
            experimental: {
              "fhir_context_required": true,
              "ai.promptopinion/fhir-context": {
                version: "1.0",
                scopes: [
                  { name: "patient/Patient.rs", required: true },
                  { name: "patient/Condition.rs", required: true },
                  { name: "patient/Immunization.rs", required: true },
                  { name: "patient/Observation.rs" },
                  { name: "patient/Practitioner.rs" },
                  { name: "patient/PractitionerRole.rs" }
                ]
              }
            }
          }
        }
      });
    }

    // Handle initialized notification
    if (method === 'notifications/initialized') {
      return res.json({ jsonrpc: "2.0", id, result: {} });
    }

    // Handle tools/list
    if (method === 'tools/list') {
      const tools = [
        { name: "listAvailablePatients", description: "List all available patients. Uses FHIR Patient search if FHIR context is provided, otherwise returns demo patients.", inputSchema: { type: "object", properties: {} } },
        { name: "assessTransitionReadiness", description: "Assess a patient's readiness for pediatric-to-adult care transition using TRAQ (Transition Readiness Assessment Questionnaire)", inputSchema: { type: "object", properties: { patientId: { type: "string", description: "Patient ID" } }, required: ["patientId"] } },
        { name: "getPatientAge", description: "Get a patient's age and transition eligibility status (eligible ages 12-26)", inputSchema: { type: "object", properties: { patientId: { type: "string", description: "Patient ID" } }, required: ["patientId"] } },
        { name: "identifyCareGaps", description: "Identify gaps in a patient's care that need to be addressed before transition to adult care", inputSchema: { type: "object", properties: { patientId: { type: "string", description: "Patient ID" } }, required: ["patientId"] } },
        { name: "checkImmunizationStatus", description: "Check a patient's immunization status for adult healthcare transition requirements", inputSchema: { type: "object", properties: { patientId: { type: "string", description: "Patient ID" } }, required: ["patientId"] } },
        { name: "searchAdultProviders", description: "Search for adult healthcare providers matching specific specialty criteria", inputSchema: { type: "object", properties: { specialty: { type: "string", description: "Medical specialty" }, location: { type: "string", description: "Location preference" } }, required: ["specialty"] } },
        { name: "mapPediatricToAdultSpecialty", description: "Map a pediatric condition to appropriate adult specialty for transition planning", inputSchema: { type: "object", properties: { condition: { type: "string", description: "The pediatric condition" } }, required: ["condition"] } },
        { name: "generateTransitionSummary", description: "Generate a comprehensive transition summary package for transferring care to adult providers", inputSchema: { type: "object", properties: { patientId: { type: "string", description: "Patient ID" } }, required: ["patientId"] } },
        { name: "scheduleWarmHandoff", description: "Schedule a warm handoff meeting between pediatric and adult care teams", inputSchema: { type: "object", properties: { patientId: { type: "string", description: "Patient ID" }, adultProviderId: { type: "string", description: "Adult provider ID" } }, required: ["patientId", "adultProviderId"] } }
      ];
      return res.json({ jsonrpc: "2.0", id, result: { tools } });
    }

    // Handle tools/call
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      let result: any;

      switch (name) {
        case 'listAvailablePatients': {
          // Try FHIR first
          if (fhirContext.fhirServerUrl) {
            try {
              const bundle = await fhirFetch(fhirContext.fhirServerUrl, '/Patient?_count=50', fhirContext.accessToken);
              const patients = bundle.entry?.map((e: any) => {
                const p = e.resource;
                return {
                  id: p.id,
                  name: `${p.name?.[0]?.given?.[0] || ''} ${p.name?.[0]?.family || ''}`.trim(),
                  age: p.birthDate ? calculateAge(p.birthDate) : null,
                  gender: p.gender,
                  source: 'fhir'
                };
              }) || [];
              result = { patients, source: 'fhir', fhirServer: fhirContext.fhirServerUrl };
              break;
            } catch (error) {
              console.log('FHIR patient list failed, falling back to synthetic');
            }
          }
          // Fallback to synthetic
          result = Object.entries(SYNTHETIC_PATIENTS).map(([pid, data]) => ({
            id: pid, name: `${data.patient.name[0].given[0]} ${data.patient.name[0].family}`,
            age: calculateAge(data.patient.birthDate), condition: data.conditions[0].code.text,
            source: 'synthetic'
          }));
          break;
        }

        case 'assessTransitionReadiness': {
          const patientData = await getPatientData(args.patientId, fhirContext);
          if (!patientData) {
            result = { error: "Patient not found", availablePatients: Object.keys(SYNTHETIC_PATIENTS) };
          } else {
            const age = calculateAge(patientData.patient.birthDate);
            result = {
              patientId: args.patientId,
              patientName: `${patientData.patient.name[0].given[0]} ${patientData.patient.name[0].family}`,
              age,
              eligible: age >= 12 && age <= 26,
              assessment: patientData.readinessAssessment,
              source: patientData.source
            };
          }
          break;
        }

        case 'getPatientAge': {
          const patientData = await getPatientData(args.patientId, fhirContext);
          if (!patientData) {
            result = { error: "Patient not found" };
          } else {
            const age = calculateAge(patientData.patient.birthDate);
            result = {
              patientId: args.patientId,
              age,
              transitionEligible: age >= 12 && age <= 26,
              yearsUntilAdulthood: age < 18 ? 18 - age : 0,
              status: age >= 18 ? "AGED OUT - Urgent transition needed" : "Pre-transition planning phase",
              source: patientData.source
            };
          }
          break;
        }

        case 'identifyCareGaps': {
          const patientData = await getPatientData(args.patientId, fhirContext);
          if (!patientData) {
            result = { error: "Patient not found" };
          } else {
            result = {
              patientId: args.patientId,
              totalGaps: patientData.careGaps?.length || 0,
              urgentCount: patientData.careGaps?.filter((g: any) => g.urgency === "urgent").length || 0,
              gaps: patientData.careGaps || [],
              source: patientData.source
            };
          }
          break;
        }

        case 'checkImmunizationStatus': {
          const patientData = await getPatientData(args.patientId, fhirContext);
          if (!patientData) {
            result = { error: "Patient not found" };
          } else {
            const immGaps = patientData.careGaps?.filter((g: any) => g.category === "immunization") || [];
            result = {
              patientId: args.patientId,
              completedImmunizations: patientData.immunizations.map((i: any) => i.vaccineCode?.text || i.vaccineCode?.coding?.[0]?.display),
              missingImmunizations: immGaps.map((g: any) => g.description),
              status: immGaps.length === 0 ? "Complete" : "Gaps identified",
              source: patientData.source
            };
          }
          break;
        }

        case 'searchAdultProviders': {
          // Try FHIR PractitionerRole search first
          if (fhirContext.fhirServerUrl) {
            try {
              const bundle = await fhirFetch(fhirContext.fhirServerUrl, `/PractitionerRole?specialty:text=${encodeURIComponent(args.specialty)}`, fhirContext.accessToken);
              const providers = bundle.entry?.map((e: any) => {
                const pr = e.resource;
                return {
                  id: pr.id,
                  specialty: pr.specialty?.[0]?.text || pr.specialty?.[0]?.coding?.[0]?.display,
                  location: pr.location?.[0]?.display,
                  practitionerRef: pr.practitioner?.reference
                };
              }) || [];
              if (providers.length > 0) {
                result = { searchCriteria: { specialty: args.specialty, location: args.location }, matchCount: providers.length, providers, source: 'fhir' };
                break;
              }
            } catch (error) {
              console.log('FHIR provider search failed, falling back to synthetic');
            }
          }
          // Fallback
          const matches = PROVIDERS.filter(pr => pr.specialty.toLowerCase().includes(args.specialty.toLowerCase()) || args.specialty.toLowerCase().includes(pr.specialty.toLowerCase().split(" ")[0]));
          result = { searchCriteria: { specialty: args.specialty, location: args.location }, matchCount: matches.length, providers: matches, source: 'synthetic' };
          break;
        }

        case 'mapPediatricToAdultSpecialty': {
          const mappings: Record<string, string> = { "diabetes": "Endocrinology", "type 1 diabetes": "Endocrinology", "heart": "Adult Congenital Heart Disease", "tetralogy": "Adult Congenital Heart Disease", "cystic fibrosis": "Pulmonology - CF Center", "cf": "Pulmonology - CF Center" };
          let adultSpecialty = "General Internal Medicine";
          for (const [key, value] of Object.entries(mappings)) { if (args.condition.toLowerCase().includes(key)) { adultSpecialty = value; break; } }
          result = { pediatricCondition: args.condition, recommendedAdultSpecialty: adultSpecialty, matchingProviders: PROVIDERS.filter(pr => pr.specialty === adultSpecialty) };
          break;
        }

        case 'generateTransitionSummary': {
          const patientData = await getPatientData(args.patientId, fhirContext);
          if (!patientData) {
            result = { error: "Patient not found" };
          } else {
            const age = calculateAge(patientData.patient.birthDate);
            result = {
              transitionSummary: {
                generatedAt: new Date().toISOString(),
                patient: {
                  id: args.patientId,
                  name: `${patientData.patient.name[0].given[0]} ${patientData.patient.name[0].family}`,
                  age,
                  gender: patientData.patient.gender
                },
                conditions: patientData.conditions.map((c: any) => c.code?.text || c.code?.coding?.[0]?.display),
                readinessScore: patientData.readinessAssessment?.overallScore,
                careGaps: patientData.careGaps || [],
                recommendations: patientData.readinessAssessment?.recommendations || [],
                source: patientData.source
              }
            };
          }
          break;
        }

        case 'scheduleWarmHandoff': {
          const patientData = await getPatientData(args.patientId, fhirContext);
          const prov = PROVIDERS.find(pr => pr.providerId === args.adultProviderId);
          if (!patientData || !prov) {
            result = { error: "Patient or provider not found" };
          } else {
            result = {
              handoff: {
                status: "scheduled",
                patientId: args.patientId,
                patientName: `${patientData.patient.name[0].given[0]} ${patientData.patient.name[0].family}`,
                adultProvider: prov.name,
                specialty: prov.specialty,
                scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                type: "warm_handoff",
                source: patientData.source
              }
            };
          }
          break;
        }

        default:
          return res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool: ${name}` } });
      }

      return res.json({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] } });
    }

    // Unknown method
    return res.json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method: ${method}` } });

  } catch (error: any) {
    console.error('MCP request error:', error);
    res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: error.message || "Internal server error" } });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`TransitionBridge AI MCP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`FHIR context: Reads X-FHIR-Server-URL, X-FHIR-Access-Token, X-Patient-ID headers`);
});

export default app;
