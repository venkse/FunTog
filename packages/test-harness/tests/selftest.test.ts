import { test } from "node:test";
import { mockSuggestion, mockCharacter, mockMemory, mockVenue, mockCrew, mockOrchestrator } from "@funtog/mocks";
import {
  runSuggestionContract, runCharacterContract, runMemoryContract,
  runVenueContract, runCrewContract, runOrchestratorContract,
} from "../src/index";

// Proves the harness + mocks agree on the contracts. Should be GREEN.
test("suggestion mock satisfies contract", () => runSuggestionContract(mockSuggestion));
test("character mock satisfies contract", () => runCharacterContract(mockCharacter));
test("memory mock satisfies contract", () => runMemoryContract(mockMemory));
test("venue mock satisfies contract", () => runVenueContract(mockVenue));
test("crew mock satisfies contract", () => runCrewContract(mockCrew));
test("orchestrator mock satisfies contract", () => runOrchestratorContract(mockOrchestrator));
