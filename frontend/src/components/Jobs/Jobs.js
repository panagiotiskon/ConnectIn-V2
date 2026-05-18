import { useState, useRef, useEffect, useCallback } from 'react';
import { MDBContainer, MDBRow, MDBCol, MDBIcon } from 'mdb-react-ui-kit';
import NavbarComponent from '../common/NavBar';
import ProfileCard from '../common/ProfileCard';
import SortingCard from '../common/SortingCard';
import CreateJobModal from './CreateJobModal';
import SkeletonCard from '../common/SkeletonCard';
import Spinner from '../common/Spinner';
import ConfirmActionModal from '../common/ConfirmActionModal';
import { useAuth } from '../../context/AuthContext';
import JobAPI from '../../api/JobAPI';
import { useNavigate } from 'react-router-dom';
import JobCard, { groupApplicationsByJob } from './JobCard';
import ApplicantRow from './ApplicantRow';
import DeleteButton from './DeleteButton';
import './Jobs.scss';

const DELETE_JOB = 'delete-job';
const WITHDRAW_APPLICATION = 'withdraw-application';

const CONFIRM_COPY = {
  [DELETE_JOB]: {
    title: 'Delete Job',
    message: 'Are you sure you want to delete this job posting?',
    confirmText: 'Delete',
  },
  [WITHDRAW_APPLICATION]: {
    title: 'Withdraw Application',
    message: 'Are you sure you want to withdraw your application?',
    confirmText: 'Withdraw',
  },
};

