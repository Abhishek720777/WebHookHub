package com.webhookhub.backend.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    // Bucket for Authentication (Login/Register) - Strict
    public Bucket resolveAuthBucket(String ip) {
        return buckets.computeIfAbsent("AUTH_" + ip, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1)))) // 5 requests per minute
                .build());
    }

    // Bucket for Webhook Ingestion - Higher capacity
    public Bucket resolveWebhookBucket(String userId) {
        return buckets.computeIfAbsent("WEBHOOK_" + userId, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1)))) // 100 requests per minute
                .build());
    }

    // Bucket for API Replay/Updates - Moderate
    public Bucket resolveApiBucket(String userId) {
        return buckets.computeIfAbsent("API_" + userId, k -> Bucket.builder()
                .addLimit(Bandwidth.classic(30, Refill.intervally(30, Duration.ofMinutes(1)))) // 30 requests per minute
                .build());
    }
}
