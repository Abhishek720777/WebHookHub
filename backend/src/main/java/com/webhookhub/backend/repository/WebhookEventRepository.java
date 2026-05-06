package com.webhookhub.backend.repository;

import com.webhookhub.backend.entity.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Map;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, Long> {
    List<WebhookEvent> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<WebhookEvent> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT e.status as status, COUNT(e) as count FROM WebhookEvent e WHERE e.userId = :userId GROUP BY e.status")
    List<Map<String, Object>> countByStatus(@Param("userId") Long userId);

    @Query("SELECT e.endpointPath as path, COUNT(e) as count FROM WebhookEvent e WHERE e.userId = :userId GROUP BY e.endpointPath")
    List<Map<String, Object>> countByEndpoint(@Param("userId") Long userId);

    @Query(value = "SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:00:00') as time, COUNT(*) as count " +
                   "FROM webhook_events WHERE user_id = :userId " +
                   "GROUP BY time ORDER BY time ASC", nativeQuery = true)
    List<Map<String, Object>> countByTime(@Param("userId") Long userId);
}
