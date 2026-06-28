package com.portfolio.crawlerdashboard.model;

public record CrawlMetrics(
        long pagesVisited,
        long pagesQueued,
        long pagesCompleted,
        long duplicateUrls,
        long brokenLinks,
        double averageResponseTimeMillis
) {
}
