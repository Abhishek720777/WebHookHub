package com.webhookhub.backend.service;

import com.webhookhub.backend.entity.WebhookChannel;
import com.webhookhub.backend.repository.WebhookChannelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WebhookChannelService {

    private final WebhookChannelRepository channelRepository;

    public WebhookChannel createChannel(Long userId, String name) {
        String slug = generateSlug(name);
        // If slug already exists, append a counter
        String finalSlug = slug;
        int counter = 1;
        while (channelRepository.existsByUserIdAndSlug(userId, finalSlug)) {
            finalSlug = slug + "-" + counter++;
        }
        WebhookChannel channel = new WebhookChannel();
        channel.setUserId(userId);
        channel.setName(name);
        channel.setSlug(finalSlug);
        return channelRepository.save(channel);
    }

    public List<WebhookChannel> getChannelsByUser(Long userId) {
        return channelRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void deleteChannel(Long channelId, Long userId) {
        WebhookChannel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
        if (!channel.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        channelRepository.delete(channel);
    }

    public WebhookChannel renameChannel(Long channelId, Long userId, String newName) {
        WebhookChannel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
        if (!channel.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        channel.setName(newName);
        channel.setSlug(generateSlug(newName));
        return channelRepository.save(channel);
    }

    public Optional<WebhookChannel> findByUserAndSlug(Long userId, String slug) {
        return channelRepository.findByUserIdAndSlug(userId, slug);
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }
}
