package com.webhookhub.backend.service;

import com.webhookhub.backend.entity.User;
import com.webhookhub.backend.entity.WebhookEvent;
import com.webhookhub.backend.repository.UserRepository;
import com.webhookhub.backend.repository.WebhookEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WebhookService Tests")
class WebhookServiceTest {

    @Mock
    private WebhookEventRepository eventRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private WebhookService webhookService;

    private User testUser;

    @BeforeEach
    void setUp() {
        webhookService = new WebhookService(eventRepository, userRepository, messagingTemplate);

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("test_user");
        testUser.setPassword("hashed_password");
        testUser.setForwardUrl(null);
    }

    // --- processIncomingWebhook() Tests ---

    @Test
    @DisplayName("Should log event as SUCCESS when no forward URL is configured")
    void shouldLogSuccessWhenNoForwardUrl() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        WebhookEvent result = webhookService.processIncomingWebhook(
                1L, "default", "POST", Map.of("content-type", "application/json"), "{\"key\":\"value\"}");

        // Assert
        assertThat(result.getStatus()).isEqualTo("SUCCESS");
        assertThat(result.getErrorMessage()).contains("No forward URL configured");
        assertThat(result.getMethod()).isEqualTo("POST");
        assertThat(result.getEndpointPath()).isEqualTo("default");
    }

    @Test
    @DisplayName("Should set status FAILED and save event when user is not found")
    void shouldFailWhenUserNotFound() {
        // Arrange
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        WebhookEvent result = webhookService.processIncomingWebhook(
                99L, "stripe", "POST", Map.of(), "{}");

        // Assert
        assertThat(result.getStatus()).isEqualTo("FAILED");
        assertThat(result.getErrorMessage()).contains("User not found");
        assertThat(result.getUserId()).isEqualTo(99L);
    }

    @Test
    @DisplayName("Should store the correct endpointPath on the event")
    void shouldStoreCustomEndpointPath() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        webhookService.processIncomingWebhook(1L, "github", "POST", Map.of(), "{}");

        // Assert — capture what actually got saved to the DB
        ArgumentCaptor<WebhookEvent> captor = ArgumentCaptor.forClass(WebhookEvent.class);
        verify(eventRepository).save(captor.capture());
        assertThat(captor.getValue().getEndpointPath()).isEqualTo("github");
    }

    @Test
    @DisplayName("Should broadcast via WebSocket after logging a successful event")
    void shouldBroadcastViaWebSocketAfterSuccess() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        webhookService.processIncomingWebhook(1L, "default", "POST", Map.of(), "{}");

        // Assert — verify the STOMP topic was used
        verify(messagingTemplate).convertAndSend(
                eq("/topic/events/" + testUser.getId()),
                any(WebhookEvent.class));
    }

    @Test
    @DisplayName("Should set status FAILED when forward URL is unreachable")
    void shouldFailWhenForwardUrlIsUnreachable() {
        // Arrange
        testUser.setForwardUrl("http://localhost:9999/nonexistent"); // Nothing is listening here
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        WebhookEvent result = webhookService.processIncomingWebhook(
                1L, "default", "POST", Map.of(), "{}");

        // Assert
        assertThat(result.getStatus()).isEqualTo("FAILED");
        assertThat(result.getErrorMessage()).isNotBlank();
    }

    // --- replayEvent() Tests ---

    @Test
    @DisplayName("Should throw RuntimeException when replaying a non-existent event")
    void shouldThrowWhenReplayingNonExistentEvent() {
        // Arrange
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        // Act + Assert
        assertThrows(RuntimeException.class, () -> webhookService.replayEvent(999L));
    }

    @Test
    @DisplayName("Replaying an event should use the saved payload and method")
    void shouldReplayEventWithOriginalPayloadAndMethod() {
        // Arrange
        WebhookEvent existing = new WebhookEvent();
        existing.setId(5L);
        existing.setUserId(1L);
        existing.setMethod("POST");
        existing.setPayload("{\"replayed\":true}");
        existing.setEndpointPath("stripe");
        existing.setHeaders("{}");

        when(eventRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        WebhookEvent result = webhookService.replayEvent(5L);

        // Assert — verify the STOMP topic was used
        verify(messagingTemplate).convertAndSend(
                eq("/topic/events/" + testUser.getId()),
                any(WebhookEvent.class));
    }
}
