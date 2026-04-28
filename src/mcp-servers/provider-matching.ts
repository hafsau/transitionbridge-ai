#!/usr/bin/env node
/**
 * Provider Matching MCP Server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getPatientById } from "../data/synthetic-patients.js";

const PROVIDERS = [
  {
    providerId: 'PROV-001',
    name: 'Dr. Sarah Mitchell',
    specialty: 'Endocrinology',
    organization: 'Metro Adult Medicine Center',
    address: '123 Health Plaza, Springfield, IL 62701',
    phone: '(555) 987-6543',
    transitionExperience: 'high',
    nextAvailable: '2026-05-15',
    waitTimeWeeks: 3,
    rating: 4.8
  },
  {
    providerId: 'PROV-002',
    name: 'Dr. James Chen',
    specialty: 'Adult Congenital Heart Disease',
    organization: 'University Heart Center',
    address: '500 University Ave, Springfield, IL 62702',
    phone: '(555) 234-5678',
    transitionExperience: 'high',
    nextAvailable: '2026-05-22',
    waitTimeWeeks: 4,
    rating: 4.9
  },
  {
    providerId: 'PROV-003',
    name: 'Dr. Amanda Foster',
    specialty: 'Pulmonology - CF Center',
    organization: 'Regional CF Care Center',
    address: '200 Medical Center Dr, Springfield, IL 62703',
    phone: '(555) 345-6789',
    transitionExperience: 'high',
    nextAvailable: '2026-05-08',
    waitTimeWeeks: 2,
    rating: 4.7
  }
];

const server = new McpServer({
  name: "provider-matching",
  version: "1.0.0",
});

server.tool(
  "searchAdultProviders",
  "Search for adult providers by specialty",
  {
    specialty: z.string().describe("Medical specialty to search for"),
    patientId: z.string().optional().describe("Optional patient ID for context")
  },
  async ({ specialty, patientId }) => {
    const matches = PROVIDERS.filter(p =>
      p.specialty.toLowerCase().includes(specialty.toLowerCase())
    );

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          specialty,
          totalMatches: matches.length,
          providers: matches
        }, null, 2)
      }]
    };
  }
);

server.tool(
  "mapPediatricToAdultSpecialty",
  "Map pediatric specialty to adult equivalent",
  {
    pediatricSpecialty: z.string().describe("The pediatric specialty")
  },
  async ({ pediatricSpecialty }) => {
    const mappings: Record<string, string> = {
      'Pediatric Endocrinology': 'Endocrinology',
      'Pediatric Cardiology': 'Adult Congenital Heart Disease',
      'Pediatric Pulmonology': 'Pulmonology',
      'Pediatric Neurology': 'Neurology',
      'Pediatric Gastroenterology': 'Gastroenterology'
    };

    const adultSpecialty = mappings[pediatricSpecialty] || pediatricSpecialty.replace('Pediatric ', '');

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          pediatricSpecialty,
          adultSpecialty,
          availableProviders: PROVIDERS.filter(p =>
            p.specialty.toLowerCase().includes(adultSpecialty.toLowerCase())
          ).length
        }, null, 2)
      }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Provider Matching MCP Server running on stdio");
}

main().catch(console.error);
