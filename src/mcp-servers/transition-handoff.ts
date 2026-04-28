#!/usr/bin/env node
/**
 * Transition Handoff MCP Server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getPatientById, calculateAge } from "../data/synthetic-patients.js";

const server = new McpServer({
  name: "transition-handoff",
  version: "1.0.0",
});

server.tool(
  "generateTransitionSummary",
  "Generate a comprehensive transition summary for a patient",
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
    const name = patient.patient.name?.[0]?.given?.join(' ') + ' ' + patient.patient.name?.[0]?.family;
    const conditions = patient.conditions.map((c: any) => c.code?.text || '');

    const summary = {
      patientId,
      patientName: name,
      dateOfBirth: patient.patient.birthDate,
      age,
      gender: patient.patient.gender,
      conditions,
      readinessScore: patient.readinessAssessment?.overallScore || 0,
      careGaps: patient.careGaps?.length || 0,
      immunizations: patient.immunizations?.length || 0,
      generatedDate: new Date().toISOString()
    };

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(summary, null, 2)
      }]
    };
  }
);

server.tool(
  "scheduleWarmHandoff",
  "Schedule a warm handoff meeting between pediatric and adult providers",
  {
    patientId: z.string().describe("The patient's ID"),
    preferredDate: z.string().optional().describe("Preferred date for the meeting")
  },
  async ({ patientId, preferredDate }) => {
    const patient = getPatientById(patientId);
    if (!patient) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: "Patient not found" }) }]
      };
    }

    const scheduledDate = preferredDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const name = patient.patient.name?.[0]?.given?.join(' ') + ' ' + patient.patient.name?.[0]?.family;

    const handoff = {
      patientId,
      patientName: name,
      scheduledDate,
      scheduledTime: '10:00 AM',
      location: 'Metro Adult Medicine Center',
      meetingType: 'joint-visit',
      pediatricProvider: {
        name: 'Dr. Sarah Martinez',
        role: 'Pediatric Specialist'
      },
      adultProvider: {
        name: 'Dr. Sarah Mitchell',
        role: 'Adult Specialist'
      },
      status: 'scheduled',
      agenda: [
        'Introduction to adult provider',
        'Review medical history',
        'Discuss care plan transition',
        'Answer patient questions'
      ]
    };

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(handoff, null, 2)
      }]
    };
  }
);

server.tool(
  "trackPostTransitionFollowup",
  "Track post-transition follow-up status",
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

    const followup = {
      patientId,
      status: 'pending',
      firstAdultVisitScheduled: true,
      firstAdultVisitDate: '2026-06-01',
      phoneCheckInCompleted: false,
      careTransferComplete: false,
      notes: 'Awaiting first adult care visit'
    };

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(followup, null, 2)
      }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Transition Handoff MCP Server running on stdio");
}

main().catch(console.error);
