package backend.connectin.domain.repository;

import backend.connectin.domain.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    List<Reaction> findAllByUserId(Long userId);
    List<Reaction> findAllByUserIdIn(List<Long> userIds);

    @Query("SELECT r FROM Reaction r JOIN FETCH r.post WHERE r.user.id = :userId")
    List<Reaction> findAllByUserIdFetchPost(@Param("userId") Long userId);

    @Query("SELECT r FROM Reaction r JOIN FETCH r.post WHERE r.user.id IN :userIds")
    List<Reaction> findAllByUserIdInFetchPost(@Param("userIds") List<Long> userIds);

    @Query(value = """
            SELECT r.*
            FROM reactions r
            WHERE r.user_id = :userId AND r.post_id = :postId
            """, nativeQuery = true)
    Optional<Reaction> findByUserIdPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    @Query(value = """
            SELECT r.post_id
            FROM reactions r
            WHERE r.user_id IN :userIds
            """, nativeQuery = true)
    List<Long> findPostIdsByUserIds(@Param("userIds") List<Long> userIds);

    @Query(value = """
            SELECT r.post_id
            FROM reactions r
            WHERE r.user_id = :userId
            """, nativeQuery = true)
    List<Long> findPostIdsByUserId(@Param("userId") Long userId);

    @Query(value = """
            SELECT r.post_id, COUNT(*)
            FROM reactions r
            WHERE r.post_id IN :postIds
            GROUP BY r.post_id
            """, nativeQuery = true)
    List<Object[]> countReactionsByPostIds(@Param("postIds") List<Long> postIds);

    @Query(value = """
            SELECT r.post_id
            FROM reactions r
            WHERE r.post_id IN :postIds
            GROUP BY r.post_id
            ORDER BY COUNT(*) DESC
            """, nativeQuery = true)
    List<Long> findPostIdsRankedByReactionCount(@Param("postIds") List<Long> postIds);
}
