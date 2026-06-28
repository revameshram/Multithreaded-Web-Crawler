package com.portfolio.crawlerdashboard.controller;

import com.portfolio.crawlerdashboard.dto.CrawlJobResponse;
import com.portfolio.crawlerdashboard.dto.CrawlRequest;
import com.portfolio.crawlerdashboard.dto.CrawlSummaryResponse;
import com.portfolio.crawlerdashboard.model.CrawlJob;
import com.portfolio.crawlerdashboard.model.CrawlJobStatus;
import com.portfolio.crawlerdashboard.service.CrawlJobManager;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;

@RestController
@RequestMapping("/api/crawls")
public class CrawlJobController {

    private final CrawlJobManager crawlJobManager;

    public CrawlJobController(CrawlJobManager crawlJobManager) {
        this.crawlJobManager = crawlJobManager;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public CrawlJobResponse createJob(@Valid @RequestBody CrawlRequest request) {
        CrawlJob job = crawlJobManager.createJob(request);
        return new CrawlJobResponse(job.getJobId(), job.getStatus().name());
    }

    @GetMapping("/{jobId}")
    public Object getJob(@PathVariable String jobId) {
        CrawlJob job = crawlJobManager.getJob(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Crawl job not found"));
        return job.toSnapshot();
    }

    @GetMapping("/{jobId}/summary")
    public CrawlSummaryResponse getSummary(@PathVariable String jobId) {
        CrawlJob job = crawlJobManager.getJob(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Crawl job not found"));

        long durationMillis = 0L;
        if (job.getStartedAt() != null && job.getCompletedAt() != null) {
            durationMillis = Duration.between(job.getStartedAt(), job.getCompletedAt()).toMillis();
        }

        return new CrawlSummaryResponse(
                job.getPagesCompleted().get(),
                job.getSeenUrls().size(),
                job.getBrokenLinks().get(),
                job.metricsSnapshot().averageResponseTimeMillis(),
                job.getMaxDepth(),
                job.getDuplicateUrls().get(),
                durationMillis
        );
    }

    @GetMapping("/{jobId}/status")
    public CrawlJobStatus getStatus(@PathVariable String jobId) {
        CrawlJob job = crawlJobManager.getJob(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Crawl job not found"));
        return job.getStatus();
    }
}
