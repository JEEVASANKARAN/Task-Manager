import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDp6tpyWr4wAPb1W5VWvfXEusJ7YFGeB4w",
  authDomain: "task-manager-d138d.firebaseapp.com",
  projectId: "task-manager-d138d",
  storageBucket: "task-manager-d138d.firebasestorage.app",
  messagingSenderId: "980203208475",
  appId: "1:980203208475:web:111e82fd5ac131e62fddbe",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// ── Auth helpers ──────────────────────────────────────────
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithGithub = () => signInWithPopup(auth, githubProvider);

export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid,
    email,
    displayName,
    photoURL: null,
    jobTitle: "",
    bio: "",
    status: "online",
    createdAt: serverTimestamp(),
  });
  return cred;
};

export const sendPasswordReset = (email) => sendPasswordResetEmail(auth, email);

export const signOutUser = () => firebaseSignOut(auth);

// ── User profile ──────────────────────────────────────────
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, "users", uid), data);
};

// ── Task operations ───────────────────────────────────────
export const createTask = async (userId, taskData) => {
  const ref = await addDoc(collection(db, "tasks"), {
    userId,
    ...taskData,
    completed: taskData.completed ?? false,
    important: taskData.important ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateTask = async (taskId, data) => {
  await updateDoc(doc(db, "tasks", taskId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTask = async (taskId) => {
  await deleteDoc(doc(db, "tasks", taskId));
};

export const getUserTasksListener = (userId, callback) => {
  const q = query(
    collection(db, "tasks"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(tasks);
    },
    (error) => {
      console.error("Error listening to user tasks:", error);
    }
  );
};

export {
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
};
