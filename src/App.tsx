import { Provider } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { store } from "@/store";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Achievements from "@/components/Achievements";
import TeachersCarousel from "@/components/TeachersCarousel";
import Footer from "@/components/Footer";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Dashboard from "@/pages/Dashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";

function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Achievements />
      <TeachersCarousel />
      <Footer />
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/signin"
            element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Provider>
  );
}

export default App;

