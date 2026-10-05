
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./PageHeader.css";

function PageHeader({ title, description, action }) {
  const navigate = useNavigate();

  return (
    <div className="page-header">
      <div>
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}

export default PageHeader;

