import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

type PatientLayoutProps = {
  children: ReactNode;
};

function PatientLayout({ children }: PatientLayoutProps) {
  return (
    <div>
      <Sidebar />

      <main>
        {children}
      </main>
    </div>
  );
}

export default PatientLayout;