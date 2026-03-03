package com.hostel.backend.controller;

import com.hostel.backend.exception.AppException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final List<String> ALLOWED_EXTENSIONS =
        List.of(".jpg", ".jpeg", ".png", ".webp", ".pdf"); // ✅ added pdf

    private static final List<String> ALLOWED_MIME_TYPES =
        List.of("image/jpeg", "image/png", "image/webp", "application/pdf"); // ✅ added pdf

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file) throws IOException {

        // 1. Empty check
        if (file.isEmpty()) {
            throw new AppException("File is empty", HttpStatus.BAD_REQUEST);
        }

        // 2. Size check
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException("File size must be less than 5MB", HttpStatus.BAD_REQUEST);
        }

        // 3. MIME type check
        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            throw new AppException("Only JPG, PNG, WEBP and PDF files are allowed", HttpStatus.BAD_REQUEST);
        }

        // 4. Extension check
        String original = file.getOriginalFilename();
        if (original == null || !original.contains(".")) {
            throw new AppException("Invalid file name", HttpStatus.BAD_REQUEST);
        }
        String extension = original.substring(original.lastIndexOf(".")).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new AppException("Only .jpg, .jpeg, .png, .webp, .pdf files are allowed", HttpStatus.BAD_REQUEST);
        }

        // 5. Magic bytes check
        if (!isValidFileBytes(file, extension)) {
            throw new AppException("Invalid file content", HttpStatus.BAD_REQUEST);
        }

        // 6. Save file
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String filename = UUID.randomUUID() + extension;
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        String fileUrl = "/uploads/" + filename;
        return ResponseEntity.ok(Map.of("url", fileUrl));
    }

    private boolean isValidFileBytes(MultipartFile file, String extension) throws IOException {
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[8];
            if (is.read(header) < 4) return false;

            // JPEG: FF D8 FF
            if (header[0] == (byte) 0xFF && header[1] == (byte) 0xD8
                    && header[2] == (byte) 0xFF) {
                return true;
            }
            // PNG: 89 50 4E 47
            if (header[0] == (byte) 0x89 && header[1] == (byte) 0x50
                    && header[2] == (byte) 0x4E && header[3] == (byte) 0x47) {
                return true;
            }
            // WEBP: 52 49 46 46 (RIFF)
            if (header[0] == (byte) 0x52 && header[1] == (byte) 0x49
                    && header[2] == (byte) 0x46 && header[3] == (byte) 0x46) {
                return true;
            }
            // ✅ PDF: 25 50 44 46 (%PDF)
            if (header[0] == (byte) 0x25 && header[1] == (byte) 0x50
                    && header[2] == (byte) 0x44 && header[3] == (byte) 0x46) {
                return true;
            }
            return false;
        }
    }
}
