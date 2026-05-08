import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminAPI from '../../api/AdminAPI';
import NavBarAdmin from './NavBarAdmin';
import { MDBContainer, MDBBtn, MDBIcon } from 'mdb-react-ui-kit';
import AdminUserCard from './AdminUserCard';
import Spinner from '../common/Spinner';
import SearchInput from '../common/SearchInput';

import './Admin.scss';

const PAGE_SIZE = 5;
const DEBOUNCE_DELAY = 300;

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Debounce search input; reset to page 0 whenever the term changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(0);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await AdminAPI.getUsers({
          search: debouncedSearch,
          page,
          size: PAGE_SIZE,
        });
        if (cancelled) return;
        setUsers(response?.content);
        setHasMore(Boolean(response?.hasMore));
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to fetch users', error);
        setUsers([]);
        setHasMore(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUsers();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, page]);

  const isDebouncing = searchTerm.trim() !== debouncedSearch;

  const handleCheckboxChange = (userId) => {
    setSelectedUsers((prevSelectedUsers) =>
      prevSelectedUsers.includes(userId)
        ? prevSelectedUsers.filter((id) => id !== userId)
        : [...prevSelectedUsers, userId]
    );
  };

  const extractUsers = async (format) => {
    if (selectedUsers.length === 0) {
      alert('Please Select Users');
      return;
    }

    try {
      const userDetails = await AdminAPI.getUserDetails(selectedUsers);
      const fileName = `userDetails.${format}`;
      const mimeType =
        format === 'json' ? 'application/json' : 'application/xml';
      const content =
        format === 'json'
          ? JSON.stringify(userDetails, null, 2)
          : await import('../../utils/xmlConverter').then((m) => m.convertToXML(userDetails));

      downloadFile(fileName, content, mimeType);
    } catch (error) {
      console.error('Error extracting users:', error);
    }
  };

  const downloadFile = (filename, content, mimeType) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleShowProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handlePrev = () => setPage((p) => Math.max(p - 1, 0));
  const handleNext = () => {
    if (hasMore) setPage((p) => p + 1);
  };

  return (
    <div className="page-layout">
      <NavBarAdmin />
      <MDBContainer fluid className="py-5">
        <div className="center-content">
          <h4 className="section-heading">Extract Selected Users</h4>
          <div className="button-group">
            <MDBBtn
              className="btn-custom"
              onClick={() => extractUsers('json')}
            >
              JSON Format
            </MDBBtn>
            <MDBBtn
              className="btn-custom"
              onClick={() => extractUsers('xml')}
            >
              XML Format
            </MDBBtn>
          </div>
        </div>

        <div className="admin-search-bar">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search users by name or email..."
            isLoading={isDebouncing || (loading && users.length === 0)}
          />
        </div>

        <div className="card-container-admin d-flex flex-wrap justify-content-center">
          {loading ? (
            <Spinner className="admin-loader" />
          ) : users.length === 0 ? (
            <p className="admin-empty">No users found.</p>
          ) : (
            users.map((user) => (
              <AdminUserCard
                key={user.id}
                user={user}
                isSelected={selectedUsers.includes(user.id)}
                onSelect={() => handleCheckboxChange(user.id)}
                onViewProfile={() => handleShowProfile(user.id)}
              />
            ))
          )}
        </div>

        {(page > 0 || hasMore) && !loading && users.length > 0 && (
          <div className="admin-pagination">
            <button
              type="button"
              className="admin-pagination__btn"
              onClick={handlePrev}
              disabled={page === 0}
              aria-label="Previous page"
            >
              <MDBIcon fas icon="chevron-left" />
            </button>
            <span className="admin-pagination__info">Page {page + 1}</span>
            <button
              type="button"
              className="admin-pagination__btn"
              onClick={handleNext}
              disabled={!hasMore}
              aria-label="Next page"
            >
              <MDBIcon fas icon="chevron-right" />
            </button>
          </div>
        )}
      </MDBContainer>
    </div>
  );
}
