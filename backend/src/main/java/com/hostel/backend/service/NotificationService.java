package com.hostel.backend.service;

import com.hostel.backend.dto.NotificationResponse;
import com.hostel.backend.entity.Notification;
import com.hostel.backend.entity.User;
import com.hostel.backend.exception.ResourceNotFoundException;
import com.hostel.backend.exception.UnauthorizedException;
import com.hostel.backend.repository.NotificationRepository;
import com.hostel.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;
    private final Map<Long, SseEmitter>  emitters = new ConcurrentHashMap<>();

    public NotificationService(NotificationRepository notificationRepository,
                                UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository         = userRepository;
    }

    // ── SSE ──────────────────────────────────────────────────────────────────

    public SseEmitter subscribe(String email) {
        User user = getUser(email);
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        emitters.put(user.getId(), emitter);
        emitter.onCompletion(() -> emitters.remove(user.getId()));
        emitter.onTimeout(()    -> emitters.remove(user.getId()));
        emitter.onError(e      -> emitters.remove(user.getId()));

        try {
            emitter.send(SseEmitter.event().name("CONNECTED").data("connected"));
        } catch (IOException e) {
            emitters.remove(user.getId());
        }

        return emitter;
    }

    // ── Send notification — saves to DB + pushes via SSE ─────────────────────

    public void sendNotification(User user, String message, String type) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .type(type)
                .isRead(false)
                .build();
        Notification saved = notificationRepository.save(notification);

        SseEmitter emitter = emitters.get(user.getId());
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name(type)
                        .data(toResponse(saved)));
            } catch (IOException e) {
                emitters.remove(user.getId());
            }
        }
    }

    // ── REST ──────────────────────────────────────────────────────────────────

    public Page<NotificationResponse> getMyNotifications(String email, int page, int size) {
        User user = getUser(email);
        return notificationRepository
                .findByUserOrderByCreatedAtDesc(user, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    public long getUnreadCount(String email) {
        User user = getUser(email);
        return notificationRepository.countByUserAndIsReadFalse(user);
    }

    @Transactional
    public void markAsRead(Long notificationId, String email) {
        User user = getUser(email);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("Cannot access this notification");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String email) {
        User user = getUser(email);
        notificationRepository.markAllAsReadForUser(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .message(n.getMessage())
                .type(n.getType())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
