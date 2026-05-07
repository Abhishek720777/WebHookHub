package com.webhookhub.backend.controller;

import com.webhookhub.backend.entity.User;
import com.webhookhub.backend.entity.WebhookEvent;
import com.webhookhub.backend.repository.UserRepository;
import com.webhookhub.backend.repository.WebhookEventRepository;
import com.webhookhub.backend.service.UserService;
import com.webhookhub.backend.service.WebhookService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final WebhookService webhookService;
    private final WebhookEventRepository eventRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final com.webhookhub.backend.service.WebhookChannelService channelService;

    @RequestMapping(value = "/webhook/{userId}/{channelSlug}/**", method = { RequestMethod.POST, RequestMethod.GET,
            RequestMethod.PUT, RequestMethod.DELETE })
    public ResponseEntity<?> receiveWebhook(@PathVariable Long userId, @PathVariable String channelSlug,
            HttpServletRequest request) throws IOException {
        String fullPath = (String) request
                .getAttribute(org.springframework.web.servlet.HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String prefix = "/webhook/" + userId + "/" + channelSlug;
        String endpointPath = fullPath.length() > prefix.length() ? fullPath.substring(prefix.length() + 1) : "default";

        Long channelId = channelService.findByUserAndSlug(userId, channelSlug)
                .map(com.webhookhub.backend.entity.WebhookChannel::getId)
                .orElse(null);

        String method = request.getMethod();

        Map<String, String> headersMap = new HashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            headersMap.put(headerName, request.getHeader(headerName));
        }

        String payload = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));

        WebhookEvent event = webhookService.processIncomingWebhook(userId, channelId, endpointPath, method, headersMap,
                payload);
        return ResponseEntity.ok(event);
    }

    @GetMapping("/api/events")
    public ResponseEntity<?> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        log.debug("Fetching events for user: {} (page: {}, size: {})", username, page, size);
        return ResponseEntity
                .ok(eventRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), PageRequest.of(page, size)));
    }

    @PostMapping("/api/events/{eventId}/replay")
    public ResponseEntity<WebhookEvent> replayEvent(@PathVariable Long eventId, Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        WebhookEvent replayed = webhookService.replayEvent(eventId, user.getId());
        return ResponseEntity.ok(replayed);
    }

    @DeleteMapping("/api/events/{eventId}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long eventId, Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        webhookService.deleteEvent(eventId, user.getId());
        return ResponseEntity.ok("Event deleted");
    }

    @PostMapping("/api/user/forward-url")
    public ResponseEntity<?> setForwardUrl(@RequestBody Map<String, String> payload, Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        user.setForwardUrl(payload.get("forwardUrl"));
        userService.saveUser(user);
        return ResponseEntity.ok("Forward URL updated");
    }

    @GetMapping("/api/user/me")
    public ResponseEntity<User> getMe(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        return ResponseEntity.ok(user);
    }
}
