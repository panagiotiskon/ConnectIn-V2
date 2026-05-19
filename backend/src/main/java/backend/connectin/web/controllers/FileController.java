package backend.connectin.web.controllers;

import backend.connectin.domain.FileDB;
import backend.connectin.service.FileService;
import backend.connectin.web.resources.FileResource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@RestController
@RequestMapping("/auth")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file,
                                        @RequestParam("isProfilePicture") String isProfilePicture,
                                        @RequestParam("userId") Long userId) {
        String message = "";
        try {
            Boolean flag = Boolean.parseBoolean(isProfilePicture);
            fileService.store(file, flag, userId);
            message = "Uploaded the file successfully: " + file.getOriginalFilename();
            return new ResponseEntity<>(message, HttpStatus.OK);
        } catch (Exception e) {
            message = "Could not upload the file: " + file.getOriginalFilename() + "!";
            return new ResponseEntity<>(message, HttpStatus.EXPECTATION_FAILED);
        }
    }

    @GetMapping("/files")
    public ResponseEntity<List<?>> getListFiles() {
        List<FileResource> files = fileService.getAllFiles().map(dbFile -> {
            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath().path("/files/")
                    .path(dbFile.getId()).toUriString();

            return new FileResource(dbFile.getName(), fileDownloadUri, dbFile.getType(), dbFile.getData().length);
        }).toList();

        return ResponseEntity.status(HttpStatus.OK).body(files);
    }

    @GetMapping("/files/{id}")
    public ResponseEntity<Object> getFile(@PathVariable String id) {

        try {
            FileDB fileDB = fileService.getFile(id);

            // Response type: byte[]
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileDB.getName() + "\"")
                    .body(fileDB.getData());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.EXPECTATION_FAILED).body(e.getMessage());
        }
    }

    @GetMapping("/files/view/{id}")
    public ResponseEntity<byte[]> viewFile(@PathVariable String id) {
        try {
            FileDB fileDB = fileService.getFile(id);
            MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
            if (fileDB.getType() != null) {
                try {
                    contentType = MediaType.parseMediaType(fileDB.getType());
                } catch (InvalidMediaTypeException ignored) {
                    // fall back to octet-stream for malformed stored types
                }
            }
            ContentDisposition disposition = ContentDisposition.inline()
                    .filename(fileDB.getName() != null ? fileDB.getName() : id, StandardCharsets.UTF_8)
                    .build();
            return ResponseEntity.ok()
                    .contentType(contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePrivate())
                    .body(fileDB.getData());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/files/user/{userId}/images")
    public ResponseEntity<List<Map<String, String>>> getUserImages(@PathVariable Long userId) {
        List<Map<String, String>> images = fileService.getAllFiles()
                .filter(file -> file.getUser().getId().equals(userId) && file.getType().startsWith("image/"))
                // Sort images: Profile picture comes first (isProfilePicture == true)
                .sorted((file1, file2) -> Boolean.compare(file2.getProfilePicture(), file1.getProfilePicture()))
                // Map to the required format
                .map(file -> Map.of(
                        "type", file.getType(),
                        "data", Base64.getEncoder().encodeToString(file.getData())
                ))
                .toList();

        return ResponseEntity.ok(images);
    }

    @DeleteMapping("/files/{id}")
    public ResponseEntity<String> deleteFileById(@PathVariable String id) {
        String message = "";
        message = fileService.deleteFileById(id);
        return ResponseEntity.status(HttpStatus.OK).body(message);
    }

    @PutMapping("/files/user/{userId}/profile-picture")
    public ResponseEntity<?> updateProfilePicture(@PathVariable Long userId,
                                                   @RequestParam("file") MultipartFile file) {
        try {
            fileService.updateProfilePicture(file, userId);
            return ResponseEntity.ok("Profile picture updated successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.EXPECTATION_FAILED)
                    .body("Could not update profile picture: " + e.getMessage());
        }
    }

    @DeleteMapping("/files/user/{userId}/profile-picture")
    public ResponseEntity<String> deleteProfilePicture(@PathVariable Long userId) {
        String message = fileService.deleteProfilePicture(userId);
        return ResponseEntity.ok(message);
    }

}
