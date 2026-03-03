package com.hostel.backend.service;

import com.hostel.backend.dto.NoticeRequest;
import com.hostel.backend.dto.NoticeResponse;
import com.hostel.backend.entity.Notice;
import com.hostel.backend.entity.User;
import com.hostel.backend.enums.Role;
import com.hostel.backend.exception.AppException;
import com.hostel.backend.exception.ResourceNotFoundException;
import com.hostel.backend.exception.UnauthorizedException;
import com.hostel.backend.repository.NoticeRepository;
import com.hostel.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final UserRepository   userRepository;

    public NoticeService(NoticeRepository noticeRepository,
                         UserRepository userRepository) {
        this.noticeRepository = noticeRepository;
        this.userRepository   = userRepository;
    }

    @Transactional
    public NoticeResponse createNotice(String email, NoticeRequest request) {
        User user = getUser(email);

        if (user.getRole() != Role.ADMIN &&
            user.getRole() != Role.WARDEN &&
            user.getRole() != Role.CARETAKER) {
            throw new UnauthorizedException("Only admin, warden or caretaker can post notices");
        }
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new AppException("Title is required", HttpStatus.BAD_REQUEST);
        }
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new AppException("Content is required", HttpStatus.BAD_REQUEST);
        }

        Notice notice = Notice.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .imageUrl(request.getImageUrl())
                .postedBy(user)
                .build();

        return toResponse(noticeRepository.save(notice));
    }

    @Transactional(readOnly = true)
    public List<NoticeResponse> getAllNotices() {
        // ✅ Only returns non-deleted notices
        return noticeRepository.findByDeletedFalseOrderByCreatedAtDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NoticeResponse getNoticeById(Long id) {
        // ✅ 404 if deleted or not found
        Notice notice = noticeRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found: " + id));
        return toResponse(notice);
    }

    @Transactional
    public void deleteNotice(Long id, String email) {
        User user = getUser(email);
        if (user.getRole() != Role.ADMIN &&
            user.getRole() != Role.WARDEN &&
            user.getRole() != Role.CARETAKER) {
            throw new UnauthorizedException("Only admin, warden or caretaker can delete notices");
        }

        Notice notice = noticeRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found: " + id));

        // ✅ Soft delete — mark as deleted, never remove from DB
        notice.setDeleted(true);
        notice.setDeletedAt(LocalDateTime.now());
        noticeRepository.save(notice);
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
                .imageUrl(n.getImageUrl())
                .postedByName(n.getPostedBy().getName())
                .postedByRole(n.getPostedBy().getRole().name())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
