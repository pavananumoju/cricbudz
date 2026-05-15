import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { signOut } from "firebase/auth";
import {
  getDocFromDB,
  getDocRef,
  setDocToDB,
} from "@/components/utils/firebase-db-utils";
import { useRouter } from "next/router";
import { Layout } from "@/layout/Layout";
import { Container, Loading, Spacer } from "@nextui-org/react";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = (props) => {
  const [user, setUser] = useState({ email: null, uid: null });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("auth status changed");
        //get the user from DB using the uid
        getDocFromDB("Users", user.email).then((dbUser) => {
          const dbUserData = dbUser.data();
          if (dbUserData != undefined && dbUserData.isUserApproved) {
            setLoading(true);
            setUser({
              email: dbUserData.email,
              uid: dbUserData.uid,
              displayName: dbUserData.displayName,
              isTnCAccepted: dbUserData.isTnCAccepted,
              isAdmin: dbUserData.isAdmin
            });
            setLoading(false);
            // console.log('tnc:'+dbUserData.isTnCAccepted);
            if(!dbUserData.isTnCAccepted){
              router.push("/rules");
            }
          } else {
            console.log("user not approved!!!");
            setLoading(false);
            throw { name: "Error", message: "User not approved to login" };
          }
        });

        // setUser({
        //   email: user.email,
        //   uid: user.uid,
        // });
      } else {
        setUser({ email: null, uid: null });
        router.push("/function/login");
      }
    });
    setLoading(false);

    return () => unsubscribe();
  }, []);

  async function signUp(email, password, name) {
    return createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const updateUser = userCredential.user;
        setUser({ email: null, uid: null });
        router.push("/function/login");

        updateProfile(auth.currentUser, {
          displayName: name,
          // photoURL: "https://example.com/jane-q-user/profile.jpg"
        })
          .then(() => {
            // Profile updated!
            console.log("profile update successfully");
            logOut()
              .then(() => {
                // Sign-out successful.
                console.log("signout success");
                const data = {
                  uid: updateUser.uid,
                  email: updateUser.email,
                  displayName: updateUser.displayName,
                  isTnCAccepted: false,
                  isUserApproved: false,
                  isAdmin: false,
                };
                const docRef = getDocRef("Users", updateUser.email);
                setDocToDB(docRef, data).then((data) => {
                  console.log("user data is set to DB>>");
                });
              })
              .catch((error) => {
                // An error happened.
                console.log("error during signout: " + error);
              });
            // ...
          })
          .catch((error) => {
            console.log('error occurred while updateProfile in auth-context.js'+error)
            // An error occurred
            // ...
          });
        // account details need to be saved to DB and then approved by admin only then user can login from login page

        console.log("logged out please login again");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      });
  }

  async function logIn(email, password) {
    return getDocFromDB("Users", email).then((dbUser) => {
      const dbUserData = dbUser.data();
      if (dbUserData != undefined && dbUserData.isUserApproved) {
        setLoading(true);
        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            setUser({
              email: dbUserData.email,
              uid: dbUserData.uid,
              displayName: dbUserData.displayName,
              isTnCAccepted: dbUserData.isTnCAccepted,
              isAdmin: dbUserData.isAdmin
            });
            setLoading(false);
          })
          .catch((error) => {
            setLoading(false);
            const errorCode = error.code;
            const errorMessage = error.message;
          });

      } else {
        console.log("user not approved!!!");
        setLoading(false);
        throw { name: "Error", message: "User not approved to login" };
      }
    });
  }

  const logOut = async () => {
    setUser({ email: null, uid: null });
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, signUp, logIn, logOut }}>
      {loading ? (
        <Layout>
          <Container justify="center" align="center">
            <Spacer y={10} />
            <Loading size="lg" color="warning" />
          </Container>
        </Layout>
      ) : (
        props.children
      )}
    </AuthContext.Provider>
  );
};
