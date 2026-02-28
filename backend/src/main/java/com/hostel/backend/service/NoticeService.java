package com.hostel.backend.service;

import com.hostel.backend.dto.NoticeRequest;
import com.hostel.backend.dto.NoticeResponse;
import com.hostel.backend.entity.Notice;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import com.hostel.backend.exception.ResourceNotFoundException;
import com.hostel.backend.exception.UnauthorizedException;
import com.hostel.backend.repository.NoticeRepository;
import com.hostel.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;

    public NoticeService(NoticeRepository noticeRepository,
                         UserRepository userRepository) {
        this.noticeRepository = noticeRepository;
        this.userRepository   = userRepository;
    }

    @Transactional
    public NoticeResponse createNotice(String email, NoticeRequest request) {
        User user = getUser(email);
        if (user.getRole() != Role.WARDEN && user.getRole() != Role.CARETAKER) {
            throw new UnauthorizedException("Only warden or caretaker can post notices");
        }
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Title is required");
        }
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new RuntimeException("Content is required");
        }
        Notice notice = Notice.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .postedBy(user)
                .build();
        return toResponse(noticeRepository.save(notice));
    }

    @Transactional(readOnly = true)
    public List<NoticeResponse> getAllNotices() {
        return noticeRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteNotice(Long id, String email) {
        User user = getUser(email);
        if (user.getRole() != Role.WARDEN && user.getRole() != Role.CARETAKER) {
            throw new UnauthorizedException("Only warden or caretaker can delete notices");
        }
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found: " + id));
        noticeRepository.delete(notice);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private NoticeResponse toResponse(Notice n) {
        return NoticeResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .content(n.getContent())
                .postedByName(n.getPostedBy().getName())
                .postedByRole(n.getPostedBy().getRole().name())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
