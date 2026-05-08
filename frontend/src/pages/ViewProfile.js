import React from "react";
import { useParams } from "react-router-dom";
import ViewProfile from "../components/ViewProfile/ViewProfile";

const ViewProfilePage = () => {
  const { userId } = useParams();
  return (
    <div className="page-layout">
      <ViewProfile userId={userId} />
    </div>
  );
};

export default ViewProfilePage;
