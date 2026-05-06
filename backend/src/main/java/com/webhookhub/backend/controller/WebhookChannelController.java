package com.webhookhub.backend.controller;

import com.webhookhub.backend.entity.User;
import com.webhookhub.backend.entity.WebhookChannel;
import com.webhookhub.backend.repository.UserRepository;
import com.webhookhub.backend.service.WebhookChannelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class WebhookChannelController {

    private final WebhookChannelService channelService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<WebhookChannel>> getChannels(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(channelService.getChannelsByUser(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> createChannel(@RequestBody Map<String, String> body, Authentication authentication) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body("Channel name is required");
        }
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        WebhookChannel channel = channelService.createChannel(user.getId(), name.trim());
        return ResponseEntity.ok(channel);
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<?> deleteChannel(@PathVariable Long channelId, Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        channelService.deleteChannel(channelId, user.getId());
        return ResponseEntity.ok("Channel deleted");
    }

    @PatchMapping("/{channelId}")
    public ResponseEntity<?> renameChannel(@PathVariable Long channelId,
                                           @RequestBody Map<String, String> body,
                                           Authentication authentication) {
        String newName = body.get("name");
        if (newName == null || newName.isBlank()) {
            return ResponseEntity.badRequest().body("Channel name is required");
        }
        User user = userRepository.findByUsername(authentication.getName()).orElseThrow();
        WebhookChannel updated = channelService.renameChannel(channelId, user.getId(), newName.trim());
        return ResponseEntity.ok(updated);
    }
}
