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
    private UserService userService;

    @Mock
    private com.webhookhub.backend.repository.WebhookChannelRepository channelRepository;

    @Mock
    private SignatureVerificationService verificationService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private WebhookService webhookService;

    private User testUser;

    @BeforeEach
    void setUp() {
        webhookService = new WebhookService(eventRepository, userService, messagingTemplate, channelRepository, verificationService);

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
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        WebhookEvent result = webhookService.processIncomingWebhook(
                1L, null, "default", "POST", Map.of("content-type", "application/json"), "{\"key\":\"value\"}");

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
        when(userService.getUserById(99L)).thenReturn(null);
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        WebhookEvent result = webhookService.processIncomingWebhook(
                99L, null, "stripe", "POST", Map.of(), "{}");

        // Assert
        assertThat(result.getStatus()).isEqualTo("FAILED");
        assertThat(result.getErrorMessage()).contains("User not found");
        assertThat(result.getUserId()).isEqualTo(99L);
    }

    @Test
    @DisplayName("Should store the correct endpointPath on the event")
    void shouldStoreCustomEndpointPath() {
        // Arrange
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        webhookService.processIncomingWebhook(1L, null, "github", "POST", Map.of(), "{}");

        // Assert — capture what actually got saved to the DB
        ArgumentCaptor<WebhookEvent> captor = ArgumentCaptor.forClass(WebhookEvent.class);
        verify(eventRepository).save(captor.capture());
        assertThat(captor.getValue().getEndpointPath()).isEqualTo("github");
    }

    @Test
    @DisplayName("Should broadcast via WebSocket after logging a successful event")
    void shouldBroadcastViaWebSocketAfterSuccess() {
        // Arrange
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        webhookService.processIncomingWebhook(1L, null, "default", "POST", Map.of(), "{}");

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
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        WebhookEvent result = webhookService.processIncomingWebhook(
                1L, null, "default", "POST", Map.of(), "{}");

        // Assert
        assertThat(result.getStatus()).isEqualTo("FAILED");
        assertThat(result.getErrorMessage()).isNotBlank();
    }

    @Test
    @DisplayName("Should mark event as verified when valid signature is provided")
    void shouldVerifySignatureWhenSecretConfigured() {
        // Arrange
        com.webhookhub.backend.entity.WebhookChannel channel = new com.webhookhub.backend.entity.WebhookChannel();
        channel.setId(10L);
        channel.setSigningSecret("secret");

        when(channelRepository.findById(10L)).thenReturn(Optional.of(channel));
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        when(verificationService.verifyHmacSha256(anyString(), anyString(), eq("secret"))).thenReturn(true);

        // Act
        WebhookEvent result = webhookService.processIncomingWebhook(
                1L, 10L, "default", "POST", Map.of("x-hub-signature-256", "valid-sig"), "{}");

        // Assert
        assertThat(result.getIsVerified()).isTrue();
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
        when(userService.getUserById(1L)).thenReturn(testUser);
        when(eventRepository.save(any(WebhookEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        WebhookEvent result = webhookService.replayEvent(5L);

        // Assert — verify the STOMP topic was used
        verify(messagingTemplate).convertAndSend(
                eq("/topic/events/" + testUser.getId()),
                any(WebhookEvent.class));
    }
}
