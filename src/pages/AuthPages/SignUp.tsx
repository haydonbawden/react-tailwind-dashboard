import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Castor client registration"
        description="Request Castor Audit & Advisory access linked to your organisation."
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
