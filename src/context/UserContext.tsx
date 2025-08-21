// src/context/UserContext.tsx
import React, { createContext, useState, useContext, ReactNode } from "react";

export type UserProfile = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  passwordHash: string | null;
  email: string;
  gender: string | null;
  dob: string | null;
  goals: string | null;
  timeframe: number | null;
  exercise: string | null;
  premium: string | null;
  userStatus: string | null;
  firebaseId: string;
  createdDate: string;
  loginMethod: string | null;
};

type UserContextType = {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
};

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
