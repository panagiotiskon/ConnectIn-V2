package backend.connectin.domain.repository;

import backend.connectin.domain.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    List<JobApplication> findJobApplicationByUserId(long userId);
    List<JobApplication> findJobApplicationByJobPostId(long jobPostId);
    List<JobApplication> findByJobPostIdIn(Collection<Long> jobPostIds);
    void deleteByUserIdAndJobPostId(long userId, long jobPostId);
}
