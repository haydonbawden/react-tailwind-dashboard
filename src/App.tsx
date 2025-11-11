import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import Unauthorized from "./pages/OtherPage/Unauthorized";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import AuditList from "./pages/Audits/AuditList";
import AuditDetail from "./pages/Audits/AuditDetail";
import UploadLanding from "./pages/Uploads/UploadLanding";
import UploadWizard from "./pages/Uploads/UploadWizard";
import AuditTypesPage from "./pages/Admin/AuditTypes";
import EmailTemplatesPage from "./pages/Admin/Templates/EmailTemplates";
import DocxTemplatesPage from "./pages/Admin/Templates/DocxTemplates";
import ImportDataPage from "./pages/Admin/ImportData";
import VerificationPage from "./pages/Verify/VerificationPage";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />
              <Route path="/audits" element={<AuditList />} />
              <Route path="/audits/:id" element={<AuditDetail />} />
              <Route path="/upload" element={<UploadLanding />} />
              <Route path="/upload/:auditId" element={<UploadWizard />} />
              <Route element={<ProtectedRoute roles={["Admin"]} />}>
                <Route path="/admin/audit-types" element={<AuditTypesPage />} />
                <Route path="/admin/templates/email" element={<EmailTemplatesPage />} />
                <Route path="/admin/templates/docx" element={<DocxTemplatesPage />} />
                <Route path="/admin/import" element={<ImportDataPage />} />
              </Route>
              <Route path="/unauthorised" element={<Unauthorized />} />
            </Route>
          </Route>

          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify/:token" element={<VerificationPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
