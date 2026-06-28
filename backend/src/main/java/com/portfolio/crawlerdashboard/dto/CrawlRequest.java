package com.portfolio.crawlerdashboard.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CrawlRequest(
        @NotBlank(message = "Target URL is required")
        @Pattern(regexp = "https?://.+", message = "Target URL must start with http:// or https://")
        String targetUrl,
        @Min(value = 1, message = "Maximum depth must be at least 1")
        @Max(value = 10, message = "Maximum depth cannot exceed 10")
        Integer maxDepth,
        @Min(value = 1, message = "Worker threads must be at least 1")
        @Max(value = 32, message = "Worker threads cannot exceed 32")
        Integer workerThreads,
        Boolean useRecommendedSettings
) {
}
