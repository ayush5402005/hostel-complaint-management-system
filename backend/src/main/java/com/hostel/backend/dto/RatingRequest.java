package com.hostel.backend.dto;

import lombok.Data;

@Data
public class RatingRequest {
    private int rating;   // 1-5
    private String comment;
}
