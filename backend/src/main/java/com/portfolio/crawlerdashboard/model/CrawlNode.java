package com.portfolio.crawlerdashboard.model;

public record CrawlNode(
        String id,
        String url,
        String title,
        Integer httpStatus,
        Long responseTimeMillis,
        String parentUrl,
        int depth,
        int outgoingLinks,
        int incomingLinks
) {
}
