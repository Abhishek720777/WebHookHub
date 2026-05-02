package com.webhookhub.backend.controller;

import com.webhookhub.backend.entity.User;
import com.webhookhub.backend.entity.WebhookEvent;
import com.webhookhub.backend.repository.UserRepository;
import com.webhookhub.backend.repository.WebhookEventRepository;
import com.webhookhub.backend.service.WebhookService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookService webhookService;
    private final WebhookEventRepository eventRepository;
    private final UserRepository userRepository;

    @RequestMapping(value = "/webhook/{userId}", method = {RequestMethod.POST, RequestMethod.GET, RequestMethod.PUT, RequestMethod.DELETE})
    public ResponseEntity<?> receiveWebhook(@PathVariable Long userId, HttpServletRequest request) throws IOException {
        String method = request.getMethod();
        
        Map<String, String> headersMap = new HashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            headersMap.put(headerName, request.getHeader(headerName));
        }

        String payload = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));

        WebhookEvent event = webhookService.processIncomingWebhook(userId, method, headersMap, payload);
        return ResponseEntity.ok(event);
    }

    @GetMapping("/api/events")
    public ResponseEntity<List<WebhookEvent>> getEvents(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        return ResponseEntity.ok(eventRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }

    @PostMapping("/api/events/{eventId}/replay")
    public ResponseEntity<WebhookEvent> replayEvent(@PathVariable Long eventId) {
        WebhookEvent replayed = webhookService.replayEvent(eventId);
        return ResponseEntity.ok(replayed);
    }
    
    @PostMapping("/api/user/forward-url")
    public ResponseEntity<?> setForwardUrl(@RequestBody Map<String, String> payload, Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        user.setForwardUrl(payload.get("forwardUrl"));
        userRepository.save(user);
        return ResponseEntity.ok("Forward URL updated");
    }
    
    @GetMapping("/api/user/me")
    public ResponseEntity<User> getMe(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        return ResponseEntity.ok(user);
    }
}
