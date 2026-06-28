package com.portfolio.crawlerdashboard.dto;

public record CrawlSummaryResponse(
        long totalPages,
        long uniqueUrls,
        long brokenLinks,
        double averageResponseTimeMillis,
        int maximumDepth,
        long duplicateUrls,
        long durationMillis
) {
}
