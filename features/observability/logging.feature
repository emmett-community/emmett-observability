Feature: Application logging with trace correlation
  As an application developer
  I want an explicit logger factory
  So that logging stays opt-in and trace-aware

  Scenario: Logger emits logs without tracing
    Given the application creates a logger explicitly
    When the application writes a log entry
    Then the log entry includes service metadata
    And the log entry does not include trace_id or span_id

  Scenario: Logger correlates logs with active spans
    Given tracing is initialized explicitly
    And an active span exists in the current context
    And the application creates a logger explicitly
    When the application writes a log entry within the span context
    Then the log entry includes trace_id and span_id

  Scenario: No logging without an injected logger
    Given the application does not create a logger
    When the application runs business logic
    Then no logs are emitted by the observability package
