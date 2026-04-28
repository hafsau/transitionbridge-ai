#!/usr/bin/env node
/**
 * Transition Assessment MCP Server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getPatientById, calculateAge } from "../data/synthetic-patients.js";

const server = new McpServer({
  name: "transition-assessment",
  version: "1.0.0",
});

server.tool(
  "assessTransitionReadiness",
  "Assess a patient's readiness for transition using TRAQ",
  {
    patientId: z.string().describe("The patient's ID")
  },
  async ({ patientId }) => {
    const patient = getPatientById(patientId);
    if (!patient) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: "Patient not found" }) }]
      };
    }

    const age = calculateAge(patient.patient.birthDate || '');
    const assessment = patient.readinessAssessment;

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          patientId,
          age,
          eligible: age >= 12 && age <= 26,
          assessment: assessment || { overallScore: 0.5, gaps: [] }
        }, null, 2)
      }]
    };
  }
);

server.tool(
  "getPatientAge",
  "Get a patient's age and transition eligibility",
  {
    patientId: z.string().describe("The patient's ID")
  },
  async ({ patientId }) => {
    const patient = getPatientById(patientId);
    if (!patient) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: "Patient not found" }) }]
      };
    }

    const age = calculateAge(patient.patient.birthDate || '');
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          patientId,
          age,
          transitionEligible: age >= 12 && age <= 26,
          yearsUntilTransition: age < 18 ? 18 - age : 0
        }, null, 2)
      }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Transition Assessment MCP Server running on stdio");
}

main().catch(console.error);
