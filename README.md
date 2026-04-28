# TransitionBridge AI

**Pediatric-to-Adult Care Transition Navigator**

An intelligent multi-agent system that ensures no young patient falls through the cracks when transitioning from pediatric to adult healthcare.

## The Problem

- **81%** of youth don't receive transition services when moving from pediatric to adult care
- Only **17%** receive guidance from healthcare providers
- Results in treatment delays, disease progression, and preventable ER visits

## The Solution

TransitionBridge AI automates the transition process using 5 coordinated AI agents:

1. **Transition Readiness Assessor** - TRAQ-based readiness scoring
2. **Care Gap Identifier** - Finds missing documentation, immunizations, screenings
3. **Adult Provider Matcher** - Maps pediatric to adult specialists
4. **Patient Educator** - Creates personalized education plans
5. **Handoff Coordinator** - Orchestrates warm handoffs between care teams

## Architecture

```
┌─────────────────────────────────────────────────┐
│           TransitionBridge AI                    │
│          A2A Multi-Agent Network                 │
└─────────────────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐    ┌───────────┐    ┌───────────┐
│Assessment│    │Preparation│    │  Handoff  │
└─────────┘    └───────────┘    └───────────┘
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐    ┌───────────┐    ┌───────────┐
│Readiness│    │Care Gap   │    │Provider   │
│Assessor │    │Identifier │    │Matcher    │
└─────────┘    └───────────┘    └───────────┘
                      │                 │
                      ▼                 ▼
               ┌───────────┐    ┌───────────┐
               │Patient    │    │Handoff    │
               │Educator   │    │Coordinator│
               └───────────┘    └───────────┘
```

## Tech Stack

- **Platform**: Prompt Opinion (MCP + A2A protocols)
- **Data Standard**: FHIR R4
- **Language**: TypeScript
- **Testing**: Vitest (89 tests)

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm run test

# Run demo
npm run demo
```

## Demo Patients

| Patient | Age | Condition | Scenario |
|---------|-----|-----------|----------|
| Maya Chen | 17 | Type 1 Diabetes | Standard transition |
| Marcus Johnson | 15 | Congenital Heart Disease | Early planning |
| Sophia Martinez | 18 | Cystic Fibrosis | Crisis (aged out) |

## MCP Servers

- `transition-assessment` - Readiness assessment tools
- `care-gap-analysis` - Gap identification tools
- `provider-matching` - Provider search and matching
- `transition-handoff` - Handoff coordination tools

## License

ISC

---

Built for the **Agents Assemble** Hackathon on Devpost.

*"Every young patient deserves a bridge, not a cliff."*
