
import Mainlayout from "@/components/layout/Mainlayout";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Image from "next/image";
import LandingPage from "../components/Landing";

export default function Home() {

  return (
    <AuthProvider>
      <Mainlayout>
        {" "}
        <LandingPage />
      </Mainlayout>
    </AuthProvider>
  );
}