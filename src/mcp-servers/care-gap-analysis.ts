#!/usr/bin/env node
/**
 * Care Gap Analysis MCP Server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getPatientById, calculateAge } from "../data/synthetic-patients.js";

const server = new McpServer({
  name: "care-gap-analysis",
  version: "1.0.0",
});

server.tool(
  "identifyCareGaps",
  "Identify care gaps for a patient",
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

    const gaps = patient.careGaps || [];
    const urgentGaps = gaps.filter((g: any) => g.urgency === 'urgent').length;

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          patientId,
          totalGaps: gaps.length,
          urgentGaps,
          gaps
        }, null, 2)
      }]
    };
  }
);

server.tool(
  "checkImmunizationStatus",
  "Check immunization status for a patient",
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

    const immunizations = patient.immunizations || [];
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          patientId,
          immunizationsCount: immunizations.length,
          immunizations: immunizations.map((i: any) => ({
            vaccine: i.vaccineCode?.text,
            date: i.occurrenceDateTime,
            status: i.status
          }))
        }, null, 2)
      }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Care Gap Analysis MCP Server running on stdio");
}

main().catch(console.error);
