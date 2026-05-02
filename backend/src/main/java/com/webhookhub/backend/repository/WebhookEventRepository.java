package com.webhookhub.backend.repository;

import com.webhookhub.backend.entity.WebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WebhookEventRepository extends JpaRepository<WebhookEvent, Long> {
    List<WebhookEvent> findByUserIdOrderByCreatedAtDesc(Long userId);
}
