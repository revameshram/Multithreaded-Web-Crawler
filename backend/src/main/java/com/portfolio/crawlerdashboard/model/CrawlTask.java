package com.portfolio.crawlerdashboard.model;

public record CrawlTask(String url, String parentUrl, int depth) {
}
