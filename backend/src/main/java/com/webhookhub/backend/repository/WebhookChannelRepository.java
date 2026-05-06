package com.webhookhub.backend.repository;

import com.webhookhub.backend.entity.WebhookChannel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WebhookChannelRepository extends JpaRepository<WebhookChannel, Long> {
    List<WebhookChannel> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<WebhookChannel> findByUserIdAndSlug(Long userId, String slug);
    boolean existsByUserIdAndSlug(Long userId, String slug);
}
