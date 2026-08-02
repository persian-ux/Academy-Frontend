import { Provider } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { store } from "@/store";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Achievements from "@/components/Achievements";
import TeachersCarousel from "@/components/TeachersCarousel";
import BrilliantStudents from "@/components/BrilliantStudents";
import Footer from "@/components/Footer";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ManageUsers from "@/pages/admin/ManageUsers";
import ManageStudents from "@/pages/admin/ManageStudents";
import StudentForm from "@/pages/admin/StudentForm";
import StudentDetail from "@/pages/admin/StudentDetail";
import CreateStudentLogin from "@/pages/admin/CreateStudentLogin";
import ManageSections from "@/pages/admin/ManageCourses";
import ManageAttendance from "@/pages/admin/ManageAttendance";
import ManageTests from "@/pages/admin/ManageTests";
import UploadMarks from "@/pages/admin/UploadMarks";
import ClassMarks from "@/pages/admin/ClassMarks";
import Reports from "@/pages/admin/Reports";
import MonthlyReports from "@/pages/admin/MonthlyReports";
import MyMarks from "@/pages/student/MyMarks";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PublicRoute from "@/components/auth/PublicRoute";
import AdminRoute from "@/components/auth/AdminRoute";

function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Achievements />
      <TeachersCarousel />
      <BrilliantStudents />
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
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="students/create" element={<StudentForm />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="students/:id/edit" element={<StudentForm />} />
            <Route path="students/:id/create-login" element={<CreateStudentLogin />} />
            <Route path="courses" element={<ManageSections />} />
            <Route path="attendance" element={<ManageAttendance />} />
            <Route path="tests" element={<ManageTests />} />
            <Route path="upload-marks" element={<UploadMarks />} />
            <Route path="class-marks" element={<ClassMarks />} />
            <Route path="reports" element={<Reports />} />
            <Route path="monthly-reports" element={<MonthlyReports />} />
          </Route>
          <Route
            path="/my-marks"
            element={
              <ProtectedRoute>
                <MyMarks />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Provider>
  );
}

export default App;