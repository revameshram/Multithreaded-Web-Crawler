package com.portfolio.crawlerdashboard.model;

import java.util.List;

public record QueueSnapshot(
        int queueSize,
        String currentUrl,
        List<String> upcomingUrls
) {
}
