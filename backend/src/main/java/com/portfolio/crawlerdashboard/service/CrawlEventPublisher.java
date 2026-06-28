package com.portfolio.crawlerdashboard.service;

import com.portfolio.crawlerdashboard.model.CrawlEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class CrawlEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public CrawlEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publish(String jobId, String eventType, Object payload) {
        messagingTemplate.convertAndSend(
                "/topic/crawls/" + jobId,
                new CrawlEvent(eventType, Instant.now(), payload)
        );
    }
}
