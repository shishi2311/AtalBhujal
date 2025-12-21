import Header from "./Header";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t bg-card py-8">
        <div className="container text-center text-muted-foreground">
          <p>&copy; 2024 HydroInsight - Atal Bhujal Groundwater Monitoring</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;