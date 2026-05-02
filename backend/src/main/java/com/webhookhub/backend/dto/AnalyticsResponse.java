package com.webhookhub.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AnalyticsResponse {
    private List<Map<String, Object>> statusDistribution;
    private List<Map<String, Object>> endpointDistribution;
    private List<Map<String, Object>> timeSeriesData;
    private long totalEvents;
    private long successCount;
    private long failureCount;
}
