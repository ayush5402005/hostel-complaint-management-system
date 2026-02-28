package com.hostel.backend.controller;

import com.hostel.backend.dto.NoticeRequest;
import com.hostel.backend.dto.NoticeResponse;
import com.hostel.backend.service.NoticeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;

    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    @GetMapping
    public ResponseEntity<List<NoticeResponse>> getAll() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    @PostMapping
    public ResponseEntity<NoticeResponse> create(
            @RequestBody NoticeRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                noticeService.createNotice(authentication.getName(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {
        noticeService.deleteNotice(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
