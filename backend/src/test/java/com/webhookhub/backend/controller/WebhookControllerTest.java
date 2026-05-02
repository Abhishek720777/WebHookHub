package com.webhookhub.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webhookhub.backend.entity.WebhookEvent;
import com.webhookhub.backend.repository.UserRepository;
import com.webhookhub.backend.repository.WebhookEventRepository;
import com.webhookhub.backend.security.JwtAuthFilter;
import com.webhookhub.backend.security.SecurityConfig;
import com.webhookhub.backend.service.WebhookService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = WebhookController.class,
    excludeAutoConfiguration = SecurityAutoConfiguration.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@DisplayName("WebhookController Tests")
class WebhookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WebhookService webhookService;

    @MockBean
    private WebhookEventRepository eventRepository;

    @MockBean
    private UserRepository userRepository;

    private WebhookEvent sampleEvent;

    @BeforeEach
    void setUp() {
        sampleEvent = new WebhookEvent();
        sampleEvent.setId(1L);
        sampleEvent.setUserId(1L);
        sampleEvent.setMethod("POST");
        sampleEvent.setEndpointPath("default");
        sampleEvent.setPayload("{\"hello\":\"world\"}");
        sampleEvent.setHeaders("{content-type=application/json}");
        sampleEvent.setStatus("SUCCESS");
        sampleEvent.setCreatedAt(LocalDateTime.now());
    }

    // --- /webhook/{userId} endpoint ---

    @Test
    @DisplayName("POST /webhook/{userId} should accept payload and return 200")
    void shouldAcceptWebhookOnBaseEndpoint() throws Exception {
        when(webhookService.processIncomingWebhook(anyLong(), anyString(), anyString(), anyMap(), anyString()))
                .thenReturn(sampleEvent);

        mockMvc.perform(post("/webhook/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"hello\":\"world\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.method").value("POST"));
    }

    @Test
    @DisplayName("POST /webhook/{userId}/{endpointPath} should store the custom path")
    void shouldAcceptWebhookOnCustomEndpoint() throws Exception {
        sampleEvent.setEndpointPath("stripe");
        when(webhookService.processIncomingWebhook(anyLong(), eq("stripe"), anyString(), anyMap(), anyString()))
                .thenReturn(sampleEvent);

        mockMvc.perform(post("/webhook/1/stripe")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"event\":\"payment.captured\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endpointPath").value("stripe"));
    }

    // --- /api/events endpoint ---

    @Test
    @DisplayName("GET /api/events should return events list")
    void shouldReturnEventsWhenAuthenticated() throws Exception {
        com.webhookhub.backend.entity.User user = new com.webhookhub.backend.entity.User();
        user.setId(1L);
        user.setUsername("test_user");
        user.setPassword("pass");

        when(userRepository.findByUsername(any())).thenReturn(java.util.Optional.of(user));
        when(eventRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(sampleEvent));

        // Security is excluded — pass a mock authentication via anonymous inner class
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "test_user", null, List.of()
                );

        mockMvc.perform(get("/api/events").with(request -> {
            request.setUserPrincipal(auth);
            return request;
        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].status").value("SUCCESS"))
                .andExpect(jsonPath("$[0].endpointPath").value("default"));
    }

    // --- /api/events/{id}/replay endpoint ---

    @Test
    @DisplayName("POST /api/events/{id}/replay should return the replayed event")
    void shouldReplayEventWhenAuthenticated() throws Exception {
        sampleEvent.setStatus("SUCCESS");
        when(webhookService.replayEvent(1L)).thenReturn(sampleEvent);

        mockMvc.perform(post("/api/events/1/replay"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }
}