const Jobs = () => {
  const [myJobs, setMyJobs] = useState([]);
  const [topPicks, setTopPicks] = useState([]);
  const [applications, setApplications] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openApplicantsId, setOpenApplicantsId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [loadingMyJobs, setLoadingMyJobs] = useState(false);
  const [loadingTopPicks, setLoadingTopPicks] = useState(false);
  const { user: currentUser } = useAuth();
  const [sortingMethod, setSortingMethod] = useState('date');
  const navigate = useNavigate();
  const observerRef = useRef(null);

  const updateBothLists = (transform) => {
    setMyJobs(transform);
    setTopPicks(transform);
  };

  const fetchMyJobs = useCallback(async () => {
    if (!currentUser) return;
    setLoadingMyJobs(true);
    try {
      const response = await JobAPI.getJobPosts(currentUser.id);
      setMyJobs(response || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setMyJobs([]);
    } finally {
      setLoadingMyJobs(false);
    }
  }, [currentUser]);

  const fetchApplications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const response = await JobAPI.getJobApplications(currentUser.id);
      setApplications(groupApplicationsByJob(response));
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchMyJobs();
    fetchApplications();
  }, [fetchMyJobs, fetchApplications]);

  useEffect(() => {
    if (!currentUser) return;
    if (sortingMethod === 'date') {
      setTopPicks(myJobs);
      setLoadingTopPicks(loadingMyJobs);
      return;
    }
    let ignore = false;
    setLoadingTopPicks(true);
    JobAPI.getRecommendedJobs(currentUser.id)
      .then((response) => { if (!ignore) setTopPicks(response || []); })
      .catch((error) => {
        if (ignore) return;
        console.error('Error fetching top picks:', error);
        setTopPicks([]);
      })
      .finally(() => { if (!ignore) setLoadingTopPicks(false); });
    return () => { ignore = true; };
  }, [currentUser, sortingMethod, myJobs, loadingMyJobs]);

  const handleCreateJob = async (title, company, description) => {
    await JobAPI.createJobPost(currentUser.id, title, company, description);
    fetchMyJobs();
  };

  const handleApply = async (jobId) => {
    setApplyingJobId(jobId);
    try {
      await JobAPI.applyToJob(currentUser.id, jobId);
      const markApplied = (job) => (job.id === jobId ? { ...job, applied: true } : job);
      setTopPicks((prev) => prev.map(markApplied));
      setMyJobs((prev) => {
        if (prev.some((job) => job.id === jobId)) return prev.map(markApplied);
        const sourceJob = topPicks.find((job) => job.id === jobId);
        return sourceJob ? [...prev, { ...sourceJob, applied: true }] : prev;
      });
    } catch (error) {
      console.error('Error applying to job:', error);
    } finally {
      setApplyingJobId(null);
    }
  };

  const requestDeleteJob = (jobId) => setPendingAction({ type: DELETE_JOB, jobId });
  const requestWithdrawApplication = (jobId) => setPendingAction({ type: WITHDRAW_APPLICATION, jobId });
  const cancelPendingAction = () => setPendingAction(null);

  const confirmPendingAction = async () => {
    if (!currentUser || !pendingAction) return;
    setIsConfirming(true);
    try {
      if (pendingAction.type === DELETE_JOB) {
        await JobAPI.deleteJob(currentUser.id, pendingAction.jobId);
        updateBothLists((prev) => prev.filter((job) => job.id !== pendingAction.jobId));
      } else if (pendingAction.type === WITHDRAW_APPLICATION) {
        await JobAPI.unapplyFromJob(currentUser.id, pendingAction.jobId);
        updateBothLists((prev) =>
          prev.map((job) =>
            job.id === pendingAction.jobId ? { ...job, applied: false } : job
          )
        );
      }
    } catch (error) {
      console.error('Error confirming action:', error);
    } finally {
      setIsConfirming(false);
      setPendingAction(null);
    }
  };

  const confirmDialog = pendingAction ? CONFIRM_COPY[pendingAction.type] : null;

  const yourJobs = myJobs.filter((job) => job.userId === currentUser?.id);
  const appliedJobs = myJobs.filter((job) => job.userId !== currentUser?.id && job.applied);
  const otherJobs = topPicks.filter((job) => job.userId !== currentUser?.id && !job.applied);

  useEffect(() => {
    if (otherJobs.length === 0) return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const jobId = entry.target.getAttribute('data-job-id');
          if (jobId) {
            JobAPI.viewJobPost(currentUser.id, jobId).catch((error) =>
              console.error('Error viewing job:', error)
            );
          }
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-job-id]').forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [currentUser, otherJobs]);

  useEffect(() => {
    const handleClickOutside = () => setOpenApplicantsId(null);
    if (openApplicantsId !== null) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openApplicantsId]);

  return (
    <>
      <ConfirmActionModal
        isOpen={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmText={confirmDialog?.confirmText}
        isLoading={isConfirming}
        onConfirm={confirmPendingAction}
        onCancel={cancelPendingAction}
      />

      <div>
        <NavbarComponent />
        <MDBContainer fluid className="jobs-container">
          <MDBRow>
            <MDBCol md="4" className="left-column mb-4 mb-md-0">
              <ProfileCard currentUser={currentUser} />
            </MDBCol>

            <MDBCol md="8" className="center-column mb-3">

              {/* Created by you */}
              <div className="section-card jobs-section-card">
                <div className="section-header">
                  <h2 className="section-title">Created by you</h2>
                  <button className="add-pill" onClick={() => setShowCreateModal(true)}>
                    + Create Job
                  </button>
                </div>
                <div className="section-body">
                  {loadingMyJobs ? (
                    <SkeletonCard count={1} />
                  ) : yourJobs.length === 0 ? (
                    <p className="empty-state">No jobs created by you.</p>
                  ) : (
                    yourJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        actions={<DeleteButton onClick={() => requestDeleteJob(job.id)} label="Delete" />}
                      >
                        {applications[job.id]?.length > 0 && (
                          <div className="jobs-applicants-wrapper">
                            <button
                              className="jobs-applicants-toggle"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenApplicantsId(openApplicantsId === job.id ? null : job.id);
                              }}
                            >
                              <span className="jobs-applicants-count">
                                {applications[job.id].length}
                              </span>
                              {applications[job.id].length === 1 ? 'Applicant' : 'Applicants'}
                              <MDBIcon
                                fas
                                icon={openApplicantsId === job.id ? 'chevron-up' : 'chevron-down'}
                                className="jobs-applicants-chevron"
                              />
                            </button>
                            {openApplicantsId === job.id && (
                              <div className="jobs-applicants-panel">
                                {applications[job.id].map((applicant, idx) => (
                                  <ApplicantRow
                                    key={applicant.userId ?? idx}
                                    applicant={applicant}
                                    onClick={() => {
                                      if (!applicant.userId) return;
                                      navigate(`/profile/${applicant.userId}`);
                                      setOpenApplicantsId(null);
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </JobCard>
                    ))
                  )}
                </div>
              </div>

              {/* Applied to */}
              <div className="section-card jobs-section-card">
                <div className="section-header">
                  <h2 className="section-title">Applied to</h2>
                </div>
                <div className="section-body">
                  {loadingMyJobs ? (
                    <SkeletonCard count={1} />
                  ) : appliedJobs.length === 0 ? (
                    <p className="empty-state">You haven't applied to any jobs yet.</p>
                  ) : (
                    appliedJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        showCreatedBy
                        badge={<span className="jobs-applied-badge">✓ Applied</span>}
                        actions={
                          <DeleteButton onClick={() => requestWithdrawApplication(job.id)} label="Withdraw" />
                        }
                      />
                    ))
                  )}
                </div>
              </div>

              <SortingCard sortingMethod={sortingMethod} onSortChange={setSortingMethod} />

              {/* Top picks */}
              <div className="section-card jobs-section-card">
                <div className="section-header">
                  <h2 className="section-title">Top picks for you</h2>
                </div>
                <div className="section-body">
                  {loadingTopPicks ? (
                    <SkeletonCard count={1} />
                  ) : otherJobs.length === 0 ? (
                    <p className="empty-state">No other jobs available.</p>
                  ) : (
                    otherJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        showCreatedBy
                        data-job-id={job.id}
                        actions={
                          job.applied ? (
                            <span className="jobs-applied-badge">✓ Applied</span>
                          ) : (
                            <button
                              className="add-pill"
                              onClick={() => handleApply(job.id)}
                              disabled={applyingJobId === job.id}
                            >
                              {applyingJobId === job.id ? <><Spinner />Applying…</> : 'Apply'}
                            </button>
                          )
                        }
                      />
                    ))
                  )}
                </div>
              </div>

            </MDBCol>
          </MDBRow>
        </MDBContainer>

        <CreateJobModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateJob}
        />
      </div>
    </>
  );
};

export default Jobs;
