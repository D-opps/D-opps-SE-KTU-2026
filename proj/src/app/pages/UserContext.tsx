import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext<any>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'student');

  // Функція, яка оновить і сховище, і стан одночасно
  const updateRole = (newRole: string) => {
    localStorage.setItem('userRole', newRole);
    setUserRole(newRole);
  };

  return (
    <UserContext.Provider value={{ userRole, updateRole }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);