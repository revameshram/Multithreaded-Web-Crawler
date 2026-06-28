package com.portfolio.crawlerdashboard.service;

import com.portfolio.crawlerdashboard.dto.CrawlRequest;
import com.portfolio.crawlerdashboard.model.CrawlJob;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CrawlJobManager {

    private static final int RECOMMENDED_DEPTH = 3;
    private static final int RECOMMENDED_THREADS = 8;

    private final Map<String, CrawlJob> jobs = new ConcurrentHashMap<>();
    private final CrawlOrchestrator crawlOrchestrator;

    public CrawlJobManager(CrawlOrchestrator crawlOrchestrator) {
        this.crawlOrchestrator = crawlOrchestrator;
    }

    public CrawlJob createJob(CrawlRequest request) {
        boolean useRecommended = request.useRecommendedSettings() == null || request.useRecommendedSettings();
        int maxDepth = useRecommended ? RECOMMENDED_DEPTH : Optional.ofNullable(request.maxDepth()).orElse(RECOMMENDED_DEPTH);
        int workerThreads = useRecommended ? RECOMMENDED_THREADS : Optional.ofNullable(request.workerThreads()).orElse(RECOMMENDED_THREADS);

        String jobId = UUID.randomUUID().toString();
        CrawlJob job = new CrawlJob(jobId, request.targetUrl(), maxDepth, workerThreads);
        jobs.put(jobId, job);
        crawlOrchestrator.start(job);
        return job;
    }

    public Optional<CrawlJob> getJob(String jobId) {
        return Optional.ofNullable(jobs.get(jobId));
    }
}
