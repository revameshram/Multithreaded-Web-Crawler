package com.portfolio.crawlerdashboard.model;

import java.time.Instant;

public record CrawlEvent(
        String type,
        Instant timestamp,
        Object payload
) {
}
