package com.webhookhub.backend.controller;

import com.webhookhub.backend.dto.AnalyticsResponse;
import com.webhookhub.backend.entity.User;
import com.webhookhub.backend.repository.UserRepository;
import com.webhookhub.backend.security.JwtAuthFilter;
import com.webhookhub.backend.security.SecurityConfig;
import com.webhookhub.backend.service.AnalyticsService;
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

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@WebMvcTest(
    controllers = AnalyticsController.class,
    excludeAutoConfiguration = SecurityAutoConfiguration.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE,
            classes = {SecurityConfig.class, JwtAuthFilter.class})
)
@DisplayName("AnalyticsController Tests")
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalyticsService analyticsService;

    @MockBean
    private UserRepository userRepository;

    @Test
    @DisplayName("GET /api/analytics should return analytics data for authenticated user")
    void shouldReturnAnalyticsData() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setUsername("test_user");

        AnalyticsResponse response = AnalyticsResponse.builder()
                .totalEvents(10)
                .successCount(8)
                .failureCount(2)
                .statusDistribution(List.of())
                .endpointDistribution(List.of())
                .timeSeriesData(List.of())
                .build();

        when(userRepository.findByUsername("test_user")).thenReturn(Optional.of(user));
        when(analyticsService.getAnalytics(1L)).thenReturn(response);

        org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "test_user", null, List.of()
                );

        mockMvc.perform(get("/api/analytics").with(request -> {
            request.setUserPrincipal(auth);
            return request;
        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEvents").value(10))
                .andExpect(jsonPath("$.successCount").value(8))
                .andExpect(jsonPath("$.failureCount").value(2));
    }
}
