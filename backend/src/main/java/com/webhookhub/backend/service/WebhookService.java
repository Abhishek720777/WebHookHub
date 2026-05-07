package com.webhookhub.backend.service;

import com.webhookhub.backend.entity.User;
import com.webhookhub.backend.entity.WebhookEvent;
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
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.webhookhub.backend.repository.WebhookChannelRepository channelRepository;
    private final SignatureVerificationService verificationService;
    private final RestTemplate restTemplate = new RestTemplate();

    public WebhookEvent processIncomingWebhook(Long userId, Long channelId, String endpointPath, String method,
            Map<String, String> headers,
            String payload) {
        WebhookEvent event = new WebhookEvent();
        event.setUserId(userId);
        event.setChannelId(channelId);
        event.setEndpointPath(endpointPath);
        event.setMethod(method);
        event.setHeaders(headers.toString());
        event.setPayload(payload);

        // Signature Verification Logic
        if (channelId != null) {
            channelRepository.findById(channelId).ifPresent(channel -> {
                if (channel.getSigningSecret() != null) {
                    String signature = headers.getOrDefault("x-hub-signature-256", 
                                       headers.getOrDefault("stripe-signature", 
                                       headers.getOrDefault("x-razorpay-signature", null)));
                    if (signature != null) {
                        boolean verified = verificationService.verifyHmacSha256(payload, signature, channel.getSigningSecret());
                        event.setIsVerified(verified);
                    }
                }
            });
        }

        User user = userService.getUserById(userId);
        if (user == null) {
            event.setStatus("FAILED");
            event.setErrorMessage("User not found");
            WebhookEvent saved = eventRepository.save(event);
            messagingTemplate.convertAndSend("/topic/events/" + userId, saved);
            return saved;
        }

        return executeForwarding(event, user.getForwardUrl());
    }

    public WebhookEvent replayEvent(Long eventId, Long userId) {
        WebhookEvent original = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (!original.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to replay this event");
        }

        User user = userService.getUserById(original.getUserId());
        if (user == null) throw new RuntimeException("User not found");

        WebhookEvent newEvent = new WebhookEvent();
        newEvent.setUserId(original.getUserId());
        newEvent.setChannelId(original.getChannelId());
        newEvent.setEndpointPath(original.getEndpointPath());
        newEvent.setMethod(original.getMethod());
        newEvent.setHeaders(original.getHeaders());
        newEvent.setPayload(original.getPayload());

        return executeForwarding(newEvent, user.getForwardUrl());
    }

    public void deleteEvent(Long eventId, Long userId) {
        WebhookEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        if (!event.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this event");
        }
        
        eventRepository.delete(event);
    }

    private WebhookEvent executeForwarding(WebhookEvent event, String forwardUrl) {
        if (event.getChannelId() != null) {
            channelRepository.findById(event.getChannelId()).ifPresent(channel -> {
                event.setChannelSlug(channel.getSlug());
            });
        }

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
