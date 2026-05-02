package com.webhookhub.backend.service;

import com.webhookhub.backend.entity.User;
import com.webhookhub.backend.entity.WebhookEvent;
import com.webhookhub.backend.repository.UserRepository;
import com.webhookhub.backend.repository.WebhookEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class WebhookService {

    private final WebhookEventRepository eventRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RestTemplate restTemplate = new RestTemplate();

    public WebhookEvent processIncomingWebhook(Long userId, String endpointPath, String method, Map<String, String> headers,
            String payload) {
        WebhookEvent event = new WebhookEvent();
        event.setUserId(userId);
        event.setEndpointPath(endpointPath);
        event.setMethod(method);
        event.setHeaders(headers.toString());
        event.setPayload(payload);

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            event.setStatus("FAILED");
            event.setErrorMessage("User not found");
            WebhookEvent saved = eventRepository.save(event);
            messagingTemplate.convertAndSend("/topic/events/" + userId, saved);
            return saved;
        }

        return executeForwarding(event, user.getForwardUrl());
    }

    public WebhookEvent replayEvent(Long eventId) {
        WebhookEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        User user = userRepository.findById(event.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return executeForwarding(event, user.getForwardUrl());
    }

    private WebhookEvent executeForwarding(WebhookEvent event, String forwardUrl) {
        if (forwardUrl == null || forwardUrl.isEmpty()) {
            event.setStatus("SUCCESS");
            event.setErrorMessage("No forward URL configured. Logged successfully.");
            WebhookEvent saved = eventRepository.save(event);
            messagingTemplate.convertAndSend("/topic/events/" + event.getUserId(), saved);
            return saved;
        }

        try {
            HttpHeaders httpHeaders = new HttpHeaders();
            httpHeaders.add("Content-Type", "application/json");

            HttpEntity<String> requestEntity = new HttpEntity<>(event.getPayload(), httpHeaders);

            ResponseEntity<String> response = restTemplate.exchange(
                    forwardUrl,
                    HttpMethod.valueOf(event.getMethod()),
                    requestEntity,
                    String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                event.setStatus("SUCCESS");
                event.setErrorMessage(null);
            } else {
                event.setStatus("FAILED");
                event.setErrorMessage("Target responded with: " + response.getStatusCode());
            }
        } catch (Exception e) {
            event.setStatus("FAILED");
            event.setErrorMessage(e.getMessage());
        }

        WebhookEvent savedEvent = eventRepository.save(event);
        // Broadcast the event to any connected WebSocket clients
        messagingTemplate.convertAndSend("/topic/events/" + event.getUserId(), savedEvent);
        
        return savedEvent;
    }
}
