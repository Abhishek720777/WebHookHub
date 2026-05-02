package com.webhookhub.backend.service;

import com.webhookhub.backend.dto.AnalyticsResponse;
import com.webhookhub.backend.repository.WebhookEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final WebhookEventRepository eventRepository;

    public AnalyticsResponse getAnalytics(Long userId) {
        System.out.println("DEBUG: Fetching analytics for User ID: " + userId);
        List<Map<String, Object>> statusDist = eventRepository.countByStatus(userId);
        List<Map<String, Object>> endpointDist = eventRepository.countByEndpoint(userId);
        List<Map<String, Object>> timeSeries = eventRepository.countByTime(userId);

        long success = statusDist.stream()
                .filter(m -> "SUCCESS".equals(m.get("status")))
                .mapToLong(m -> ((Number) m.get("count")).longValue())
                .findFirst()
                .orElse(0L);

        long failure = statusDist.stream()
                .filter(m -> "FAILED".equals(m.get("status")))
                .mapToLong(m -> ((Number) m.get("count")).longValue())
                .findFirst()
                .orElse(0L);

        return AnalyticsResponse.builder()
                .statusDistribution(statusDist)
                .endpointDistribution(endpointDist)
                .timeSeriesData(timeSeries)
                .totalEvents(success + failure)
                .successCount(success)
                .failureCount(failure)
                .build();
    }
}
