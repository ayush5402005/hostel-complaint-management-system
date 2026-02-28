package com.hostel.backend.controller;

import com.hostel.backend.dto.CommentRequest;
import com.hostel.backend.dto.CommentResponse;
import com.hostel.backend.service.ComplaintCommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/complaints/{complaintId}/comments")
public class ComplaintCommentController {

    private final ComplaintCommentService commentService;

    public ComplaintCommentController(ComplaintCommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable Long complaintId,
            Authentication authentication) {
        return ResponseEntity.ok(
                commentService.getComments(complaintId, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long complaintId,
            @RequestBody CommentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                commentService.addComment(complaintId, authentication.getName(), request));
    }
}
