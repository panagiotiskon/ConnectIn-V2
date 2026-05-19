package backend.connectin.web.controllers;

import backend.connectin.domain.Connection;
import backend.connectin.service.ConnectionService;
import backend.connectin.service.UserService;
import backend.connectin.web.dto.ConnectedUserDTO;
import backend.connectin.web.dto.UserSearchPageDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("auth")
public class ConnectionController {
    private final ConnectionService connectionService;
    private final UserService userService;

    public ConnectionController(ConnectionService connectionService, UserService userService) {
        this.connectionService = connectionService;
        this.userService = userService;
    }

    @GetMapping("/connections/{userId}")
    @ResponseBody
    public ResponseEntity<List<ConnectedUserDTO>> getUserConnections(@PathVariable Long userId) {
        List<ConnectedUserDTO> connectedUserDTOList = connectionService.getUserConnections(userId);
        return new ResponseEntity<>(connectedUserDTOList, HttpStatus.OK);
    }

    @GetMapping("/connections/pending/{userId}")
    @ResponseBody
    public ResponseEntity<List<ConnectedUserDTO>> getUserPendingConnections(@PathVariable Long userId) {
        List<ConnectedUserDTO> connectedUserDTOList = connectionService.getPendingUserConnections(userId);
        return new ResponseEntity<>(connectedUserDTOList, HttpStatus.OK);
    }

    @PostMapping("/connections/{userId}")
    public ResponseEntity<List<Connection>> requestToConnect(@PathVariable Long userId, @RequestParam Long connectionUserId) {
        return new ResponseEntity<>(connectionService.requestToConnect(userId,connectionUserId),HttpStatus.CREATED);
    }

    @GetMapping("/connections/registered-users")
    @ResponseStatus(HttpStatus.OK)
    @ResponseBody
    public UserSearchPageDTO getSpecificRegisteredUsers(
            @RequestParam(value = "search", required = false) String searchTerm,
            @RequestParam(value = "userId") long userId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        return userService.searchUsers(searchTerm, userId, page, size);
    }

    @PutMapping("/connections/{userId}/accept")
    public ResponseEntity<String> acceptConnection(@PathVariable Long userId, @RequestParam Long connectionUserId) {
        connectionService.changeConnectionStatusToAccepted(userId, connectionUserId);
        return new ResponseEntity<>("Connection accepted", HttpStatus.OK);
    }

    @DeleteMapping("connections/{userId}")
    public ResponseEntity<String> deleteConnection(@PathVariable Long userId, @RequestParam Long connectionUserId) {
        connectionService.deleteConnection(userId,connectionUserId);
        return new ResponseEntity<>("Successfully deleted", HttpStatus.OK);
    }

}
