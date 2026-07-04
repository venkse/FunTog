import { test } from "node:test";
import { runSessionStoreContract } from "../src/contracts/sessionstore";
import { mockSessionStore } from "@funtog/mocks";
import { InMemorySessionStore } from "@funtog/convergence-orchestrator";

test("sessionstore mock satisfies contract", () => runSessionStoreContract(mockSessionStore()));
test("orchestrator reference store satisfies contract", () => runSessionStoreContract(new InMemorySessionStore()));
