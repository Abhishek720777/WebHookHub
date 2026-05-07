package com.webhookhub.backend.security;

import com.webhookhub.backend.service.RateLimitingService;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitingService rateLimitingService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        Bucket bucket = null;

        // Apply Auth Rate Limiting (by IP)
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
            String xff = request.getHeader("X-Forwarded-For");
            String ip = (xff != null) ? xff.split(",")[0].trim() : request.getRemoteAddr();
            bucket = rateLimitingService.resolveAuthBucket(ip);
        }
        
        // Apply Webhook Rate Limiting (by User ID in Path)
        else if (path.startsWith("/webhook/")) {
            String[] parts = path.split("/");
            if (parts.length >= 3) {
                String userId = parts[2];
                bucket = rateLimitingService.resolveWebhookBucket(userId);
            }
        }

        if (bucket != null) {
            if (bucket.tryConsume(1)) {
                filterChain.doFilter(request, response);
            } else {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many requests. Please try again later.");
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
}
