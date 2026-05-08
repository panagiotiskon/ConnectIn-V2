import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../common/NavBar.scss';
import {
  MDBNavbar,
  MDBNavbarNav,
  MDBNavbarItem,
  MDBNavbarLink,
  MDBIcon,
  MDBContainer,
  MDBNavbarToggler,
} from 'mdb-react-ui-kit';
import ConnectInLogo from '../../assets/ConnectIn.png';
import { useAuth } from '../../context/AuthContext';

const NavBarAdminComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openNavSecond, setOpenNavSecond] = useState(false);
  const { logout } = useAuth();

  const isProfilePage = location.pathname.startsWith('/profile');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleGoBack = () => {
    navigate('/admin');
    setOpenNavSecond(false);
  };

  return (
    <MDBNavbar expand="lg" light bgColor="light">
      <MDBContainer className="navbar-container w-100">
        <div className="d-flex align-items-center justify-content-between w-100">
          <img
            src={ConnectInLogo}
            alt="ConnectIn Logo"
            className="navbar-logo"
            onClick={() => navigate('/admin')}
            style={{ cursor: 'pointer' }}
          />
          {openNavSecond ? (
            <button
              className="mobile-close-btn"
              onClick={() => setOpenNavSecond(false)}
              aria-label="Close menu"
            >
              <MDBIcon fas icon="times" />
            </button>
          ) : (
            <MDBNavbarToggler
              aria-expanded={openNavSecond}
              aria-label="Toggle navigation"
              onClick={() => setOpenNavSecond(true)}
            >
              <MDBIcon fas icon="bars" style={{ color: '#333' }} />
            </MDBNavbarToggler>
          )}
          <div className={`nav-menu${openNavSecond ? ' nav-menu--open' : ''}`}>
            <MDBNavbarNav className="navbar-nav">
              {isProfilePage && (
                <MDBNavbarItem className="d-flex flex-column align-items-center navbar-nav-item">
                  <MDBNavbarLink
                    onClick={handleGoBack}
                    className="d-flex flex-column align-items-center"
                  >
                    <MDBIcon
                      fas
                      icon="arrow-left"
                      style={{ fontSize: '1.4rem', color: 'gray' }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>Go Back</span>
                  </MDBNavbarLink>
                </MDBNavbarItem>
              )}
              <MDBNavbarItem className="d-flex flex-column align-items-center navbar-nav-item">
                <MDBNavbarLink
                  onClick={() => {
                    handleLogout();
                    setOpenNavSecond(false);
                  }}
                  className="d-flex flex-column align-items-center"
                >
                  <MDBIcon
                    fas
                    icon="sign-out-alt"
                    style={{ fontSize: '1.4rem', color: 'red' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'red' }}>
                    Logout
                  </span>
                </MDBNavbarLink>
              </MDBNavbarItem>
            </MDBNavbarNav>
          </div>
        </div>
      </MDBContainer>
    </MDBNavbar>
  );
};

export default NavBarAdminComponent;
