package com.hostel.backend.controller;

import com.hostel.backend.dto.RatingRequest;
import com.hostel.backend.dto.RatingResponse;
import com.hostel.backend.dto.WorkerRatingSummary;
import com.hostel.backend.service.ComplaintRatingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ComplaintRatingController {

    private final ComplaintRatingService ratingService;

    public ComplaintRatingController(ComplaintRatingService ratingService) {
        this.ratingService = ratingService;
    }

    @PostMapping("/complaints/{complaintId}/rating")
    public ResponseEntity<RatingResponse> submitRating(
            @PathVariable Long complaintId,
            @RequestBody RatingRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(
                ratingService.submitRating(complaintId, authentication.getName(), request));
    }

    @GetMapping("/complaints/{complaintId}/rating")
    public ResponseEntity<RatingResponse> getRating(
            @PathVariable Long complaintId) {
        return ResponseEntity.ok(ratingService.getRatingForComplaint(complaintId));
    }

    @GetMapping("/workers/{workerId}/rating")
    public ResponseEntity<WorkerRatingSummary> getWorkerRating(
            @PathVariable Long workerId) {
        return ResponseEntity.ok(ratingService.getWorkerRatingSummary(workerId));
    }

    @GetMapping("/workers/ratings")
    public ResponseEntity<List<WorkerRatingSummary>> getAllWorkerRatings() {
        return ResponseEntity.ok(ratingService.getAllWorkerRatings());
    }
}
