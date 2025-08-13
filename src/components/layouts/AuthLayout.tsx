import {
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  SignIn,
} from "@clerk/clerk-react";

export const AuthLayout = () => {
  return (
    <>
      <SignedOut>
        <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#0e0c1f] to-[#1a1a22]">
          <div className="rounded-lg shadow-[0_0_10px_2px_rgba(168,85,247,0.8)] transition duration-300 hover:shadow-[0_0_20px_4px_rgba(192,132,252,1)]">
            <SignIn
              appearance={{
                elements: {
                  socialButtonsBlockButton: "hidden",
                  dividerRow: "hidden",
                  footerActionLink: "hidden",
                  footerAction: "hidden",
                },
              }}
            />
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <RedirectToSignIn redirectUrl="/" />
      </SignedIn>
    </>
  );
};
