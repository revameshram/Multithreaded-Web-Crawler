package com.portfolio.crawlerdashboard.dto;

import com.portfolio.crawlerdashboard.model.CrawlEdge;
import com.portfolio.crawlerdashboard.model.CrawlJobStatus;
import com.portfolio.crawlerdashboard.model.CrawlMetrics;
import com.portfolio.crawlerdashboard.model.CrawlNode;
import com.portfolio.crawlerdashboard.model.LogEntry;
import com.portfolio.crawlerdashboard.model.QueueSnapshot;
import com.portfolio.crawlerdashboard.model.ThreadActivity;

import java.time.Instant;
import java.util.List;

public record CrawlJobSnapshotResponse(
        String jobId,
        CrawlJobStatus status,
        String targetUrl,
        int maxDepth,
        int workerThreads,
        Instant startedAt,
        Instant completedAt,
        long runningTimeMillis,
        CrawlMetrics metrics,
        QueueSnapshot queue,
        List<ThreadActivity> threads,
        List<CrawlNode> nodes,
        List<CrawlEdge> edges,
        List<LogEntry> logs
) {
}
