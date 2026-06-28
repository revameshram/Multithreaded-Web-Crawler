package com.portfolio.crawlerdashboard.model;

import java.time.Instant;

public record LogEntry(
        Instant timestamp,
        String level,
        String message
) {
}
