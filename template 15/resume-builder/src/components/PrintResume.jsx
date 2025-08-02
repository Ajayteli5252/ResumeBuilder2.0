import React from 'react';
import { useLocation } from 'react-router-dom';
import Template15 from './Template15';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const PrintResume = () => {
  const query = useQuery();
  let resumeData = null;
  try {
    resumeData = JSON.parse(query.get('data'));
  } catch (e) {
    resumeData = null;
  }

  if (!resumeData) {
    return <div style={{ padding: 40, color: 'red' }}>Invalid or missing resume data for printing.</div>;
  }

  return (
    <div className="bg-white min-h-screen print:bg-white">
      <div className="max-w-3xl mx-auto bg-white shadow-none rounded-none p-8">
        <Template15
          aiStatus={{ isAvailable: false, message: '', isLoading: false }}
          resumeData={resumeData}
          readOnly={true}
          hideSidebar={true}
          hideBranding={true}
        />
      </div>
    </div>
  );
};

export default PrintResume; 