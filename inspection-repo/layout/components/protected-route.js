import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/router";
import { useEffect } from "react";

function ProtectedRoute(props) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user.uid) {
      console.log('no user uid, routing to login page');
      router.push("/function/login");
    }
  }, [router, user]);
  
  return <div>{user ? props.children : null}</div>;
}

export default ProtectedRoute;
