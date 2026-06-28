package com.portfolio.crawlerdashboard.model;

public record ThreadActivity(
        String threadName,
        String state,
        String currentUrl
) {
}
