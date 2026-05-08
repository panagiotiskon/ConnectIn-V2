import { MDBIcon } from 'mdb-react-ui-kit';

const DeleteButton = ({ onClick, label }) => (
  <button className="jobs-entry-delete" onClick={onClick} aria-label={label}>
    <MDBIcon fas icon="times" />
  </button>
);

export default DeleteButton;
