Feature: Application tracing initialization
  As an application developer
  I want explicit tracing initialization
  So that instrumentation is opt-in and under application control

  Scenario: Tracing is not started on import
    Given the observability package is imported
    When the application does not call initTracing
    Then no tracing is active

  Scenario: Tracing initializes with OTLP exporter
    Given the application provides an OTLP exporter configuration
    When initTracing is called
    Then OpenTelemetry is configured for OTLP export

  Scenario: Tracing initializes with console exporter
    Given the application enables the console exporter
    When initTracing is called
    Then spans are exported to the console for development or testing

  Scenario: Tracing shuts down explicitly
    Given tracing is initialized explicitly
    When the application invokes the shutdown function
    Then the tracing pipeline is flushed and stopped
