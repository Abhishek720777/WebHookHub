package com.webhookhub.backend.controller;

import com.webhookhub.backend.dto.AnalyticsResponse;
import com.webhookhub.backend.entity.User;
import com.webhookhub.backend.repository.UserRepository;
import com.webhookhub.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<AnalyticsResponse> getAnalytics(Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return ResponseEntity.ok(analyticsService.getAnalytics(user.getId()));
    }
}
