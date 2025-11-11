import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Castor portal sign in"
        description="Access Castor Audit & Advisory with your approved credentials."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
