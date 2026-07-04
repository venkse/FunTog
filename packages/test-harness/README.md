# @funtog/test-harness

Shared utilities for **contract tests** (consumer-driven): given an implementation of a service
interface, assert it satisfies the contract (shapes, invariants, degradation behaviour). Each
producing subteam runs the contract test for what it produces; "done" = these pass.
