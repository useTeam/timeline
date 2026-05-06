import { Navigate, useLocation } from "react-router-dom";
import { loadSession } from "../lib/auth";

type Props = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: Props) {
  const location = useLocation();
  const session = loadSession();
  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }
  return children;
}

