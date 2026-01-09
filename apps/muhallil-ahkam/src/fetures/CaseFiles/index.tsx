import { useParams } from 'react-router-dom';

const CaseFiles: React.FC = () => {
  const { caseId } = useParams();
  console.log(caseId);
  return (
    <div>CaseFiles {caseId}</div>
  )
}

export default CaseFiles