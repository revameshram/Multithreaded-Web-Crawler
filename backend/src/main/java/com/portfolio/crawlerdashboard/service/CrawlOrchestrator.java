package com.portfolio.crawlerdashboard.service;

import com.portfolio.crawlerdashboard.model.CrawlJob;
import com.portfolio.crawlerdashboard.model.CrawlJobStatus;
import com.portfolio.crawlerdashboard.model.CrawlNodeState;
import com.portfolio.crawlerdashboard.model.CrawlTask;
import com.portfolio.crawlerdashboard.model.LogEntry;
import com.portfolio.crawlerdashboard.model.ThreadActivity;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
public class CrawlOrchestrator {

    private final CrawlEventPublisher eventPublisher;
    private final HttpClient httpClient;

    public CrawlOrchestrator(CrawlEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public void start(CrawlJob job) {
        ExecutorService executor = Executors.newFixedThreadPool(job.getWorkerThreads());
        CountDownLatch workerLatch = new CountDownLatch(job.getWorkerThreads());
        job.setExecutorService(executor);
        job.setStatus(CrawlJobStatus.RUNNING);
        job.setStartedAt(Instant.now());

        String normalizedTarget = normalize(job.getTargetUrl());
        if (normalizedTarget == null) {
            job.setStatus(CrawlJobStatus.FAILED);
            appendLog(job, "ERROR", "Invalid target URL");
            publishSnapshot(job, "JOB_FAILED");
            return;
        }

        job.getSeenUrls().add(normalizedTarget);
        job.getNodes().put(normalizedTarget, new CrawlNodeState(
                normalizedTarget,
                null,
                null,
                null,
                null,
                0
        ));
        enqueue(job, new CrawlTask(normalizedTarget, null, 0));
        job.appendLog(new LogEntry(Instant.now(), "INFO", "Created crawl job for " + job.getTargetUrl()));
        publishSnapshot(job, "JOB_STARTED");

        for (int i = 0; i < job.getWorkerThreads(); i++) {
            int threadNumber = i + 1;
            executor.submit(() -> runWorker(job, "worker-" + threadNumber, workerLatch));
        }

        Thread completionWatcher = new Thread(() -> awaitCompletion(job, workerLatch), "crawl-completion-" + job.getJobId());
        completionWatcher.setDaemon(true);
        completionWatcher.start();
    }

    private void runWorker(CrawlJob job, String workerName, CountDownLatch workerLatch) {
        updateThread(job, workerName, "WAITING", null);
        try {
            while (!Thread.currentThread().isInterrupted()) {
                CrawlTask task = null;
                try {
                    task = job.getQueue().poll(3, TimeUnit.SECONDS);
                    if (task == null) {
                        if (job.getQueue().isEmpty()) {
                            return;
                        }
                        continue;
                    }

                    if (task.depth() > job.getMaxDepth()) {
                        continue;
                    }
                    if (!job.getVisitedUrls().add(task.url())) {
                        job.getDuplicateUrls().incrementAndGet();
                        appendLog(job, "WARNING", "Duplicate URL skipped: " + task.url());
                        publishSnapshot(job, "DUPLICATE_URL");
                        continue;
                    }

                    job.setCurrentUrl(task.url());
                    job.getPagesVisited().incrementAndGet();
                    updateThread(job, workerName, "DOWNLOADING", task.url());
                    appendLog(job, "INFO", "Fetching " + task.url());

                    long start = System.currentTimeMillis();
                    HttpResponse<String> response = fetch(task.url());
                    long responseTime = System.currentTimeMillis() - start;

                    if (response.statusCode() >= 400) {
                        job.getBrokenLinks().incrementAndGet();
                    }

                    updateThread(job, workerName, "PARSING", task.url());
                    Document document = Jsoup.parse(response.body(), response.uri().toString());
                    String title = document.title();

                    job.getNodes().put(task.url(), new CrawlNodeState(
                            task.url(),
                            title,
                            response.statusCode(),
                            responseTime,
                            task.parentUrl(),
                            task.depth()
                    ));
                    job.getPagesCompleted().incrementAndGet();
                    job.getTotalResponseTimeMillis().addAndGet(responseTime);

                    Set<String> discovered = extractLinks(response.uri().toString(), document);
                    appendLog(job, "INFO", "Found " + discovered.size() + " links on " + task.url());

                    for (String link : discovered) {
                        recordEdge(job, task.url(), link);
                        if (job.getSeenUrls().add(link)) {
                            job.getNodes().put(link, new CrawlNodeState(
                                    link,
                                    null,
                                    null,
                                    null,
                                    task.url(),
                                    task.depth() + 1
                            ));
                            enqueue(job, new CrawlTask(link, task.url(), task.depth() + 1));
                        } else {
                            job.getDuplicateUrls().incrementAndGet();
                        }
                    }

                    publishSnapshot(job, "PAGE_COMPLETED");
                    updateThread(job, workerName, "PROCESSING", task.url());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    appendLog(job, "ERROR", "Worker interrupted");
                    return;
                } catch (IOException e) {
                    if (task != null) {
                        job.getBrokenLinks().incrementAndGet();
                        job.getNodes().put(task.url(), new CrawlNodeState(
                                task.url(),
                                null,
                                500,
                                0L,
                                task.parentUrl(),
                                task.depth()
                        ));
                        job.getPagesCompleted().incrementAndGet();
                    }
                    appendLog(job, "ERROR", "Request failed: " + e.getMessage());
                    publishSnapshot(job, "CRAWL_ERROR");
                } catch (Exception e) {
                    if (task != null) {
                        job.getBrokenLinks().incrementAndGet();
                        job.getNodes().put(task.url(), new CrawlNodeState(
                                task.url(),
                                null,
                                500,
                                0L,
                                task.parentUrl(),
                                task.depth()
                        ));
                        job.getPagesCompleted().incrementAndGet();
                    }
                    appendLog(job, "ERROR", "Crawler error: " + e.getMessage());
                    publishSnapshot(job, "CRAWL_ERROR");
                } finally {
                    updateThread(job, workerName, "WAITING", null);
                }
            }
        } finally {
            workerLatch.countDown();
        }
    }

    private HttpResponse<String> fetch(String url) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .header("User-Agent", "crawler-dashboard/1.0")
                .timeout(Duration.ofSeconds(15))
                .GET()
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private Set<String> extractLinks(String baseUrl, Document document) {
        Set<String> links = new HashSet<>();
        for (Element anchor : document.select("a[href]")) {
            String normalized = normalize(document.baseUri().isBlank() ? baseUrl : anchor.absUrl("href"));
            if (normalized != null) {
                links.add(normalized);
            }
        }
        return links;
    }

    private void enqueue(CrawlJob job, CrawlTask task) {
        if (task.url() == null) {
            return;
        }
        job.getQueue().offer(task);
        job.getPagesQueued().incrementAndGet();
        publishSnapshot(job, "QUEUE_UPDATED");
    }

    private void recordEdge(CrawlJob job, String source, String target) {
        job.getOutgoing().computeIfAbsent(source, key -> java.util.concurrent.ConcurrentHashMap.newKeySet()).add(target);
        job.getIncoming().computeIfAbsent(target, key -> java.util.concurrent.ConcurrentHashMap.newKeySet()).add(source);
        String edgeId = source + "->" + target;
        synchronized (job.getEdges()) {
            boolean exists = job.getEdges().stream().anyMatch(edge -> edge.id().equals(edgeId));
            if (!exists) {
                job.getEdges().add(new com.portfolio.crawlerdashboard.model.CrawlEdge(edgeId, source, target));
            }
        }
    }

    private void updateThread(CrawlJob job, String workerName, String state, String currentUrl) {
        job.getThreadActivities().put(workerName, new ThreadActivity(workerName, state, currentUrl));
        eventPublisher.publish(job.getJobId(), "THREAD_ACTIVITY", job.threadSnapshot());
    }

    private void appendLog(CrawlJob job, String level, String message) {
        LogEntry entry = new LogEntry(Instant.now(), level, message);
        job.appendLog(entry);
        eventPublisher.publish(job.getJobId(), "LOG", entry);
    }

    private void publishSnapshot(CrawlJob job, String eventType) {
        eventPublisher.publish(job.getJobId(), eventType, job.toSnapshot());
    }

    private void awaitCompletion(CrawlJob job, CountDownLatch workerLatch) {
        try {
            workerLatch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            job.setStatus(CrawlJobStatus.FAILED);
            appendLog(job, "ERROR", "Completion watcher interrupted");
            publishSnapshot(job, "JOB_FAILED");
            return;
        } finally {
            ExecutorService executor = job.getExecutorService();
            if (executor != null) {
                executor.shutdownNow();
            }
        }

        job.setCompletedAt(Instant.now());
        if (job.getStatus() != CrawlJobStatus.FAILED) {
            job.setStatus(CrawlJobStatus.COMPLETED);
        }
        appendLog(job, "INFO", "Crawl completed for " + job.getTargetUrl());
        publishSnapshot(job, "JOB_COMPLETED");
    }

    private String normalize(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }

        try {
            URI uri = new URI(url.trim());
            String scheme = uri.getScheme();
            if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) {
                return null;
            }

            String host = uri.getHost();
            if (host == null || host.isBlank()) {
                return null;
            }

            String path = uri.getPath() == null || uri.getPath().isBlank() ? "/" : uri.getPath();
            int port = uri.getPort();
            boolean defaultPort = (scheme.equalsIgnoreCase("http") && port == 80)
                    || (scheme.equalsIgnoreCase("https") && port == 443)
                    || port == -1;
            String authority = defaultPort ? host.toLowerCase() : host.toLowerCase() + ":" + port;

            return new URI(
                    scheme.toLowerCase(),
                    authority,
                    path,
                    uri.getQuery(),
                    null
            ).toString();
        } catch (URISyntaxException e) {
            return null;
        }
    }
}
