package backend.connectin.service;

import backend.connectin.domain.Connection;
import backend.connectin.domain.FileDB;
import backend.connectin.domain.User;
import backend.connectin.domain.enums.ConnectionStatus;
import backend.connectin.domain.repository.ConnectionRepository;
import backend.connectin.domain.repository.FileRepository;
import backend.connectin.domain.repository.PersonalInfoRepository;
import backend.connectin.domain.repository.UserRepository;
import backend.connectin.web.dto.ConnectedUserDTO;
import backend.connectin.web.dto.RegisteredUserDTO;
import backend.connectin.web.mappers.ConnectionMapper;
import backend.connectin.web.resources.ConnectionResource;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ConnectionService {
    private final UserRepository userRepository;
    private final UserService userService;
    private final ConnectionRepository connectionRepository;
    private final FileService fileService;
    private final ConnectionMapper connectionMapper;
    private final PersonalInfoRepository personalInfoRepository;
    private final FileRepository fileRepository;

    public ConnectionService(UserRepository userRepository, UserService userService, ConnectionRepository connectionRepository, FileService fileService, ConnectionMapper connectionMapper, PersonalInfoRepository personalInfoRepository, FileRepository fileRepository) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.connectionRepository = connectionRepository;
        this.fileService = fileService;
        this.connectionMapper = connectionMapper;
        this.personalInfoRepository = personalInfoRepository;
        this.fileRepository = fileRepository;
    }

    private record ExperienceSnippet(String jobTitle, String companyName) {}

    private Map<Long, ExperienceSnippet> loadLatestExperienceMap(List<Long> userIds) {
        if (userIds.isEmpty()) return Map.of();
        return personalInfoRepository.findLatestExperienceByUserIds(userIds).stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> new ExperienceSnippet((String) row[1], (String) row[2]),
                        (a, b) -> a));
    }

    private Map<Long, FileDB> loadProfilePictureMap(List<Long> userIds) {
        if (userIds.isEmpty()) return Map.of();
        return fileRepository.findProfilePicturesByUserIds(userIds).stream()
                .collect(Collectors.toMap(FileDB::getUserId, Function.identity(), (a, b) -> a));
    }

    private static String[] encodePicture(FileDB pic) {
        if (pic == null || pic.getType() == null || !pic.getType().startsWith("image/")) {
            return new String[]{null, null};
        }
        return new String[]{Base64.getEncoder().encodeToString(pic.getData()), pic.getType()};
    }

    public List<ConnectedUserDTO> getUserConnections(long userId) {
        if (userRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        List<Connection> connectionList = connectionRepository.findUserConnections(userId);
        if (connectionList.isEmpty()) {
            return List.of();
        }
        return assembleConnectedUserDTOs(connectionList, false);
    }

    public List<ConnectedUserDTO> getPendingUserConnections(long userId) {
        if (userRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        List<Connection> connectionList = connectionRepository.findPendingUserConnections(userId);
        if (connectionList.isEmpty()) {
            return List.of();
        }
        return assembleConnectedUserDTOs(connectionList, true);
    }

    private List<ConnectedUserDTO> assembleConnectedUserDTOs(List<Connection> connections, boolean isPending) {
        List<Long> peerIds = connections.stream()
                .map(connection -> isPending ? connection.getUserId1() : connection.getUserId2())
                .distinct()
                .toList();

        Map<Long, User> usersById = userRepository.findAllById(peerIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, ExperienceSnippet> experienceMap = loadLatestExperienceMap(peerIds);
        Map<Long, FileDB> pictureMap = loadProfilePictureMap(peerIds);

        List<ConnectedUserDTO> dtos = new ArrayList<>(peerIds.size());
        for (Long peerId : peerIds) {
            User user = usersById.get(peerId);
            if (user == null) {
                continue;
            }
            ExperienceSnippet exp = experienceMap.get(peerId);
            String[] pic = encodePicture(pictureMap.get(peerId));
            dtos.add(new ConnectedUserDTO(
                    user.getId(),
                    user.getFirstName(),
                    user.getLastName(),
                    exp != null ? exp.jobTitle() : null,
                    exp != null ? exp.companyName() : null,
                    pic[0],
                    pic[1],
                    isPending));
        }
        return dtos;
    }


    public List<Long> getConnectedUserIds(long userId) {
        List<Connection> connectionList = connectionRepository.findUserConnections(userId);
        return connectionList.stream().map(Connection::getUserId2).toList();
    }

    public List<ConnectionResource> getConnectedUsers(Long userId){
        return connectionRepository.findUserConnections(userId)
                .stream()
                .map(connectionMapper::mapToConnectionResource)
                .toList();
    }

    @Transactional
    public List<Connection> requestToConnect(long userId, long connectionId) {
        if (userId == connectionId) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot connect to self");
        }
        if (userRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        if (userRepository.findById(connectionId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        // Guard against a connection already existing in either direction. This
        // avoids the DB-level duplicate-key error and surfaces a clear 409 when
        // the client UI has stale data or when one side of a legacy two-row
        // connection exists without its mirror.
        if (connectionRepository.existsBetween(userId, connectionId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Connection already exists");
        }

        Connection connection1 = connectionMapper.mapToConnection(userId, connectionId, ConnectionStatus.PENDING);
        Connection connection2 = connectionMapper.mapToConnection(connectionId, userId, ConnectionStatus.PENDING);

        connectionRepository.save(connection1);
        connectionRepository.save(connection2);
        return List.of(connection1, connection2);
    }

    @Transactional
    public void changeConnectionStatusToAccepted(long userId, long connectionUserId) {
        connectionRepository.updateConnectionStatus(userId, connectionUserId, ConnectionStatus.ACCEPTED);
    }

    @Transactional
    public void deleteConnection(long userId, long connectionUserId) {
        connectionRepository.deleteConnection(userId, connectionUserId);
    }

    @Transactional
    public List<RegisteredUserDTO> removeConnectedAndPendingUsers(List<Long> users, long userId){
        if(users.isEmpty()){
            return List.of();
        }
        Set<Long> excluded = new HashSet<>();
        connectionRepository.findPendingUserConnections(userId).forEach(c -> excluded.add(c.getUserId2()));
        connectionRepository.findUserConnections(userId).forEach(c -> excluded.add(c.getUserId2()));

        List<Long> finalRegisteredUsers = users.stream()
                .filter(u -> !excluded.contains(u))
                .distinct()
                .toList();
        if(finalRegisteredUsers.isEmpty()){
            return List.of();
        }

        Map<Long, User> usersById = userRepository.findAllById(finalRegisteredUsers).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, ExperienceSnippet> experienceMap = loadLatestExperienceMap(finalRegisteredUsers);
        Map<Long, FileDB> pictureMap = loadProfilePictureMap(finalRegisteredUsers);

        List<RegisteredUserDTO> registeredUserDTOS = new ArrayList<>(finalRegisteredUsers.size());
        for (Long id : finalRegisteredUsers) {
            User user = usersById.get(id);
            if (user == null) {
                continue;
            }
            ExperienceSnippet exp = experienceMap.get(id);
            String[] pic = encodePicture(pictureMap.get(id));
            registeredUserDTOS.add(new RegisteredUserDTO(
                    user.getId(),
                    user.getFirstName(),
                    user.getLastName(),
                    exp != null ? exp.jobTitle() : null,
                    exp != null ? exp.companyName() : null,
                    pic[0],
                    pic[1],
                    null));
        }
        return registeredUserDTOS;

    }
}
