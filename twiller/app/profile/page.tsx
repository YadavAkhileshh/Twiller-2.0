"use client";

import MainLayout from "@/components/layout/Mainlayout";
import ProfilePage from "@/components/ProfilePage";
import { AuthProvider } from "@/context/AuthContext";

export default function Profile() {
  return (
    <AuthProvider>
      <MainLayout>
        <ProfilePage />
      </MainLayout>
    </AuthProvider>
  );
}
