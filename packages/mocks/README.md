# @funtog/mocks

Contract-faithful fakes of every subsystem. Build your service against these so you never have
to wait for another team. Each mock implements the same interface from `@funtog/contracts` that
the real subsystem will. Swap mocks for reals at integration time.

Rule: a mock returns plausible, schema-valid canned data. It is NOT a reference implementation —
just enough to let a dependent build and test in isolation.
