// src/components/GoogleAuth.tsx
import React from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

const CLIENT_ID =
  "1066485499060-0io67am55s3sbuj9qlru7dqb00olumd6.apps.googleusercontent.com";

interface Props {
  onLoginSuccess: (tokenResponse: any) => void;
  onLogoutSuccess: () => void;
}

const GoogleAuth: React.FC<Props> = ({ onLoginSuccess, onLogoutSuccess }) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => onLoginSuccess(tokenResponse),
    onError: () => console.log("Login Failed"),
  });

  return (
    <div>
      <button onClick={() => login()}>Login with Google</button>
      <button onClick={onLogoutSuccess}>Logout</button>
    </div>
  );
};

const GoogleAuthProviderWrapper: React.FC<Props> = (props) => (
  <GoogleOAuthProvider clientId={CLIENT_ID}>
    <GoogleAuth {...props} />
  </GoogleOAuthProvider>
);

export default GoogleAuthProviderWrapper;
