package com.hostel.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // Map<IP_endpoint, Deque<requestTimestamps>>
    private final Map<String, Deque<Long>> requestLog = new ConcurrentHashMap<>();

    // Rules: endpoint → max requests allowed in windowSeconds
    private static final Map<String, int[]> RULES = Map.of(
        "/api/auth/login",      new int[]{5,  15 * 60},  // 5 requests per 15 min
        "/api/auth/verify-otp", new int[]{5,  15 * 60},  // 5 requests per 15 min
        "/api/auth/resend-otp", new int[]{3,  60 * 60},   // 3 requests per 1 hour
        "/api/auth/forgot-password",  new int[]{3, 60 * 60}
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Only apply to POST requests on rate-limited endpoints
        if (!"POST".equals(method) || !RULES.containsKey(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String ip = getClientIp(request);
        String key = ip + ":" + path;
        int[] rule = RULES.get(path);
        int maxRequests = rule[0];
        long windowSeconds = rule[1];

        if (isRateLimited(key, maxRequests, windowSeconds)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"message\": \"Too many requests. Please try again later.\"}"
            );
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimited(String key, int maxRequests, long windowSeconds) {
        long now = Instant.now().getEpochSecond();
        long windowStart = now - windowSeconds;

        requestLog.putIfAbsent(key, new ArrayDeque<>());
        Deque<Long> timestamps = requestLog.get(key);

        synchronized (timestamps) {
            // Remove timestamps outside the window
            while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= maxRequests) {
                return true; // Rate limited
            }

            timestamps.addLast(now);
            return false;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
