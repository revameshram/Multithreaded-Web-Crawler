package com.portfolio.crawlerdashboard.model;

public record CrawlNodeState(
        String url,
        String title,
        Integer httpStatus,
        Long responseTimeMillis,
        String parentUrl,
        int depth
) {
}
