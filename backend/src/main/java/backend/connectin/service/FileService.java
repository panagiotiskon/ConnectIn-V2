package backend.connectin.service;

import backend.connectin.domain.FileDB;
import backend.connectin.domain.repository.FileRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Optional;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

@Service
public class FileService {

    private final FileRepository fileDBRepository;
    private static final long MAX_PROFILE_PICTURE_BYTES = 10 * 1024 * 1024; // 10 MB

    public FileService(FileRepository fileDBRepository) {
        this.fileDBRepository = fileDBRepository;
    }

    public void save(FileDB fileDB) {
        fileDBRepository.save(fileDB);
    }

    public FileDB store(MultipartFile file, Boolean isProfilePicture, Long userId) throws IOException {
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());
        FileDB fileDB = new FileDB(fileName, file.getContentType(), file.getBytes(), isProfilePicture, userId);
        fileDBRepository.save(fileDB);
        return fileDB;
    }

    public Optional<FileDB> getProfilePicture(Long userId) {
        return fileDBRepository.findProfilePicture(userId);
    }

    public FileDB getFile(String id) {
        return fileDBRepository.findById(id).get();
    }

    public Stream<FileDB> getAllFiles() {
        // Convert Iterable to Stream
        return StreamSupport.stream(fileDBRepository.findAll().spliterator(), false);
    }
    public String deleteFileById(String id) {
        if (fileDBRepository.existsById(id)) {
            fileDBRepository.deleteById(id);
            return "File has been successfully deleted";
        }
        return "File doesn't exist";
    }

    public FileDB updateProfilePicture(MultipartFile file, Long userId) throws IOException {
        if (file.getSize() > MAX_PROFILE_PICTURE_BYTES) {
            throw new IllegalArgumentException("Profile picture exceeds maximum allowed size");
        }
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("Profile picture must be an image file");
        }
        getProfilePicture(userId).ifPresent(existing -> fileDBRepository.deleteById(existing.getId()));
        return store(file, true, userId);
    }

    public String deleteProfilePicture(Long userId) {
        Optional<FileDB> existing = getProfilePicture(userId);
        if (existing.isPresent()) {
            fileDBRepository.deleteById(existing.get().getId());
            return "Profile picture deleted successfully";
        }
        return "File doesn't exist";
    }
}
