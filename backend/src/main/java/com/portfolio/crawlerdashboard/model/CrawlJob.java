package com.portfolio.crawlerdashboard.model;

import com.portfolio.crawlerdashboard.dto.CrawlJobSnapshotResponse;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicLong;

public class CrawlJob {

    private final String jobId;
    private final String targetUrl;
    private final int maxDepth;
    private final int workerThreads;
    private final BlockingQueue<CrawlTask> queue = new LinkedBlockingQueue<>();
    private final Set<String> seenUrls = ConcurrentHashMap.newKeySet();
    private final Set<String> visitedUrls = ConcurrentHashMap.newKeySet();
    private final Map<String, CrawlNodeState> nodes = new ConcurrentHashMap<>();
    private final Map<String, ThreadActivity> threadActivities = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> outgoing = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> incoming = new ConcurrentHashMap<>();
    private final List<CrawlEdge> edges = java.util.Collections.synchronizedList(new ArrayList<>());
    private final ConcurrentLinkedDeque<LogEntry> logs = new ConcurrentLinkedDeque<>();
    private final AtomicLong pagesVisited = new AtomicLong();
    private final AtomicLong pagesQueued = new AtomicLong();
    private final AtomicLong pagesCompleted = new AtomicLong();
    private final AtomicLong duplicateUrls = new AtomicLong();
    private final AtomicLong brokenLinks = new AtomicLong();
    private final AtomicLong totalResponseTimeMillis = new AtomicLong();

    private volatile CrawlJobStatus status = CrawlJobStatus.PENDING;
    private volatile Instant startedAt;
    private volatile Instant completedAt;
    private volatile ExecutorService executorService;
    private volatile String currentUrl;

    public CrawlJob(String jobId, String targetUrl, int maxDepth, int workerThreads) {
        this.jobId = jobId;
        this.targetUrl = targetUrl;
        this.maxDepth = maxDepth;
        this.workerThreads = workerThreads;
    }

    public String getJobId() {
        return jobId;
    }

    public String getTargetUrl() {
        return targetUrl;
    }

    public int getMaxDepth() {
        return maxDepth;
    }

    public int getWorkerThreads() {
        return workerThreads;
    }

    public BlockingQueue<CrawlTask> getQueue() {
        return queue;
    }

    public Set<String> getSeenUrls() {
        return seenUrls;
    }

    public Set<String> getVisitedUrls() {
        return visitedUrls;
    }

    public Map<String, CrawlNodeState> getNodes() {
        return nodes;
    }

    public Map<String, ThreadActivity> getThreadActivities() {
        return threadActivities;
    }

    public Map<String, Set<String>> getOutgoing() {
        return outgoing;
    }

    public Map<String, Set<String>> getIncoming() {
        return incoming;
    }

    public List<CrawlEdge> getEdges() {
        return edges;
    }

    public ConcurrentLinkedDeque<LogEntry> getLogs() {
        return logs;
    }

    public AtomicLong getPagesVisited() {
        return pagesVisited;
    }

    public AtomicLong getPagesQueued() {
        return pagesQueued;
    }

    public AtomicLong getPagesCompleted() {
        return pagesCompleted;
    }

    public AtomicLong getDuplicateUrls() {
        return duplicateUrls;
    }

    public AtomicLong getBrokenLinks() {
        return brokenLinks;
    }

    public AtomicLong getTotalResponseTimeMillis() {
        return totalResponseTimeMillis;
    }

    public CrawlJobStatus getStatus() {
        return status;
    }

    public void setStatus(CrawlJobStatus status) {
        this.status = status;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public ExecutorService getExecutorService() {
        return executorService;
    }

    public void setExecutorService(ExecutorService executorService) {
        this.executorService = executorService;
    }

    public String getCurrentUrl() {
        return currentUrl;
    }

    public void setCurrentUrl(String currentUrl) {
        this.currentUrl = currentUrl;
    }

    public void appendLog(LogEntry entry) {
        logs.addFirst(entry);
        while (logs.size() > 250) {
            logs.pollLast();
        }
    }

    public CrawlMetrics metricsSnapshot() {
        long completed = pagesCompleted.get();
        double average = completed == 0 ? 0.0 : (double) totalResponseTimeMillis.get() / completed;
        return new CrawlMetrics(
                pagesVisited.get(),
                pagesQueued.get(),
                pagesCompleted.get(),
                duplicateUrls.get(),
                brokenLinks.get(),
                average
        );
    }

    public QueueSnapshot queueSnapshot() {
        List<String> upcoming = queue.stream()
                .limit(10)
                .map(CrawlTask::url)
                .toList();
        return new QueueSnapshot(queue.size(), currentUrl, upcoming);
    }

    public List<ThreadActivity> threadSnapshot() {
        return threadActivities.values().stream()
                .sorted(Comparator.comparing(ThreadActivity::threadName))
                .toList();
    }

    public List<CrawlNode> nodeSnapshot() {
        return nodes.values().stream()
                .map(state -> new CrawlNode(
                        state.url(),
                        state.url(),
                        state.title(),
                        state.httpStatus(),
                        state.responseTimeMillis(),
                        state.parentUrl(),
                        state.depth(),
                        outgoing.getOrDefault(state.url(), Set.of()).size(),
                        incoming.getOrDefault(state.url(), Set.of()).size()
                ))
                .toList();
    }

    public List<CrawlEdge> edgeSnapshot() {
        synchronized (edges) {
            return List.copyOf(edges);
        }
    }

    public List<LogEntry> logSnapshot() {
        return logs.stream().toList();
    }

    public CrawlJobSnapshotResponse toSnapshot() {
        long runtime = 0L;
        if (startedAt != null) {
            Instant end = completedAt != null ? completedAt : Instant.now();
            runtime = Duration.between(startedAt, end).toMillis();
        }

        return new CrawlJobSnapshotResponse(
                jobId,
                status,
                targetUrl,
                maxDepth,
                workerThreads,
                startedAt,
                completedAt,
                runtime,
                metricsSnapshot(),
                queueSnapshot(),
                threadSnapshot(),
                nodeSnapshot(),
                edgeSnapshot(),
                logSnapshot()
        );
    }
}
