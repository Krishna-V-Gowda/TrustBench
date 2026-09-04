# Security

TrustBench executes local subject code through Node.js. Treat every subject as code execution, not as inert data.

- Do not run adapters against untrusted uploads.
- Review fetched source and verify the locked digest.
- Never place credentials, private datasets, or employer code in fixtures or reports.
- Report suspected vulnerabilities privately to the repository owner before public disclosure.

The Node VM boundary is not advertised as a security sandbox. It exists to supply a controlled runtime for reviewed browser code.
